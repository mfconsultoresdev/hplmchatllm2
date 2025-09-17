
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservation_number, guest_email } = body

    // Validate required fields
    if (!reservation_number) {
      return NextResponse.json(
        { message: 'Código de reserva requerido' },
        { status: 400 }
      )
    }

    // Find the reservation
    const reservation = await prisma.reservation.findFirst({
      where: {
        reservation_number: reservation_number.toUpperCase()
      },
      include: {
        guest: true,
        room: {
          include: {
            room_type: true
          }
        },
        hotel: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { message: 'Código de reserva no válido' },
        { status: 404 }
      )
    }

    // Validate email if provided
    if (guest_email && reservation.guest.email) {
      if (reservation.guest.email.toLowerCase() !== guest_email.toLowerCase()) {
        return NextResponse.json(
          { message: 'El email no coincide con la reserva' },
          { status: 400 }
        )
      }
    }

    // Get recent messages for this guest
    const guestMessages = await prisma.communicationMessage.findMany({
      where: {
        OR: [
          { guest_id: reservation.guest.id },
          {
            guest_recipients: {
              some: {
                guest_id: reservation.guest.id
              }
            }
          }
        ]
      },
      include: {
        template: {
          select: {
            name: true,
            category: true
          }
        },
        sender_staff: {
          select: {
            first_name: true,
            last_name: true,
            department: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10
    })

    // Prepare session data
    const sessionData = {
      guest: {
        id: reservation.guest.id,
        first_name: reservation.guest.first_name,
        last_name: reservation.guest.last_name,
        email: reservation.guest.email
      },
      reservation: {
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        room: {
          room_number: reservation.room.room_number,
          room_type: {
            name: reservation.room.room_type.name,
            amenities: reservation.room.room_type.amenities
          }
        }
      },
      hotel: {
        name: reservation.hotel.name,
        address: reservation.hotel.address,
        phone: reservation.hotel.phone,
        email: reservation.hotel.email
      },
      messages: guestMessages
    }

    return NextResponse.json(sessionData)

  } catch (error: any) {
    console.error('Error in guest portal login:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
