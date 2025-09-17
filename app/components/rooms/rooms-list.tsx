
'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Bed, Users, Wifi, Car, Eye, MoreHorizontal, Check, X } from 'lucide-react'

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

interface RoomsListProps {
  rooms: Room[]
  onStatusChange: (roomId: string, newStatus: string, notes?: string) => void
  getStatusBadgeVariant: (status: string) => any
  getStatusText: (status: string) => string
}

export function RoomsList({ rooms, onStatusChange, getStatusBadgeVariant, getStatusText }: RoomsListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Habitación</TableHead>
              <TableHead>Piso</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Huésped</TableHead>
              <TableHead>Tarifa</TableHead>
              <TableHead>Amenidades</TableHead>
              <TableHead className="w-[50px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">
                  Hab. {room.room_number}
                </TableCell>
                <TableCell>
                  Piso {room.floor.floor_number}
                </TableCell>
                <TableCell>
                  <div>
                    <div>{room.room_type.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {room.room_type.max_occupancy} pax
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(room.status)}>
                    {getStatusText(room.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {room.reservations.length > 0 ? (
                    <div>
                      <div className="font-medium">
                        {room.reservations[0].guest.first_name} {room.reservations[0].guest.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Hasta: {new Date(room.reservations[0].check_out_date).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    ${room.room_type.base_rate_usd.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    por noche
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {room.has_minibar && (
                      <Badge variant="outline" className="text-xs">
                        <Car className="h-3 w-3 mr-1" />
                        M
                      </Badge>
                    )}
                    {room.has_view && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        V
                      </Badge>
                    )}
                    {room.has_balcony && (
                      <Badge variant="outline" className="text-xs">
                        B
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
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
                        <Check className="mr-2 h-4 w-4" />
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
                        <X className="mr-2 h-4 w-4" />
                        Marcar Fuera de Servicio
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
