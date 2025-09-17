
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/rooms/[id] - Obtener habitación específica
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      },
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
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/rooms/[id] - Actualizar habitación
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { room_number, floor_id, room_type_id, status, has_minibar, has_balcony, has_view, wifi_password, notes } = body

    // Verificar que la habitación existe y pertenece al hotel del usuario
    const existingRoom = await prisma.room.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      }
    })

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Si se está cambiando el número de habitación, verificar que no exista ya
    if (room_number && room_number !== existingRoom.room_number) {
      const roomWithSameNumber = await prisma.room.findUnique({
        where: {
          hotel_id_room_number: {
            hotel_id: session.user.hotelId,
            room_number: room_number
          }
        }
      })

      if (roomWithSameNumber) {
        return NextResponse.json({ error: 'Room number already exists' }, { status: 400 })
      }
    }

    const room = await prisma.room.update({
      where: {
        id: params.id
      },
      data: {
        ...(room_number && { room_number }),
        ...(floor_id && { floor_id }),
        ...(room_type_id && { room_type_id }),
        ...(status && { status }),
        ...(has_minibar !== undefined && { has_minibar }),
        ...(has_balcony !== undefined && { has_balcony }),
        ...(has_view !== undefined && { has_view }),
        ...(wifi_password !== undefined && { wifi_password }),
        ...(notes !== undefined && { notes }),
        updated_by: session.user.id,
        updated_at: new Date()
      },
      include: {
        floor: true,
        room_type: true
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/rooms/[id] - Eliminar habitación
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verificar que la habitación existe y no tiene reservas activas
    const room = await prisma.room.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      },
      include: {
        reservations: {
          where: {
            status: {
              in: ['CONFIRMED', 'CHECKED_IN']
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.reservations.length > 0) {
      return NextResponse.json({ error: 'Cannot delete room with active reservations' }, { status: 400 })
    }

    await prisma.room.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
