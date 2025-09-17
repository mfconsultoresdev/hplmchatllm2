
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Settings, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Car,
  Coffee,
  Utensils,
  Waves,
  Shirt,
  Wrench
} from 'lucide-react'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description?: string
  category: string
  price_usd: number
  is_active: boolean
}

interface ServiceRequest {
  id: string
  quantity: number
  notes?: string
  requested_time: string
  completed_time?: string
  status: string
  priority: string
  total_amount?: number
  guest: {
    first_name: string
    last_name: string
  }
  service: Service
  room?: {
    room_number: string
  }
}

const SERVICE_CATEGORIES = {
  RESTAURANT: { label: 'Restaurante', icon: Utensils, color: 'text-orange-600' },
  SPA: { label: 'Spa', icon: Waves, color: 'text-blue-600' },
  LAUNDRY: { label: 'Lavandería', icon: Shirt, color: 'text-purple-600' },
  ROOM_SERVICE: { label: 'Room Service', icon: Coffee, color: 'text-green-600' },
  TRANSPORT: { label: 'Transporte', icon: Car, color: 'text-gray-600' },
  MAINTENANCE: { label: 'Mantenimiento', icon: Wrench, color: 'text-red-600' },
  OTHER: { label: 'Otros', icon: Settings, color: 'text-slate-600' }
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateService, setShowCreateService] = useState(false)
  const [activeTab, setActiveTab] = useState('requests')
  
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'ROOM_SERVICE',
    price: 0,
    isActive: true
  })

  useEffect(() => {
    fetchServices()
    fetchServiceRequests()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      
      if (data.services) {
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Error al cargar servicios')
    }
  }

  const fetchServiceRequests = async () => {
    try {
      const response = await fetch('/api/services/requests')
      const data = await response.json()
      
      if (data.serviceRequests) {
        setServiceRequests(data.serviceRequests)
      }
    } catch (error) {
      console.error('Error fetching service requests:', error)
      toast.error('Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = async () => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newService)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Servicio creado exitosamente')
        fetchServices()
        setShowCreateService(false)
        setNewService({
          name: '',
          description: '',
          category: 'ROOM_SERVICE',
          price: 0,
          isActive: true
        })
      } else {
        toast.error(data.error || 'Error al crear servicio')
      }
    } catch (error) {
      console.error('Error creating service:', error)
      toast.error('Error al crear servicio')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Servicios del Hotel</h1>
            <p className="text-gray-600">Gestiona servicios y solicitudes de huéspedes</p>
          </div>
        </div>
        
        <Dialog open={showCreateService} onOpenChange={setShowCreateService}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Servicio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Servicio</Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Servicio de habitación 24h"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={newService.category}
                  onValueChange={(value) => setNewService(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <category.icon className={`h-4 w-4 ${category.color}`} />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Precio (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción detallada del servicio..."
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateService} className="flex-1">
                  Crear Servicio
                </Button>
                <Button 
                  onClick={() => setShowCreateService(false)} 
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Solicitudes ({serviceRequests.length})</TabsTrigger>
          <TabsTrigger value="services">Servicios ({services.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4">
            {serviceRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay solicitudes de servicio</p>
                </CardContent>
              </Card>
            ) : (
              serviceRequests.map((request) => {
                const categoryInfo = SERVICE_CATEGORIES[request.service.category as keyof typeof SERVICE_CATEGORIES] || SERVICE_CATEGORIES.OTHER
                const CategoryIcon = categoryInfo.icon
                
                return (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                          <div>
                            <h3 className="font-semibold">
                              {request.service.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {request.guest.first_name} {request.guest.last_name}
                              {request.room && ` - Habitación ${request.room.room_number}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status}
                            </span>
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Cantidad:</span> {request.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Solicitado:</span> {formatDateTime(request.requested_time)}
                        </div>
                        {request.completed_time && (
                          <div>
                            <span className="font-medium">Completado:</span> {formatDateTime(request.completed_time)}
                          </div>
                        )}
                        {request.total_amount && (
                          <div>
                            <span className="font-medium">Total:</span> ${request.total_amount.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {request.notes && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          <span className="font-medium">Notas:</span> {request.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const categoryInfo = SERVICE_CATEGORIES[service.category as keyof typeof SERVICE_CATEGORIES] || SERVICE_CATEGORIES.OTHER
              const CategoryIcon = categoryInfo.icon
              
              return (
                <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </div>
                      <Badge variant={service.is_active ? 'default' : 'secondary'}>
                        {service.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium">
                        {categoryInfo.label}
                      </p>
                      {service.description && (
                        <p className="text-sm text-gray-700">{service.description}</p>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold text-green-600">
                          ${service.price_usd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {services.length === 0 && (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No hay servicios configurados</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
