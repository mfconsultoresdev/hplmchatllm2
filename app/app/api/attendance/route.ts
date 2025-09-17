
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { Decimal } from '@prisma/client/runtime/library'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const staff_id = searchParams.get('staff_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (staff_id) {
      where.staff_id = staff_id
    }
    
    if (department && department !== 'ALL') {
      where.staff = {
        department: department
      }
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    // Date range filter
    if (date_from && date_to) {
      where.attendance_date = {
        gte: new Date(date_from),
        lte: new Date(date_to)
      }
    } else if (date_from) {
      where.attendance_date = {
        gte: new Date(date_from)
      }
    } else {
      // Default to last 7 days if no date range specified
      const today = new Date()
      const lastWeek = new Date()
      lastWeek.setDate(today.getDate() - 7)
      
      where.attendance_date = {
        gte: lastWeek,
        lte: today
      }
    }

    const [attendance, total] = await Promise.all([
      prisma.staffAttendance.findMany({
        where,
        include: {
          staff: {
            select: {
              id: true,
              employee_number: true,
              first_name: true,
              last_name: true,
              department: true,
              position: true
            }
          },
          time_entries: {
            select: {
              id: true,
              entry_type: true,
              start_time: true,
              end_time: true,
              duration_minutes: true,
              task_category: true,
              task_description: true
            }
          }
        },
        orderBy: [
          { attendance_date: 'desc' },
          { staff: { department: 'asc' } },
          { staff: { last_name: 'asc' } }
        ],
        skip,
        take: limit
      }),
      prisma.staffAttendance.count({ where })
    ])

    return NextResponse.json({
      attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
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
      staff_id,
      attendance_date,
      clock_in,
      clock_out,
      break_start,
      break_end,
      scheduled_hours,
      status,
      absence_type,
      absence_reason,
      is_excused,
      productivity_rating,
      tasks_completed,
      performance_notes,
      notes
    } = body

    // Validate required fields
    if (!staff_id || !attendance_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staff_id }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: {
        hotel_id_staff_id_attendance_date: {
          hotel_id: hotel.id,
          staff_id,
          attendance_date: new Date(attendance_date)
        }
      }
    })

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance already exists for this date' },
        { status: 400 }
      )
    }

    // Calculate actual hours if clock_in and clock_out are provided
    let actual_hours = null
    let break_minutes = null

    if (clock_in && clock_out) {
      const clockInTime = new Date(clock_in).getTime()
      const clockOutTime = new Date(clock_out).getTime()
      
      let workMinutes = (clockOutTime - clockInTime) / (1000 * 60)
      
      if (break_start && break_end) {
        const breakStartTime = new Date(break_start).getTime()
        const breakEndTime = new Date(break_end).getTime()
        break_minutes = (breakEndTime - breakStartTime) / (1000 * 60)
        workMinutes -= break_minutes
      } else {
        break_minutes = 60 // Default 1 hour break
        workMinutes -= break_minutes
      }
      
      actual_hours = new Decimal(Math.round((workMinutes / 60) * 100) / 100) // Round to 2 decimal places
    }

    const attendance = await prisma.staffAttendance.create({
      data: {
        hotel_id: hotel.id,
        staff_id,
        attendance_date: new Date(attendance_date),
        clock_in: clock_in ? new Date(clock_in) : null,
        clock_out: clock_out ? new Date(clock_out) : null,
        break_start: break_start ? new Date(break_start) : null,
        break_end: break_end ? new Date(break_end) : null,
        scheduled_hours: scheduled_hours ? parseFloat(scheduled_hours) : null,
        actual_hours,
        break_minutes: Math.round(break_minutes || 0),
        status: status || 'PRESENT',
        absence_type,
        absence_reason,
        is_excused: is_excused || false,
        productivity_rating: productivity_rating ? parseInt(productivity_rating) : null,
        tasks_completed: tasks_completed ? tasks_completed : undefined,
        performance_notes,
        notes,
        created_by: 'system' // TODO: Get from auth context
      },
      include: {
        staff: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
            department: true,
            position: true
          }
        }
      }
    })

    return NextResponse.json(attendance, { status: 201 })

  } catch (error: any) {
    console.error('Error creating attendance:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Attendance already exists for this staff member on this date' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    )
  }
}
