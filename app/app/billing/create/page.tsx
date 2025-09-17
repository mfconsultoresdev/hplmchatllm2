

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  is_taxable: boolean
  item_type: string
  service_id?: string
  room_id?: string
}

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  document_type: string
  document_number: string
  address: string
}

interface Reservation {
  id: string
  reservation_number: string
  guest: Guest
  room: {
    id: string
    room_number: string
    room_type: {
      name: string
    }
  }
  check_in_date: string
  check_out_date: string
  nights: number
  room_rate: number
  total_amount: number
}

interface Service {
  id: string
  name: string
  description: string
  price_usd: number
  category: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [guests, setGuests] = useState<Guest[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [services, setServices] = useState<Service[]>([])

  // Form data
  const [clientType, setClientType] = useState<'GUEST' | 'COMPANY' | 'WALK_IN'>('GUEST')
  const [selectedGuest, setSelectedGuest] = useState<string>('')
  const [selectedReservation, setSelectedReservation] = useState<string>('')
  const [companyName, setCompanyName] = useState('')
  const [clientDocument, setClientDocument] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('IMMEDIATE')
  
  // Tax settings
  const [applyIva, setApplyIva] = useState(true)
  const [ivaRate, setIvaRate] = useState(16.00)
  const [municipalTaxRate, setMunicipalTaxRate] = useState(0)
  const [serviceTaxRate, setServiceTaxRate] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([{
    id: Date.now().toString(),
    description: '',
    quantity: 1,
    unit_price: 0,
    line_total: 0,
    is_taxable: true,
    item_type: 'SERVICE'
  }])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      // Fetch guests
      const guestsResponse = await fetch('/api/guests')
      if (guestsResponse.ok) {
        const guestsData = await guestsResponse.json()
        setGuests(guestsData.guests || [])
      }

      // Fetch current reservations
      const reservationsResponse = await fetch('/api/reservations?status=CHECKED_IN')
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json()
        setReservations(reservationsData.reservations || [])
      }

