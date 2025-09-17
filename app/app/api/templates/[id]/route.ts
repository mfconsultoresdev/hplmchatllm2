
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const template = await prisma.messageTemplate.findUnique({
      where: { id },
      include: {
        messages: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            subject: true,
            status: true,
            sent_at: true,
            read_count: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)

  } catch (error) {
    console.error('Error fetching message template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const {
      name,
      category,
      type,
      subject,
      content,
      variables,
      language,
      is_active,
      is_automatic,
      trigger_event,
      send_delay_hours
    } = body

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
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
        updated_at: new Date()
      }
    })

    return NextResponse.json(template)

  } catch (error: any) {
    console.error('Error updating message template:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to update message template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.messageTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })

  } catch (error: any) {
    console.error('Error deleting message template:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to delete message template' },
      { status: 500 }
    )
  }
}
