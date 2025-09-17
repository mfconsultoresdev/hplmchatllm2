
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

// GET /api/guests/[id] - Get guest with history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guest = await prisma.guest.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      },
      include: {
        reservations: {
          include: {
            room: {
              include: {
                room_type: true,
                floor: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        },
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 10 // Last 10 transactions
        },
        _count: {
          select: {
            reservations: true,
            transactions: true
          }
        }
      }
    })

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(guest)

  } catch (error) {
    console.error('Error fetching guest:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest' },
      { status: 500 }
    )
  }
}

// PUT /api/guests/[id] - Update guest
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
    const data = UpdateGuestSchema.parse(body)

    // Check if guest exists
    const existingGuest = await prisma.guest.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
      }
    })

    if (!existingGuest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== existingGuest.email) {
      const duplicateEmail = await prisma.guest.findFirst({
        where: {
          hotel_id: session.user.hotelId,
          email: data.email,
          id: { not: params.id }
        }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Another guest with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Check document uniqueness if being updated
    if (data.document_type && data.document_number && 
        (data.document_type !== existingGuest.document_type || 
         data.document_number !== existingGuest.document_number)) {
      
      const duplicateDocument = await prisma.guest.findFirst({
        where: {
          hotel_id: session.user.hotelId,
          document_type: data.document_type,
          document_number: data.document_number,
          id: { not: params.id }
        }
      })

      if (duplicateDocument) {
        return NextResponse.json(
          { error: 'Another guest with this document already exists' },
          { status: 400 }
        )
      }
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: params.id },
      data: {
        ...data,
        updated_by: session.user.id!,
        updated_at: new Date()
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

    return NextResponse.json(updatedGuest)

  } catch (error) {
    console.error('Error updating guest:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update guest' },
      { status: 500 }
    )
  }
}

// DELETE /api/guests/[id] - Delete guest (if no reservations)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.hotelId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if guest exists and has no reservations
    const guest = await prisma.guest.findUnique({
      where: {
        id: params.id,
        hotel_id: session.user.hotelId
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

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    if (guest._count.reservations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete guest with existing reservations' },
        { status: 400 }
      )
    }

    await prisma.guest.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Guest deleted successfully' })

  } catch (error) {
    console.error('Error deleting guest:', error)
    return NextResponse.json(
      { error: 'Failed to delete guest' },
      { status: 500 }
    )
  }
}
