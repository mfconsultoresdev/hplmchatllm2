

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener todas las facturas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const guestId = searchParams.get('guestId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (paymentStatus) {
      where.payment_status = paymentStatus
    }
    
    if (guestId) {
      where.guest_id = guestId
    }
    
    if (startDate) {
      where.created_at = {
        ...where.created_at,
        gte: new Date(startDate)
      }
    }
    
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        lte: new Date(endDate)
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        guest: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            document_number: true,
            document_type: true
          }
        },
        reservation: {
          select: {
            id: true,
            reservation_number: true,
            check_in_date: true,
            check_out_date: true,
            room: {
              select: {
                room_number: true,
                room_type: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        invoice_items: {
          orderBy: {
            line_number: 'asc'
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            payment_method: true,
            payment_date: true,
            status: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Obtener el total de facturas para paginación
    const totalInvoices = await prisma.invoice.count({ where })

    return NextResponse.json({
      invoices,
      pagination: {
        total: totalInvoices,
        limit,
        offset,
        hasMore: offset + limit < totalInvoices
      }
    })

  } catch (error) {
    console.error('Error obteniendo facturas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva factura
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
      reservation_id,
      guest_id,
      client_type = 'GUEST',
      company_name,
      client_document,
      client_address,
      client_phone,
      client_email,
      currency = 'USD',
      items,
      apply_iva = true,
      iva_rate = 16.00,
      municipal_tax_rate = 0,
      service_tax_rate = 0,
      discount_amount = 0,
      notes,
      payment_terms = 'IMMEDIATE'
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Los items de factura son requeridos' },
        { status: 400 }
      )
    }

    // Generar número de factura secuencial
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoice_number: 'desc' }
    })
    
    let nextNumber = 1
    if (lastInvoice && lastInvoice.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }
    
    const invoiceNumber = `PMS-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`

    // Calcular totales
    let subtotal = 0
    const processedItems = items.map((item: any, index: number) => {
      const lineTotal = Number(item.quantity || 1) * Number(item.unit_price || 0)
      subtotal += lineTotal
      
      return {
        line_number: index + 1,
        description: item.description,
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        line_total: lineTotal,
        is_taxable: item.is_taxable !== false,
        tax_rate: apply_iva ? Number(iva_rate) : 0,
        tax_amount: (apply_iva && item.is_taxable !== false) ? (lineTotal * Number(iva_rate) / 100) : 0,
        service_id: item.service_id,
        room_id: item.room_id,
        item_type: item.item_type || 'SERVICE',
        category: item.category
      }
    })

    const discountAmt = Number(discount_amount)
    const subtotalAfterDiscount = subtotal - discountAmt
    
    const ivaAmount = apply_iva ? (subtotalAfterDiscount * Number(iva_rate) / 100) : 0
    const municipalTaxAmount = Number(municipal_tax_rate) > 0 ? (subtotalAfterDiscount * Number(municipal_tax_rate) / 100) : 0
    const serviceTaxAmount = Number(service_tax_rate) > 0 ? (subtotalAfterDiscount * Number(service_tax_rate) / 100) : 0
    
    const totalTaxAmount = ivaAmount + municipalTaxAmount + serviceTaxAmount
    const totalAmount = subtotalAfterDiscount + totalTaxAmount

    // Crear factura
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        hotel_id: session.user?.hotelId || '', // Asumir que existe
        client_type,
        guest_id: client_type === 'GUEST' ? guest_id : null,
        reservation_id,
        company_name: client_type === 'COMPANY' ? company_name : null,
        client_document,
        client_address,
        client_phone,
        client_email,
        currency,
        subtotal,
        tax_amount: totalTaxAmount,
        discount_amount: discountAmt,
        total_amount: totalAmount,
        iva_rate: apply_iva ? Number(iva_rate) : 0,
        iva_amount: ivaAmount,
        municipal_tax_rate: Number(municipal_tax_rate),
        municipal_tax_amount: municipalTaxAmount,
        service_tax_rate: Number(service_tax_rate),
        service_tax_amount: serviceTaxAmount,
        notes,
        payment_terms,
        created_by: session.user?.id || '',
        invoice_items: {
          create: processedItems
        }
      },
      include: {
        guest: true,
        reservation: true,
        invoice_items: true
      }
    })

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Factura creada exitosamente'
    })

  } catch (error) {
    console.error('Error creando factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
