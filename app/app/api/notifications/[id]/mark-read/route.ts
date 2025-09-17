
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        is_read: true,
        read_at: new Date()
      }
    })

    return NextResponse.json(notification)

  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
