
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (department && department !== 'ALL') {
      where.department = department
    }
    
    if (status === 'active') {
      where.is_active = true
    } else if (status === 'inactive') {
      where.is_active = false
    }
    
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { employee_number: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              is_active: true
            }
          },
          _count: {
            select: {
              attendance: true,
              evaluations: true
            }
          }
        },
        orderBy: [
          { department: 'asc' },
          { last_name: 'asc' },
          { first_name: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.staff.count({ where })
    ])

    return NextResponse.json({
      staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const {
      employee_number,
      first_name,
      last_name,
      email,
      phone,
      department,
      position,
      employment_type,
      shift_type,
      salary_type,
      base_salary,
      hire_date,
      emergency_contact,
      emergency_phone,
      date_of_birth,
      address,
      city,
      state,
      postal_code,
      is_active,
      can_login,
      access_level,
      notes
    } = body

    // Validate required fields
    if (!employee_number || !first_name || !last_name || !department || !position || !hire_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if employee number already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { employee_number }
    })
    
    if (existingStaff) {
      return NextResponse.json(
        { error: 'Employee number already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.staff.findUnique({
        where: { email }
      })
      
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    const staff = await prisma.staff.create({
      data: {
        hotel_id: hotel.id,
        employee_number,
        first_name,
        last_name,
        email,
        phone,
        department,
        position,
        employment_type: employment_type || 'FULL_TIME',
        shift_type: shift_type || 'DAY',
        salary_type: salary_type || 'HOURLY',
        base_salary: base_salary ? parseFloat(base_salary) : null,
        hire_date: new Date(hire_date),
        emergency_contact,
        emergency_phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        address,
        city,
        state,
        postal_code,
        is_active: is_active ?? true,
        can_login: can_login ?? false,
        access_level: access_level || 'BASIC',
        notes,
        created_by: 'system' // TODO: Get from auth context
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true
          }
        }
      }
    })

    return NextResponse.json(staff, { status: 201 })

  } catch (error: any) {
    console.error('Error creating staff:', error)
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Staff member with this information already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}
