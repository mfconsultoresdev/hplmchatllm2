
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, Clock, DollarSign, Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ReservationForm from '@/components/reservations/reservation-form'
import ReservationDetails from '@/components/reservations/reservation-details'
import AvailabilityCalendar from '@/components/reservations/availability-calendar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Reservation {
  id: string
  reservation_number: string
  check_in_date: string
  check_out_date: string
  status: string
  payment_status: string
  adults: number
  children: number
  nights: number
  total_amount: number | { toString(): string }
  currency: string
  guest: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  room: {
    room_number: string
    room_type: {
      name: string
    }
    floor: {
      name: string
    }
  }
  creator: {
    name: string
  }
  created_at: string
}

interface ReservationStats {
  total_reservations: number
  confirmed: number
  checked_in: number
  checked_out: number
  cancelled: number
  total_revenue: number
  average_stay: number
}

const STATUS_COLORS = {
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
}

const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-red-100 text-red-800',
}

export default function ReservationsPage() {
  const { data: session } = useSession()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<ReservationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    payment_status: 'ALL',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20
  })

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'ALL') params.append(key, value.toString())
      })

      const response = await fetch(`/api/reservations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch reservations')

      const data = await response.json()
      setReservations(data.reservations)
    } catch (error) {
      console.error('Error fetching reservations:', error)
      toast.error('Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      // Calculate reservation stats from the data
      const reservationStats: ReservationStats = {
        total_reservations: reservations.length,
        confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
        checked_in: reservations.filter(r => r.status === 'CHECKED_IN').length,
        checked_out: reservations.filter(r => r.status === 'CHECKED_OUT').length,
        cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
        total_revenue: reservations
          .filter(r => r.status !== 'CANCELLED')
          .reduce((sum, r) => sum + parseFloat(r.total_amount.toString()), 0),
        average_stay: reservations.length > 0 
          ? reservations.reduce((sum, r) => sum + r.nights, 0) / reservations.length 
          : 0
      }
      setStats(reservationStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [filters])

  useEffect(() => {
    if (reservations.length > 0) {
      fetchStats()
    }
  }, [reservations])

  const handleReservationCreated = () => {
    setShowReservationForm(false)
    fetchReservations()
    toast.success('Reserva creada exitosamente')
  }

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      fetchReservations()
      toast.success('Estado actualizado exitosamente')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('¿Está seguro de que desea cancelar esta reserva?')) return

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to cancel reservation')
      
      fetchReservations()
      toast.success('Reserva cancelada exitosamente')
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      toast.error('Error al cancelar la reserva')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Reservas</h1>
          <p className="text-muted-foreground">
            Administra las reservas del hotel Paseo Las Mercedes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAvailabilityCalendar(true)} variant="outline">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendario
          </Button>
          <Button onClick={() => setShowReservationForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_reservations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Huéspedes Activos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checked_in}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estadía Promedio</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_stay.toFixed(1)} noches</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por huésped..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value, page: 1 }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Estado de reserva" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                <SelectItem value="CHECKED_IN">Check-in</SelectItem>
                <SelectItem value="CHECKED_OUT">Check-out</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.payment_status} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, payment_status: value, page: 1 }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los pagos</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="PARTIAL">Parcial</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setFilters({
                search: '',
                status: 'ALL',
                payment_status: 'ALL',
                date_from: '',
                date_to: '',
                page: 1,
                limit: 20
              })}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Reservas</CardTitle>
          <CardDescription>
            {reservations.length} reservas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando reservas...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron reservas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reserva #</TableHead>
                    <TableHead>Huésped</TableHead>
                    <TableHead>Habitación</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Noches</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {reservation.reservation_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {reservation.guest.first_name} {reservation.guest.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.adults + reservation.children} pax
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reservation.room.room_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.room.room_type.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(reservation.check_in_date), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(reservation.check_out_date), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>{reservation.nights}</TableCell>
                      <TableCell>
                        <Badge 
                          className={STATUS_COLORS[reservation.status as keyof typeof STATUS_COLORS]}
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={PAYMENT_STATUS_COLORS[reservation.payment_status as keyof typeof PAYMENT_STATUS_COLORS]}
                        >
                          {reservation.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${parseFloat(reservation.total_amount.toString()).toFixed(2)} {reservation.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReservation(reservation.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {reservation.status === 'CONFIRMED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(reservation.id, 'CHECKED_IN')}
                            >
                              Check-in
                            </Button>
                          )}
                          
                          {reservation.status === 'CHECKED_IN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(reservation.id, 'CHECKED_OUT')}
                            >
                              Check-out
                            </Button>
                          )}
                          
                          {['CONFIRMED', 'CHECKED_IN'].includes(reservation.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelReservation(reservation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Dialogs */}
      <Dialog open={showReservationForm} onOpenChange={setShowReservationForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
            <DialogDescription>
              Crear una nueva reserva para un huésped
            </DialogDescription>
          </DialogHeader>
          <ReservationForm onSuccess={handleReservationCreated} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAvailabilityCalendar} onOpenChange={setShowAvailabilityCalendar}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Calendario de Disponibilidad</DialogTitle>
            <DialogDescription>
              Vista del calendario de reservas y disponibilidad
            </DialogDescription>
          </DialogHeader>
          <AvailabilityCalendar />
        </DialogContent>
      </Dialog>

      {selectedReservation && (
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalles de la Reserva</DialogTitle>
            </DialogHeader>
            <ReservationDetails 
              reservationId={selectedReservation}
              onUpdate={() => {
                fetchReservations()
                setSelectedReservation(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
