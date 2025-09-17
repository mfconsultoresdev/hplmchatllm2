
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateGuestSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  document_type: z.enum(['ID', 'PASSPORT', 'DRIVER_LICENSE']).optional(),
  document_number: z.string().optional(),
  nationality: z.string().optional(),
  date_of_birth: z.string().transform((val) => new Date(val)).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  vip_status: z.boolean().default(false),
  preferences: z.record(z.any()).optional(),
  notes: z.string().optional(),
})

const UpdateGuestSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  document_type: z.enum(['ID', 'PASSPORT', 'DRIVER_LICENSE']).optional(),
  document_number: z.string().optional(),
  nationality: z.string().optional(),
  date_of_birth: z.string().transform((val) => new Date(val)).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  vip_status: z.boolean().optional(),
  preferences: z.record(z.any()).optional(),
  notes: z.string().optional(),
})

// GET /api/guests - List guests with search and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const vip_only = searchParams.get('vip_only') === 'true'

    const skip = (page - 1) * limit

    // Build search conditions
    const where: any = {
      hotel_id: session.user.hotelId
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { document_number: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (vip_only) {
      where.vip_status = true
    }

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { vip_status: 'desc' },
          { last_name: 'asc' },
          { first_name: 'asc' }
        ],
        include: {
          _count: {
            select: {
              reservations: true,
              transactions: true
            }
          }
        }
      }),
      prisma.guest.count({ where })
    ])

    return NextResponse.json({
      guests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guests' },
      { status: 500 }
    )
  }
}

// POST /api/guests - Create new guest
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateGuestSchema.parse(body)

    // Check if guest with same email already exists
    if (data.email) {
      const existingGuest = await prisma.guest.findFirst({
        where: {
          hotel_id: session.user.hotelId,
          email: data.email
        }
      })

      if (existingGuest) {
        return NextResponse.json(
          { error: 'Guest with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Check if guest with same document already exists
    if (data.document_type && data.document_number) {
      const existingGuest = await prisma.guest.findFirst({
        where: {
          hotel_id: session.user.hotelId,
          document_type: data.document_type,
          document_number: data.document_number
        }
      })

      if (existingGuest) {
        return NextResponse.json(
          { error: 'Guest with this document already exists' },
          { status: 400 }
        )
      }
    }

    const guest = await prisma.guest.create({
      data: {
        hotel_id: session.user.hotelId,
        ...data,
        created_by: session.user.id!
      },
      include: {
        _count: {
          select: {
            reservations: true,
            transactions: true
          }
        }
      }
    })

    return NextResponse.json(guest, { status: 201 })

  } catch (error) {
    console.error('Error creating guest:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create guest' },
      { status: 500 }
    )
  }
}
