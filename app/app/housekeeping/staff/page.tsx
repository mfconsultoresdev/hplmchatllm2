
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  User,
  Clock,
  TrendingUp,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface StaffMember {
  id: string
  employee_code: string
  shift_start: string
  shift_end: string
  skill_level: string
  is_active: boolean
  is_available: boolean
  current_location: string
  tasks_completed: number
  quality_rating: number
  user: {
    id: string
    name: string
    first_name: string
    last_name: string
    email: string
    phone: string
    position: string
  }
  performance_metrics: {
    total_tasks: number
    completed_tasks: number
    completion_rate: number
    avg_task_duration: number
  }
  attendance: Array<{
    date: string
    status: string
    actual_hours: number
  }>
}

const skillLevelLabels: Record<string, string> = {
  TRAINEE: 'Entrenamiento',
  JUNIOR: 'Junior',
  SENIOR: 'Senior',
  SUPERVISOR: 'Supervisor'
}

const skillLevelColors: Record<string, string> = {
  TRAINEE: 'bg-gray-100 text-gray-800',
  JUNIOR: 'bg-blue-100 text-blue-800',
  SENIOR: 'bg-green-100 text-green-800',
  SUPERVISOR: 'bg-purple-100 text-purple-800'
}

export default function HousekeepingStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    skill_level: '',
    is_active: '',
    is_available: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [filters])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.append(key, value)
      })

      const response = await fetch(`/api/housekeeping/staff?${searchParams}`)
      
      if (response.ok) {
        const result = await response.json()
        setStaff(result.staff)
      } else {
        toast.error('Error cargando el personal')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceRate = (attendance: StaffMember['attendance']) => {
    if (attendance.length === 0) return 0
    const presentDays = attendance.filter(day => day.status === 'PRESENT').length
    return Math.round((presentDays / attendance.length) * 100)
  }

  const renderStarsRating = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 text-yellow-400" />)
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return <div className="flex gap-1">{stars}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personal de Housekeeping</h1>
          <p className="text-muted-foreground">
            Gestión del equipo de limpieza y mantenimiento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/housekeeping/staff/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              {staff.filter(s => s.is_active).length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.is_available).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {staff.filter(s => s.is_active).length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + s.performance_metrics.completion_rate, 0) / staff.length) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completación de tareas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.length > 0 ? (staff.reduce((sum, s) => sum + (s.quality_rating || 0), 0) / staff.length).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de calidad
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={filters.skill_level} onValueChange={(value) => setFilters(prev => ({ ...prev, skill_level: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Nivel de habilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los niveles</SelectItem>
                <SelectItem value="TRAINEE">Entrenamiento</SelectItem>
                <SelectItem value="JUNIOR">Junior</SelectItem>
                <SelectItem value="SENIOR">Senior</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.is_active} onValueChange={(value) => setFilters(prev => ({ ...prev, is_active: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.is_available} onValueChange={(value) => setFilters(prev => ({ ...prev, is_available: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Disponibles</SelectItem>
                <SelectItem value="false">No disponibles</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchStaff}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {staff.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{member.user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {member.employee_code} • {member.user.position}
                      </p>
                      
                      <div className="flex gap-2 mt-2">
                        <Badge className={skillLevelColors[member.skill_level]} variant="secondary">
                          {skillLevelLabels[member.skill_level]}
                        </Badge>
                        
                        <Badge variant={member.is_available ? "default" : "secondary"}>
                          {member.is_available ? 'Disponible' : 'Ocupado'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {renderStarsRating(member.quality_rating || 0)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {(member.quality_rating || 0).toFixed(1)}/5.0
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Turno
                      </div>
                      <div className="font-medium">
                        {member.shift_start} - {member.shift_end}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        Tareas
                      </div>
                      <div className="font-medium">
                        {member.performance_metrics.completed_tasks}/{member.performance_metrics.total_tasks}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Tasa de Completación</div>
                      <div className="font-medium text-green-600">
                        {member.performance_metrics.completion_rate}%
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Tiempo Promedio</div>
                      <div className="font-medium">
                        {member.performance_metrics.avg_task_duration} min
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Asistencia</div>
                      <div className="font-medium">
                        {getAttendanceRate(member.attendance)}%
                      </div>
                    </div>

                    {member.current_location && (
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          Ubicación
                        </div>
                        <div className="font-medium text-xs">
                          {member.current_location}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                      {member.user.phone && (
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          Llamar
                        </Button>
                      )}
                      
                      {member.user.email && (
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                      )}
                    </div>

                    <Link href={`/housekeeping/staff/${member.id}`}>
                      <Button size="sm">Ver Detalles</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {staff.length === 0 && !loading && (
            <Card className="md:col-span-2">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay personal</h3>
                <p className="text-muted-foreground mb-4">
                  No se encontró personal con los filtros seleccionados
                </p>
                <Link href="/housekeeping/staff/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar primer empleado
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
