
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCheck, Clock, BedDouble, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface Room {
  id: string
  room_number: string
  status: string
  room_type: {
    name: string
  }
}

interface Reservation {
  id: string
  reservation_number: string
  check_in_date: string
  check_out_date: string
  adults: number
  children: number
  nights: number
  total_amount: number
  status: string
  guest: Guest
  room: Room
}

export default function CheckInPage() {
  const [pendingCheckIns, setPendingCheckIns] = useState<Reservation[]>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [checkInForm, setCheckInForm] = useState({
    keyCards: 1,
    notes: '',
    roomId: ''
  })

  useEffect(() => {
    fetchPendingCheckIns()
  }, [])

  const fetchPendingCheckIns = async () => {
    try {
      const response = await fetch('/api/checkin')
      const data = await response.json()
      
      if (data.checkIns) {
        setPendingCheckIns(data.checkIns)
      }
    } catch (error) {
      console.error('Error fetching pending check-ins:', error)
      toast.error('Error al cargar check-ins pendientes')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (reservationId: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId,
          roomId: checkInForm.roomId || undefined,
          keyCards: checkInForm.keyCards,
          notes: checkInForm.notes
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Check-in realizado exitosamente')
        fetchPendingCheckIns() // Refresh the list
        setSelectedReservation(null)
        setCheckInForm({ keyCards: 1, notes: '', roomId: '' })
      } else {
        toast.error(data.error || 'Error al procesar check-in')
      }
    } catch (error) {
      console.error('Error processing check-in:', error)
      toast.error('Error al procesar check-in')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'CHECKED_IN':
        return 'bg-green-100 text-green-800'
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-in de Huéspedes</h1>
          <p className="text-gray-600">Gestiona las llegadas programadas para hoy</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Reservaciones pendientes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-ins Pendientes ({pendingCheckIns.length})
          </h2>
          
          {pendingCheckIns.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No hay check-ins pendientes para hoy</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingCheckIns.map((reservation) => (
                <Card key={reservation.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {reservation.guest.first_name} {reservation.guest.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Reservación #{reservation.reservation_number}
                        </p>
                      </div>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <BedDouble className="h-4 w-4" />
                        Habitación {reservation.room.room_number}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.adults} adultos
                        {reservation.children > 0 && `, ${reservation.children} niños`}
                      </div>
                      <div>
                        Entrada: {formatDate(reservation.check_in_date)}
                      </div>
                      <div>
                        Salida: {formatDate(reservation.check_out_date)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">
                        ${reservation.total_amount.toFixed(2)} ({reservation.nights} noches)
                      </span>
                      <Button
                        onClick={() => setSelectedReservation(reservation)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Procesar Check-in
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Formulario de check-in */}
        <div>
          {selectedReservation ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">
                  Procesar Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Detalles de la Reservación</h4>
                  <p><strong>Huésped:</strong> {selectedReservation.guest.first_name} {selectedReservation.guest.last_name}</p>
                  <p><strong>Habitación:</strong> {selectedReservation.room.room_number} ({selectedReservation.room.room_type.name})</p>
                  <p><strong>Contacto:</strong> {selectedReservation.guest.email || selectedReservation.guest.phone || 'No disponible'}</p>
                </div>

                <div>
                  <Label htmlFor="keyCards">Número de Tarjetas</Label>
                  <Input
                    id="keyCards"
                    type="number"
                    min={1}
                    max={10}
                    value={checkInForm.keyCards}
                    onChange={(e) => setCheckInForm(prev => ({
                      ...prev,
                      keyCards: parseInt(e.target.value) || 1
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas del Check-in</Label>
                  <Textarea
                    id="notes"
                    placeholder="Observaciones especiales, solicitudes del huésped, etc."
                    value={checkInForm.notes}
                    onChange={(e) => setCheckInForm(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCheckIn(selectedReservation.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? 'Procesando...' : 'Confirmar Check-in'}
                  </Button>
                  <Button
                    onClick={() => setSelectedReservation(null)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Selecciona una reservación para procesar el check-in
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
