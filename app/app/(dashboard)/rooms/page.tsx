
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { RoomsGrid } from '@/components/rooms/rooms-grid'
import { RoomsList } from '@/components/rooms/rooms-list'
import { Search, Plus, Filter, Grid, List } from 'lucide-react'

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

interface Floor {
  id: string
  floor_number: number
  name: string
}

interface RoomType {
  id: string
  name: string
  description: string
  max_occupancy: number
  base_rate_usd: number
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [floorFilter, setFloorFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  
  // Modal para crear habitación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    room_number: '',
    floor_id: '',
    room_type_id: '',
    has_minibar: false,
    has_balcony: false,
    has_view: false,
    wifi_password: '',
    notes: ''
  })

  useEffect(() => {
    fetchRooms()
    fetchFloors()
    fetchRoomTypes()
  }, [])

  const fetchRooms = async (filters?: any) => {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.floor) params.append('floor', filters.floor)
      if (filters?.roomType) params.append('roomType', filters.roomType)
      
      const response = await fetch(`/api/rooms?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      } else {
        toast.error('Error al cargar las habitaciones')
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('Error al cargar las habitaciones')
    } finally {
      setLoading(false)
    }
  }

  const fetchFloors = async () => {
    try {
      const response = await fetch('/api/floors')
      if (response.ok) {
        const data = await response.json()
        setFloors(data)
      }
    } catch (error) {
      console.error('Error fetching floors:', error)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('/api/room-types')
      if (response.ok) {
        const data = await response.json()
        setRoomTypes(data)
      }
    } catch (error) {
      console.error('Error fetching room types:', error)
    }
  }

  const handleCreateRoom = async () => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      })

      if (response.ok) {
        toast.success('Habitación creada exitosamente')
        setIsCreateModalOpen(false)
        setCreateFormData({
          room_number: '',
          floor_id: '',
          room_type_id: '',
          has_minibar: false,
          has_balcony: false,
          has_view: false,
          wifi_password: '',
          notes: ''
        })
        fetchRooms()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear la habitación')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Error al crear la habitación')
    }
  }

  const handleStatusChange = async (roomId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (response.ok) {
        toast.success('Estado de habitación actualizado')
        fetchRooms()
      } else {
        toast.error('Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error updating room status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  // Aplicar filtros
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.room_type.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || room.status === statusFilter
    const matchesFloor = floorFilter === 'ALL' || room.floor.id === floorFilter
    const matchesType = typeFilter === 'ALL' || room.room_type.id === typeFilter

    return matchesSearch && matchesStatus && matchesFloor && matchesType
  })

  // Aplicar filtros cuando cambien
  useEffect(() => {
    fetchRooms({
      status: statusFilter,
      floor: floorFilter,
      roomType: typeFilter
    })
  }, [statusFilter, floorFilter, typeFilter])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'default'
      case 'OCCUPIED': return 'destructive'
      case 'CLEANING': return 'secondary'
      case 'MAINTENANCE': return 'outline'
      case 'OUT_OF_ORDER': return 'destructive'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponible'
      case 'OCCUPIED': return 'Ocupada'
      case 'CLEANING': return 'Limpieza'
      case 'MAINTENANCE': return 'Mantenimiento'
      case 'OUT_OF_ORDER': return 'Fuera de Servicio'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Habitaciones</h1>
          <p className="text-muted-foreground">
            Administra las habitaciones del Hotel Paseo Las Mercedes
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Habitación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Habitación</DialogTitle>
              <DialogDescription>
                Ingresa los detalles de la nueva habitación
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room_number" className="text-right">
                  Número
                </Label>
                <Input
                  id="room_number"
                  value={createFormData.room_number}
                  onChange={(e) => setCreateFormData({ ...createFormData, room_number: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="floor_id" className="text-right">
                  Piso
                </Label>
                <Select
                  value={createFormData.floor_id}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, floor_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar piso" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        Piso {floor.floor_number} - {floor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room_type_id" className="text-right">
                  Tipo
                </Label>
                <Select
                  value={createFormData.room_type_id}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, room_type_id: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} - {type.max_occupancy} pax
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={createFormData.notes}
                  onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRoom}>Crear Habitación</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar habitación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  <SelectItem value="AVAILABLE">Disponible</SelectItem>
                  <SelectItem value="OCCUPIED">Ocupada</SelectItem>
                  <SelectItem value="CLEANING">Limpieza</SelectItem>
                  <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                  <SelectItem value="OUT_OF_ORDER">Fuera de Servicio</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Piso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      Piso {floor.floor_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredRooms.length} habitaciones
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista de habitaciones */}
      <Tabs value={viewMode} className="w-full">
        <TabsContent value="grid">
          <RoomsGrid 
            rooms={filteredRooms} 
            onStatusChange={handleStatusChange}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusText={getStatusText}
          />
        </TabsContent>
        <TabsContent value="list">
          <RoomsList 
            rooms={filteredRooms} 
            onStatusChange={handleStatusChange}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusText={getStatusText}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
