
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get all service requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const guestId = searchParams.get('guestId')

    const where: any = {}
    if (status) where.status = status
    if (guestId) where.guest_id = guestId

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
        guest: true,
        service: true,
        room: true,
        reservation: true
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({ serviceRequests })

  } catch (error) {
    console.error('Error obteniendo solicitudes de servicio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Create new service request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { guestId, serviceId, roomId, reservationId, quantity, notes, requestedTime } = await request.json()

    if (!guestId || !serviceId) {
      return NextResponse.json(
        { error: 'ID de huésped y servicio son requeridos' },
        { status: 400 }
      )
    }

    // Get guest's hotel_id
    const guest = await prisma.guest.findUnique({
      where: { id: guestId }
    })

    if (!guest) {
      return NextResponse.json(
        { error: 'Huésped no encontrado' },
        { status: 404 }
      )
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        hotel_id: guest.hotel_id,
        guest_id: guestId,
        service_id: serviceId,
        room_id: roomId,
        reservation_id: reservationId,
        quantity: quantity || 1,
        notes: notes || '',
        requested_time: requestedTime ? new Date(requestedTime) : new Date(),
        status: 'PENDING'
      },
      include: {
        guest: true,
        service: true,
        room: true,
        reservation: true
      }
    })

    return NextResponse.json({
      success: true,
      serviceRequest,
      message: 'Solicitud de servicio creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creando solicitud de servicio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
