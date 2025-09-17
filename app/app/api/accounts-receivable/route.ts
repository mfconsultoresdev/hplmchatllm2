
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener cuentas por cobrar
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
    const status = searchParams.get('status') || 'overdue'
    const daysOverdue = parseInt(searchParams.get('daysOverdue') || '0')
    const guestId = searchParams.get('guestId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir filtros para facturas pendientes
    const where: any = {
      payment_status: {
        in: ['UNPAID', 'PARTIAL']
      }
    }

    if (guestId) {
      where.guest_id = guestId
    }

    // Filtrar por días vencidos
    if (status === 'overdue' && daysOverdue > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOverdue)
      
      where.due_date = {
        lt: cutoffDate
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
            document_type: true,
            vip_status: true
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
        payments: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true,
            amount: true,
            payment_date: true,
            payment_method: true
          }
        }
      },
      orderBy: [
        { due_date: 'asc' },
        { total_amount: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Calcular información adicional para cada factura
    const accountsReceivable = invoices.map(invoice => {
      const totalPaid = invoice.payments.reduce((sum, payment) => {
        return sum + Number(payment.amount)
      }, 0)
      
      const outstandingBalance = Number(invoice.total_amount) - totalPaid
      
      const daysOverdue = invoice.due_date 
        ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 3600 * 24)))
        : 0

      const agingCategory = daysOverdue === 0 ? 'CURRENT' :
                           daysOverdue <= 30 ? '1-30_DAYS' :
                           daysOverdue <= 60 ? '31-60_DAYS' :
                           daysOverdue <= 90 ? '61-90_DAYS' :
                           'OVER_90_DAYS'

      return {
        ...invoice,
        outstanding_balance: outstandingBalance,
        total_paid: totalPaid,
        days_overdue: daysOverdue,
        aging_category: agingCategory,
        risk_level: daysOverdue > 90 ? 'HIGH' :
                   daysOverdue > 60 ? 'MEDIUM' :
                   daysOverdue > 30 ? 'LOW' : 'NONE'
      }
    })

    // Calcular totales y estadísticas
    const totalCount = await prisma.invoice.count({ where })
    
    const summary = {
      total_invoices: accountsReceivable.length,
      total_outstanding: accountsReceivable.reduce((sum, inv) => sum + inv.outstanding_balance, 0),
      by_aging: {
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        over_90_days: 0
      },
      by_risk_level: {
        none: 0,
        low: 0,
        medium: 0,
        high: 0
      }
    }

    accountsReceivable.forEach(invoice => {
      // Aging buckets
      switch (invoice.aging_category) {
        case 'CURRENT':
          summary.by_aging.current += invoice.outstanding_balance
          break
        case '1-30_DAYS':
          summary.by_aging.days_1_30 += invoice.outstanding_balance
          break
        case '31-60_DAYS':
          summary.by_aging.days_31_60 += invoice.outstanding_balance
          break
        case '61-90_DAYS':
          summary.by_aging.days_61_90 += invoice.outstanding_balance
          break
        case 'OVER_90_DAYS':
          summary.by_aging.over_90_days += invoice.outstanding_balance
          break
      }

      // Risk levels
      switch (invoice.risk_level) {
        case 'NONE':
          summary.by_risk_level.none += invoice.outstanding_balance
          break
        case 'LOW':
          summary.by_risk_level.low += invoice.outstanding_balance
          break
        case 'MEDIUM':
          summary.by_risk_level.medium += invoice.outstanding_balance
          break
        case 'HIGH':
          summary.by_risk_level.high += invoice.outstanding_balance
          break
      }
    })

    return NextResponse.json({
      accounts_receivable: accountsReceivable,
      summary,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error obteniendo cuentas por cobrar:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear plan de pago o acción de cobranza
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
      action_type, // PAYMENT_PLAN, REMINDER, COLLECTION_CALL, LEGAL_ACTION
      notes,
      payment_plan, // { installments: [{ due_date, amount }] }
      reminder_type, // EMAIL, SMS, PHONE
      next_follow_up_date
    } = body

    if (!invoice_id || !action_type) {
      return NextResponse.json(
        { error: 'ID de factura y tipo de acción requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la factura existe y tiene saldo pendiente
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoice_id },
      include: {
        payments: {
          where: { status: 'COMPLETED' }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const outstandingBalance = Number(invoice.total_amount) - totalPaid

    if (outstandingBalance <= 0) {
      return NextResponse.json(
        { error: 'Esta factura no tiene saldo pendiente' },
        { status: 400 }
      )
    }

    // Crear registro de acción de cobranza
    const collectionAction = await prisma.collectionAction.create({
      data: {
        hotel_id: session.user?.hotelId || '',
        invoice_id,
        action_type,
        action_date: new Date(),
        notes,
        reminder_type,
        next_follow_up_date: next_follow_up_date ? new Date(next_follow_up_date) : null,
        outstanding_amount: outstandingBalance,
        created_by: session.user?.id || '',
        status: 'PENDING'
      }
    })

    // Si es plan de pago, crear las cuotas
    let paymentPlan = null
    if (action_type === 'PAYMENT_PLAN' && payment_plan?.installments) {
      paymentPlan = await prisma.paymentPlan.create({
        data: {
          hotel_id: session.user?.hotelId || '',
          invoice_id,
          total_amount: outstandingBalance,
          status: 'ACTIVE',
          created_by: session.user?.id || '',
          installments: {
            create: payment_plan.installments.map((installment: any, index: number) => ({
              installment_number: index + 1,
              due_date: new Date(installment.due_date),
              amount: Number(installment.amount),
              status: 'PENDING'
            }))
          }
        },
        include: {
          installments: true
        }
      })

      // Actualizar estado de la factura
      await prisma.invoice.update({
        where: { id: invoice_id },
        data: {
          payment_terms: 'INSTALLMENT',
          notes: `${invoice.notes || ''}\nPlan de pago creado: ${paymentPlan.installments.length} cuotas`.trim()
        }
      })
    }

    return NextResponse.json({
      success: true,
      collection_action: collectionAction,
      payment_plan: paymentPlan,
      message: `Acción de cobranza ${action_type} creada exitosamente`
    })

  } catch (error) {
    console.error('Error creando acción de cobranza:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
