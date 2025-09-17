

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los pagos
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
    const paymentMethod = searchParams.get('paymentMethod')
    const invoiceId = searchParams.get('invoiceId')
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
    
    if (paymentMethod) {
      where.payment_method = paymentMethod
    }
    
    if (invoiceId) {
      where.invoice_id = invoiceId
    }
    
    if (guestId) {
      where.guest_id = guestId
    }
    
    if (startDate) {
      where.payment_date = {
        ...where.payment_date,
        gte: new Date(startDate)
      }
    }
    
    if (endDate) {
      where.payment_date = {
        ...where.payment_date,
        lte: new Date(endDate)
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoice_number: true,
            total_amount: true,
            currency: true,
            guest: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        guest: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true
          }
        },
        reservation: {
          select: {
            id: true,
            reservation_number: true,
            room: {
              select: {
                room_number: true
              }
            }
          }
        }
      },
      orderBy: {
        payment_date: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Obtener el total de pagos para paginación
    const totalPayments = await prisma.payment.count({ where })

    // Calcular estadísticas rápidas
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      where: {
        payment_date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      payments,
      stats,
      pagination: {
        total: totalPayments,
        limit,
        offset,
        hasMore: offset + limit < totalPayments
      }
    })

  } catch (error) {
    console.error('Error obteniendo pagos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Registrar nuevo pago
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
      invoice_id,
      reservation_id,
      guest_id,
      amount,
      currency = 'USD',
      payment_method,
      payment_date,
      reference_number,
      notes,
      // Card/Bank details
      card_last_four,
      card_brand,
      bank_name,
      account_number,
      authorization_code,
      // Crypto details
      crypto_currency,
      wallet_address,
      blockchain_hash,
      // Exchange rate
      exchange_rate,
      amount_local
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a cero' },
        { status: 400 }
      )
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: 'Método de pago requerido' },
        { status: 400 }
      )
    }

    // Generar número de pago
    const lastPayment = await prisma.payment.findFirst({
      orderBy: { payment_number: 'desc' }
    })
    
    let nextNumber = 1
    if (lastPayment && lastPayment.payment_number) {
      const lastNumber = parseInt(lastPayment.payment_number.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }
    
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`

    // Si hay invoice_id, verificar el invoice
    let invoice = null
    if (invoice_id) {
      invoice = await prisma.invoice.findUnique({
        where: { id: invoice_id },
        include: {
          payments: true
        }
      })

      if (!invoice) {
        return NextResponse.json(
          { error: 'Factura no encontrada' },
          { status: 404 }
        )
      }

      // Calcular pagos previos
      const totalPaid = invoice.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0)
      
      const remainingAmount = Number(invoice.total_amount) - totalPaid
      
      if (Number(amount) > remainingAmount) {
        return NextResponse.json(
          { error: `El monto excede el saldo pendiente de $${remainingAmount}` },
          { status: 400 }
        )
      }
    }

    // Crear el pago
    const payment = await prisma.payment.create({
      data: {
        payment_number: paymentNumber,
        hotel_id: session.user?.hotelId || '',
        invoice_id,
        reservation_id,
        guest_id,
        amount: Number(amount),
        currency,
        exchange_rate: exchange_rate ? Number(exchange_rate) : null,
        amount_local: amount_local ? Number(amount_local) : null,
        payment_method,
        payment_date: payment_date ? new Date(payment_date) : new Date(),
        reference_number,
        notes,
        card_last_four,
        card_brand,
        bank_name,
        account_number,
        authorization_code,
        crypto_currency,
        wallet_address,
        blockchain_hash,
        status: 'COMPLETED',
        created_by: session.user?.id || '',
        processed_by: session.user?.id || ''
      }
    })

    // Si es pago de factura, actualizar el estado de la factura
    if (invoice) {
      const totalPaid = invoice.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0) + Number(amount)
      
      const totalAmount = Number(invoice.total_amount)
      
      let paymentStatus = 'PARTIAL'
      let invoiceStatus = invoice.status
      
      if (totalPaid >= totalAmount) {
        paymentStatus = 'PAID'
        invoiceStatus = 'PAID'
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL'
      } else {
        paymentStatus = 'UNPAID'
      }

      await prisma.invoice.update({
        where: { id: invoice_id },
        data: {
          payment_status: paymentStatus,
          status: invoiceStatus,
          updated_by: session.user?.id
        }
      })
    }

    // Si es pago de reservación, actualizar el estado
    if (reservation_id && !invoice_id) {
      await prisma.reservation.update({
        where: { id: reservation_id },
        data: {
          payment_status: 'PAID',
          updated_by: session.user?.id
        }
      })
    }

    const paymentWithDetails = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: {
        invoice: true,
        guest: true,
        reservation: true
      }
    })

    return NextResponse.json({
      success: true,
      payment: paymentWithDetails,
      message: 'Pago registrado exitosamente'
    })

  } catch (error) {
    console.error('Error registrando pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
