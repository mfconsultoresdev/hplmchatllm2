
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const department = searchParams.get('department')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const staff_id = searchParams.get('staff_id') // For user's specific messages
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (category && category !== 'ALL') {
      where.category = category
    }
    
    if (department && department !== 'ALL') {
      where.department = department
    }
    
    if (priority && priority !== 'ALL') {
      where.priority = priority
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    // If staff_id is provided, get messages targeted to this staff member
    if (staff_id) {
      where.OR = [
        { send_to_all: true },
        { sender_id: staff_id },
        {
          recipients: {
            some: {
              staff_id: staff_id
            }
          }
        }
      ]
    }

    const [messages, total] = await Promise.all([
      prisma.communicationMessage.findMany({
        where,
        include: {
          sender_staff: {
            select: {
              id: true,
              employee_number: true,
              first_name: true,
              last_name: true,
              department: true,
              position: true
            }
          },
          recipients: {
            include: {
              staff: {
                select: {
                  id: true,
                  employee_number: true,
                  first_name: true,
                  last_name: true,
                  department: true
                }
              }
            }
          },
          _count: {
            select: {
              recipients: true,
              replies: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.communicationMessage.count({ where })
    ])

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching communications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const {
      subject,
      message,
      priority,
      category,
      sender_name,
      sender_type,
      department,
      position,
      send_to_all,
      recipient_staff_ids,
      delivery_method,
      scheduled_send,
      attachments,
      expires_at
    } = body

    // Validate required fields
    if (!subject || !message || !sender_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the message
    const communicationMessage = await prisma.communicationMessage.create({
      data: {
        hotel_id: hotel.id,
        subject,
        message,
        priority: priority || 'NORMAL',
        category: category || 'GENERAL',
        sender_name,
        sender_type: sender_type || 'STAFF',
        department: department || null,
        position: position || null,
        send_to_all: send_to_all || false,
        delivery_method: delivery_method || 'INTERNAL',
        scheduled_send: scheduled_send ? new Date(scheduled_send) : null,
        sent_at: scheduled_send ? null : new Date(),
        attachments: attachments ? attachments : undefined,
        expires_at: expires_at ? new Date(expires_at) : null,
        status: scheduled_send ? 'DRAFT' : 'SENT',
        created_by: 'system' // TODO: Get from auth context
      }
    })

    // Create recipients if not sending to all
    if (!send_to_all && recipient_staff_ids && recipient_staff_ids.length > 0) {
      const recipientData = recipient_staff_ids.map((staff_id: string) => ({
        hotel_id: hotel.id,
        message_id: communicationMessage.id,
        staff_id,
        status: 'PENDING'
      }))

      await prisma.communicationRecipient.createMany({
        data: recipientData
      })
    } else if (send_to_all) {
      // Get all active staff for this hotel
      const activeStaff = await prisma.staff.findMany({
        where: {
          hotel_id: hotel.id,
          is_active: true
        },
        select: { id: true }
      })

      if (activeStaff.length > 0) {
        const recipientData = activeStaff.map(staff => ({
          hotel_id: hotel.id,
          message_id: communicationMessage.id,
          staff_id: staff.id,
          status: 'PENDING'
        }))

        await prisma.communicationRecipient.createMany({
          data: recipientData
        })
      }
    }

    // Fetch the created message with relations
    const messageWithRelations = await prisma.communicationMessage.findUnique({
      where: { id: communicationMessage.id },
      include: {
        recipients: {
          include: {
            staff: {
              select: {
                id: true,
                employee_number: true,
                first_name: true,
                last_name: true,
                department: true
              }
            }
          }
        },
        _count: {
          select: {
            recipients: true
          }
        }
      }
    })

    return NextResponse.json(messageWithRelations, { status: 201 })

  } catch (error: any) {
    console.error('Error creating communication:', error)
    return NextResponse.json(
      { error: 'Failed to create communication' },
      { status: 500 }
    )
  }
}
