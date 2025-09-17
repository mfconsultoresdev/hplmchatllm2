
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Revenue breakdown by category
    const revenueBreakdown = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        status: 'COMPLETED',
        type: { in: ['ROOM_CHARGE', 'SERVICE_CHARGE', 'PAYMENT'] }
      },
      _sum: {
        amount: true
      }
    })

    // Revenue by service category
    const serviceRevenue = await prisma.transaction.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        status: 'COMPLETED',
        type: 'SERVICE_CHARGE',
        service: { isNot: null }
      },
      include: {
        service: {
          select: {
            name: true,
            category: true
          }
        }
      }
    })

    // Group service revenue by category
    const serviceRevenueByCategory = serviceRevenue.reduce((acc: Record<string, number>, transaction) => {
      const category = transaction.service?.category || 'OTHER'
      acc[category] = (acc[category] || 0) + transaction.amount.toNumber()
      return acc
    }, {})

    // Calculate total revenue
    const totalRevenue = revenueBreakdown.reduce((sum, item) => {
      return sum + (item._sum.amount?.toNumber() || 0)
    }, 0)

    // Format revenue breakdown
    const formattedBreakdown = revenueBreakdown.map(item => {
      const amount = item._sum.amount?.toNumber() || 0
      const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0
      
      let categoryName = item.type
      switch (item.type) {
        case 'ROOM_CHARGE':
          categoryName = 'Habitaciones'
          break
        case 'SERVICE_CHARGE':
          categoryName = 'Servicios'
          break
        case 'PAYMENT':
          categoryName = 'Pagos'
          break
      }

      return {
        category: categoryName,
        amount,
        percentage: Math.round(percentage * 100) / 100
      }
    })

    // Format service breakdown
    const formattedServiceBreakdown = Object.entries(serviceRevenueByCategory).map(([category, amount]) => {
      const percentage = totalRevenue > 0 ? ((amount as number) / totalRevenue) * 100 : 0
      
      let categoryName = category
      switch (category) {
        case 'RESTAURANT':
          categoryName = 'Restaurante'
          break
        case 'SPA':
          categoryName = 'Spa'
          break
        case 'LAUNDRY':
          categoryName = 'Lavandería'
          break
        case 'MINIBAR':
          categoryName = 'Minibar'
          break
        case 'ROOM_SERVICE':
          categoryName = 'Servicio a Habitación'
          break
        case 'OTHER':
          categoryName = 'Otros'
          break
      }

      return {
        category: categoryName,
        amount: amount as number,
        percentage: Math.round(percentage * 100) / 100
      }
    })

    // Average daily rate
    const roomChargeTransactions = await prisma.transaction.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        type: 'ROOM_CHARGE',
        status: 'COMPLETED'
      },
      include: {
        reservation: true
      }
    })

    const totalRoomRevenue = roomChargeTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0)
    const totalNights = roomChargeTransactions.reduce((sum, t) => {
      return sum + (t.reservation?.nights || 1)
    }, 0)

    const averageDailyRate = totalNights > 0 ? totalRoomRevenue / totalNights : 0

    return NextResponse.json({
      success: true,
      data: {
        breakdown: formattedBreakdown,
        serviceBreakdown: formattedServiceBreakdown,
        summary: {
          totalRevenue,
          averageDailyRate: Math.round(averageDailyRate * 100) / 100,
          totalTransactions: revenueBreakdown.reduce((sum, item) => sum + (item._sum.amount ? 1 : 0), 0)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { success: false, error: 'Error fetching revenue data' },
      { status: 500 }
    )
  }
}
