
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Room {
  id: string
  room_number: string
  room_type: {
    name: string
    base_rate_usd: number
  }
}

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function NewReservationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [formData, setFormData] = useState({
    room_id: '',
    guest_id: '',
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    currency: 'USD',
    special_requests: '',
    notes: ''
  })

  useEffect(() => {
    fetchRooms()
    fetchGuests()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms?.filter((room: Room) => room.id) || [])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchGuests = async () => {
    try {
      const response = await fetch('/api/guests')
      if (response.ok) {
        const data = await response.json()
        setGuests(data.guests?.filter((guest: Guest) => guest.id) || [])
      }
    } catch (error) {
      console.error('Error fetching guests:', error)
    }
  }

  const calculateNights = () => {
    if (formData.check_in_date && formData.check_out_date) {
      const checkIn = new Date(formData.check_in_date)
      const checkOut = new Date(formData.check_out_date)
      const diffTime = checkOut.getTime() - checkIn.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    }
    return 0
  }

  const getSelectedRoom = () => {
    return rooms.find(room => room.id === formData.room_id)
  }

  const calculateTotal = () => {
    const nights = calculateNights()
    const room = getSelectedRoom()
    if (room && nights > 0) {
      return nights * room.room_type.base_rate_usd
    }
    return 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const nights = calculateNights()
    const room = getSelectedRoom()
    
    if (!room) {
      toast.error('Debe seleccionar una habitación')
      setLoading(false)
      return
    }

    if (nights <= 0) {
      toast.error('Las fechas de check-in y check-out son inválidas')
      setLoading(false)
      return
    }

    try {
      const reservationData = {
        ...formData,
        nights,
        room_rate: room.room_type.base_rate_usd,
        total_amount: calculateTotal(),
        taxes: 0,
        discounts: 0
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      })

      if (response.ok) {
        toast.success('Reserva creada exitosamente')
        router.push('/reservations')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la reserva')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nueva Reserva</h1>
        <p className="text-muted-foreground">Crear una nueva reserva en el sistema</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información de la Reserva */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guest_id">Huésped*</Label>
                <Select value={formData.guest_id} onValueChange={(value) => setFormData({...formData, guest_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar huésped" />
                  </SelectTrigger>
                  <SelectContent>
                    {guests.map((guest) => (
                      <SelectItem key={guest.id} value={guest.id}>
                        {guest.first_name} {guest.last_name} {guest.email && `(${guest.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="room_id">Habitación*</Label>
                <Select value={formData.room_id} onValueChange={(value) => setFormData({...formData, room_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar habitación" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Habitación {room.room_number} - {room.room_type.name} (${room.room_type.base_rate_usd}/noche)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in_date">Check-in*</Label>
                  <Input
                    id="check_in_date"
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({...formData, check_in_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="check_out_date">Check-out*</Label>
                  <Input
                    id="check_out_date"
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({...formData, check_out_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adults">Adultos</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    value={formData.adults}
                    onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <Label htmlFor="children">Niños</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={formData.children}
                    onChange={(e) => setFormData({...formData, children: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Costos */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Costos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Noches:</span>
                  <span className="font-semibold">{calculateNights()}</span>
                </div>
                {getSelectedRoom() && (
                  <div className="flex justify-between">
                    <span>Tarifa por noche:</span>
                    <span className="font-semibold">${getSelectedRoom()?.room_type.base_rate_usd}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Solicitudes Especiales */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Solicitudes Especiales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="special_requests">Solicitudes Especiales</Label>
              <Textarea
                id="special_requests"
                placeholder="Cama extra, vista al mar, piso alto, etc."
                value={formData.special_requests}
                onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                placeholder="Notas para el personal del hotel..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/reservations')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Reserva'}
          </Button>
        </div>
      </form>
    </div>
  )
}
