
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/floors - Obtener todos los pisos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const floors = await prisma.floor.findMany({
      where: {
        hotel_id: session.user.hotelId,
        is_active: true
      },
      include: {
        rooms: {
          include: {
            room_type: true,
            reservations: {
              where: {
                status: {
                  in: ['CONFIRMED', 'CHECKED_IN']
                }
              },
              include: {
                guest: true
              },
              take: 1,
              orderBy: {
                check_in_date: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        floor_number: 'asc'
      }
    })

    return NextResponse.json(floors)
  } catch (error) {
    console.error('Error fetching floors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
