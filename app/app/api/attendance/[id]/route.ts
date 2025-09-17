
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

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

    const attendance = await prisma.staffAttendance.findUnique({
      where: { id },
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
          orderBy: { start_time: 'asc' }
        }
      }
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(attendance)

  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance record' },
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
      notes,
      approved_by,
      reviewed_by
    } = body

    // Check if attendance exists
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: { id }
    })

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Calculate actual hours if clock_in and clock_out are provided
    let actual_hours = existingAttendance.actual_hours
    let break_minutes = existingAttendance.break_minutes

    if (clock_in && clock_out) {
      const clockInTime = new Date(clock_in).getTime()
      const clockOutTime = new Date(clock_out).getTime()
      
      let workMinutes = (clockOutTime - clockInTime) / (1000 * 60)
      
      if (break_start && break_end) {
        const breakStartTime = new Date(break_start).getTime()
        const breakEndTime = new Date(break_end).getTime()
        break_minutes = (breakEndTime - breakStartTime) / (1000 * 60)
        workMinutes -= break_minutes
      } else if (existingAttendance.break_minutes) {
        break_minutes = existingAttendance.break_minutes
        workMinutes -= break_minutes
      }
      
      actual_hours = new Decimal(Math.round((workMinutes / 60) * 100) / 100)
    }

    const updatedAttendance = await prisma.staffAttendance.update({
      where: { id },
      data: {
        clock_in: clock_in ? new Date(clock_in) : undefined,
        clock_out: clock_out ? new Date(clock_out) : undefined,
        break_start: break_start ? new Date(break_start) : undefined,
        break_end: break_end ? new Date(break_end) : undefined,
        scheduled_hours: scheduled_hours ? parseFloat(scheduled_hours) : undefined,
        actual_hours,
        break_minutes: Math.round(break_minutes || 0),
        status,
        absence_type,
        absence_reason,
        is_excused,
        productivity_rating: productivity_rating ? parseInt(productivity_rating) : undefined,
        tasks_completed: tasks_completed ? tasks_completed : undefined,
        performance_notes,
        notes,
        approved_by,
        approved_at: approved_by ? new Date() : undefined,
        reviewed_by,
        reviewed_at: reviewed_by ? new Date() : undefined
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

    return NextResponse.json(updatedAttendance)

  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance record' },
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

    // Check if attendance exists
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: { id }
    })

    if (!existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    await prisma.staffAttendance.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Attendance record deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}
