
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Users, UserPlus, Search, Star, Eye, Edit, Trash2, Crown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import GuestForm from '@/components/guests/guest-form'
import GuestDetails from '@/components/guests/guest-details'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  document_type?: string
  document_number?: string
  nationality?: string
  vip_status: boolean
  created_at: string
  _count: {
    reservations: number
    transactions: number
  }
}

interface GuestStats {
  total_guests: number
  vip_guests: number
  new_this_month: number
  active_guests: number
}

export default function GuestsPage() {
  const { data: session } = useSession()
  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState<GuestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    vip_only: false,
    page: 1,
    limit: 20
  })

  const fetchGuests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/guests?${params}`)
      if (!response.ok) throw new Error('Failed to fetch guests')

      const data = await response.json()
      setGuests(data.guests)
      
      // Calculate stats
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      
      const guestStats: GuestStats = {
        total_guests: data.guests.length,
        vip_guests: data.guests.filter((g: Guest) => g.vip_status).length,
        new_this_month: data.guests.filter((g: Guest) => {
          const createdDate = new Date(g.created_at)
          return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear
        }).length,
        active_guests: data.guests.filter((g: Guest) => g._count.reservations > 0).length
      }
      setStats(guestStats)
      
    } catch (error) {
      console.error('Error fetching guests:', error)
      toast.error('Error al cargar huéspedes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuests()
  }, [filters])

  const handleGuestCreated = () => {
    setShowGuestForm(false)
    setEditingGuest(null)
    fetchGuests()
    toast.success('Huésped creado exitosamente')
  }

  const handleGuestUpdated = () => {
    setEditingGuest(null)
    setShowGuestForm(false)
    fetchGuests()
    toast.success('Huésped actualizado exitosamente')
  }

  const handleToggleVIP = async (guestId: string, currentVipStatus: boolean) => {
    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vip_status: !currentVipStatus })
      })

      if (!response.ok) throw new Error('Failed to update VIP status')
      
      fetchGuests()
      toast.success(`Estado VIP ${!currentVipStatus ? 'activado' : 'desactivado'}`)
    } catch (error) {
      console.error('Error updating VIP status:', error)
      toast.error('Error al actualizar estado VIP')
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este huésped?')) return

    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete guest')
      }
      
      fetchGuests()
      toast.success('Huésped eliminado exitosamente')
    } catch (error: any) {
      console.error('Error deleting guest:', error)
      toast.error(error.message || 'Error al eliminar huésped')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Huéspedes</h1>
          <p className="text-muted-foreground">
            Administra los huéspedes del hotel Paseo Las Mercedes
          </p>
        </div>
        <Button onClick={() => setShowGuestForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Huésped
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Huéspedes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_guests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Huéspedes VIP</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vip_guests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevos este Mes</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new_this_month}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Huéspedes Activos</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_guests}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o documento..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="vip-filter"
                checked={filters.vip_only}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, vip_only: checked, page: 1 }))}
              />
              <label htmlFor="vip-filter" className="text-sm font-medium">
                Solo VIP
              </label>
            </div>

            <Button
              variant="outline"
              onClick={() => setFilters({
                search: '',
                vip_only: false,
                page: 1,
                limit: 20
              })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Huéspedes</CardTitle>
          <CardDescription>
            {guests.length} huéspedes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando huéspedes...</div>
          ) : guests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron huéspedes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Nacionalidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div>
                            <p className="font-medium">
                              {guest.first_name} {guest.last_name}
                            </p>
                            {guest.vip_status && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {guest.email && (
                            <p className="text-muted-foreground">{guest.email}</p>
                          )}
                          {guest.phone && (
                            <p className="text-muted-foreground">{guest.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {guest.document_type && guest.document_number && (
                          <div className="text-sm">
                            <p>{guest.document_type}</p>
                            <p className="text-muted-foreground">{guest.document_number}</p>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {guest.nationality || '-'}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={guest.vip_status}
                            onCheckedChange={() => handleToggleVIP(guest.id, guest.vip_status)}
                          />
                          <span className="text-xs text-muted-foreground">VIP</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <p>{guest._count.reservations} reservas</p>
                          <p className="text-muted-foreground">
                            {guest._count.transactions} transacciones
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {format(new Date(guest.created_at), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGuest(guest.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingGuest(guest)
                              setShowGuestForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {guest._count.reservations === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGuest(guest.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showGuestForm} onOpenChange={setShowGuestForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGuest ? 'Editar Huésped' : 'Nuevo Huésped'}
            </DialogTitle>
            <DialogDescription>
              {editingGuest 
                ? 'Actualizar la información del huésped'
                : 'Registrar un nuevo huésped en el sistema'
              }
            </DialogDescription>
          </DialogHeader>
          <GuestForm 
            guest={editingGuest}
            onSuccess={editingGuest ? handleGuestUpdated : handleGuestCreated}
          />
        </DialogContent>
      </Dialog>

      {selectedGuest && (
        <Dialog open={!!selectedGuest} onOpenChange={() => setSelectedGuest(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles del Huésped</DialogTitle>
            </DialogHeader>
            <GuestDetails 
              guestId={selectedGuest}
              onUpdate={() => {
                fetchGuests()
                setSelectedGuest(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
