
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener datos del dashboard de housekeeping
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const hotelId = session.user?.hotelId

    // Get current date ranges
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // 1. Task Statistics
    const taskStats = await prisma.housekeepingTask.groupBy({
      by: ['status'],
      where: {
        hotel_id: hotelId,
        created_at: {
          gte: today
        }
      },
      _count: {
        id: true
      }
    })

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const completedTasks = taskStats.find(stat => stat.status === 'COMPLETED')?._count.id || 0
    const pendingTasks = taskStats.find(stat => stat.status === 'PENDING')?._count.id || 0
    const inProgressTasks = taskStats.find(stat => stat.status === 'IN_PROGRESS')?._count.id || 0

    // 2. Room Status Overview
    const roomStatusStats = await prisma.room.groupBy({
      by: ['status'],
      where: {
        hotel_id: hotelId
      },
      _count: {
        id: true
      }
    })

    // 3. Staff Performance Today
    const staffOnDuty = await prisma.housekeepingStaff.count({
      where: {
        hotel_id: hotelId,
        is_active: true,
        is_available: true
      }
    })

    const attendanceToday = await prisma.housekeepingAttendance.count({
      where: {
        hotel_id: hotelId,
        date: today,
        status: 'PRESENT'
      }
    })

    // 4. Supplies Low Stock
    const lowStockSupplies = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM housekeeping_supplies 
      WHERE hotel_id = ${hotelId} 
      AND current_stock <= minimum_stock
      AND is_active = true
    ` as [{ count: number }]

    // 5. Recent Activity (last 24 hours)
    const recentTasks = await prisma.housekeepingTask.findMany({
      where: {
        hotel_id: hotelId,
        updated_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        room: {
          select: {
            room_number: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 10
    })

    // 6. Weekly Task Completion Trend
    const weeklyTasks = await prisma.housekeepingTask.findMany({
      where: {
        hotel_id: hotelId,
        created_at: {
          gte: startOfWeek
        }
      },
      select: {
        status: true,
        created_at: true,
        completed_date: true
      }
    })

    // Group by day of week
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      
      const dayTasks = weeklyTasks.filter(task => {
        const taskDate = new Date(task.created_at)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.getTime() === date.getTime()
      })
      
      return {
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        total: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'COMPLETED').length,
        pending: dayTasks.filter(t => t.status === 'PENDING').length
      }
    })

    // 7. High Priority Tasks
    const highPriorityTasks = await prisma.housekeepingTask.count({
      where: {
        hotel_id: hotelId,
        priority: 'HIGH',
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      }
    })

    // 8. Average Task Completion Time
    const avgCompletionTime = await prisma.housekeepingTask.aggregate({
      where: {
        hotel_id: hotelId,
        status: 'COMPLETED',
        actual_duration: { not: null },
        completed_date: {
          gte: startOfMonth
        }
      },
      _avg: {
        actual_duration: true
      }
    })

    return NextResponse.json({
      success: true,
      dashboard: {
        task_stats: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          in_progress: inProgressTasks,
          high_priority: highPriorityTasks,
          completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        room_stats: roomStatusStats.map(stat => ({
          status: stat.status,
          count: stat._count.id
        })),
        staff_stats: {
          on_duty: staffOnDuty,
          present_today: attendanceToday,
          availability_rate: staffOnDuty > 0 ? Math.round((attendanceToday / staffOnDuty) * 100) : 0
        },
        supply_stats: {
          low_stock_count: lowStockSupplies[0].count
        },
        performance: {
          avg_completion_time: Math.round(avgCompletionTime._avg.actual_duration || 0),
          weekly_trend: weeklyData
        },
        recent_activity: recentTasks.map(task => ({
          id: task.id,
          task_type: task.task_type,
          room_number: task.room.room_number,
          status: task.status,
          priority: task.priority,
          updated_at: task.updated_at
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching housekeeping dashboard:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

