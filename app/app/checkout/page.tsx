
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { UserX, Clock, BedDouble, Users, DollarSign, Key } from 'lucide-react'
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

export default function CheckOutPage() {
  const [pendingCheckOuts, setPendingCheckOuts] = useState<Reservation[]>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [checkOutForm, setCheckOutForm] = useState({
    charges: 0,
    notes: '',
    roomCondition: 'needs_cleaning',
    keyCardsReturned: true
  })

  useEffect(() => {
    fetchPendingCheckOuts()
  }, [])

  const fetchPendingCheckOuts = async () => {
    try {
      const response = await fetch('/api/checkout')
      const data = await response.json()
      
      if (data.checkOuts) {
        setPendingCheckOuts(data.checkOuts)
      }
    } catch (error) {
      console.error('Error fetching pending check-outs:', error)
      toast.error('Error al cargar check-outs pendientes')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async (reservationId: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId,
          charges: checkOutForm.charges,
          notes: checkOutForm.notes,
          roomCondition: checkOutForm.roomCondition,
          keyCardsReturned: checkOutForm.keyCardsReturned
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Check-out realizado exitosamente')
        fetchPendingCheckOuts() // Refresh the list
        setSelectedReservation(null)
        setCheckOutForm({
          charges: 0,
          notes: '',
          roomCondition: 'needs_cleaning',
          keyCardsReturned: true
        })
      } else {
        toast.error(data.error || 'Error al procesar check-out')
      }
    } catch (error) {
      console.error('Error processing check-out:', error)
      toast.error('Error al procesar check-out')
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

  const getRoomConditionLabel = (condition: string) => {
    switch (condition) {
      case 'clean':
        return 'Limpia y lista'
      case 'needs_cleaning':
        return 'Necesita limpieza'
      case 'maintenance_required':
        return 'Requiere mantenimiento'
      default:
        return condition
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
        <UserX className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-out de Huéspedes</h1>
          <p className="text-gray-600">Gestiona las salidas programadas para hoy</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Reservaciones pendientes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-outs Pendientes ({pendingCheckOuts.length})
          </h2>
          
          {pendingCheckOuts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No hay check-outs pendientes para hoy</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingCheckOuts.map((reservation) => (
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
                      <span className="font-semibold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${reservation.total_amount.toFixed(2)} ({reservation.nights} noches)
                      </span>
                      <Button
                        onClick={() => {
                          setSelectedReservation(reservation)
                          setCheckOutForm(prev => ({
                            ...prev,
                            charges: reservation.total_amount
                          }))
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Procesar Check-out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Formulario de check-out */}
        <div>
          {selectedReservation ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">
                  Procesar Check-out
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
                  <Label htmlFor="charges">Cargos Totales ($)</Label>
                  <Input
                    id="charges"
                    type="number"
                    step="0.01"
                    min={0}
                    value={checkOutForm.charges}
                    onChange={(e) => setCheckOutForm(prev => ({
                      ...prev,
                      charges: parseFloat(e.target.value) || 0
                    }))}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Incluye hospedaje, servicios adicionales, impuestos, etc.
                  </p>
                </div>

                <div>
                  <Label htmlFor="roomCondition">Estado de la Habitación</Label>
                  <Select
                    value={checkOutForm.roomCondition}
                    onValueChange={(value) => setCheckOutForm(prev => ({
                      ...prev,
                      roomCondition: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Limpia y lista</SelectItem>
                      <SelectItem value="needs_cleaning">Necesita limpieza</SelectItem>
                      <SelectItem value="maintenance_required">Requiere mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keyCards"
                    checked={checkOutForm.keyCardsReturned}
                    onCheckedChange={(checked) => setCheckOutForm(prev => ({
                      ...prev,
                      keyCardsReturned: checked as boolean
                    }))}
                  />
                  <Label htmlFor="keyCards" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Tarjetas de acceso devueltas
                  </Label>
                </div>

                <div>
                  <Label htmlFor="notes">Notas del Check-out</Label>
                  <Textarea
                    id="notes"
                    placeholder="Condición de la habitación, daños reportados, comentarios del huésped, etc."
                    value={checkOutForm.notes}
                    onChange={(e) => setCheckOutForm(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCheckOut(selectedReservation.id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {processing ? 'Procesando...' : 'Confirmar Check-out'}
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
                <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Selecciona una reservación para procesar el check-out
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
