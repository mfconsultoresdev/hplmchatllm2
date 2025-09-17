

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener métodos de pago
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        hotel_id: session.user?.hotelId || ''
      },
      orderBy: {
        display_order: 'asc'
      }
    })

    return NextResponse.json({ paymentMethods })

  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear método de pago
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      type,
      code,
      is_active = true,
      requires_approval = false,
      min_amount,
      max_amount,
      fee_type = 'NONE',
      fee_amount = 0,
      fee_percentage = 0,
      gateway_name,
      gateway_config,
      display_order = 0,
      icon_url,
      description
    } = body

    if (!name || !type || !code) {
      return NextResponse.json(
        { error: 'Nombre, tipo y código son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el código es único para el hotel
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        hotel_id: session.user?.hotelId || '',
        code
      }
    })

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Ya existe un método de pago con ese código' },
        { status: 400 }
      )
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        hotel_id: session.user?.hotelId || '',
        name,
        type,
        code,
        is_active,
        requires_approval,
        min_amount: min_amount ? Number(min_amount) : null,
        max_amount: max_amount ? Number(max_amount) : null,
        fee_type,
        fee_amount: Number(fee_amount),
        fee_percentage: Number(fee_percentage),
        gateway_name,
        gateway_config,
        display_order: Number(display_order),
        icon_url,
        description,
        created_by: session.user?.id
      }
    })

    return NextResponse.json({
      success: true,
      paymentMethod,
      message: 'Método de pago creado exitosamente'
    })

  } catch (error) {
    console.error('Error creando método de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
