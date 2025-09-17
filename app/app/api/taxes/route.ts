

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener configuración de impuestos
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const taxes = await prisma.taxConfig.findMany({
      where: {
        hotel_id: session.user?.hotelId || '',
        is_active: true,
        OR: [
          { effective_to: null },
          { effective_to: { gte: new Date() } }
        ]
      },
      orderBy: {
        type: 'asc'
      }
    })

    return NextResponse.json({ taxes })

  } catch (error) {
    console.error('Error obteniendo configuración de impuestos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear configuración de impuesto
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
      rate,
      is_active = true,
      is_inclusive = false,
      applies_to,
      tax_authority,
      legal_reference,
      effective_from,
      effective_to
    } = body

    if (!name || !type || rate === undefined || rate === null) {
      return NextResponse.json(
        { error: 'Nombre, tipo y tasa son requeridos' },
        { status: 400 }
      )
    }

    if (rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: 'La tasa debe estar entre 0 y 100' },
        { status: 400 }
      )
    }

    const taxConfig = await prisma.taxConfig.create({
      data: {
        hotel_id: session.user?.hotelId || '',
        name,
        type,
        rate: Number(rate),
        is_active,
        is_inclusive,
        applies_to,
        tax_authority,
        legal_reference,
        effective_from: effective_from ? new Date(effective_from) : new Date(),
        effective_to: effective_to ? new Date(effective_to) : null,
        created_by: session.user?.id
      }
    })

    return NextResponse.json({
      success: true,
      taxConfig,
      message: 'Configuración de impuesto creada exitosamente'
    })

  } catch (error) {
    console.error('Error creando configuración de impuesto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
