
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Crown,
  Calendar,
  CreditCard,
  History,
  Edit
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

interface GuestDetail {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  document_type?: string
  document_number?: string
  nationality?: string
  date_of_birth?: string
  address?: string
  city?: string
  country?: string
  postal_code?: string
  vip_status: boolean
  preferences?: any
  notes?: string
  created_at: string
  updated_at: string
  reservations: Array<{
    id: string
    reservation_number: string
    check_in_date: string
    check_out_date: string
    status: string
    nights: number
    total_amount: number
    currency: string
    room: {
      room_number: string
      room_type: {
        name: string
      }
    }
  }>
  transactions: Array<{
    id: string
    type: string
    description: string
    amount: number
    currency: string
    status: string
    payment_method?: string
    created_at: string
  }>
  _count: {
    reservations: number
    transactions: number
  }
}

interface Props {
  guestId: string
  onUpdate: () => void
}

const STATUS_COLORS = {
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
}

export default function GuestDetails({ guestId, onUpdate }: Props) {
  const [guest, setGuest] = useState<GuestDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchGuestDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/guests/${guestId}`)
      if (!response.ok) throw new Error('Failed to fetch guest details')
      
      const data = await response.json()
      setGuest(data)
    } catch (error) {
      console.error('Error fetching guest details:', error)
      toast.error('Error al cargar los detalles del huésped')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuestDetails()
  }, [guestId])

  if (loading) {
    return <div className="text-center py-8">Cargando detalles...</div>
  }

  if (!guest) {
    return <div className="text-center py-8">Huésped no encontrado</div>
  }

  // Calculate stats
  const totalSpent = guest.transactions
    .filter(t => t.type !== 'REFUND' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0)
    
  const completedStays = guest.reservations.filter(r => r.status === 'CHECKED_OUT').length
  const totalNights = guest.reservations.reduce((sum, r) => sum + r.nights, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold">
              {guest.first_name} {guest.last_name}
            </h2>
            {guest.vip_status && (
              <Badge variant="secondary">
                <Crown className="h-3 w-3 mr-1" />
                VIP
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Cliente desde {format(new Date(guest.created_at), 'dd MMM yyyy', { locale: es })}
          </p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={onUpdate}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{guest._count.reservations}</div>
            <p className="text-xs text-muted-foreground">Total Reservas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{completedStays}</div>
            <p className="text-xs text-muted-foreground">Estadías Completadas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalNights}</div>
            <p className="text-xs text-muted-foreground">Total Noches</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${totalSpent.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total Gastado</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Información Personal</TabsTrigger>
          <TabsTrigger value="reservations">Historial de Reservas</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre completo:</span>
                  <span className="font-medium">
                    {guest.first_name} {guest.last_name}
                  </span>
                </div>
                
                {guest.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de nacimiento:</span>
                    <span className="font-medium">
                      {format(new Date(guest.date_of_birth), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                )}
                
                {guest.nationality && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nacionalidad:</span>
                    <span className="font-medium">{guest.nationality}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado VIP:</span>
                  <span className="font-medium">
                    {guest.vip_status ? (
                      <Badge variant="secondary">
                        <Crown className="h-3 w-3 mr-1" />
                        Sí
                      </Badge>
                    ) : 'No'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guest.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{guest.email}</span>
                  </div>
                )}
                
                {guest.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <span className="font-medium">{guest.phone}</span>
                  </div>
                )}
                
                {!guest.email && !guest.phone && (
                  <p className="text-muted-foreground text-sm">
                    No hay información de contacto disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Document Information */}
            {(guest.document_type || guest.document_number) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Información de Documento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guest.document_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">
                        {guest.document_type === 'ID' && 'Cédula de Identidad'}
                        {guest.document_type === 'PASSPORT' && 'Pasaporte'}
                        {guest.document_type === 'DRIVER_LICENSE' && 'Licencia de Conducir'}
                      </span>
                    </div>
                  )}
                  
                  {guest.document_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <span className="font-medium">{guest.document_number}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Address Information */}
            {(guest.address || guest.city || guest.country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Información de Dirección
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guest.address && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dirección:</span>
                      <span className="font-medium">{guest.address}</span>
                    </div>
                  )}
                  
                  {guest.city && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ciudad:</span>
                      <span className="font-medium">{guest.city}</span>
                    </div>
                  )}
                  
                  {guest.country && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">País:</span>
                      <span className="font-medium">{guest.country}</span>
                    </div>
                  )}
                  
                  {guest.postal_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Código postal:</span>
                      <span className="font-medium">{guest.postal_code}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notes */}
          {guest.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas Especiales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{guest.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Historial de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guest.reservations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay reservas registradas
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reserva #</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Habitación</TableHead>
                      <TableHead>Noches</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guest.reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          {reservation.reservation_number}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(new Date(reservation.check_in_date), 'dd MMM', { locale: es })}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(reservation.check_out_date), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reservation.room.room_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {reservation.room.room_type.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{reservation.nights}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[reservation.status as keyof typeof STATUS_COLORS]}>
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${reservation.total_amount.toFixed(2)} {reservation.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Historial de Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guest.transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay transacciones registradas
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guest.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), 'dd MMM yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {transaction.payment_method || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${transaction.amount.toFixed(2)} {transaction.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
