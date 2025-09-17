
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener datos para POS
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener servicios activos para el POS
    const services = await prisma.service.findMany({
      where: {
        is_active: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        price_usd: true,
        price_usdt: true,
        price_eur: true,
        is_taxable: true,
        tax_rate: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Obtener métodos de pago activos
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        display_order: 'asc'
      }
    })

    // Obtener habitaciones ocupadas para cargos rápidos
    const occupiedRooms = await prisma.room.findMany({
      where: {
        status: 'OCCUPIED'
      },
      include: {
        room_type: {
          select: {
            name: true
          }
        },
        reservations: {
          where: {
            status: 'CHECKED_IN'
          },
          include: {
            guest: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          },
          take: 1
        }
      }
    })

    // Obtener configuración fiscal
    const taxConfig = await prisma.taxConfig.findMany({
      where: {
        is_active: true
      }
    })

    return NextResponse.json({
      services: services.reduce((acc, service) => {
        const category = service.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(service)
        return acc
      }, {} as any),
      payment_methods: paymentMethods,
      occupied_rooms: occupiedRooms.map(room => ({
        id: room.id,
        room_number: room.room_number,
        room_type: room.room_type.name,
        guest_name: room.reservations[0]?.guest 
          ? `${room.reservations[0].guest.first_name} ${room.reservations[0].guest.last_name}`
          : 'Sin huésped asignado',
        reservation_id: room.reservations[0]?.id
      })),
      tax_configuration: taxConfig
    })

  } catch (error) {
    console.error('Error obteniendo datos para POS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Procesar venta en POS
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      items,
      payment_method,
      amount_paid,
      currency = 'USD',
      client_type = 'WALK_IN',
      guest_id,
      room_id,
      reservation_id,
      client_name,
      client_document,
      apply_iva = true,
      discount_percentage = 0,
      notes
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Items requeridos' },
        { status: 400 }
      )
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'Método de pago requerido' },
        { status: 400 }
      )
    }

    // Procesar items y calcular totales
    let subtotal = 0
    const processedItems = []

    for (const item of items) {
      const service = await prisma.service.findUnique({
        where: { id: item.service_id }
      })

      if (!service) {
        return NextResponse.json(
          { error: `Servicio ${item.service_id} no encontrado` },
          { status: 400 }
        )
      }

      const quantity = Number(item.quantity) || 1
      const unitPrice = Number(service.price_usd) // Ajustar según moneda
      const lineTotal = quantity * unitPrice

      subtotal += lineTotal

      processedItems.push({
        line_number: processedItems.length + 1,
        description: service.name,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        is_taxable: service.is_taxable && apply_iva,
        tax_rate: service.is_taxable && apply_iva ? Number(service.tax_rate) : 0,
        tax_amount: service.is_taxable && apply_iva ? (lineTotal * Number(service.tax_rate) / 100) : 0,
        service_id: service.id,
        room_id: room_id || null,
        item_type: 'SERVICE',
        category: service.category
      })
    }

    // Aplicar descuento
    const discountAmount = subtotal * (Number(discount_percentage) / 100)
    const subtotalAfterDiscount = subtotal - discountAmount

    // Calcular impuestos
    const ivaAmount = apply_iva 
      ? processedItems
          .filter(item => item.is_taxable)
          .reduce((sum, item) => sum + item.tax_amount, 0)
      : 0

    const totalAmount = subtotalAfterDiscount + ivaAmount

    // Generar número de factura POS
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoice_number: {
          startsWith: 'POS-'
        }
      },
      orderBy: { invoice_number: 'desc' }
    })
    
    let nextNumber = 1
    if (lastInvoice && lastInvoice.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }
    
    const invoiceNumber = `POS-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`

    // Crear factura POS
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        hotel_id: session.user?.hotelId || '',
        client_type,
        guest_id: client_type === 'GUEST' ? guest_id : null,
        reservation_id,
        company_name: client_type === 'COMPANY' ? client_name : null,
        client_document,
        client_address: null,
        client_phone: null,
        client_email: null,
        currency,
        subtotal,
        tax_amount: ivaAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        iva_rate: apply_iva ? 16.00 : 0,
        iva_amount: ivaAmount,
        municipal_tax_rate: 0,
        municipal_tax_amount: 0,
        service_tax_rate: 0,
        service_tax_amount: 0,
        notes,
        payment_terms: 'IMMEDIATE',
        status: 'DRAFT',
        payment_status: 'UNPAID',
        created_by: session.user?.id || '',
        invoice_items: {
          create: processedItems
        }
      },
      include: {
        invoice_items: true
      }
    })

    // Si se pagó inmediatamente, registrar el pago
    let payment = null
    if (amount_paid && Number(amount_paid) > 0) {
      // Generar número de pago
      const lastPayment = await prisma.payment.findFirst({
        orderBy: { payment_number: 'desc' }
      })
      
      let nextPayNumber = 1
      if (lastPayment && lastPayment.payment_number) {
        const lastPayNumber = parseInt(lastPayment.payment_number.split('-').pop() || '0')
        nextPayNumber = lastPayNumber + 1
      }
      
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(nextPayNumber).padStart(6, '0')}`

      payment = await prisma.payment.create({
        data: {
          payment_number: paymentNumber,
          hotel_id: session.user?.hotelId || '',
          invoice_id: invoice.id,
          reservation_id,
          guest_id,
          amount: Number(amount_paid),
          currency,
          payment_method,
          payment_date: new Date(),
          status: 'COMPLETED',
          created_by: session.user?.id || '',
          processed_by: session.user?.id || ''
        }
      })

      // Actualizar estado de factura
      const paidAmount = Number(amount_paid)
      let paymentStatus = 'UNPAID'
      let invoiceStatus = 'DRAFT'

      if (paidAmount >= totalAmount) {
        paymentStatus = 'PAID'
        invoiceStatus = 'PAID'
      } else if (paidAmount > 0) {
        paymentStatus = 'PARTIAL'
        invoiceStatus = 'PARTIAL'
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          payment_status: paymentStatus,
          status: invoiceStatus
        }
      })
    }

    return NextResponse.json({
      success: true,
      invoice,
      payment,
      totals: {
        subtotal,
        discount_amount: discountAmount,
        iva_amount: ivaAmount,
        total_amount: totalAmount,
        amount_paid: Number(amount_paid) || 0,
        change: Number(amount_paid) > totalAmount ? Number(amount_paid) - totalAmount : 0
      },
      message: 'Venta procesada exitosamente'
    })

  } catch (error) {
    console.error('Error procesando venta POS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
