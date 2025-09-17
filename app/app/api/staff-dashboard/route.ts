
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    
    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Get staff counts by department
    const staffByDepartment = await prisma.staff.groupBy({
      by: ['department'],
      where: {
        hotel_id: hotel.id,
        is_active: true
      },
      _count: {
        id: true
      }
    })

    // Get today's attendance statistics
    const todayAttendance = await prisma.staffAttendance.findMany({
      where: {
        hotel_id: hotel.id,
        attendance_date: {
          gte: startOfToday,
          lt: endOfToday
        }
      },
      include: {
        staff: {
          select: {
            department: true
          }
        }
      }
    })

    const attendanceStats = {
      total: todayAttendance.length,
      present: todayAttendance.filter(a => a.status === 'PRESENT').length,
      late: todayAttendance.filter(a => a.status === 'LATE').length,
      absent: todayAttendance.filter(a => ['ABSENT', 'SICK_LEAVE', 'VACATION'].includes(a.status)).length
    }

    // Get today's schedules
    const todaySchedules = await prisma.staffSchedule.findMany({
      where: {
        hotel_id: hotel.id,
        schedule_date: {
          gte: startOfToday,
          lt: endOfToday
        }
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
      },
      orderBy: [
        { shift_start: 'asc' },
        { staff: { department: 'asc' } }
      ]
    })

    // Get recent communications
    const recentCommunications = await prisma.communicationMessage.findMany({
      where: {
        hotel_id: hotel.id,
        status: 'SENT',
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        sender_staff: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        _count: {
          select: {
            recipients: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    })

    // Get average hours worked this week by department
    const weeklyHours = await prisma.staffAttendance.findMany({
      where: {
        hotel_id: hotel.id,
        attendance_date: {
          gte: startOfWeek,
          lt: endOfWeek
        },
        actual_hours: {
          not: null
        }
      },
      include: {
        staff: {
          select: {
            department: true
          }
        }
      }
    })

    const hoursByDepartment = weeklyHours.reduce((acc: any, record) => {
      const dept = record.staff.department
      if (!acc[dept]) {
        acc[dept] = { total: 0, count: 0 }
      }
      acc[dept].total += parseFloat(record.actual_hours?.toString() || '0')
      acc[dept].count += 1
      return acc
    }, {})

    Object.keys(hoursByDepartment).forEach(dept => {
      hoursByDepartment[dept].average = Math.round((hoursByDepartment[dept].total / hoursByDepartment[dept].count) * 100) / 100
    })

    // Get performance ratings for the month
    const monthlyPerformance = await prisma.staffAttendance.findMany({
      where: {
        hotel_id: hotel.id,
        attendance_date: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        productivity_rating: {
          not: null
        }
      },
      select: {
        productivity_rating: true,
        staff: {
          select: {
            department: true
          }
        }
      }
    })

    const avgPerformanceByDept = monthlyPerformance.reduce((acc: any, record) => {
      const dept = record.staff.department
      if (!acc[dept]) {
        acc[dept] = { total: 0, count: 0 }
      }
      acc[dept].total += record.productivity_rating || 0
      acc[dept].count += 1
      return acc
    }, {})

    Object.keys(avgPerformanceByDept).forEach(dept => {
      avgPerformanceByDept[dept].average = Math.round((avgPerformanceByDept[dept].total / avgPerformanceByDept[dept].count) * 100) / 100
    })

    return NextResponse.json({
      staff_by_department: staffByDepartment,
      attendance_stats: attendanceStats,
      today_schedules: todaySchedules,
      recent_communications: recentCommunications,
      weekly_hours_by_department: hoursByDepartment,
      monthly_performance_by_department: avgPerformanceByDept,
      summary: {
        total_active_staff: staffByDepartment.reduce((sum, dept) => sum + dept._count.id, 0),
        attendance_rate: attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0,
        scheduled_today: todaySchedules.length,
        unread_communications: recentCommunications.filter(c => c.read_count === 0).length
      }
    })

  } catch (error) {
    console.error('Error fetching staff dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff dashboard data' },
      { status: 500 }
    )
  }
}
