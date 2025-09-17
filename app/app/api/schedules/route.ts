
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

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
      where.schedule_date = {
        gte: new Date(date_from),
        lte: new Date(date_to)
      }
    } else if (date_from) {
      where.schedule_date = {
        gte: new Date(date_from)
      }
    } else {
      // Default to next 7 days if no date range specified
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)
      
      where.schedule_date = {
        gte: today,
        lte: nextWeek
      }
    }

    const schedules = await prisma.staffSchedule.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            employee_number: true,
            first_name: true,
            last_name: true,
            department: true,
            position: true,
            shift_type: true
          }
        }
      },
      orderBy: [
        { schedule_date: 'asc' },
        { staff: { department: 'asc' } },
        { shift_start: 'asc' }
      ]
    })

    return NextResponse.json({ schedules })

  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
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
      schedule_date,
      shift_start,
      shift_end,
      break_start,
      break_end,
      schedule_type,
      scheduled_hours,
      break_minutes,
      assigned_areas,
      special_tasks,
      notes
    } = body

    // Validate required fields
    if (!staff_id || !schedule_date || !shift_start || !shift_end) {
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

    // Check if schedule already exists for this date
    const existingSchedule = await prisma.staffSchedule.findUnique({
      where: {
        hotel_id_staff_id_schedule_date: {
          hotel_id: hotel.id,
          staff_id,
          schedule_date: new Date(schedule_date)
        }
      }
    })

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule already exists for this date' },
        { status: 400 }
      )
    }

    const schedule = await prisma.staffSchedule.create({
      data: {
        hotel_id: hotel.id,
        staff_id,
        schedule_date: new Date(schedule_date),
        shift_start: new Date(shift_start),
        shift_end: new Date(shift_end),
        break_start: break_start ? new Date(break_start) : null,
        break_end: break_end ? new Date(break_end) : null,
        schedule_type: schedule_type || 'REGULAR',
        scheduled_hours: scheduled_hours ? parseFloat(scheduled_hours) : 8.0,
        break_minutes: break_minutes || 60,
        assigned_areas: assigned_areas ? assigned_areas : undefined,
        special_tasks,
        notes,
        status: 'SCHEDULED',
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

    return NextResponse.json(schedule, { status: 201 })

  } catch (error: any) {
    console.error('Error creating schedule:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Schedule already exists for this staff member on this date' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
