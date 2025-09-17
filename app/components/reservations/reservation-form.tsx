
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Users, DollarSign, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const reservationSchema = z.object({
  guest_id: z.string().min(1, 'Debe seleccionar un huésped'),
  room_id: z.string().min(1, 'Debe seleccionar una habitación'),
  check_in_date: z.string().min(1, 'Fecha de entrada es requerida'),
  check_out_date: z.string().min(1, 'Fecha de salida es requerida'),
  adults: z.number().min(1, 'Al menos 1 adulto es requerido'),
  children: z.number().min(0),
  currency: z.string().default('USD'),
  room_rate: z.number().min(0, 'La tarifa debe ser mayor a 0'),
  special_requests: z.string().optional(),
  notes: z.string().optional(),
})

type ReservationFormData = z.infer<typeof reservationSchema>

interface Guest {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  vip_status: boolean
}

interface AvailableRoom {
  id: string
  room_number: string
  room_type: {
    name: string
    max_occupancy: number
    base_rate_usd: number
  }
  floor: {
    name: string
  }
}

interface Props {
  onSuccess: () => void
}

export default function ReservationForm({ onSuccess }: Props) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
  const [guestSearch, setGuestSearch] = useState('')
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [creating, setCreating] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      adults: 1,
      children: 0,
      currency: 'USD'
    }
  })

  const checkInDate = watch('check_in_date')
  const checkOutDate = watch('check_out_date')
  const adults = watch('adults')
  const children = watch('children')
  const selectedRoomId = watch('room_id')

  // Fetch guests
  const fetchGuests = async (search = '') => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/guests?${params}`)
      if (!response.ok) throw new Error('Failed to fetch guests')
      
      const data = await response.json()
      setGuests(data.guests)
    } catch (error) {
      console.error('Error fetching guests:', error)
      toast.error('Error al cargar huéspedes')
    }
  }

  // Check room availability
  const checkAvailability = async () => {
    if (!checkInDate || !checkOutDate) return

    try {
      setCheckingAvailability(true)
      const params = new URLSearchParams({
        check_in: checkInDate,
        check_out: checkOutDate,
        adults: adults.toString(),
        children: children.toString()
      })

      const response = await fetch(`/api/reservations/availability?${params}`)
      if (!response.ok) throw new Error('Failed to check availability')

      const data = await response.json()
      
      // Flatten the room data for easier display
      const rooms: AvailableRoom[] = []
      data.availability.forEach((typeGroup: any) => {
        rooms.push(...typeGroup.rooms)
      })
      
      setAvailableRooms(rooms)
    } catch (error) {
      console.error('Error checking availability:', error)
      toast.error('Error al verificar disponibilidad')
      setAvailableRooms([])
    } finally {
      setCheckingAvailability(false)
    }
  }

  // Calculate total amount based on selected room
  useEffect(() => {
    if (selectedRoomId && checkInDate && checkOutDate) {
      const room = availableRooms.find(r => r.id === selectedRoomId)
      if (room) {
        const nights = Math.ceil(
          (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        )
        const total = room.room_type.base_rate_usd * nights
        setValue('room_rate', room.room_type.base_rate_usd)
      }
    }
  }, [selectedRoomId, checkInDate, checkOutDate, availableRooms, setValue])

  // Load guests on component mount
  useEffect(() => {
    fetchGuests()
  }, [])

  // Check availability when dates or guests change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      checkAvailability()
    }
  }, [checkInDate, checkOutDate, adults, children])

  const onSubmit = async (data: ReservationFormData) => {
    try {
      setCreating(true)
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create reservation')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error creating reservation:', error)
      toast.error(error.message || 'Error al crear la reserva')
    } finally {
      setCreating(false)
    }
  }

  const filteredGuests = guests.filter(guest =>
    `${guest.first_name} ${guest.last_name}`.toLowerCase().includes(guestSearch.toLowerCase())
  )

  const calculateNights = () => {
    if (checkInDate && checkOutDate) {
      return Math.ceil(
        (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    }
    return 0
  }

  const calculateTotal = () => {
    if (selectedRoomId && checkInDate && checkOutDate) {
      const room = availableRooms.find(r => r.id === selectedRoomId)
      if (room) {
        return room.room_type.base_rate_usd * calculateNights()
      }
    }
    return 0
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Guest Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Seleccionar Huésped
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar huésped por nombre..."
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={(value) => setValue('guest_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar huésped" />
              </SelectTrigger>
              <SelectContent>
                {filteredGuests.map((guest) => (
                  <SelectItem key={guest.id} value={guest.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{guest.first_name} {guest.last_name}</span>
                      {guest.vip_status && (
                        <Badge variant="secondary" className="ml-2">VIP</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.guest_id && (
              <p className="text-sm text-red-500">{errors.guest_id.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stay Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Detalles de la Estadía
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_in_date">Fecha de Entrada</Label>
              <Input
                id="check_in_date"
                type="date"
                {...register('check_in_date')}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              {errors.check_in_date && (
                <p className="text-sm text-red-500">{errors.check_in_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="check_out_date">Fecha de Salida</Label>
              <Input
                id="check_out_date"
                type="date"
                {...register('check_out_date')}
                min={checkInDate || format(new Date(), 'yyyy-MM-dd')}
              />
              {errors.check_out_date && (
                <p className="text-sm text-red-500">{errors.check_out_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="adults">Adultos</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                {...register('adults', { valueAsNumber: true })}
              />
              {errors.adults && (
                <p className="text-sm text-red-500">{errors.adults.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="children">Niños</Label>
              <Input
                id="children"
                type="number"
                min="0"
                {...register('children', { valueAsNumber: true })}
              />
              {errors.children && (
                <p className="text-sm text-red-500">{errors.children.message}</p>
              )}
            </div>
          </div>

          {checkInDate && checkOutDate && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">
                Noches: {calculateNights()} | 
                Huéspedes: {adults + children}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Habitaciones Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkingAvailability ? (
            <div className="text-center py-4">Verificando disponibilidad...</div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {checkInDate && checkOutDate 
                ? 'No hay habitaciones disponibles para las fechas seleccionadas'
                : 'Seleccione las fechas para ver habitaciones disponibles'
              }
            </div>
          ) : (
            <div className="space-y-4">
              <Select onValueChange={(value) => setValue('room_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar habitación" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <span className="font-medium">
                            Habitación {room.room_number}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {room.room_type.name} - {room.floor.name}
                          </span>
                        </div>
                        <span className="font-medium">
                          ${room.room_type.base_rate_usd}/noche
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.room_id && (
                <p className="text-sm text-red-500">{errors.room_id.message}</p>
              )}

              {selectedRoomId && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total de la Reserva:</span>
                    <span className="text-lg font-bold">
                      ${calculateTotal().toFixed(2)} USD
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {calculateNights()} noches × ${availableRooms.find(r => r.id === selectedRoomId)?.room_type.base_rate_usd}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="special_requests">Solicitudes Especiales</Label>
            <Textarea
              id="special_requests"
              placeholder="Cama extra, vista al mar, etc..."
              {...register('special_requests')}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas Internas</Label>
            <Textarea
              id="notes"
              placeholder="Notas para el personal..."
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hidden fields */}
      <input type="hidden" {...register('room_rate', { valueAsNumber: true })} />
      <input type="hidden" {...register('currency')} />

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={creating} className="min-w-32">
          {creating ? 'Creando...' : 'Crear Reserva'}
        </Button>
      </div>
    </form>
  )
}
