
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

    const schedule = await prisma.staffSchedule.findUnique({
      where: { id },
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
      }
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)

  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
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
      shift_start,
      shift_end,
      break_start,
      break_end,
      schedule_type,
      scheduled_hours,
      break_minutes,
      assigned_areas,
      special_tasks,
      notes,
      status
    } = body

    // Check if schedule exists
    const existingSchedule = await prisma.staffSchedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    const updatedSchedule = await prisma.staffSchedule.update({
      where: { id },
      data: {
        shift_start: shift_start ? new Date(shift_start) : undefined,
        shift_end: shift_end ? new Date(shift_end) : undefined,
        break_start: break_start ? new Date(break_start) : null,
        break_end: break_end ? new Date(break_end) : null,
        schedule_type,
        scheduled_hours: scheduled_hours ? parseFloat(scheduled_hours) : undefined,
        break_minutes,
        assigned_areas: assigned_areas ? assigned_areas : undefined,
        special_tasks,
        notes,
        status
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

    return NextResponse.json(updatedSchedule)

  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
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

    // Check if schedule exists
    const existingSchedule = await prisma.staffSchedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    await prisma.staffSchedule.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Schedule deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}
