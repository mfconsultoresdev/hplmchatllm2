
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const body = await request.json()
    
    const { message_id, staff_id } = body

    if (!message_id || !staff_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the recipient record
    const recipient = await prisma.communicationRecipient.findUnique({
      where: {
        message_id_staff_id: {
          message_id,
          staff_id
        }
      }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient record not found' },
        { status: 404 }
      )
    }

    // Update the recipient as read
    const updatedRecipient = await prisma.communicationRecipient.update({
      where: {
        message_id_staff_id: {
          message_id,
          staff_id
        }
      },
      data: {
        read_at: new Date(),
        status: 'READ'
      }
    })

    // Update read count on the message
    await prisma.communicationMessage.update({
      where: { id: message_id },
      data: {
        read_count: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      message: 'Message marked as read',
      recipient: updatedRecipient
    })

  } catch (error) {
    console.error('Error marking message as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    )
  }
}
