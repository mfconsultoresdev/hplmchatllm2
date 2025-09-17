
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for reservation creation/validation
const CreateReservationSchema = z.object({
  room_id: z.string(),
  guest_id: z.string(),
  check_in_date: z.string().transform((val) => new Date(val)),
  check_out_date: z.string().transform((val) => new Date(val)),
  adults: z.number().min(1),
  children: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  room_rate: z.number(),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
})

const UpdateReservationSchema = z.object({
  check_in_date: z.string().transform((val) => new Date(val)).optional(),
  check_out_date: z.string().transform((val) => new Date(val)).optional(),
  adults: z.number().min(1).optional(),
  children: z.number().min(0).optional(),
  status: z.enum(['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']).optional(),
  payment_status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED']).optional(),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
})

// Generate unique reservation number
function generateReservationNumber(): string {
  const prefix = 'PLM'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${timestamp}${random}`
}

// Calculate nights between two dates
function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Check for room availability conflicts
async function checkRoomAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string
): Promise<boolean> {
  const conflicts = await prisma.reservation.findMany({
    where: {
      room_id: roomId,
      status: {
        not: 'CANCELLED'
      },
      OR: [
        {
          AND: [
            { check_in_date: { lte: checkIn } },
            { check_out_date: { gt: checkIn } }
          ]
        },
        {
          AND: [
            { check_in_date: { lt: checkOut } },
            { check_out_date: { gte: checkOut } }
          ]
        },
        {
          AND: [
            { check_in_date: { gte: checkIn } },
            { check_out_date: { lte: checkOut } }
          ]
        }
      ],
      ...(excludeReservationId && {
        id: { not: excludeReservationId }
      })
    }
  })

  return conflicts.length === 0
}

// GET /api/reservations - List reservations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const guest_name = searchParams.get('guest_name')
    const room_number = searchParams.get('room_number')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      hotel_id: session.user.hotelId
    }

    if (status) {
      where.status = status
    }

    if (date_from || date_to) {
      where.check_in_date = {}
      if (date_from) where.check_in_date.gte = new Date(date_from)
      if (date_to) where.check_in_date.lte = new Date(date_to)
    }

    if (guest_name) {
      where.guest = {
        OR: [
          { first_name: { contains: guest_name, mode: 'insensitive' } },
          { last_name: { contains: guest_name, mode: 'insensitive' } }
        ]
      }
    }

    if (room_number) {
      where.room = {
        room_number: { contains: room_number, mode: 'insensitive' }
      }
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { check_in_date: 'desc' },
          { created_at: 'desc' }
        ],
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
          }
        }
      }),
      prisma.reservation.count({ where })
    ])

    return NextResponse.json({
      reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

// POST /api/reservations - Create new reservation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateReservationSchema.parse(body)

    // Check room availability
    const isAvailable = await checkRoomAvailability(
      data.room_id,
      data.check_in_date,
      data.check_out_date
    )

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Room is not available for the selected dates' },
        { status: 400 }
      )
    }

    // Calculate nights and total
    const nights = calculateNights(data.check_in_date, data.check_out_date)
    const total_amount = data.room_rate * nights

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        reservation_number: generateReservationNumber(),
        hotel_id: session.user.hotelId,
        room_id: data.room_id,
        guest_id: data.guest_id,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        adults: data.adults,
        children: data.children,
        nights,
        currency: data.currency,
        room_rate: data.room_rate,
        total_amount,
        special_requests: data.special_requests,
        notes: data.notes,
        created_by: session.user.id!,
        status: 'CONFIRMED',
        payment_status: 'PENDING'
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

    // Update room status if check-in is today
    const today = new Date()
    const checkInDate = new Date(data.check_in_date)
    
    if (checkInDate.toDateString() === today.toDateString()) {
      await prisma.room.update({
        where: { id: data.room_id },
        data: { status: 'OCCUPIED' }
      })
    }

    return NextResponse.json(reservation, { status: 201 })

  } catch (error) {
    console.error('Error creating reservation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}

// PUT /api/reservations - Bulk update reservations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reservation_ids, updates } = await request.json()
    const updateData = UpdateReservationSchema.parse(updates)

    const updatedReservations = await Promise.all(
      reservation_ids.map(async (id: string) => {
        return prisma.reservation.update({
          where: { 
            id,
            hotel_id: session.user.hotelId 
          },
          data: {
            ...updateData,
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
      })
    )

    return NextResponse.json({ reservations: updatedReservations })

  } catch (error) {
    console.error('Error updating reservations:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update reservations' },
      { status: 500 }
    )
  }
}
