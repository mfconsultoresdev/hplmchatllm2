
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener tareas de housekeeping
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
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assigned_to')
    const taskType = searchParams.get('task_type')
    const priority = searchParams.get('priority')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const roomNumber = searchParams.get('room_number')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {
      hotel_id: session.user?.hotelId
    }

    if (status) where.status = status
    if (assignedTo) where.assigned_to = assignedTo
    if (taskType) where.task_type = taskType
    if (priority) where.priority = priority
    
    if (dateFrom || dateTo) {
      where.created_at = {}
      if (dateFrom) where.created_at.gte = new Date(dateFrom)
      if (dateTo) where.created_at.lte = new Date(dateTo)
    }

    if (roomNumber) {
      where.room = {
        room_number: {
          contains: roomNumber,
          mode: 'insensitive'
        }
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.housekeepingTask.findMany({
        where,
        include: {
          room: {
            include: {
              room_type: true,
              floor: true
            }
          },
          reservation: {
            include: {
              guest: true
            }
          },
          task_items: {
            orderBy: { created_at: 'asc' }
          },
          hotel: {
            select: {
              name: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.housekeepingTask.count({ where })
    ])

    // Add assigned staff information
    const tasksWithStaff = await Promise.all(
      tasks.map(async (task) => {
        let assignedStaff = null
        if (task.assigned_to) {
          const user = await prisma.user.findUnique({
            where: { id: task.assigned_to },
            include: {
              housekeeping_staff: true
            }
          })
          if (user) {
            assignedStaff = {
              id: user.id,
              name: user.name,
              email: user.email,
              employee_code: user.housekeeping_staff?.employee_code,
              skill_level: user.housekeeping_staff?.skill_level
            }
          }
        }

        return {
          ...task,
          assigned_staff: assignedStaff
        }
      })
    )

    return NextResponse.json({
      success: true,
      tasks: tasksWithStaff,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching housekeeping tasks:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva tarea de housekeeping
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
      room_id,
      task_type,
      priority = 'NORMAL',
      assigned_to,
      description,
      special_instructions,
      estimated_duration,
      reservation_id,
      task_items = []
    } = body

    // Validate required fields
    if (!room_id || !task_type) {
      return NextResponse.json(
        { error: 'room_id y task_type son requeridos' },
        { status: 400 }
      )
    }

    // Verify room belongs to hotel
    const room = await prisma.room.findFirst({
      where: {
        id: room_id,
        hotel_id: session.user?.hotelId
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Habitación no encontrada' },
        { status: 404 }
      )
    }

    // Create task
    const task = await prisma.housekeepingTask.create({
      data: {
        hotel_id: session.user?.hotelId!,
        room_id,
        task_type,
        priority,
        assigned_to,
        description,
        special_instructions,
        estimated_duration,
        reservation_id,
        assigned_date: assigned_to ? new Date() : null,
        created_by: session.user?.id
      },
      include: {
        room: {
          include: {
            room_type: true,
            floor: true
          }
        },
        reservation: {
          include: {
            guest: true
          }
        }
      }
    })

    // Create task items if provided
    if (task_items.length > 0) {
      await prisma.housekeepingTaskItem.createMany({
        data: task_items.map((item: any) => ({
          task_id: task.id,
          item_name: item.item_name,
          description: item.description,
          is_required: item.is_required ?? true
        }))
      })
    }

    // Fetch task with items
    const completeTask = await prisma.housekeepingTask.findUnique({
      where: { id: task.id },
      include: {
        room: {
          include: {
            room_type: true,
            floor: true
          }
        },
        reservation: {
          include: {
            guest: true
          }
        },
        task_items: {
          orderBy: { created_at: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      task: completeTask
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating housekeeping task:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

