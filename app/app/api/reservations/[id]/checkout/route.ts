
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/reservations/[id]/checkout - Process check-out
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notes, additional_charges } = await request.json()

    // Get reservation
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      },
      include: {
        room: true,
        guest: true,
        transactions: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation.status !== 'CHECKED_IN') {
      return NextResponse.json(
        { error: `Cannot check out reservation with status: ${reservation.status}` },
        { status: 400 }
      )
    }

    // Process checkout in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Add additional charges if any
      if (additional_charges && additional_charges.length > 0) {
        for (const charge of additional_charges) {
          await tx.transaction.create({
            data: {
              hotel_id: session.user.hotelId,
              type: 'SERVICE_CHARGE',
              description: charge.description,
              amount: charge.amount,
              currency: reservation.currency,
              reservation_id: reservation.id,
              room_id: reservation.room_id,
              guest_id: reservation.guest_id,
              service_id: charge.service_id || null,
              status: 'COMPLETED',
              created_by: session.user.id!
            }
          })
        }
      }

      // Update reservation
      const updatedReservation = await tx.reservation.update({
        where: { id: params.id },
        data: {
          status: 'CHECKED_OUT',
          actual_check_out: new Date(),
          check_out_by: session.user.id!,
          notes: notes || reservation.notes,
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
          transactions: {
            orderBy: { created_at: 'desc' }
          }
        }
      })

      // Update room status to cleaning
      await tx.room.update({
        where: { id: reservation.room_id },
        data: {
          status: 'CLEANING',
          updated_by: session.user.id!,
          updated_at: new Date()
        }
      })

      return updatedReservation
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error processing check-out:', error)
    return NextResponse.json(
      { error: 'Failed to process check-out' },
      { status: 500 }
    )
  }
}
