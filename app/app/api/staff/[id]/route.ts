
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

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true
          }
        },
        schedules: {
          take: 5,
          orderBy: { schedule_date: 'desc' }
        },
        attendance: {
          take: 5,
          orderBy: { attendance_date: 'desc' }
        },
        evaluations: {
          take: 3,
          orderBy: { evaluation_date: 'desc' }
        },
        _count: {
          select: {
            schedules: true,
            attendance: true,
            evaluations: true,
            sent_messages: true
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(staff)

  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
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
      termination_date,
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

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Check if employee number already exists (excluding current staff)
    if (employee_number && employee_number !== existingStaff.employee_number) {
      const duplicateStaff = await prisma.staff.findUnique({
        where: { employee_number }
      })
      
      if (duplicateStaff) {
        return NextResponse.json(
          { error: 'Employee number already exists' },
          { status: 400 }
        )
      }
    }

    // Check if email already exists (excluding current staff)
    if (email && email !== existingStaff.email) {
      const duplicateEmail = await prisma.staff.findUnique({
        where: { email }
      })
      
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
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
        base_salary: base_salary ? parseFloat(base_salary) : null,
        hire_date: hire_date ? new Date(hire_date) : undefined,
        termination_date: termination_date ? new Date(termination_date) : null,
        emergency_contact,
        emergency_phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        address,
        city,
        state,
        postal_code,
        is_active,
        can_login,
        access_level,
        notes
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

    return NextResponse.json(updatedStaff)

  } catch (error: any) {
    console.error('Error updating staff:', error)
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Staff member with this information already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update staff member' },
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

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendance: true,
            schedules: true,
            evaluations: true
          }
        }
      }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // If staff has related records, deactivate instead of delete
    const hasRelatedRecords = existingStaff._count.attendance > 0 || 
                              existingStaff._count.schedules > 0 || 
                              existingStaff._count.evaluations > 0

    if (hasRelatedRecords) {
      const deactivatedStaff = await prisma.staff.update({
        where: { id },
        data: {
          is_active: false,
          termination_date: new Date()
        }
      })
      
      return NextResponse.json({
        message: 'Staff member deactivated due to existing records',
        staff: deactivatedStaff
      })
    }

    // If no related records, permanently delete
    await prisma.staff.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Staff member deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}
