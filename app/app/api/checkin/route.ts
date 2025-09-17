
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Process check-in
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { reservationId, roomId, notes, keyCards } = await request.json()

    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID de reservación requerido' },
        { status: 400 }
      )
    }

    // Find the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { 
        guest: true,
        room: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservación no encontrada' },
        { status: 404 }
      )
    }

    // Check if already checked in
    if (reservation.status === 'CHECKED_IN') {
      return NextResponse.json(
        { error: 'El huésped ya hizo check-in' },
        { status: 400 }
      )
    }

    // Update reservation status
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CHECKED_IN',
        actual_check_in: new Date(),
        room_id: roomId || reservation.room_id,
        notes: notes || reservation.notes
      }
    })

    // Update room status to occupied
    if (roomId || reservation.room_id) {
      await prisma.room.update({
        where: { id: roomId || reservation.room_id },
        data: { status: 'OCCUPIED' }
      })
    }

    // Create check-in record
    const checkInRecord = await prisma.checkIn.create({
      data: {
        hotel_id: reservation.hotel_id,
        reservation_id: reservationId,
        guest_id: reservation.guest_id,
        room_id: roomId || reservation.room_id,
        check_in_time: new Date(),
        key_cards: keyCards || 1,
        notes: notes || '',
        checked_in_by: session.user?.email || 'system'
      }
    })

    return NextResponse.json({
      success: true,
      checkIn: checkInRecord,
      message: 'Check-in procesado exitosamente'
    })

  } catch (error) {
    console.error('Error en check-in:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Get pending check-ins
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const pendingCheckIns = await prisma.reservation.findMany({
      where: {
        check_in_date: {
          gte: today,
          lt: tomorrow
        },
        status: 'CONFIRMED'
      },
      include: {
        guest: true,
        room: true
      },
      orderBy: {
        check_in_date: 'asc'
      }
    })

    return NextResponse.json({ checkIns: pendingCheckIns })

  } catch (error) {
    console.error('Error obteniendo check-ins pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
