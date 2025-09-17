

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener pago por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          include: {
            guest: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                phone: true
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
        hotel: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ payment })

  } catch (error) {
    console.error('Error obteniendo pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar pago
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
      reconciled,
      reconciled_date,
      notes,
      receipt_url
    } = body

    // Verificar que el pago existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: true
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status,
        reconciled: reconciled !== undefined ? reconciled : existingPayment.reconciled,
        reconciled_date: reconciled_date ? new Date(reconciled_date) : 
                        (reconciled ? new Date() : null),
        notes,
        receipt_url,
        updated_by: session.user?.id,
        updated_at: new Date()
      },
      include: {
        invoice: true,
        guest: true,
        reservation: true
      }
    })

    // Si se cambia el estado del pago, actualizar la factura relacionada
    if (status && existingPayment.invoice) {
      const invoice = existingPayment.invoice
      const allPayments = await prisma.payment.findMany({
        where: { 
          invoice_id: invoice.id,
          id: { not: params.id }
        }
      })

      // Incluir el pago actualizado
      allPayments.push(payment)

      const totalPaid = allPayments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0)
      
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
        invoiceStatus = 'PENDING'
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          payment_status: paymentStatus,
          status: invoiceStatus,
          updated_by: session.user?.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment,
      message: 'Pago actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error actualizando pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Anular pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Pago anulado por el usuario'

    // Verificar que el pago existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        invoice: true
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // No permitir anular pagos ya anulados o reembolsados
    if (existingPayment.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'El pago ya está reembolsado' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: 'REFUNDED',
        refund_amount: existingPayment.amount,
        refund_date: new Date(),
        refund_reason: reason,
        updated_by: session.user?.id,
        updated_at: new Date()
      },
      include: {
        invoice: true
      }
    })

    // Actualizar el estado de la factura si existe
    if (existingPayment.invoice) {
      const invoice = existingPayment.invoice
      const allPayments = await prisma.payment.findMany({
        where: { 
          invoice_id: invoice.id,
          status: 'COMPLETED' // Solo contar pagos completados (no reembolsados)
        }
      })

      const totalPaid = allPayments
        .reduce((sum, p) => sum + Number(p.amount), 0)
      
      const totalAmount = Number(invoice.total_amount)
      
      let paymentStatus = 'UNPAID'
      let invoiceStatus = 'PENDING'
      
      if (totalPaid >= totalAmount) {
        paymentStatus = 'PAID'
        invoiceStatus = 'PAID'
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL'
        invoiceStatus = 'PENDING'
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          payment_status: paymentStatus,
          status: invoiceStatus,
          updated_by: session.user?.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment,
      message: 'Pago anulado exitosamente'
    })

  } catch (error) {
    console.error('Error anulando pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
