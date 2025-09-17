
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')
    
    const endDate = new Date()
    const startDate = subMonths(endDate, months - 1)
    
    // Generate month intervals
    const monthIntervals = eachMonthOfInterval({
      start: startOfMonth(startDate),
      end: endOfMonth(endDate)
    })

    const trendsData = await Promise.all(
      monthIntervals.map(async (monthStart) => {
        const monthEnd = endOfMonth(monthStart)
        
        // Reservations count for this month
        const reservationCount = await prisma.reservation.count({
          where: {
            created_at: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })

        // Revenue for this month
        const monthRevenue = await prisma.transaction.aggregate({
          where: {
            created_at: {
              gte: monthStart,
              lte: monthEnd
            },
            status: 'COMPLETED',
            type: { in: ['ROOM_CHARGE', 'SERVICE_CHARGE'] }
          },
          _sum: {
            amount: true
          }
        })

        // Average occupancy for this month
        const totalRooms = await prisma.room.count()
        const daysInMonth = monthEnd.getDate()
        
        const totalRoomNights = totalRooms * daysInMonth
        const occupiedRoomNights = await prisma.reservation.aggregate({
          where: {
            OR: [
              {
                AND: [
                  { check_in_date: { gte: monthStart } },
                  { check_in_date: { lte: monthEnd } }
                ]
              },
              {
                AND: [
                  { check_out_date: { gte: monthStart } },
                  { check_out_date: { lte: monthEnd } }
                ]
              },
              {
                AND: [
                  { check_in_date: { lte: monthStart } },
                  { check_out_date: { gte: monthEnd } }
                ]
              }
            ],
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }
          },
          _sum: {
            nights: true
          }
        })

        const occupancyRate = totalRoomNights > 0 
          ? ((occupiedRoomNights._sum.nights || 0) / totalRoomNights) * 100 
          : 0

        // Average daily rate
        const roomRevenue = await prisma.transaction.aggregate({
          where: {
            created_at: {
              gte: monthStart,
              lte: monthEnd
            },
            type: 'ROOM_CHARGE',
            status: 'COMPLETED'
          },
          _sum: {
            amount: true
          }
        })

        const totalNights = occupiedRoomNights._sum.nights || 1
        const avgDailyRate = totalNights > 0 
          ? (roomRevenue._sum.amount?.toNumber() || 0) / totalNights 
          : 0

        return {
          month: format(monthStart, 'MMM'),
          fullDate: format(monthStart, 'yyyy-MM'),
          reservations: reservationCount,
          revenue: monthRevenue._sum.amount?.toNumber() || 0,
          occupancy: Math.round(occupancyRate * 100) / 100,
          avgDailyRate: Math.round(avgDailyRate * 100) / 100
        }
      })
    )

    // Calculate growth rates
    const trendsWithGrowth = trendsData.map((current, index) => {
      const previous = index > 0 ? trendsData[index - 1] : null
      
      const reservationGrowth = previous 
        ? ((current.reservations - previous.reservations) / previous.reservations) * 100 
        : 0
      
      const revenueGrowth = previous 
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
        : 0
      
      const occupancyGrowth = previous 
        ? current.occupancy - previous.occupancy 
        : 0

      return {
        ...current,
        growth: {
          reservations: Math.round(reservationGrowth * 100) / 100,
          revenue: Math.round(revenueGrowth * 100) / 100,
          occupancy: Math.round(occupancyGrowth * 100) / 100
        }
      }
    })

    // Overall summary
    const totalRevenue = trendsData.reduce((sum, month) => sum + month.revenue, 0)
    const averageOccupancy = trendsData.reduce((sum, month) => sum + month.occupancy, 0) / trendsData.length
    const totalReservations = trendsData.reduce((sum, month) => sum + month.reservations, 0)

    return NextResponse.json({
      success: true,
      data: trendsWithGrowth,
      summary: {
        totalRevenue,
        averageOccupancy: Math.round(averageOccupancy * 100) / 100,
        totalReservations,
        periodMonths: months
      }
    })
  } catch (error) {
    console.error('Error fetching trends data:', error)
    return NextResponse.json(
      { success: false, error: 'Error fetching trends data' },
      { status: 500 }
    )
  }
}
