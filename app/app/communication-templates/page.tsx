
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Edit, Trash2, MessageSquare, Users, Settings, Eye } from 'lucide-react'
import { toast } from "react-hot-toast"

interface MessageTemplate {
  id: string
  name: string
  category: string
  type: string
  subject: string
  content: string
  variables?: any
  language: string
  is_active: boolean
  is_automatic: boolean
  trigger_event?: string
  send_delay_hours: number
  created_at: string
  updated_at: string
  messages?: any[]
}

const CATEGORIES = [
  { value: 'WELCOME', label: 'Bienvenida' },
  { value: 'CHECKOUT', label: 'Check-out' },
  { value: 'SERVICE', label: 'Servicios' },
  { value: 'EMERGENCY', label: 'Emergencias' },
  { value: 'POLICY', label: 'Políticas' },
  { value: 'PROMOTION', label: 'Promociones' },
  { value: 'GENERAL', label: 'General' },
  { value: 'ANNOUNCEMENT', label: 'Anuncios' }
]

const TYPES = [
  { value: 'GUEST', label: 'Huéspedes' },
  { value: 'STAFF', label: 'Personal' },
  { value: 'BOTH', label: 'Ambos' }
]

const TRIGGER_EVENTS = [
  { value: 'CHECK_IN', label: 'Check-in' },
  { value: 'CHECKOUT', label: 'Check-out' },
  { value: 'SERVICE_REQUEST', label: 'Solicitud de servicio' },
  { value: 'RESERVATION_CREATED', label: 'Reserva creada' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' }
]

export default function CommunicationTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'GENERAL',
    type: 'GUEST',
    subject: '',
    content: '',
    variables: {},
    language: 'es',
    is_active: true,
    is_automatic: false,
    trigger_event: '',
    send_delay_hours: 0
  })

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, selectedType])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory)
      if (selectedType !== 'ALL') params.set('type', selectedType)
      
      const response = await fetch(`/api/templates?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(data.templates || [])
      } else {
        toast.error('Error al cargar plantillas')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Plantilla creada exitosamente')
        setShowCreateDialog(false)
        resetForm()
        fetchTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear plantilla')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Error al crear plantilla')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    try {
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Plantilla actualizada exitosamente')
        setEditingTemplate(null)
        resetForm()
        fetchTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar plantilla')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Error al actualizar plantilla')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta plantilla?')) return

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Plantilla eliminada exitosamente')
        fetchTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar plantilla')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar plantilla')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'GENERAL',
      type: 'GUEST',
      subject: '',
      content: '',
      variables: {},
      language: 'es',
      is_active: true,
      is_automatic: false,
      trigger_event: '',
      send_delay_hours: 0
    })
  }

  const openEditDialog = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      type: template.type,
      subject: template.subject,
      content: template.content,
      variables: template.variables || {},
      language: template.language,
      is_active: template.is_active,
      is_automatic: template.is_automatic,
      trigger_event: template.trigger_event || '',
      send_delay_hours: template.send_delay_hours
    })
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getTypeLabel = (type: string) => {
    return TYPES.find(t => t.value === type)?.label || type
  }

  const getTriggerEventLabel = (event: string) => {
    return TRIGGER_EVENTS.find(e => e.value === event)?.label || event
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Comunicación</h1>
          <p className="text-gray-600 mt-2">Gestiona las plantillas de mensajes para huéspedes y personal</p>
        </div>
        <Dialog open={showCreateDialog || !!editingTemplate} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingTemplate(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre de la plantilla"
                  />
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Contenido del mensaje..."
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use variables como {`{{guest_name}}`}, {`{{room_number}}`}, etc.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Plantilla activa</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_automatic"
                  checked={formData.is_automatic}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_automatic: checked })}
                />
                <Label htmlFor="is_automatic">Envío automático</Label>
              </div>

              {formData.is_automatic && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trigger_event">Evento disparador</Label>
                    <Select value={formData.trigger_event} onValueChange={(value) => setFormData({ ...formData, trigger_event: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_EVENTS.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            {event.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="send_delay_hours">Retraso (horas)</Label>
                    <Input
                      id="send_delay_hours"
                      type="number"
                      value={formData.send_delay_hours}
                      onChange={(e) => setFormData({ ...formData, send_delay_hours: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false)
                setEditingTemplate(null)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                {editingTemplate ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
            <div>
              <Label htmlFor="type-filter">Tipo</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  {TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de plantillas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Plantillas ({filteredTemplates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Automático</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.subject}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getTypeLabel(template.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "destructive"}>
                        {template.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.is_automatic ? (
                        <div>
                          <Badge variant="default">Automático</Badge>
                          {template.trigger_event && (
                            <div className="text-xs text-gray-500 mt-1">
                              {getTriggerEventLabel(template.trigger_event)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.messages?.length || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
