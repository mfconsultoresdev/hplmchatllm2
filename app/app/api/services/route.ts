
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get all hotel services
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ services })

  } catch (error) {
    console.error('Error obteniendo servicios:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { name, description, price, category, isActive, hotelId } = await request.json()

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      )
    }

    // For now, use a default hotel_id - this should be dynamic in production
    const defaultHotelId = hotelId || 'cm4yxpuow0000z8ibtm0f9nvw'

    const service = await prisma.service.create({
      data: {
        hotel_id: defaultHotelId,
        name,
        description: description || '',
        category,
        price_usd: price || 0,
        is_active: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({
      success: true,
      service,
      message: 'Servicio creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creando servicio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
