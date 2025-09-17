
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/room-types - Obtener todos los tipos de habitación
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const roomTypes = await prisma.roomType.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(roomTypes)
  } catch (error) {
    console.error('Error fetching room types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
