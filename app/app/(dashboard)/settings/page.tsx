
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'react-hot-toast'
import { Building, Settings, Users, DollarSign, Bell } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [hotelSettings, setHotelSettings] = useState({
    name: 'Hotel Paseo Las Mercedes',
    address: '',
    phone: '',
    email: '',
    description: '',
    tax_id: '',
    logo_url: '',
    default_currency: 'USD'
  })

  const [systemSettings, setSystemSettings] = useState({
    check_in_time: '15:00',
    check_out_time: '11:00',
    max_advance_booking_days: 365,
    allow_same_day_booking: true,
    require_cc_for_booking: false,
    auto_assign_rooms: false,
    send_confirmation_emails: true,
    send_reminder_emails: true,
    default_language: 'es'
  })

  const [billingSettings, setBillingSettings] = useState({
    tax_rate: 16,
    currency_rates: {
      usd_to_eur: 0.85,
      usd_to_usdt: 1.00,
      usd_to_bnb: 0.0025,
      usd_to_etc: 0.035
    },
    payment_methods: {
      cash: true,
      credit_card: true,
      crypto: true,
      bank_transfer: true
    }
  })

  const [notificationSettings, setNotificationSettings] = useState({
    new_reservations: true,
    check_in_reminders: true,
    check_out_reminders: true,
    payment_confirmations: true,
    maintenance_alerts: true,
    low_inventory_alerts: true
  })

  useEffect(() => {
    // In a real app, fetch settings from API
    // fetchSettings()
  }, [])

  const handleSaveHotelSettings = async () => {
    setLoading(true)
    try {
      // In a real app, save to API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Configuración del hotel guardada')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSystemSettings = async () => {
    setLoading(true)
    try {
      // In a real app, save to API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Configuración del sistema guardada')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBillingSettings = async () => {
    setLoading(true)
    try {
      // In a real app, save to API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Configuración de facturación guardada')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotificationSettings = async () => {
    setLoading(true)
    try {
      // In a real app, save to API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Configuración de notificaciones guardada')
    } catch (error) {
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuraciones</h1>
        <p className="text-muted-foreground">Gestiona la configuración del sistema hotelero</p>
      </div>

      <Tabs defaultValue="hotel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hotel" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Hotel
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Facturación
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Hotel Settings */}
        <TabsContent value="hotel">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Hotel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotel_name">Nombre del Hotel</Label>
                  <Input
                    id="hotel_name"
                    value={hotelSettings.name}
                    onChange={(e) => setHotelSettings({...hotelSettings, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="default_currency">Moneda Principal</Label>
                  <Select value={hotelSettings.default_currency} onValueChange={(value) => setHotelSettings({...hotelSettings, default_currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USDT">USDT - Tether</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="hotel_address">Dirección</Label>
                <Textarea
                  id="hotel_address"
                  value={hotelSettings.address}
                  onChange={(e) => setHotelSettings({...hotelSettings, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotel_phone">Teléfono</Label>
                  <Input
                    id="hotel_phone"
                    value={hotelSettings.phone}
                    onChange={(e) => setHotelSettings({...hotelSettings, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="hotel_email">Email</Label>
                  <Input
                    id="hotel_email"
                    type="email"
                    value={hotelSettings.email}
                    onChange={(e) => setHotelSettings({...hotelSettings, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax_id">RIF/NIT</Label>
                  <Input
                    id="tax_id"
                    value={hotelSettings.tax_id}
                    onChange={(e) => setHotelSettings({...hotelSettings, tax_id: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <Input
                    id="logo_url"
                    value={hotelSettings.logo_url}
                    onChange={(e) => setHotelSettings({...hotelSettings, logo_url: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hotel_description">Descripción</Label>
                <Textarea
                  id="hotel_description"
                  value={hotelSettings.description}
                  onChange={(e) => setHotelSettings({...hotelSettings, description: e.target.value})}
                  placeholder="Descripción del hotel..."
                />
              </div>

              <Button onClick={handleSaveHotelSettings} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in_time">Hora de Check-in</Label>
                  <Input
                    id="check_in_time"
                    type="time"
                    value={systemSettings.check_in_time}
                    onChange={(e) => setSystemSettings({...systemSettings, check_in_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="check_out_time">Hora de Check-out</Label>
                  <Input
                    id="check_out_time"
                    type="time"
                    value={systemSettings.check_out_time}
                    onChange={(e) => setSystemSettings({...systemSettings, check_out_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_advance_booking">Días máximos para reserva anticipada</Label>
                <Input
                  id="max_advance_booking"
                  type="number"
                  value={systemSettings.max_advance_booking_days}
                  onChange={(e) => setSystemSettings({...systemSettings, max_advance_booking_days: parseInt(e.target.value) || 365})}
                />
              </div>

              <div>
                <Label htmlFor="default_language">Idioma por Defecto</Label>
                <Select value={systemSettings.default_language} onValueChange={(value) => setSystemSettings({...systemSettings, default_language: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow_same_day"
                    checked={systemSettings.allow_same_day_booking}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, allow_same_day_booking: checked})}
                  />
                  <Label htmlFor="allow_same_day">Permitir reservas el mismo día</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_cc"
                    checked={systemSettings.require_cc_for_booking}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, require_cc_for_booking: checked})}
                  />
                  <Label htmlFor="require_cc">Requerir tarjeta de crédito para reservas</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_assign"
                    checked={systemSettings.auto_assign_rooms}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, auto_assign_rooms: checked})}
                  />
                  <Label htmlFor="auto_assign">Asignación automática de habitaciones</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="confirmation_emails"
                    checked={systemSettings.send_confirmation_emails}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, send_confirmation_emails: checked})}
                  />
                  <Label htmlFor="confirmation_emails">Enviar emails de confirmación</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="reminder_emails"
                    checked={systemSettings.send_reminder_emails}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, send_reminder_emails: checked})}
                  />
                  <Label htmlFor="reminder_emails">Enviar emails de recordatorio</Label>
                </div>
              </div>

              <Button onClick={handleSaveSystemSettings} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Facturación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tax_rate">Tasa de Impuesto (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={billingSettings.tax_rate}
                  onChange={(e) => setBillingSettings({...billingSettings, tax_rate: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tasas de Cambio (desde USD)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>USD a EUR</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={billingSettings.currency_rates.usd_to_eur}
                      onChange={(e) => setBillingSettings({
                        ...billingSettings, 
                        currency_rates: {...billingSettings.currency_rates, usd_to_eur: parseFloat(e.target.value) || 0}
                      })}
                    />
                  </div>
                  <div>
                    <Label>USD a USDT</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={billingSettings.currency_rates.usd_to_usdt}
                      onChange={(e) => setBillingSettings({
                        ...billingSettings, 
                        currency_rates: {...billingSettings.currency_rates, usd_to_usdt: parseFloat(e.target.value) || 0}
                      })}
                    />
                  </div>
                  <div>
                    <Label>USD a BNB</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={billingSettings.currency_rates.usd_to_bnb}
                      onChange={(e) => setBillingSettings({
                        ...billingSettings, 
                        currency_rates: {...billingSettings.currency_rates, usd_to_bnb: parseFloat(e.target.value) || 0}
                      })}
                    />
                  </div>
                  <div>
                    <Label>USD a ETC</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={billingSettings.currency_rates.usd_to_etc}
                      onChange={(e) => setBillingSettings({
                        ...billingSettings, 
                        currency_rates: {...billingSettings.currency_rates, usd_to_etc: parseFloat(e.target.value) || 0}
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Métodos de Pago Habilitados</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cash"
                      checked={billingSettings.payment_methods.cash}
                      onCheckedChange={(checked) => setBillingSettings({
                        ...billingSettings, 
                        payment_methods: {...billingSettings.payment_methods, cash: checked}
                      })}
                    />
                    <Label htmlFor="cash">Efectivo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="credit_card"
                      checked={billingSettings.payment_methods.credit_card}
                      onCheckedChange={(checked) => setBillingSettings({
                        ...billingSettings, 
                        payment_methods: {...billingSettings.payment_methods, credit_card: checked}
                      })}
                    />
                    <Label htmlFor="credit_card">Tarjeta de Crédito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="crypto"
                      checked={billingSettings.payment_methods.crypto}
                      onCheckedChange={(checked) => setBillingSettings({
                        ...billingSettings, 
                        payment_methods: {...billingSettings.payment_methods, crypto: checked}
                      })}
                    />
                    <Label htmlFor="crypto">Criptomonedas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bank_transfer"
                      checked={billingSettings.payment_methods.bank_transfer}
                      onCheckedChange={(checked) => setBillingSettings({
                        ...billingSettings, 
                        payment_methods: {...billingSettings.payment_methods, bank_transfer: checked}
                      })}
                    />
                    <Label htmlFor="bank_transfer">Transferencia Bancaria</Label>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveBillingSettings} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new_reservations"
                    checked={notificationSettings.new_reservations}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, new_reservations: checked})}
                  />
                  <Label htmlFor="new_reservations">Nuevas reservas</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="check_in_reminders"
                    checked={notificationSettings.check_in_reminders}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, check_in_reminders: checked})}
                  />
                  <Label htmlFor="check_in_reminders">Recordatorios de check-in</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="check_out_reminders"
                    checked={notificationSettings.check_out_reminders}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, check_out_reminders: checked})}
                  />
                  <Label htmlFor="check_out_reminders">Recordatorios de check-out</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="payment_confirmations"
                    checked={notificationSettings.payment_confirmations}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, payment_confirmations: checked})}
                  />
                  <Label htmlFor="payment_confirmations">Confirmaciones de pago</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenance_alerts"
                    checked={notificationSettings.maintenance_alerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, maintenance_alerts: checked})}
                  />
                  <Label htmlFor="maintenance_alerts">Alertas de mantenimiento</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="low_inventory_alerts"
                    checked={notificationSettings.low_inventory_alerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, low_inventory_alerts: checked})}
                  />
                  <Label htmlFor="low_inventory_alerts">Alertas de inventario bajo</Label>
                </div>
              </div>

              <Button onClick={handleSaveNotificationSettings} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