      // Fetch services
      const servicesResponse = await fetch('/api/services')
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        setServices(servicesData.services || [])
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Error cargando datos iniciales')
    }
  }

  const handleGuestChange = (guestId: string) => {
    setSelectedGuest(guestId)
    const guest = guests.find(g => g.id === guestId)
    if (guest) {
      setClientEmail(guest.email || '')
      setClientPhone(guest.phone || '')
      setClientDocument(guest.document_number || '')
      setClientAddress(guest.address || '')
      
      // Find active reservation for this guest
      const activeReservation = reservations.find(r => r.guest.id === guestId)
      if (activeReservation) {
        setSelectedReservation(activeReservation.id)
      }
    }
  }

  const handleReservationChange = (reservationId: string) => {
    if (reservationId === 'none') {
      setSelectedReservation('')
      // Remove room items
      setItems(items.filter(i => i.item_type !== 'ROOM'))
      return
    }
    
    setSelectedReservation(reservationId)
    const reservation = reservations.find(r => r.id === reservationId)
    if (reservation) {
      setSelectedGuest(reservation.guest.id)
      setClientEmail(reservation.guest.email || '')
      setClientPhone(reservation.guest.phone || '')
      setClientDocument(reservation.guest.document_number || '')
      setClientAddress(reservation.guest.address || '')
      
      // Add room charge as first item
      const roomItem: InvoiceItem = {
        id: Date.now().toString(),
        description: `Alojamiento - Hab. ${reservation.room.room_number} (${reservation.room.room_type.name}) - ${reservation.nights} noche(s)`,
        quantity: reservation.nights,
        unit_price: Number(reservation.room_rate),
        line_total: Number(reservation.room_rate) * reservation.nights,
        is_taxable: true,
        item_type: 'ROOM',
        room_id: reservation.room.id
      }
      
      setItems([roomItem, ...items.filter(i => i.item_type !== 'ROOM')])
    }
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      line_total: 0,
      is_taxable: true,
      item_type: 'SERVICE'
    }
    setItems([...items, newItem])
  }

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId))
    }
  }

  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates }
        // Recalculate line total
        updated.line_total = updated.quantity * updated.unit_price
        return updated
      }
      return item
    }))
  }

  const addServiceItem = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      const serviceItem: InvoiceItem = {
        id: Date.now().toString(),
        description: service.name,
        quantity: 1,
        unit_price: Number(service.price_usd),
        line_total: Number(service.price_usd),
        is_taxable: true,
        item_type: 'SERVICE',
        service_id: service.id
      }
      setItems([...items, serviceItem])
    }
  }

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
  const subtotalAfterDiscount = subtotal - discountAmount
  const ivaAmount = applyIva ? (subtotalAfterDiscount * ivaRate / 100) : 0
  const municipalTaxAmount = municipalTaxRate > 0 ? (subtotalAfterDiscount * municipalTaxRate / 100) : 0
  const serviceTaxAmount = serviceTaxRate > 0 ? (subtotalAfterDiscount * serviceTaxRate / 100) : 0
  const totalTax = ivaAmount + municipalTaxAmount + serviceTaxAmount
  const totalAmount = subtotalAfterDiscount + totalTax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0 || items.every(item => !item.description.trim())) {
      toast.error('Debe agregar al menos un item a la factura')
      return
    }
    
    if (clientType === 'GUEST' && !selectedGuest) {
      toast.error('Debe seleccionar un huésped')
      return
    }
    
    if (clientType === 'COMPANY' && !companyName.trim()) {
      toast.error('Debe ingresar el nombre de la empresa')
      return
    }

    setLoading(true)
    
    try {
      const invoiceData = {
        client_type: clientType,
        guest_id: clientType === 'GUEST' ? selectedGuest : null,
        reservation_id: selectedReservation || null,
        company_name: clientType === 'COMPANY' ? companyName : null,
        client_document: clientDocument,
        client_address: clientAddress,
        client_phone: clientPhone,
        client_email: clientEmail,
        currency,
        items: items.filter(item => item.description.trim()),
        apply_iva: applyIva,
        iva_rate: ivaRate,
        municipal_tax_rate: municipalTaxRate,
        service_tax_rate: serviceTaxRate,
        discount_amount: discountAmount,
        notes,
        payment_terms: paymentTerms
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Factura creada exitosamente')
        router.push(`/billing/invoices/${result.invoice.id}`)
      } else {
        toast.error(result.error || 'Error creando la factura')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error('Error al crear la factura')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/billing">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Factura</h1>
          <p className="text-muted-foreground">
            Crear una nueva factura para el cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Cliente</Label>
                  <Select value={clientType} onValueChange={(value: any) => setClientType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUEST">Huésped</SelectItem>
                      <SelectItem value="COMPANY">Empresa</SelectItem>
                      <SelectItem value="WALK_IN">Cliente Directo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {clientType === 'GUEST' && (
                  <>
                    <div>
                      <Label>Huésped *</Label>
                      <Select value={selectedGuest} onValueChange={handleGuestChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un huésped" />
                        </SelectTrigger>
                        <SelectContent>
                          {guests.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.first_name} {guest.last_name} - {guest.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Reservación (Opcional)</Label>
                      <Select value={selectedReservation} onValueChange={handleReservationChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una reservación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin reservación</SelectItem>
                          {reservations.filter(r => r.guest.id === selectedGuest).map((reservation) => (
                            <SelectItem key={reservation.id} value={reservation.id}>
                              {reservation.reservation_number} - Hab. {reservation.room.room_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {clientType === 'COMPANY' && (
                  <div>
                    <Label>Nombre de la Empresa *</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ingrese el nombre de la empresa"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Documento/RIF</Label>
                    <Input
                      value={clientDocument}
                      onChange={(e) => setClientDocument(e.target.value)}
                      placeholder="V-12345678 o J-12345678-9"
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+58 414 1234567"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                  />
                </div>

                <div>
                  <Label>Dirección</Label>
                  <Textarea
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Dirección completa del cliente"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Items de la Factura</CardTitle>
                  <div className="flex gap-2">
                    <Select onValueChange={addServiceItem} value="">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Agregar servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - {formatCurrency(service.price_usd)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">
                        Item #{index + 1}
                      </Badge>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label>Descripción *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Descripción del producto o servicio"
                          required
                        />
                      </div>
                      <div>
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Precio Unitario</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={item.is_taxable}
                          onCheckedChange={(checked) => updateItem(item.id, { is_taxable: checked })}
                        />
                        <Label>Gravable con impuestos</Label>
                      </div>
                      <div className="text-lg font-medium">
                        Total: {formatCurrency(item.line_total)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Summary and Settings */}
          <div className="space-y-6">
            {/* Tax Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Impuestos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Aplicar IVA</Label>
                  <Switch
                    checked={applyIva}
                    onCheckedChange={setApplyIva}
                  />
                </div>

                {applyIva && (
                  <div>
                    <Label>Tasa IVA (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={ivaRate}
                      onChange={(e) => setIvaRate(Number(e.target.value))}
                    />
                  </div>
                )}

                <div>
                  <Label>Tasa Municipal (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={municipalTaxRate}
                    onChange={(e) => setMunicipalTaxRate(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Impuesto Servicios (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={serviceTaxRate}
                    onChange={(e) => setServiceTaxRate(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Descuento</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label>Moneda</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólares</SelectItem>
                      <SelectItem value="EUR">EUR - Euros</SelectItem>
                      <SelectItem value="VES">VES - Bolívares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Subtotal (con desc.):</span>
                  <span>{formatCurrency(subtotalAfterDiscount)}</span>
                </div>

                {applyIva && (
                  <div className="flex justify-between">
                    <span>IVA ({ivaRate}%):</span>
                    <span>{formatCurrency(ivaAmount)}</span>
                  </div>
                )}

                {municipalTaxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tasa Municipal ({municipalTaxRate}%):</span>
                    <span>{formatCurrency(municipalTaxAmount)}</span>
                  </div>
                )}

                {serviceTaxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Imp. Servicios ({serviceTaxRate}%):</span>
                    <span>{formatCurrency(serviceTaxAmount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Términos de Pago</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE">Inmediato</SelectItem>
                      <SelectItem value="NET_15">15 días</SelectItem>
                      <SelectItem value="NET_30">30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales para la factura"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Factura'}
              </Button>
              <Link href="/billing" className="block">
                <Button variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
