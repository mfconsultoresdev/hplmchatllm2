
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Generar reportes fiscales
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
    const reportType = searchParams.get('type') || 'monthly'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFilter: any = {}
    
    if (startDate && endDate) {
      dateFilter = {
        invoice_date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    } else if (reportType === 'monthly') {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59)
      dateFilter = {
        invoice_date: {
          gte: start,
          lte: end
        }
      }
    } else if (reportType === 'yearly') {
      const start = new Date(year, 0, 1)
      const end = new Date(year, 11, 31, 23, 59, 59)
      dateFilter = {
        invoice_date: {
          gte: start,
          lte: end
        }
      }
    }

    // Obtener facturas del período
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['PAID', 'PARTIAL', 'DRAFT']
        },
        ...dateFilter
      },
      include: {
        guest: {
          select: {
            first_name: true,
            last_name: true,
            document_type: true,
            document_number: true
          }
        },
        invoice_items: {
          include: {
            service: true
          }
        },
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    })

    // Calcular totales fiscales
    const fiscalSummary = {
      period: {
        type: reportType,
        year,
        month: reportType === 'monthly' ? month : null,
        startDate: startDate || dateFilter.invoice_date?.gte,
        endDate: endDate || dateFilter.invoice_date?.lte
      },
      totals: {
        total_invoices: invoices.length,
        gross_revenue: 0,
        net_revenue: 0,
        total_iva: 0,
        total_municipal_tax: 0,
        total_service_tax: 0,
        total_discounts: 0,
        total_payments: 0,
        outstanding_balance: 0
      },
      by_currency: {} as Record<string, any>,
      by_tax_rate: {} as Record<string, any>,
      by_payment_method: {} as Record<string, any>,
      daily_breakdown: [] as any[]
    }

    // Procesar cada factura
    invoices.forEach(invoice => {
      const currency = invoice.currency
      const grossAmount = Number(invoice.subtotal)
      const netAmount = Number(invoice.total_amount)
      const ivaAmount = Number(invoice.iva_amount)
      const municipalAmount = Number(invoice.municipal_tax_amount)
      const serviceAmount = Number(invoice.service_tax_amount)
      const discountAmount = Number(invoice.discount_amount)
      
      // Calcular pagos recibidos
      const totalPaid = invoice.payments.reduce((sum, payment) => {
        return sum + Number(payment.amount)
      }, 0)

      // Totales generales
      fiscalSummary.totals.gross_revenue += grossAmount
      fiscalSummary.totals.net_revenue += netAmount
      fiscalSummary.totals.total_iva += ivaAmount
      fiscalSummary.totals.total_municipal_tax += municipalAmount
      fiscalSummary.totals.total_service_tax += serviceAmount
      fiscalSummary.totals.total_discounts += discountAmount
      fiscalSummary.totals.total_payments += totalPaid
      fiscalSummary.totals.outstanding_balance += (netAmount - totalPaid)

      // Por moneda
      if (!fiscalSummary.by_currency[currency]) {
        fiscalSummary.by_currency[currency] = {
          count: 0,
          gross_revenue: 0,
          net_revenue: 0,
          total_iva: 0,
          total_payments: 0
        }
      }
      
      fiscalSummary.by_currency[currency].count += 1
      fiscalSummary.by_currency[currency].gross_revenue += grossAmount
      fiscalSummary.by_currency[currency].net_revenue += netAmount
      fiscalSummary.by_currency[currency].total_iva += ivaAmount
      fiscalSummary.by_currency[currency].total_payments += totalPaid

      // Por tasa de IVA
      const ivaRate = Number(invoice.iva_rate)
      const ivaKey = `${ivaRate}%`
      if (!fiscalSummary.by_tax_rate[ivaKey]) {
        fiscalSummary.by_tax_rate[ivaKey] = {
          count: 0,
          base_amount: 0,
          tax_amount: 0
        }
      }
      
      fiscalSummary.by_tax_rate[ivaKey].count += 1
      fiscalSummary.by_tax_rate[ivaKey].base_amount += grossAmount
      fiscalSummary.by_tax_rate[ivaKey].tax_amount += ivaAmount

      // Por método de pago
      invoice.payments.forEach(payment => {
        const method = payment.payment_method
        if (!fiscalSummary.by_payment_method[method]) {
          fiscalSummary.by_payment_method[method] = {
            count: 0,
            total_amount: 0
          }
        }
        
        fiscalSummary.by_payment_method[method].count += 1
        fiscalSummary.by_payment_method[method].total_amount += Number(payment.amount)
      })
    })

    // Generar desglose diario para el período
    if (reportType === 'monthly') {
      const daysInMonth = new Date(year, month, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStart = new Date(year, month - 1, day, 0, 0, 0)
        const dayEnd = new Date(year, month - 1, day, 23, 59, 59)
        
        const dayInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.invoice_date)
          return invDate >= dayStart && invDate <= dayEnd
        })
        
        const dayTotals = dayInvoices.reduce((acc, inv) => {
          acc.count += 1
          acc.gross_revenue += Number(inv.subtotal)
          acc.net_revenue += Number(inv.total_amount)
          acc.iva_amount += Number(inv.iva_amount)
          
          const dayPayments = inv.payments.reduce((sum, pay) => sum + Number(pay.amount), 0)
          acc.payments += dayPayments
          
          return acc
        }, {
          date: dayStart.toISOString().split('T')[0],
          count: 0,
          gross_revenue: 0,
          net_revenue: 0,
          iva_amount: 0,
          payments: 0
        })
        
        fiscalSummary.daily_breakdown.push(dayTotals)
      }
    }

    // Obtener configuración fiscal del hotel
    const taxConfig = await prisma.taxConfig.findMany({
      where: {
        hotel_id: session.user?.hotelId || '',
        is_active: true
      }
    })

    return NextResponse.json({
      success: true,
      fiscal_summary: fiscalSummary,
      tax_configuration: taxConfig,
      generated_at: new Date().toISOString(),
      generated_by: session.user?.name || 'Sistema'
    })

  } catch (error) {
    console.error('Error generando reporte fiscal:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Generar reporte fiscal específico para SENIAT
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
    const { period_start, period_end, report_format = 'SENIAT_XML' } = body

    if (!period_start || !period_end) {
      return NextResponse.json(
        { error: 'Fechas de período requeridas' },
        { status: 400 }
      )
    }

    // Obtener facturas del período para declaración
    const invoices = await prisma.invoice.findMany({
      where: {
        invoice_date: {
          gte: new Date(period_start),
          lte: new Date(period_end)
        },
        status: {
          in: ['PAID', 'PARTIAL']
        }
      },
      include: {
        guest: true,
        invoice_items: true,
        payments: true
      },
      orderBy: {
        invoice_date: 'asc'
      }
    })

    // Generar archivo para SENIAT según formato requerido
    const seniatReport = {
      header: {
        rif: 'J-12345678-9', // Debería venir de configuración del hotel
        period_start,
        period_end,
        generated_at: new Date().toISOString(),
        total_documents: invoices.length
      },
      invoices: invoices.map(inv => ({
        document_type: 'FACTURA',
        document_number: inv.invoice_number,
        date: inv.invoice_date.toISOString().split('T')[0],
        client_document: inv.client_document || 'N/A',
        client_name: inv.client_type === 'GUEST' 
          ? `${inv.guest?.first_name || ''} ${inv.guest?.last_name || ''}`
          : inv.company_name || 'Cliente General',
        base_amount: Number(inv.subtotal),
        iva_rate: Number(inv.iva_rate),
        iva_amount: Number(inv.iva_amount),
        total_amount: Number(inv.total_amount),
        currency: inv.currency,
        payment_status: inv.payment_status,
        export_status: inv.currency !== 'VES' ? 'EXPORT' : 'DOMESTIC'
      })),
      summary: {
        total_base: invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0),
        total_iva: invoices.reduce((sum, inv) => sum + Number(inv.iva_amount), 0),
        total_amount: invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0),
        by_currency: {} as Record<string, { count: number; total_base: number; total_iva: number; total_amount: number }>
      }
    }

    // Agrupar por moneda para resumen
    invoices.forEach(inv => {
      const curr = inv.currency
      if (!seniatReport.summary.by_currency[curr]) {
        seniatReport.summary.by_currency[curr] = {
          count: 0,
          total_base: 0,
          total_iva: 0,
          total_amount: 0
        }
      }
      seniatReport.summary.by_currency[curr].count += 1
      seniatReport.summary.by_currency[curr].total_base += Number(inv.subtotal)
      seniatReport.summary.by_currency[curr].total_iva += Number(inv.iva_amount)
      seniatReport.summary.by_currency[curr].total_amount += Number(inv.total_amount)
    })

    return NextResponse.json({
      success: true,
      seniat_report: seniatReport,
      format: report_format
    })

  } catch (error) {
    console.error('Error generando reporte SENIAT:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
