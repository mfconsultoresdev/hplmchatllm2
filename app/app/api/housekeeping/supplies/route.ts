
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener suministros de housekeeping
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
    const category = searchParams.get('category')
    const needsReorder = searchParams.get('needs_reorder') === 'true'
    const isActive = searchParams.get('is_active')
    const name = searchParams.get('name')
    
    // Build where clause
    const where: any = {
      hotel_id: session.user?.hotelId
    }

    if (category) where.category = category
    if (isActive !== null) where.is_active = isActive === 'true'
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      }
    }
    
    const supplies = await prisma.housekeepingSupply.findMany({
      where,
      include: {
        usage_records: {
          take: 5,
          orderBy: {
            usage_date: 'desc'
          },
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        inventory_movements: {
          take: 5,
          orderBy: {
            created_at: 'desc'
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Filter for low stock if needed
    let filteredSupplies = supplies
    if (needsReorder) {
      filteredSupplies = supplies.filter(supply => 
        Number(supply.current_stock) <= Number(supply.minimum_stock)
      )
    }

    // Calculate metrics for each supply
    const suppliesWithMetrics = filteredSupplies.map(supply => {
      const isLowStock = Number(supply.current_stock) <= Number(supply.minimum_stock)
      const stockLevel = Number(supply.maximum_stock) > 0 
        ? (Number(supply.current_stock) / Number(supply.maximum_stock)) * 100
        : 0

      return {
        ...supply,
        is_low_stock: isLowStock,
        stock_level_percentage: Math.round(stockLevel),
        needs_reorder: isLowStock
      }
    })

    return NextResponse.json({
      success: true,
      supplies: suppliesWithMetrics
    })

  } catch (error) {
    console.error('Error fetching housekeeping supplies:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo suministro
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
      description,
      category,
      unit_type,
      minimum_stock,
      maximum_stock,
      unit_cost,
      supplier_name,
      supplier_contact,
      brand,
      storage_location
    } = body

    // Validate required fields
    if (!name || !category || !unit_type || minimum_stock === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, category, unit_type, minimum_stock' },
        { status: 400 }
      )
    }

    const supply = await prisma.housekeepingSupply.create({
      data: {
        hotel_id: session.user?.hotelId!,
        name,
        description,
        category,
        unit_type,
        minimum_stock,
        maximum_stock,
        unit_cost,
        supplier_name,
        supplier_contact,
        brand,
        storage_location,
        created_by: session.user?.id
      }
    })

    return NextResponse.json({
      success: true,
      supply
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating housekeeping supply:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

