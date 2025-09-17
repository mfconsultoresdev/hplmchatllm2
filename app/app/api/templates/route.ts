
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const is_active = searchParams.get('is_active')
    const language = searchParams.get('language')

    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      hotel_id: hotel.id
    }
    
    if (category && category !== 'ALL') {
      where.category = category
    }
    
    if (type && type !== 'ALL') {
      where.type = type
    }
    
    if (is_active === 'true' || is_active === 'false') {
      where.is_active = is_active === 'true'
    }
    
    if (language) {
      where.language = language
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Error fetching message templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message templates' },
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
      name,
      category,
      type,
      subject,
      content,
      variables,
      language = 'es',
      is_active = true,
      is_automatic = false,
      trigger_event,
      send_delay_hours = 0
    } = body

    // Validate required fields
    if (!name || !category || !type || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the template
    const template = await prisma.messageTemplate.create({
      data: {
        hotel_id: hotel.id,
        name,
        category,
        type,
        subject,
        content,
        variables: variables || {},
        language,
        is_active,
        is_automatic,
        trigger_event,
        send_delay_hours,
        created_by: 'system' // TODO: Get from auth context
      }
    })

    return NextResponse.json(template, { status: 201 })

  } catch (error: any) {
    console.error('Error creating message template:', error)
    return NextResponse.json(
      { error: 'Failed to create message template' },
      { status: 500 }
    )
  }
}
