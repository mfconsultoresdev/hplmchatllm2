
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

interface Reservation {
  id: string
  reservation_number: string
  check_in_date: string
  check_out_date: string
  status: string
  room_id: string
  guest: {
    first_name: string
    last_name: string
  }
  room: {
    room_number: string
    room_type: {
      name: string
    }
  }
}

interface Room {
  id: string
  room_number: string
  room_type: {
    name: string
  }
  floor: {
    name: string
  }
}

export default function AvailabilityCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch rooms
      const roomsResponse = await fetch('/api/rooms')
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json()
        setRooms(roomsData.rooms)
      }

      // Fetch reservations for current month
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
      
      const reservationsResponse = await fetch(
        `/api/reservations?date_from=${startDate}&date_to=${endDate}&limit=1000`
      )
      
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json()
        setReservations(reservationsData.reservations)
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const getDaysInMonth = () => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    })
  }

  const getReservationsForDateAndRoom = (date: Date, roomId?: string) => {
    return reservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in_date)
      const checkOut = new Date(reservation.check_out_date)
      
      const isInDateRange = date >= checkIn && date < checkOut
      const matchesRoom = !roomId || reservation.room_id === roomId
      
      return isInDateRange && matchesRoom && reservation.status !== 'CANCELLED'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'CHECKED_IN': return 'bg-green-100 text-green-800'
      case 'CHECKED_OUT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRooms = selectedRoom 
    ? rooms.filter(room => room.id === selectedRoom)
    : rooms

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          Cargando calendario...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las habitaciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las habitaciones</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  Habitación {room.room_number} - {room.room_type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid gap-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((date) => {
            const dayReservations = getReservationsForDateAndRoom(date, selectedRoom)
            const isToday = isSameDay(date, new Date())
            
            return (
              <Card key={date.toISOString()} className={`min-h-32 ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader className="p-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${
                      isSameMonth(date, currentMonth) 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {format(date, 'd')}
                    </span>
                    {dayReservations.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayReservations.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-2 pt-0">
                  <div className="space-y-1">
                    {dayReservations.slice(0, 3).map((reservation) => (
                      <div
                        key={reservation.id}
                        className={`text-xs p-1 rounded ${getStatusColor(reservation.status)}`}
                        title={`${reservation.guest.first_name} ${reservation.guest.last_name} - Habitación ${reservation.room.room_number}`}
                      >
                        <div className="font-medium truncate">
                          {reservation.guest.first_name} {reservation.guest.last_name}
                        </div>
                        <div className="truncate">
                          Hab. {reservation.room.room_number}
                        </div>
                      </div>
                    ))}
                    
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayReservations.length - 3} más
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-100"></div>
              <span>Confirmada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-100"></div>
              <span>Check-in</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-100"></div>
              <span>Check-out</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded ring-2 ring-blue-500"></div>
              <span>Hoy</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
