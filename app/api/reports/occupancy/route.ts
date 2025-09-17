
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { format, subDays, eachDayOfInterval } from 'date-fns'

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
    
    // Get total rooms
    const totalRooms = await prisma.room.count({
      where: { 
        hotel: { name: 'Hotel Paseo Las Mercedes' } // Replace with actual hotel filter
      }
    })

    // Generate date range
    const dateRange = eachDayOfInterval({ start, end })
    
    const occupancyData = await Promise.all(
      dateRange.map(async (date) => {
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)
        
        // Count occupied rooms for this date
        const occupiedRooms = await prisma.reservation.count({
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            check_in_date: { lte: date },
            check_out_date: { gt: date }
          }
        })

        // Calculate revenue for this date
        const revenue = await prisma.transaction.aggregate({
          where: {
            type: { in: ['ROOM_CHARGE', 'SERVICE_CHARGE'] },
            status: 'COMPLETED',
            created_at: {
              gte: date,
              lt: nextDate
            }
          },
          _sum: {
            amount: true
          }
        })

        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

        return {
          date: format(date, 'MMM dd'),
          fullDate: format(date, 'yyyy-MM-dd'),
          occupancy: Math.round(occupancyRate * 100) / 100,
          occupiedRooms,
          totalRooms,
          revenue: revenue._sum.amount?.toNumber() || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: occupancyData,
      summary: {
        averageOccupancy: occupancyData.reduce((sum, day) => sum + day.occupancy, 0) / occupancyData.length,
        totalRevenue: occupancyData.reduce((sum, day) => sum + day.revenue, 0),
        totalRooms
      }
    })
  } catch (error) {
    console.error('Error fetching occupancy data:', error)
    return NextResponse.json(
      { success: false, error: 'Error fetching occupancy data' },
      { status: 500 }
    )
  }
}
