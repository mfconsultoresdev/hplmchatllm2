
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/rooms - Obtener todas las habitaciones con filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const floor = searchParams.get('floor')
    const roomType = searchParams.get('roomType')

    const whereClause: any = {
      hotel_id: session.user.hotelId
    }

    if (status) whereClause.status = status
    if (floor) whereClause.floor_id = floor
    if (roomType) whereClause.room_type_id = roomType

    const rooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        floor: true,
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
          orderBy: {
            check_in_date: 'desc'
          },
          take: 1
        }
      },
      orderBy: [
        { floor: { floor_number: 'asc' } },
        { room_number: 'asc' }
      ]
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/rooms - Crear nueva habitación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { room_number, floor_id, room_type_id, has_minibar, has_balcony, has_view, wifi_password, notes } = body

    // Verificar que no exista una habitación con el mismo número
    const existingRoom = await prisma.room.findUnique({
      where: {
        hotel_id_room_number: {
          hotel_id: session.user.hotelId,
          room_number: room_number
        }
      }
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        room_number,
        hotel_id: session.user.hotelId,
        floor_id,
        room_type_id,
        has_minibar: has_minibar || false,
        has_balcony: has_balcony || false,
        has_view: has_view || false,
        wifi_password,
        notes,
        status: 'AVAILABLE',
        created_by: session.user.id,
        updated_by: session.user.id
      },
      include: {
        floor: true,
        room_type: true
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
