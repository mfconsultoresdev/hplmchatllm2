
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params

    const message = await prisma.communicationMessage.findUnique({
      where: { id },
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
                department: true,
                position: true
              }
            }
          },
          orderBy: {
            staff: {
              last_name: 'asc'
            }
          }
        },
        replies: {
          include: {
            sender_staff: {
              select: {
                id: true,
                employee_number: true,
                first_name: true,
                last_name: true,
                department: true
              }
            }
          },
          orderBy: {
            created_at: 'asc'
          }
        },
        _count: {
          select: {
            recipients: true,
            replies: true
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(message)

  } catch (error) {
    console.error('Error fetching message:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params
    const body = await request.json()

    const {
      subject,
      message,
      priority,
      category,
      status,
      expires_at,
      scheduled_send
    } = body

    // Check if message exists
    const existingMessage = await prisma.communicationMessage.findUnique({
      where: { id }
    })

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    const updatedMessage = await prisma.communicationMessage.update({
      where: { id },
      data: {
        subject,
        message,
        priority,
        category,
        status,
        expires_at: expires_at ? new Date(expires_at) : null,
        scheduled_send: scheduled_send ? new Date(scheduled_send) : undefined
      },
      include: {
        sender_staff: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
            department: true
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
        }
      }
    })

    return NextResponse.json(updatedMessage)

  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = params

    // Check if message exists
    const existingMessage = await prisma.communicationMessage.findUnique({
      where: { id }
    })

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Delete recipients first (due to foreign key constraints)
    await prisma.communicationRecipient.deleteMany({
      where: { message_id: id }
    })

    // Delete the message
    await prisma.communicationMessage.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Message deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
