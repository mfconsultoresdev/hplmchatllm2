
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const AvailabilityQuerySchema = z.object({
  check_in: z.string().transform((val) => new Date(val)),
  check_out: z.string().transform((val) => new Date(val)),
  adults: z.number().min(1).default(1),
  children: z.number().min(0).default(0),
  room_type_id: z.string().optional(),
})

// GET /api/reservations/availability - Check room availability
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = AvailabilityQuerySchema.parse({
      check_in: searchParams.get('check_in'),
      check_out: searchParams.get('check_out'),
      adults: parseInt(searchParams.get('adults') || '1'),
      children: parseInt(searchParams.get('children') || '0'),
      room_type_id: searchParams.get('room_type_id') || undefined,
    })

    // Get all rooms in the hotel
    const allRooms = await prisma.room.findMany({
      where: {
        hotel_id: session.user.hotelId,
        status: { in: ['AVAILABLE', 'OCCUPIED'] },
        ...(query.room_type_id && {
          room_type_id: query.room_type_id
        })
      },
      include: {
        room_type: true,
        floor: true,
      }
    })

    // Get conflicting reservations for the date range
    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        hotel_id: session.user.hotelId,
        status: { not: 'CANCELLED' },
        OR: [
          {
            AND: [
              { check_in_date: { lte: query.check_in } },
              { check_out_date: { gt: query.check_in } }
            ]
          },
          {
            AND: [
              { check_in_date: { lt: query.check_out } },
              { check_out_date: { gte: query.check_out } }
            ]
          },
          {
            AND: [
              { check_in_date: { gte: query.check_in } },
              { check_out_date: { lte: query.check_out } }
            ]
          }
        ]
      },
      select: {
        room_id: true
      }
    })

    // Create set of occupied room IDs
    const occupiedRoomIds = new Set(conflictingReservations.map(r => r.room_id))

    // Filter available rooms
    const availableRooms = allRooms.filter(room => 
      !occupiedRoomIds.has(room.id) && 
      room.room_type.max_occupancy >= (query.adults + query.children)
    )

    // Group by room type for easier display
    const roomsByType = availableRooms.reduce((acc, room) => {
      const typeId = room.room_type.id
      if (!acc[typeId]) {
        acc[typeId] = {
          room_type: room.room_type,
          available_count: 0,
          rooms: []
        }
      }
      acc[typeId].available_count++
      acc[typeId].rooms.push(room)
      return acc
    }, {} as any)

    // Calculate nights for pricing
    const nights = Math.ceil(
      (query.check_out.getTime() - query.check_in.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Add pricing information
    const availability = Object.values(roomsByType).map((group: any) => ({
      ...group,
      nights,
      total_base_rate_usd: group.room_type.base_rate_usd.toNumber() * nights,
      total_base_rate_eur: group.room_type.base_rate_eur.toNumber() * nights,
    }))

    return NextResponse.json({
      query: {
        check_in: query.check_in,
        check_out: query.check_out,
        adults: query.adults,
        children: query.children,
        nights
      },
      availability,
      summary: {
        total_rooms_available: availableRooms.length,
        room_types_available: availability.length
      }
    })

  } catch (error) {
    console.error('Error checking availability:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
