
"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Clock, Filter, Users, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Schedule {
  id: string
  schedule_date: string
  shift_start: string
  shift_end: string
  break_start?: string
  break_end?: string
  schedule_type: string
  status: string
  scheduled_hours: number
  break_minutes: number
  assigned_areas?: string
  special_tasks?: string
  notes?: string
  staff: {
    id: string
    employee_number: string
    first_name: string
    last_name: string
    department: string
    position: string
    shift_type: string
  }
}

const DEPARTMENTS = [
  'FRONT_DESK',
  'HOUSEKEEPING',
  'MAINTENANCE',
  'SECURITY',
  'ADMINISTRATION',
  'RESTAURANT'
]

const DEPARTMENT_LABELS: Record<string, string> = {
  'FRONT_DESK': 'Recepción',
  'HOUSEKEEPING': 'Limpieza',
  'MAINTENANCE': 'Mantenimiento',
  'SECURITY': 'Seguridad',
  'ADMINISTRATION': 'Administración',
  'RESTAURANT': 'Restaurante'
}

const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  'REGULAR': 'Regular',
  'OVERTIME': 'Tiempo Extra',
  'HOLIDAY': 'Feriado',
  'SPECIAL': 'Especial'
}

const STATUS_LABELS: Record<string, string> = {
  'SCHEDULED': 'Programado',
  'CONFIRMED': 'Confirmado',
  'MODIFIED': 'Modificado',
  'CANCELLED': 'Cancelado'
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    // Set default date range (next 7 days)
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)
    
    setDateFrom(today.toISOString().split('T')[0])
    setDateTo(nextWeek.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchSchedules()
    }
  }, [departmentFilter, statusFilter, dateFrom, dateTo])

  const fetchSchedules = async () => {
    try {
      const params = new URLSearchParams({
        department: departmentFilter,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo
      })

      const response = await fetch(`/api/schedules?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'FRONT_DESK': 'bg-blue-100 text-blue-800',
      'HOUSEKEEPING': 'bg-green-100 text-green-800',
      'MAINTENANCE': 'bg-orange-100 text-orange-800',
      'SECURITY': 'bg-red-100 text-red-800',
      'ADMINISTRATION': 'bg-purple-100 text-purple-800',
      'RESTAURANT': 'bg-yellow-100 text-yellow-800'
    }
    return colors[department] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'MODIFIED': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Group schedules by date
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    const date = schedule.schedule_date.split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Horarios y Turnos</h1>
          <p className="text-gray-600">Gestiona los horarios del personal</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Horario
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="date-from">Fecha Inicio</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Fecha Fin</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label>Departamento</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {DEPARTMENT_LABELS[dept]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="SCHEDULED">Programado</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="MODIFIED">Modificado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchSchedules} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horarios</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {schedules.filter(s => s.status === 'CONFIRMED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {schedules.filter(s => s.status === 'SCHEDULED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.reduce((sum, s) => sum + s.scheduled_hours, 0)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules by Date */}
      {Object.keys(schedulesByDate).length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron horarios para el período seleccionado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.keys(schedulesByDate)
          .sort()
          .map(date => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatDate(date)} - {schedulesByDate[date].length} turnos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Horas</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedulesByDate[date]
                        .sort((a, b) => new Date(a.shift_start).getTime() - new Date(b.shift_start).getTime())
                        .map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${schedule.staff.first_name} ${schedule.staff.last_name}`} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(schedule.staff.first_name, schedule.staff.last_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm">
                                    {schedule.staff.first_name} {schedule.staff.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    #{schedule.staff.employee_number}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getDepartmentColor(schedule.staff.department)}>
                                {DEPARTMENT_LABELS[schedule.staff.department]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {formatTime(schedule.shift_start)} - {formatTime(schedule.shift_end)}
                                </div>
                                {schedule.break_start && schedule.break_end && (
                                  <div className="text-gray-500 text-xs">
                                    Descanso: {formatTime(schedule.break_start)} - {formatTime(schedule.break_end)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{schedule.scheduled_hours}h</div>
                                <div className="text-gray-500 text-xs">
                                  {schedule.break_minutes}min descanso
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(schedule.status)}>
                                {STATUS_LABELS[schedule.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {SCHEDULE_TYPE_LABELS[schedule.schedule_type]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-32 text-xs text-gray-500 truncate">
                                {schedule.special_tasks || schedule.notes || '-'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
      )}
    </div>
  )
}
