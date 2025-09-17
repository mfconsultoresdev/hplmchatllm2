
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ClipboardList, 
  Users, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  BarChart3,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface DashboardData {
  task_stats: {
    total: number
    completed: number
    pending: number
    in_progress: number
    high_priority: number
    completion_rate: number
  }
  room_stats: Array<{
    status: string
    count: number
  }>
  staff_stats: {
    on_duty: number
    present_today: number
    availability_rate: number
  }
  supply_stats: {
    low_stock_count: number
  }
  performance: {
    avg_completion_time: number
    weekly_trend: Array<{
      day: string
      date: string
      total: number
      completed: number
      pending: number
    }>
  }
  recent_activity: Array<{
    id: string
    task_type: string
    room_number: string
    status: string
    priority: string
    updated_at: string
  }>
}

const taskTypeLabels: Record<string, string> = {
  CHECKOUT_CLEANING: 'Limpieza Post-Checkout',
  MAINTENANCE_CLEANING: 'Limpieza de Mantenimiento',
  DEEP_CLEANING: 'Limpieza Profunda',
  INSPECTION: 'Inspección',
  MAINTENANCE: 'Mantenimiento'
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada'
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

export default function HousekeepingPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/housekeeping/dashboard')
      
      if (response.ok) {
        const result = await response.json()
        setDashboardData(result.dashboard)
      } else {
        toast.error('Error cargando datos del dashboard')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Housekeeping</h1>
          <p className="text-muted-foreground">
            Gestión del departamento de limpieza y mantenimiento
          </p>
        </div>
        <div className="grid gap-4">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Housekeeping</h1>
          <p className="text-muted-foreground">
            Gestión del departamento de limpieza y mantenimiento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/housekeeping/tasks/new">
            <Button>
              <ClipboardList className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </Link>
          <Button variant="outline" onClick={fetchDashboardData}>
            Actualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="staff">Personal</TabsTrigger>
          <TabsTrigger value="supplies">Suministros</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tareas de Hoy
                    </CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.task_stats.total}</div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{dashboardData.task_stats.completed} completadas</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tasa de Completación
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.task_stats.completion_rate}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {dashboardData.task_stats.high_priority > 0 && (
                        <span className="text-orange-600">
                          {dashboardData.task_stats.high_priority} alta prioridad
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Personal Presente
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.staff_stats.present_today}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      de {dashboardData.staff_stats.on_duty} en servicio
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Suministros Bajos
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.supply_stats.low_stock_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {dashboardData.supply_stats.low_stock_count > 0 ? 'necesitan reposición' : 'stock normal'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Room Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Habitaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {dashboardData.room_stats.map((stat) => (
                      <div key={stat.status} className="text-center">
                        <div className="text-2xl font-bold">{stat.count}</div>
                        <div className="text-sm text-muted-foreground">
                          {stat.status === 'AVAILABLE' && 'Disponibles'}
                          {stat.status === 'OCCUPIED' && 'Ocupadas'}
                          {stat.status === 'CLEANING' && 'En Limpieza'}
                          {stat.status === 'MAINTENANCE' && 'Mantenimiento'}
                          {stat.status === 'OUT_OF_ORDER' && 'Fuera de Servicio'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Rendimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Tiempo promedio por tarea
                      </span>
                      <span className="font-medium">
                        {dashboardData.performance.avg_completion_time} min
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Tendencia Semanal</span>
                      <div className="grid grid-cols-7 gap-1">
                        {dashboardData.performance.weekly_trend.map((day) => (
                          <div key={day.date} className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              {day.day}
                            </div>
                            <div className="h-16 bg-muted rounded flex flex-col justify-end p-1">
                              <div 
                                className="bg-primary rounded-sm" 
                                style={{ 
                                  height: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%`,
                                  minHeight: day.completed > 0 ? '4px' : '0px'
                                }}
                              />
                            </div>
                            <div className="text-xs mt-1">
                              {day.completed}/{day.total}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.recent_activity.slice(0, 6).map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {activity.status === 'COMPLETED' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {activity.status === 'IN_PROGRESS' && (
                                <Clock className="h-4 w-4 text-blue-500" />
                              )}
                              {activity.status === 'PENDING' && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                Hab. {activity.room_number}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {taskTypeLabels[activity.task_type] || activity.task_type}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={`text-xs ${priorityColors[activity.priority] || 'bg-gray-100 text-gray-800'}`}
                              variant="secondary"
                            >
                              {activity.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {dashboardData.recent_activity.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay actividad reciente
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Resumen de Tareas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData?.task_stats.pending || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Pendientes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {dashboardData?.task_stats.in_progress || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">En Progreso</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progreso del día</span>
                      <span>{dashboardData?.task_stats.completion_rate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${dashboardData?.task_stats.completion_rate || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href="/housekeeping/tasks">
                      <Button className="w-full">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Gestionar Tareas
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tareas por Prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.task_stats.high_priority && dashboardData.task_stats.high_priority > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Urgentes</span>
                      </div>
                      <Badge variant="destructive">{dashboardData.task_stats.high_priority}</Badge>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">{dashboardData?.task_stats.total || 0}</div>
                      <div className="text-muted-foreground">Total Hoy</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-medium text-green-700">{dashboardData?.task_stats.completed || 0}</div>
                      <div className="text-muted-foreground">Completadas</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href="/housekeeping/tasks/new">
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Tarea
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal Disponible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData?.staff_stats.present_today || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Presentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData?.staff_stats.on_duty || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">En Servicio</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Disponibilidad</span>
                      <span>{dashboardData?.staff_stats.availability_rate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dashboardData?.staff_stats.availability_rate || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href="/housekeeping/staff">
                      <Button className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Gestionar Personal
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Disponibles</span>
                    </div>
                    <span className="font-medium">{dashboardData?.staff_stats.present_today || 0}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">0</div>
                      <div className="text-muted-foreground">En Descanso</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <div className="font-medium text-orange-700">0</div>
                      <div className="text-muted-foreground">Ausentes</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Link href="/housekeeping/staff/new">
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Empleado
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="supplies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData?.supply_stats.low_stock_count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Stock Bajo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        0
                      </div>
                      <div className="text-sm text-muted-foreground">Stock Normal</div>
                    </div>
                  </div>
                  
                  {dashboardData?.supply_stats.low_stock_count && dashboardData.supply_stats.low_stock_count > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-800">Acción Requerida</span>
                      </div>
                      <p className="text-xs text-red-700">
                        {dashboardData.supply_stats.low_stock_count} suministros necesitan reposición
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Link href="/housekeeping/supplies">
                      <Button className="w-full">
                        <Package className="h-4 w-4 mr-2" />
                        Gestionar Inventario
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas de Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.supply_stats.low_stock_count && dashboardData.supply_stats.low_stock_count > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium">Productos de Limpieza</span>
                        </div>
                        <Badge variant="secondary">Revisar</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Amenidades</span>
                        </div>
                        <Badge variant="outline">Monitor</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-muted-foreground">
                        Todos los suministros en stock normal
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Link href="/housekeeping/supplies/new">
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Suministro
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

