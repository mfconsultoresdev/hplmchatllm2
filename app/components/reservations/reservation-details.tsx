
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  CalendarDays, 
  Users, 
  DollarSign, 
  MapPin, 
  Clock,
  CreditCard,
  FileText,
  LogIn,
  LogOut,
  Edit
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

interface ReservationDetail {
  id: string
  reservation_number: string
  check_in_date: string
  check_out_date: string
  status: string
  payment_status: string
  adults: number
  children: number
  nights: number
  total_amount: number
  currency: string
  room_rate: number
  taxes: number
  discounts: number
  special_requests?: string
  notes?: string
  actual_check_in?: string
  actual_check_out?: string
  created_at: string
  updated_at: string
  guest: {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    document_type?: string
    document_number?: string
    nationality?: string
  }
  room: {
    id: string
    room_number: string
    room_type: {
      name: string
      max_occupancy: number
    }
    floor: {
      name: string
    }
  }
  creator: {
    name: string
    email: string
  }
  check_in_user?: {
    name: string
    email: string
  }
  check_out_user?: {
    name: string
    email: string
  }
  transactions: Array<{
    id: string
    type: string
    description: string
    amount: number
    currency: string
    status: string
    payment_method?: string
    created_at: string
  }>
}

interface Props {
  reservationId: string
  onUpdate: () => void
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

export default function ReservationDetails({ reservationId, onUpdate }: Props) {
  const [reservation, setReservation] = useState<ReservationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReservationDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reservations/${reservationId}`)
      if (!response.ok) throw new Error('Failed to fetch reservation')
      
      const data = await response.json()
      setReservation(data)
    } catch (error) {
      console.error('Error fetching reservation:', error)
      toast.error('Error al cargar los detalles de la reserva')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservationDetails()
  }, [reservationId])

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/reservations/${reservationId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!response.ok) throw new Error('Failed to check in')
      
      await fetchReservationDetails()
      toast.success('Check-in realizado exitosamente')
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Error al realizar el check-in')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/reservations/${reservationId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!response.ok) throw new Error('Failed to check out')
      
      await fetchReservationDetails()
      toast.success('Check-out realizado exitosamente')
    } catch (error) {
      console.error('Error checking out:', error)
      toast.error('Error al realizar el check-out')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelReservation = async () => {
    if (!confirm('¿Está seguro de que desea cancelar esta reserva?')) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to cancel reservation')
      
      onUpdate()
      toast.success('Reserva cancelada exitosamente')
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      toast.error('Error al cancelar la reserva')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando detalles...</div>
  }

  if (!reservation) {
    return <div className="text-center py-8">Reserva no encontrada</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold">Reserva {reservation.reservation_number}</h2>
            <Badge className={STATUS_COLORS[reservation.status as keyof typeof STATUS_COLORS]}>
              {reservation.status}
            </Badge>
            <Badge className={PAYMENT_STATUS_COLORS[reservation.payment_status as keyof typeof PAYMENT_STATUS_COLORS]}>
              {reservation.payment_status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Creada el {format(new Date(reservation.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
          </p>
        </div>

        <div className="flex space-x-2">
          {reservation.status === 'CONFIRMED' && (
            <Button onClick={handleCheckIn} disabled={actionLoading}>
              <LogIn className="h-4 w-4 mr-2" />
              Check-in
            </Button>
          )}
          
          {reservation.status === 'CHECKED_IN' && (
            <Button onClick={handleCheckOut} disabled={actionLoading}>
              <LogOut className="h-4 w-4 mr-2" />
              Check-out
            </Button>
          )}
          
          {['CONFIRMED', 'CHECKED_IN'].includes(reservation.status) && (
            <Button 
              variant="destructive" 
              onClick={handleCancelReservation}
              disabled={actionLoading}
            >
              Cancelar Reserva
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="guest">Huésped</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stay Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Información de Estadía
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in:</span>
                  <span className="font-medium">
                    {format(new Date(reservation.check_in_date), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out:</span>
                  <span className="font-medium">
                    {format(new Date(reservation.check_out_date), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Noches:</span>
                  <span className="font-medium">{reservation.nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Huéspedes:</span>
                  <span className="font-medium">
                    {reservation.adults} adultos, {reservation.children} niños
                  </span>
                </div>

                {reservation.actual_check_in && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in real:</span>
                    <span className="font-medium">
                      {format(new Date(reservation.actual_check_in), 'dd MMM yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                )}

                {reservation.actual_check_out && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out real:</span>
                    <span className="font-medium">
                      {format(new Date(reservation.actual_check_out), 'dd MMM yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Room Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Información de Habitación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Habitación:</span>
                  <span className="font-medium">{reservation.room.room_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{reservation.room.room_type.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Piso:</span>
                  <span className="font-medium">{reservation.room.floor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacidad:</span>
                  <span className="font-medium">{reservation.room.room_type.max_occupancy} personas</span>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Información de Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarifa por noche:</span>
                  <span className="font-medium">
                    ${reservation.room_rate.toFixed(2)} {reservation.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    ${(reservation.room_rate * reservation.nights).toFixed(2)} {reservation.currency}
                  </span>
                </div>
                {reservation.taxes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impuestos:</span>
                    <span className="font-medium">
                      ${reservation.taxes.toFixed(2)} {reservation.currency}
                    </span>
                  </div>
                )}
                {reservation.discounts > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuentos:</span>
                    <span>-${reservation.discounts.toFixed(2)} {reservation.currency}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${reservation.total_amount.toFixed(2)} {reservation.currency}</span>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            {(reservation.special_requests || reservation.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Información Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reservation.special_requests && (
                    <div>
                      <span className="text-muted-foreground font-medium">Solicitudes especiales:</span>
                      <p className="mt-1">{reservation.special_requests}</p>
                    </div>
                  )}
                  {reservation.notes && (
                    <div>
                      <span className="text-muted-foreground font-medium">Notas internas:</span>
                      <p className="mt-1">{reservation.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="guest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Información del Huésped
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Nombre completo:</span>
                  <p className="font-medium">
                    {reservation.guest.first_name} {reservation.guest.last_name}
                  </p>
                </div>
                
                {reservation.guest.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{reservation.guest.email}</p>
                  </div>
                )}
                
                {reservation.guest.phone && (
                  <div>
                    <span className="text-muted-foreground">Teléfono:</span>
                    <p className="font-medium">{reservation.guest.phone}</p>
                  </div>
                )}
                
                {reservation.guest.document_type && reservation.guest.document_number && (
                  <div>
                    <span className="text-muted-foreground">Documento:</span>
                    <p className="font-medium">
                      {reservation.guest.document_type}: {reservation.guest.document_number}
                    </p>
                  </div>
                )}
                
                {reservation.guest.nationality && (
                  <div>
                    <span className="text-muted-foreground">Nacionalidad:</span>
                    <p className="font-medium">{reservation.guest.nationality}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Historial de Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservation.transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay transacciones registradas
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservation.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {transaction.payment_method || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${transaction.amount.toFixed(2)} {transaction.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
