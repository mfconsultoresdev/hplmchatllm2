
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener personal de housekeeping
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
    const isActive = searchParams.get('is_active')
    const isAvailable = searchParams.get('is_available')
    const skillLevel = searchParams.get('skill_level')
    
    // Build where clause
    const where: any = {
      hotel_id: session.user?.hotelId
    }

    if (isActive !== null) where.is_active = isActive === 'true'
    if (isAvailable !== null) where.is_available = isAvailable === 'true'
    if (skillLevel) where.skill_level = skillLevel

    const staff = await prisma.housekeepingStaff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            position: true,
            is_active: true
          }
        },
        attendance: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      },
      orderBy: [
        { skill_level: 'desc' },
        { user: { name: 'asc' } }
      ]
    })

    // Calculate performance metrics
    const staffWithMetrics = await Promise.all(
      staff.map(async (member) => {
        // Get task completion stats for last 30 days
        const taskStats = await prisma.housekeepingTask.groupBy({
          by: ['status'],
          where: {
            assigned_to: member.user_id,
            created_at: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          },
          _count: {
            id: true
          }
        })

        const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0)
        const completedTasks = taskStats.find(stat => stat.status === 'COMPLETED')?._count.id || 0
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

        // Calculate average task duration
        const avgDuration = await prisma.housekeepingTask.aggregate({
          where: {
            assigned_to: member.user_id,
            status: 'COMPLETED',
            actual_duration: { not: null }
          },
          _avg: {
            actual_duration: true
          }
        })

        return {
          ...member,
          performance_metrics: {
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            completion_rate: Math.round(completionRate),
            avg_task_duration: Math.round(avgDuration._avg.actual_duration || 0)
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      staff: staffWithMetrics
    })

  } catch (error) {
    console.error('Error fetching housekeeping staff:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

