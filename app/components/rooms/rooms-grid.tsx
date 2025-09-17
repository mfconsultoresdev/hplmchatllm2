
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Bed, Users, Wifi, Car, Eye, MoreHorizontal } from 'lucide-react'

interface Room {
  id: string
  room_number: string
  status: string
  floor: {
    id: string
    floor_number: number
    name: string
  }
  room_type: {
    id: string
    name: string
    max_occupancy: number
    base_rate_usd: number
  }
  reservations: Array<{
    id: string
    guest: {
      first_name: string
      last_name: string
    }
    check_in_date: string
    check_out_date: string
  }>
  has_minibar: boolean
  has_balcony: boolean
  has_view: boolean
  notes?: string
}

interface RoomsGridProps {
  rooms: Room[]
  onStatusChange: (roomId: string, newStatus: string, notes?: string) => void
  getStatusBadgeVariant: (status: string) => any
  getStatusText: (status: string) => string
}

export function RoomsGrid({ rooms, onStatusChange, getStatusBadgeVariant, getStatusText }: RoomsGridProps) {
  const groupedRooms = rooms.reduce((acc, room) => {
    const floorNumber = room.floor.floor_number
    if (!acc[floorNumber]) {
      acc[floorNumber] = []
    }
    acc[floorNumber].push(room)
    return acc
  }, {} as Record<number, Room[]>)

  const sortedFloors = Object.keys(groupedRooms).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-8">
      {sortedFloors.map((floorNumber) => (
        <div key={floorNumber}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold">Piso {floorNumber}</h3>
            <p className="text-muted-foreground">
              {groupedRooms[floorNumber].length} habitaciones
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupedRooms[floorNumber].map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Hab. {room.room_number}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(room.id, 'AVAILABLE')}
                          disabled={room.status === 'AVAILABLE'}
                        >
                          Marcar Disponible
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(room.id, 'CLEANING')}
                          disabled={room.status === 'CLEANING'}
                        >
                          Marcar en Limpieza
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(room.id, 'MAINTENANCE')}
                          disabled={room.status === 'MAINTENANCE'}
                        >
                          Marcar en Mantenimiento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(room.id, 'OUT_OF_ORDER')}
                          disabled={room.status === 'OUT_OF_ORDER'}
                        >
                          Marcar Fuera de Servicio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusBadgeVariant(room.status)}>
                      {getStatusText(room.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {room.room_type.name}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Información de huésped si está ocupada */}
                    {room.reservations.length > 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm">
                          {room.reservations[0].guest.first_name} {room.reservations[0].guest.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Check-out: {new Date(room.reservations[0].check_out_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {/* Características de la habitación */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{room.room_type.max_occupancy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>${room.room_type.base_rate_usd}</span>
                      </div>
                    </div>
                    
                    {/* Amenidades */}
                    <div className="flex gap-1">
                      {room.has_minibar && (
                        <Badge variant="outline" className="text-xs">
                          <Car className="h-3 w-3 mr-1" />
                          Minibar
                        </Badge>
                      )}
                      {room.has_view && (
                        <Badge variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Vista
                        </Badge>
                      )}
                      {room.has_balcony && (
                        <Badge variant="outline" className="text-xs">
                          Balcón
                        </Badge>
                      )}
                    </div>
                    
                    {/* Notas si existen */}
                    {room.notes && (
                      <p className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
                        {room.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
