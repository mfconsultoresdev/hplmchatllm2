
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Key, MessageSquare, Wifi, Phone, MapPin, Clock } from 'lucide-react'
import { toast } from "react-hot-toast"

interface GuestSession {
  guest: {
    id: string
    first_name: string
    last_name: string
    email?: string
  }
  reservation: {
    id: string
    reservation_number: string
    check_in_date: string
    check_out_date: string
    room: {
      room_number: string
      room_type: {
        name: string
        amenities: any
      }
    }
  }
  hotel: {
    name: string
    address: string
    phone: string
    email: string
  }
  messages?: any[]
}

export default function GuestPortalPage() {
  const [reservationCode, setReservationCode] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [activeTab, setActiveTab] = useState('info')

  const handleLogin = async () => {
    if (!reservationCode.trim()) {
      toast.error('Por favor ingrese el código de reserva')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/guest-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_number: reservationCode,
          guest_email: guestEmail
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGuestSession(data)
        toast.success('¡Bienvenido!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Código de reserva no válido')
      }
    } catch (error) {
      console.error('Error logging in:', error)
      toast.error('Error al acceder al portal')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!guestSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Portal de Huéspedes</CardTitle>
            <p className="text-gray-600">Hotel Paseo Las Mercedes</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reservation-code">Código de Reserva</Label>
              <Input
                id="reservation-code"
                placeholder="Ej: RES-2024-001"
                value={reservationCode}
                onChange={(e) => setReservationCode(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="guest-email">Email (opcional)</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="su-email@ejemplo.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Acceder al Portal'
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Su código de reserva se encuentra en su confirmación de reserva o en el check-in
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bienvenido, {guestSession.guest.first_name} {guestSession.guest.last_name}
              </h1>
              <p className="text-gray-600">
                Habitación {guestSession.reservation.room.room_number} • {guestSession.reservation.reservation_number}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setGuestSession(null)}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-sm">
          {[
            { id: 'info', label: 'Mi Estancia', icon: Clock },
            { id: 'messages', label: 'Mensajes', icon: MessageSquare },
            { id: 'services', label: 'Servicios', icon: Phone },
            { id: 'hotel', label: 'Hotel Info', icon: MapPin }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Detalles de su Estancia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Check-in</Label>
                  <p className="text-lg">{formatDate(guestSession.reservation.check_in_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Check-out</Label>
                  <p className="text-lg">{formatDate(guestSession.reservation.check_out_date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Habitación</Label>
                  <p className="text-lg">
                    {guestSession.reservation.room.room_number} - {guestSession.reservation.room.room_type.name}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Información de la Habitación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">WiFi</Label>
                    <p className="text-gray-600">Red: HotelPaseoLM</p>
                    <p className="text-gray-600">Contraseña: disponible en recepción</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Servicios</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary">WiFi gratuito</Badge>
                      <Badge variant="secondary">Aire acondicionado</Badge>
                      <Badge variant="secondary">TV por cable</Badge>
                      <Badge variant="secondary">Servicio 24/7</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Servicios Rápidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Phone className="h-6 w-6 mb-2" />
                    <span className="text-sm">Recepción</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span className="text-sm">Chat</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Wifi className="h-6 w-6 mb-2" />
                    <span className="text-sm">Soporte</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Clock className="h-6 w-6 mb-2" />
                    <span className="text-sm">Servicios</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'messages' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mensajes del Hotel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
                <p className="text-gray-500">Los mensajes del hotel aparecerán aquí</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Servicio a la Habitación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Disponible 24 horas para su comodidad
                </p>
                <Button className="w-full">Solicitar Servicio</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Housekeeping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Solicitar limpieza o artículos adicionales
                </p>
                <Button className="w-full" variant="outline">
                  Solicitar Limpieza
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Concierge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Información turística y reservas
                </p>
                <Button className="w-full" variant="outline">
                  Contactar Concierge
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'hotel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Información del Hotel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Nombre</Label>
                  <p className="text-lg">{guestSession.hotel.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Dirección</Label>
                  <p className="text-gray-600">{guestSession.hotel.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Teléfono</Label>
                  <p className="text-gray-600">{guestSession.hotel.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-gray-600">{guestSession.hotel.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Servicios del Hotel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Recepción 24 horas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>WiFi gratuito</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Servicio a la habitación</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Concierge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Servicio de limpieza</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
