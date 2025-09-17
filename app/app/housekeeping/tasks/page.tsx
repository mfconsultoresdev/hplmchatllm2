
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ClipboardList, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  Home,
  Edit,
  Play,
  Pause,
  CheckCheck
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface Task {
  id: string
  task_type: string
  priority: string
  status: string
  description: string
  estimated_duration: number
  actual_duration: number
  created_at: string
  assigned_date: string
  started_date: string
  completed_date: string
  room: {
    room_number: string
    room_type: {
      name: string
    }
    floor: {
      name: string
    }
  }
  assigned_staff: {
    id: string
    name: string
    employee_code: string
    skill_level: string
  } | null
  reservation: {
    guest: {
      first_name: string
      last_name: string
    }
  } | null
  task_items: Array<{
    id: string
    item_name: string
    is_completed: boolean
    is_required: boolean
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

const statusColors: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

export default function HousekeepingTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    task_type: '',
    room_number: ''
  })

  useEffect(() => {
    fetchTasks()
  }, [filters])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.append(key, value)
      })

      const response = await fetch(`/api/housekeeping/tasks?${searchParams}`)
      
      if (response.ok) {
        const result = await response.json()
        setTasks(result.tasks)
      } else {
        toast.error('Error cargando las tareas')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/housekeeping/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === 'IN_PROGRESS' && { started_date: new Date().toISOString() }),
          ...(newStatus === 'COMPLETED' && { completed_date: new Date().toISOString() })
        })
      })

      if (response.ok) {
        toast.success('Estado de la tarea actualizado')
        fetchTasks()
      } else {
        toast.error('Error actualizando la tarea')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Error de conexión')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'PENDING':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />
    }
  }

  const getCompletionPercentage = (task: Task) => {
    if (task.task_items.length === 0) return 0
    const completed = task.task_items.filter(item => item.is_completed).length
    return Math.round((completed / task.task_items.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas de Housekeeping</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de tareas de limpieza
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/housekeeping/tasks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Input
                placeholder="Buscar por habitación..."
                value={filters.room_number}
                onChange={(e) => setFilters(prev => ({ ...prev, room_number: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="COMPLETED">Completada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las prioridades</SelectItem>
                <SelectItem value="LOW">Baja</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.task_type} onValueChange={(value) => setFilters(prev => ({ ...prev, task_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de tarea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los tipos</SelectItem>
                <SelectItem value="CHECKOUT_CLEANING">Limpieza Post-Checkout</SelectItem>
                <SelectItem value="MAINTENANCE_CLEANING">Limpieza de Mantenimiento</SelectItem>
                <SelectItem value="DEEP_CLEANING">Limpieza Profunda</SelectItem>
                <SelectItem value="INSPECTION">Inspección</SelectItem>
                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchTasks}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <Badge className={statusColors[task.status]} variant="secondary">
                          {statusLabels[task.status]}
                        </Badge>
                      </div>
                      
                      <Badge className={priorityColors[task.priority]} variant="secondary">
                        {task.priority}
                      </Badge>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Home className="h-4 w-4" />
                        Hab. {task.room.room_number} - {task.room.room_type.name}
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <h3 className="font-medium">
                          {taskTypeLabels[task.task_type] || task.task_type}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {task.assigned_staff && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4" />
                            <span>{task.assigned_staff.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {task.assigned_staff.skill_level}
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {task.estimated_duration} min est.
                          </div>
                          
                          {task.actual_duration > 0 && (
                            <div>Real: {task.actual_duration} min</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Task Items Progress */}
                    {task.task_items.length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progreso de items</span>
                          <span>{getCompletionPercentage(task)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${getCompletionPercentage(task)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.task_items.filter(item => item.is_completed).length} de {task.task_items.length} items completados
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {task.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    
                    {task.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                        >
                          <CheckCheck className="h-4 w-4 mr-1" />
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, 'PENDING')}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                      </>
                    )}

                    <Link href={`/housekeeping/tasks/${task.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {tasks.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay tareas</h3>
                <p className="text-muted-foreground mb-4">
                  No se encontraron tareas con los filtros seleccionados
                </p>
                <Link href="/housekeeping/tasks/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera tarea
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
