
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateReservationSchema = z.object({
  check_in_date: z.string().transform((val) => new Date(val)).optional(),
  check_out_date: z.string().transform((val) => new Date(val)).optional(),
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
  currency: z.string().optional(),
  room_rate: z.number().optional(),
  status: z.enum(['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']).optional(),
  payment_status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED']).optional(),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
})

// Calculate nights between two dates
function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// GET /api/reservations/[id] - Get single reservation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      },
      include: {
        guest: true,
        room: {
          include: {
            room_type: true,
            floor: true
          }
        },
        creator: {
          select: { name: true, email: true }
        },
        check_in_user: {
          select: { name: true, email: true }
        },
        check_out_user: {
          select: { name: true, email: true }
        },
        transactions: {
          orderBy: { created_at: 'desc' }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(reservation)

  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    )
  }
}

// PUT /api/reservations/[id] - Update reservation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = UpdateReservationSchema.parse(body)

    // Get current reservation
    const currentReservation = await prisma.reservation.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      }
    })

    if (!currentReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Check if dates are being changed and validate availability
    if (data.check_in_date || data.check_out_date) {
      const newCheckIn = data.check_in_date || currentReservation.check_in_date
      const newCheckOut = data.check_out_date || currentReservation.check_out_date

      // Check room availability for new dates (excluding current reservation)
      const conflicts = await prisma.reservation.findMany({
        where: {
          room_id: currentReservation.room_id,
          id: { not: params.id },
          status: { not: 'CANCELLED' },
          OR: [
            {
              AND: [
                { check_in_date: { lte: newCheckIn } },
                { check_out_date: { gt: newCheckIn } }
              ]
            },
            {
              AND: [
                { check_in_date: { lt: newCheckOut } },
                { check_out_date: { gte: newCheckOut } }
              ]
            },
            {
              AND: [
                { check_in_date: { gte: newCheckIn } },
                { check_out_date: { lte: newCheckOut } }
              ]
            }
          ]
        }
      })

      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Room is not available for the selected dates' },
          { status: 400 }
        )
      }

      // Recalculate nights and total if dates changed
      if (data.check_in_date || data.check_out_date) {
        const nights = calculateNights(newCheckIn, newCheckOut)
        const room_rate = data.room_rate || parseFloat(currentReservation.room_rate.toString())
        Object.assign(data, {
          nights: nights,
          total_amount: parseFloat((room_rate * nights).toFixed(2))
        })
      }
    }

    // Update reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        ...data,
        updated_by: session.user.id!,
        updated_at: new Date()
      },
      include: {
        guest: true,
        room: {
          include: {
            room_type: true,
            floor: true
          }
        },
        creator: {
          select: { name: true, email: true }
        },
        transactions: {
          orderBy: { created_at: 'desc' }
        }
      }
    })

    return NextResponse.json(updatedReservation)

  } catch (error) {
    console.error('Error updating reservation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

// DELETE /api/reservations/[id] - Cancel reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current reservation
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Update reservation status to cancelled
    const cancelledReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        updated_by: session.user.id!,
        updated_at: new Date()
      },
      include: {
        guest: true,
        room: {
          include: {
            room_type: true,
            floor: true
          }
        }
      }
    })

    // Update room status if it was occupied
    if (reservation.status === 'CHECKED_IN') {
      await prisma.room.update({
        where: { id: reservation.room_id },
        data: { status: 'CLEANING' }
      })
    }

    return NextResponse.json(cancelledReservation)

  } catch (error) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    )
  }
}
