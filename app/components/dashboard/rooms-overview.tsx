

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bed, 
  Users, 
  Wrench, 
  X, 
  RefreshCw, 
  AlertCircle,
  Eye
} from 'lucide-react'

interface Room {
  id: string
  room_number: string
  status: string
  floor: {
    floor_number: number
    name?: string
  }
  room_type: {
    id: string
    name: string
    max_occupancy: number
  }
  current_reservation?: {
    id: string
    guest: {
      first_name: string
      last_name: string
    }
    check_out_date: string
  }
}

interface RoomsOverviewProps {
  maxRooms?: number
}

export function RoomsOverview({ maxRooms = 12 }: RoomsOverviewProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/rooms?limit=' + maxRooms)
      
      if (!response.ok) {
        throw new Error('Error al cargar las habitaciones')
      }
      
      const data = await response.json()
      setRooms(Array.isArray(data.rooms) ? data.rooms : [])
    } catch (err) {
      console.error('Rooms overview error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [maxRooms])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Disponible</Badge>
      case 'OCCUPIED':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Ocupada</Badge>
      case 'MAINTENANCE':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Mantenimiento</Badge>
      case 'OUT_OF_ORDER':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Fuera de Servicio</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Bed className="h-4 w-4 text-green-600" />
      case 'OCCUPIED':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-orange-600" />
      case 'OUT_OF_ORDER':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Bed className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Bed className="h-5 w-5 mr-2" />
              Estado de Habitaciones
            </CardTitle>
            <CardDescription>
              Vista general del estado actual de las habitaciones
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRooms}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/rooms'}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Todas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRooms}
                className="ml-2"
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div 
                key={room.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(room.status)}
                    <span className="font-medium">Hab. {room.room_number}</span>
                  </div>
                  {getStatusBadge(room.status)}
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  {room.room_type.name} • {room.floor.name || `Piso ${room.floor.floor_number}`}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Capacidad: {room.room_type.max_occupancy} personas
                </div>
                
                {room.current_reservation && (
                  <div className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                    <div className="font-medium">
                      {room.current_reservation.guest.first_name} {room.current_reservation.guest.last_name}
                    </div>
                    <div>
                      Sale: {new Date(room.current_reservation.check_out_date).toLocaleDateString('es-VE')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && rooms.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Bed className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay habitaciones disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
