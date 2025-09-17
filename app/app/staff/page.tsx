
"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Users, Phone, Mail, Clock, Calendar, UserCheck, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Staff {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  department: string
  position: string
  employment_type: string
  shift_type: string
  salary_type: string
  base_salary?: number
  hire_date: string
  is_active: boolean
  can_login: boolean
  access_level: string
  user?: {
    id: string
    name: string
    email: string
    is_active: boolean
  }
  _count: {
    attendance: number
    evaluations: number
  }
}

interface StaffStats {
  total_active_staff: number
  attendance_rate: number
  scheduled_today: number
  unread_communications: number
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

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  'FULL_TIME': 'Tiempo Completo',
  'PART_TIME': 'Medio Tiempo',
  'CONTRACTOR': 'Contratista',
  'INTERN': 'Pasante'
}

const SHIFT_TYPE_LABELS: Record<string, string> = {
  'DAY': 'Día',
  'NIGHT': 'Noche',
  'ROTATING': 'Rotativo'
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [stats, setStats] = useState<StaffStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("active")
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchStaff()
    fetchStats()
  }, [departmentFilter, statusFilter, searchTerm])

  const fetchStaff = async () => {
    try {
      const params = new URLSearchParams({
        department: departmentFilter,
        status: statusFilter,
        search: searchTerm,
        limit: '50'
      })

      const response = await fetch(`/api/staff?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/staff-dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.summary)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatCurrency = (amount: number | undefined, type: string) => {
    if (!amount) return 'No especificado'
    const formatted = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
    
    return type === 'HOURLY' ? `${formatted}/hora` : `${formatted}/mes`
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
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
          <h1 className="text-3xl font-bold">Gestión de Personal</h1>
          <p className="text-gray-600">Administra empleados, horarios y asistencia</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Funcionalidad en desarrollo. Próximamente disponible.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_active_staff}</div>
              <p className="text-xs text-muted-foreground">
                Empleados activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencia Hoy</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendance_rate}%</div>
              <p className="text-xs text-muted-foreground">
                Tasa de asistencia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horarios Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduled_today}</div>
              <p className="text-xs text-muted-foreground">
                Turnos programados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comunicaciones</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unread_communications}</div>
              <p className="text-xs text-muted-foreground">
                Mensajes sin leer
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, número de empleado, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los Departamentos</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {DEPARTMENT_LABELS[dept]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron empleados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Tipo de Empleo</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Salario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Contacto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedStaff(member)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.first_name} ${member.last_name}`} />
                            <AvatarFallback>
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">
                              {member.first_name} {member.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{member.employee_number}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDepartmentColor(member.department)}>
                          {DEPARTMENT_LABELS[member.department]}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {EMPLOYMENT_TYPE_LABELS[member.employment_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {SHIFT_TYPE_LABELS[member.shift_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(member.base_salary, member.salary_type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            member.is_active ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className={member.is_active ? 'text-green-700' : 'text-red-700'}>
                            {member.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {member.email && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Detail Dialog */}
      {selectedStaff && (
        <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedStaff.first_name} ${selectedStaff.last_name}`} />
                  <AvatarFallback>
                    {getInitials(selectedStaff.first_name, selectedStaff.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div>{selectedStaff.first_name} {selectedStaff.last_name}</div>
                  <div className="text-sm text-gray-500">#{selectedStaff.employee_number}</div>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Departamento</label>
                  <p>{DEPARTMENT_LABELS[selectedStaff.department]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Posición</label>
                  <p>{selectedStaff.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Empleo</label>
                  <p>{EMPLOYMENT_TYPE_LABELS[selectedStaff.employment_type]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Turno</label>
                  <p>{SHIFT_TYPE_LABELS[selectedStaff.shift_type]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Contratación</label>
                  <p>{new Date(selectedStaff.hire_date).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Salario</label>
                  <p>{formatCurrency(selectedStaff.base_salary, selectedStaff.salary_type)}</p>
                </div>
              </div>
              
              {selectedStaff.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p>{selectedStaff.email}</p>
                </div>
              )}
              
              {selectedStaff.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Teléfono</label>
                  <p>{selectedStaff.phone}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedStaff._count.attendance}
                  </div>
                  <div className="text-xs text-gray-500">Registros de Asistencia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedStaff._count.evaluations}
                  </div>
                  <div className="text-xs text-gray-500">Evaluaciones</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${selectedStaff.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedStaff.is_active ? 'ACTIVO' : 'INACTIVO'}
                  </div>
                  <div className="text-xs text-gray-500">Estado</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
