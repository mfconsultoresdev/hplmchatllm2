
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// PUT /api/rooms/[id]/status - Cambiar estado de habitación
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    // Validar estado
    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'OUT_OF_ORDER']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid room status' }, { status: 400 })
    }

    // Verificar que la habitación existe
    const existingRoom = await prisma.room.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      }
    })

    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Actualizar estado
    const room = await prisma.room.update({
      where: {
        id: params.id
      },
      data: {
        status,
        notes: notes || existingRoom.notes,
        last_cleaned: status === 'CLEANING' ? new Date() : existingRoom.last_cleaned,
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
    console.error('Error updating room status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
