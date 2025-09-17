
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipient_type = searchParams.get('recipient_type')
    const recipient_id = searchParams.get('recipient_id')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const is_read = searchParams.get('is_read')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      hotel_id: hotel.id
    }
    
    if (recipient_type && recipient_type !== 'ALL') {
      where.recipient_type = recipient_type
    }
    
    if (recipient_id) {
      where.recipient_id = recipient_id
    }
    
    if (type && type !== 'ALL') {
      where.type = type
    }
    
    if (category && category !== 'ALL') {
      where.category = category
    }
    
    if (is_read === 'true' || is_read === 'false') {
      where.is_read = is_read === 'true'
    }

    // Filter out expired notifications
    const now = new Date()
    where.OR = [
      { expires_at: null },
      { expires_at: { gt: now } }
    ]

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          staff: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              department: true
            }
          },
          guest: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: [
          { is_read: 'asc' }, // Unread first
          { created_at: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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
      title,
      message,
      type = 'INFO',
      category = 'SYSTEM',
      recipient_type = 'STAFF',
      recipient_id,
      source_type,
      source_id,
      delivery_method = 'PUSH',
      action_url,
      action_data,
      expires_at,
      auto_dismiss = false
    } = body

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        hotel_id: hotel.id,
        title,
        message,
        type,
        category,
        recipient_type,
        recipient_id,
        source_type,
        source_id,
        delivery_method,
        action_url,
        action_data: action_data || undefined,
        expires_at: expires_at ? new Date(expires_at) : null,
        auto_dismiss,
        created_by: 'system' // TODO: Get from auth context
      }
    })

    return NextResponse.json(notification, { status: 201 })

  } catch (error: any) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
