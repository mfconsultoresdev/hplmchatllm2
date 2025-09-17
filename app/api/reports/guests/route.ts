
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

    // Total unique guests in period
    const uniqueGuests = await prisma.reservation.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }
      },
      include: {
        guest: true
      },
      distinct: ['guest_id']
    })

    // Guest segmentation (simulated - in real app, you'd have guest categories)
    const totalGuests = uniqueGuests.length
    
    // Simulate guest segments based on reservation patterns
    const guestSegments = [
      {
        segment: 'Corporativo',
        count: Math.floor(totalGuests * 0.35),
        percentage: 35
      },
      {
        segment: 'Turismo',
        count: Math.floor(totalGuests * 0.50),
        percentage: 50
      },
      {
        segment: 'Eventos',
        count: Math.floor(totalGuests * 0.15),
        percentage: 15
      }
    ]

    // Repeat guests (guests with more than one reservation)
    const guestReservationCounts = await prisma.guest.findMany({
      include: {
        _count: {
          select: {
            reservations: {
              where: {
                created_at: {
                  gte: start,
                  lte: end
                }
              }
            }
          }
        }
      },
      where: {
        reservations: {
          some: {
            created_at: {
              gte: start,
              lte: end
            }
          }
        }
      }
    })

    const repeatGuests = guestReservationCounts.filter(guest => guest._count.reservations > 1)

    // Guest nationality distribution (if available)
    const nationalityStats = await prisma.guest.groupBy({
      by: ['nationality'],
      where: {
        reservations: {
          some: {
            created_at: {
              gte: start,
              lte: end
            }
          }
        },
        nationality: { not: null }
      },
      _count: {
        nationality: true
      },
      orderBy: {
        _count: {
          nationality: 'desc'
        }
      },
      take: 10
    })

    // VIP guests stats
    const vipGuests = await prisma.guest.count({
      where: {
        vip_status: true,
        reservations: {
          some: {
            created_at: {
              gte: start,
              lte: end
            }
          }
        }
      }
    })

    // Average stay duration
    const stayDurations = await prisma.reservation.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end
        },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }
      },
      select: {
        nights: true
      }
    })

    const averageStayDuration = stayDurations.length > 0 
      ? stayDurations.reduce((sum, res) => sum + res.nights, 0) / stayDurations.length 
      : 0

    return NextResponse.json({
      success: true,
      data: {
        guestSegments,
        nationalityStats: nationalityStats.map(stat => ({
          nationality: stat.nationality || 'Unknown',
          count: stat._count.nationality
        })),
        summary: {
          totalGuests,
          repeatGuests: repeatGuests.length,
          repeatGuestPercentage: totalGuests > 0 ? (repeatGuests.length / totalGuests) * 100 : 0,
          vipGuests,
          vipGuestPercentage: totalGuests > 0 ? (vipGuests / totalGuests) * 100 : 0,
          averageStayDuration: Math.round(averageStayDuration * 100) / 100
        }
      }
    })
  } catch (error) {
    console.error('Error fetching guest analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Error fetching guest analytics' },
      { status: 500 }
    )
  }
}
