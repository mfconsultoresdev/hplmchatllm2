
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, MessageSquare, Users, Bell, Send, Filter, Search } from 'lucide-react'
import { toast } from "react-hot-toast"
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface CommunicationMessage {
  id: string
  subject: string
  message: string
  priority: string
  category: string
  sender_name: string
  sender_type: string
  status: string
  sent_at?: string
  read_count: number
  reply_count: number
  created_at: string
  guest?: {
    id: string
    first_name: string
    last_name: string
    email?: string
  }
  reservation?: {
    id: string
    reservation_number: string
    room: {
      room_number: string
    }
  }
  sender_staff?: {
    id: string
    first_name: string
    last_name: string
    department: string
    position: string
  }
  guest_recipients?: any[]
  recipients?: any[]
  template?: {
    id: string
    name: string
    category: string
  }
}

interface MessageTemplate {
  id: string
  name: string
  category: string
  type: string
  subject: string
}

const PRIORITIES = [
  { value: 'LOW', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-red-100 text-red-800' }
]

const CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'GUEST_SERVICE', label: 'Atención al huésped' },
  { value: 'ANNOUNCEMENT', label: 'Anuncios' },
  { value: 'POLICY', label: 'Políticas' },
  { value: 'EMERGENCY', label: 'Emergencias' }
]

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState('staff')
  const [messages, setMessages] = useState<CommunicationMessage[]>([])
  const [guestMessages, setGuestMessages] = useState<CommunicationMessage[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('ALL')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [messageType, setMessageType] = useState<'staff' | 'guest'>('staff')
  
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'NORMAL',
    category: 'GENERAL',
    sender_name: 'Sistema',
    template_id: '',
    guest_id: '',
    reservation_id: '',
    send_to_all: false,
    recipient_staff_ids: [],
    delivery_method: 'INTERNAL'
  })

  useEffect(() => {
    fetchMessages()
    fetchGuestMessages()
    fetchTemplates()
  }, [])

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPriority !== 'ALL') params.set('priority', selectedPriority)
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
      
      const response = await fetch(`/api/communications?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setMessages(data.messages || [])
      } else {
        toast.error('Error al cargar comunicaciones')
      }
    } catch (error) {
      console.error('Error fetching communications:', error)
      toast.error('Error al cargar comunicaciones')
    }
  }

  const fetchGuestMessages = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedPriority !== 'ALL') params.set('priority', selectedPriority)
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
      
      const response = await fetch(`/api/guest-communications?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setGuestMessages(data.messages || [])
      } else {
        toast.error('Error al cargar comunicaciones con huéspedes')
      }
    } catch (error) {
      console.error('Error fetching guest communications:', error)
      toast.error('Error al cargar comunicaciones con huéspedes')
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates?is_active=true')
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleCreateMessage = async () => {
    try {
      const endpoint = messageType === 'guest' ? '/api/guest-communications' : '/api/communications'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Mensaje enviado exitosamente')
        setShowCreateDialog(false)
        resetForm()
        if (messageType === 'guest') {
          fetchGuestMessages()
        } else {
          fetchMessages()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al enviar mensaje')
      }
    } catch (error) {
      console.error('Error creating message:', error)
      toast.error('Error al enviar mensaje')
    }
  }

  const resetForm = () => {
    setFormData({
      subject: '',
      message: '',
      priority: 'NORMAL',
      category: 'GENERAL',
      sender_name: 'Sistema',
      template_id: '',
      guest_id: '',
      reservation_id: '',
      send_to_all: false,
      recipient_staff_ids: [],
      delivery_method: 'INTERNAL'
    })
  }

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) return

    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const template = await response.json()
      
      if (response.ok) {
        setFormData({
          ...formData,
          template_id: templateId,
          subject: template.subject,
          message: template.content,
          category: template.category,
          delivery_method: template.type === 'GUEST' ? 'PORTAL' : 'INTERNAL'
        })
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITIES.find(p => p.value === priority)
    return (
      <Badge className={priorityConfig?.color}>
        {priorityConfig?.label}
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  const filteredStaffMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredGuestMessages = guestMessages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (message.guest && `${message.guest.first_name} ${message.guest.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const MessageCard = ({ message, isGuest = false }: { message: CommunicationMessage, isGuest?: boolean }) => (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{message.subject}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">
                De: {message.sender_name}
              </span>
              {message.sender_staff && (
                <Badge variant="outline">
                  {message.sender_staff.department}
                </Badge>
              )}
              {isGuest && message.guest && (
                <Badge variant="outline">
                  {message.guest.first_name} {message.guest.last_name}
                </Badge>
              )}
              {message.reservation && (
                <Badge variant="secondary">
                  Hab. {message.reservation.room.room_number}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge(message.priority)}
            <Badge variant="outline">
              {getCategoryLabel(message.category)}
            </Badge>
            <Badge variant={message.status === 'SENT' ? 'default' : 'secondary'}>
              {message.status}
            </Badge>
          </div>
        </div>
        
        <p className="text-gray-700 mb-3 line-clamp-2">{message.message}</p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>
              {message.sent_at 
                ? formatDistanceToNow(new Date(message.sent_at), { addSuffix: true, locale: es })
                : formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: es })
              }
            </span>
            {message.template && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {message.template.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {isGuest ? message.guest_recipients?.length || 0 : message.recipients?.length || 0} destinatarios
            </span>
            <span>📖 {message.read_count}</span>
            <span>💬 {message.reply_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Centro de Comunicaciones</h1>
          <p className="text-gray-600 mt-2">Gestiona las comunicaciones con el personal y huéspedes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Mensaje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Mensaje</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="message-type">Tipo de mensaje</Label>
                <Select value={messageType} onValueChange={(value: 'staff' | 'guest') => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Personal interno</SelectItem>
                    <SelectItem value="guest">Comunicación con huéspedes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template">Plantilla (opcional)</Label>
                <Select value={formData.template_id} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin plantilla</SelectItem>
                    {templates
                      .filter(t => messageType === 'guest' ? t.type === 'GUEST' || t.type === 'BOTH' : t.type === 'STAFF' || t.type === 'BOTH')
                      .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Asunto del mensaje"
                />
              </div>

              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Escribir mensaje..."
                  rows={6}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateMessage} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar mensajes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="priority-filter">Prioridad</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las prioridades</SelectItem>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category-filter">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las categorías</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de mensajes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Comunicaciones Internas ({filteredStaffMessages.length})
          </TabsTrigger>
          <TabsTrigger value="guests" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comunicaciones con Huéspedes ({filteredGuestMessages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div>
              {filteredStaffMessages.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
                    <p className="text-gray-500">No se encontraron comunicaciones internas</p>
                  </CardContent>
                </Card>
              ) : (
                filteredStaffMessages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guests" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div>
              {filteredGuestMessages.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
                    <p className="text-gray-500">No se encontraron comunicaciones con huéspedes</p>
                  </CardContent>
                </Card>
              ) : (
                filteredGuestMessages.map((message) => (
                  <MessageCard key={message.id} message={message} isGuest={true} />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
