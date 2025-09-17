
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  Receipt,
  Calculator,
  Trash2,
  User,
  Building
} from 'lucide-react'
import { toast } from 'sonner'

interface POSItem {
  id: string
  name: string
  description?: string
  category: string
  price_usd: number
  is_taxable: boolean
  tax_rate: number
}

interface CartItem extends POSItem {
  quantity: number
  line_total: number
}

interface POSData {
  services: Record<string, POSItem[]>
  payment_methods: any[]
  occupied_rooms: any[]
  tax_configuration: any[]
}

export default function POSPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [posData, setPosData] = useState<POSData | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [clientType, setClientType] = useState('WALK_IN')
  const [selectedGuest, setSelectedGuest] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientDocument, setClientDocument] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [applyIVA, setApplyIVA] = useState(true)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    loadPOSData()
  }, [])

  const loadPOSData = async () => {
    try {
      const response = await fetch('/api/pos')
      const data = await response.json()
      
      if (response.ok) {
        setPosData(data)
      } else {
        toast.error('Error cargando datos del POS')
      }
    } catch (error) {
      console.error('Error loading POS data:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (service: POSItem) => {
    const existingItem = cart.find(item => item.id === service.id)
    
    if (existingItem) {
      updateQuantity(service.id, existingItem.quantity + 1)
    } else {
      const cartItem: CartItem = {
        ...service,
        quantity: 1,
        line_total: Number(service.price_usd)
      }
      setCart([...cart, cartItem])
    }
  }

  const updateQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(serviceId)
      return
    }

    setCart(cart.map(item => {
      if (item.id === serviceId) {
        return {
          ...item,
          quantity: newQuantity,
          line_total: newQuantity * Number(item.price_usd)
        }
      }
      return item
    }))
  }

  const removeFromCart = (serviceId: string) => {
    setCart(cart.filter(item => item.id !== serviceId))
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0)
    const discountAmount = subtotal * (discount / 100)
    const subtotalAfterDiscount = subtotal - discountAmount
    
    const taxAmount = applyIVA ? cart
      .filter(item => item.is_taxable)
      .reduce((sum, item) => {
        const itemAfterDiscount = item.line_total * (1 - discount / 100)
        return sum + (itemAfterDiscount * (item.tax_rate / 100))
      }, 0) : 0

    const total = subtotalAfterDiscount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    }
  }

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (!paymentMethod) {
      toast.error('Selecciona un método de pago')
      return
    }

    const totals = calculateTotals()

    try {
      setLoading(true)
      
      const saleData = {
        items: cart.map(item => ({
          service_id: item.id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        amount_paid: Number(amountPaid) || totals.total,
        currency: 'USD',
        client_type: clientType,
        guest_id: clientType === 'GUEST' ? selectedGuest : null,
        room_id: selectedRoom || null,
        client_name: clientType === 'COMPANY' ? clientName : null,
        client_document: clientDocument || null,
        apply_iva: applyIVA,
        discount_percentage: discount,
        notes
      }

      const response = await fetch('/api/pos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Venta procesada exitosamente')
        
        // Reset form
        setCart([])
        setClientType('WALK_IN')
        setSelectedGuest('')
        setSelectedRoom('')
        setClientName('')
        setClientDocument('')
        setPaymentMethod('')
        setAmountPaid('')
        setDiscount(0)
        setNotes('')
        setShowPaymentModal(false)

        // Show receipt option
        if (result.invoice) {
          toast.success(`Factura ${result.invoice.invoice_number} generada`)
        }
      } else {
        toast.error(result.error || 'Error procesando venta')
      }
    } catch (error) {
      console.error('Error processing sale:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  if (!posData) {
    return <div className="flex items-center justify-center h-64">Error cargando datos</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Servicios Disponibles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Servicios Disponibles
              </CardTitle>
              <CardDescription>
                Selecciona servicios para agregar al carrito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(posData.services)[0]} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                  {Object.keys(posData.services).map((category) => (
                    <TabsTrigger key={category} value={category} className="text-xs">
                      {category.replace('_', ' ')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(posData.services).map(([category, services]) => (
                  <TabsContent key={category} value={category}>
                    <ScrollArea className="h-96">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {services.map((service) => (
                          <Card 
                            key={service.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => addToCart(service)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-sm">{service.name}</h4>
                                <Badge variant="secondary">
                                  ${service.price_usd}
                                </Badge>
                              </div>
                              {service.description && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {service.description}
                                </p>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">
                                  {service.is_taxable ? `+${service.tax_rate}% IVA` : 'Sin IVA'}
                                </span>
                                <Button size="sm" variant="outline">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Carrito y Checkout */}
        <div className="space-y-6">
          {/* Carrito */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrito
                </span>
                <Badge variant="outline">
                  {cart.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Carrito vacío
                </p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${item.price_usd} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Totales */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Totales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento ({discount}%):</span>
                    <span>-${totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {applyIVA && totals.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span>${totals.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Procesar Pago
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Información de Pago</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cliente */}
                      <div className="space-y-4">
                        <div>
                          <Label>Tipo de Cliente</Label>
                          <Select value={clientType} onValueChange={setClientType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WALK_IN">Cliente Ocasional</SelectItem>
                              <SelectItem value="GUEST">Huésped</SelectItem>
                              <SelectItem value="COMPANY">Empresa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {clientType === 'GUEST' && posData.occupied_rooms.length > 0 && (
                          <div>
                            <Label>Huésped/Habitación</Label>
                            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar habitación" />
                              </SelectTrigger>
                              <SelectContent>
                                {posData.occupied_rooms.map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.room_number} - {room.guest_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {(clientType === 'COMPANY' || clientType === 'WALK_IN') && (
                          <>
                            <div>
                              <Label>Nombre del Cliente</Label>
                              <Input
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Nombre completo o razón social"
                              />
                            </div>
                            <div>
                              <Label>Documento (RIF/CI)</Label>
                              <Input
                                value={clientDocument}
                                onChange={(e) => setClientDocument(e.target.value)}
                                placeholder="J-12345678-9 o V-12345678"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Pago */}
                      <div className="space-y-4">
                        <div>
                          <Label>Método de Pago</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar método" />
                            </SelectTrigger>
                            <SelectContent>
                              {posData.payment_methods.map((method) => (
                                <SelectItem key={method.id} value={method.code}>
                                  {method.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Monto Recibido</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder={totals.total.toFixed(2)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Descuento (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={discount}
                              onChange={(e) => setDiscount(Number(e.target.value))}
                            />
                          </div>
                          <div className="flex items-center space-x-2 mt-6">
                            <input
                              type="checkbox"
                              id="apply-iva"
                              checked={applyIVA}
                              onChange={(e) => setApplyIVA(e.target.checked)}
                            />
                            <label htmlFor="apply-iva" className="text-sm">
                              Aplicar IVA
                            </label>
                          </div>
                        </div>

                        <div>
                          <Label>Notas</Label>
                          <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Comentarios adicionales"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumen Final */}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold">Total a Pagar:</span>
                        <span className="text-2xl font-bold">${totals.total.toFixed(2)}</span>
                      </div>
                      
                      {Number(amountPaid) > totals.total && (
                        <div className="flex justify-between items-center mb-4 text-green-600">
                          <span>Cambio:</span>
                          <span className="font-bold">
                            ${(Number(amountPaid) - totals.total).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowPaymentModal(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={processSale}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? 'Procesando...' : 'Confirmar Venta'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
