
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
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  FileText, 
  Calendar,
  Phone,
  Mail,
  CreditCard,
  TrendingDown,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface AccountReceivable {
  id: string
  invoice_number: string
  total_amount: number
  outstanding_balance: number
  total_paid: number
  days_overdue: number
  aging_category: string
  risk_level: string
  due_date?: string
  invoice_date: string
  currency: string
  payment_status: string
  guest?: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    document_number?: string
    vip_status: boolean
  }
  reservation?: {
    reservation_number: string
    room: {
      room_number: string
      room_type: {
        name: string
      }
    }
  }
}

interface AccountsSummary {
  total_invoices: number
  total_outstanding: number
  by_aging: {
    current: number
    days_1_30: number
    days_31_60: number
    days_61_90: number
    over_90_days: number
  }
  by_risk_level: {
    none: number
    low: number
    medium: number
    high: number
  }
}

export default function AccountsReceivablePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<AccountReceivable[]>([])
  const [summary, setSummary] = useState<AccountsSummary | null>(null)
  const [statusFilter, setStatusFilter] = useState('overdue')
  const [daysOverdueFilter, setDaysOverdueFilter] = useState('0')
  const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [reminderType, setReminderType] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [paymentPlan, setPaymentPlan] = useState<Array<{due_date: string, amount: string}>>([])

  useEffect(() => {
    loadAccountsReceivable()
  }, [statusFilter, daysOverdueFilter])

  const loadAccountsReceivable = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        daysOverdue: daysOverdueFilter
      })
      
      const response = await fetch(`/api/accounts-receivable?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAccounts(data.accounts_receivable)
        setSummary(data.summary)
      } else {
        toast.error('Error cargando cuentas por cobrar')
      }
    } catch (error) {
      console.error('Error loading accounts receivable:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const createCollectionAction = async () => {
    if (!selectedAccount || !actionType) {
      toast.error('Selecciona una acción válida')
      return
    }

    try {
      setLoading(true)
      
      const actionData: any = {
        invoice_id: selectedAccount.id,
        action_type: actionType,
        notes: actionNotes,
        reminder_type: reminderType || undefined,
        next_follow_up_date: followUpDate || undefined
      }

      if (actionType === 'PAYMENT_PLAN' && paymentPlan.length > 0) {
        actionData.payment_plan = {
          installments: paymentPlan.map(installment => ({
            due_date: installment.due_date,
            amount: parseFloat(installment.amount)
          }))
        }
      }

      const response = await fetch('/api/accounts-receivable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(actionData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setShowActionModal(false)
        setSelectedAccount(null)
        setActionType('')
        setActionNotes('')
        setReminderType('')
        setFollowUpDate('')
        setPaymentPlan([])
        loadAccountsReceivable()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error creating collection action:', error)
      toast.error('Error procesando acción')
    } finally {
      setLoading(false)
    }
  }

  const addPaymentPlanInstallment = () => {
    setPaymentPlan([...paymentPlan, { due_date: '', amount: '' }])
  }

  const updatePaymentPlanInstallment = (index: number, field: string, value: string) => {
    const updated = [...paymentPlan]
    updated[index] = { ...updated[index], [field]: value }
    setPaymentPlan(updated)
  }

  const removePaymentPlanInstallment = (index: number) => {
    setPaymentPlan(paymentPlan.filter((_, i) => i !== index))
  }

  const getRiskBadgeColor = (riskLevel: string): "destructive" | "secondary" | "outline" | "default" => {
    switch (riskLevel) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'destructive'
      case 'LOW': return 'secondary'
      default: return 'outline'
    }
  }

  const getAgingBadgeColor = (category: string): "destructive" | "secondary" | "outline" | "default" => {
    switch (category) {
      case 'CURRENT': return 'outline'
      case '1-30_DAYS': return 'secondary'
      case '31-60_DAYS': return 'destructive'
      case '61-90_DAYS': return 'destructive'
      case 'OVER_90_DAYS': return 'destructive'
      default: return 'outline'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading && accounts.length === 0) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuentas por Cobrar</h1>
          <p className="text-gray-600 mt-2">
            Gestión de facturas pendientes y acciones de cobranza
          </p>
        </div>
      </div>

      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.total_outstanding)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.total_invoices} facturas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vencido &gt; 90 días</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.by_aging.over_90_days)}
              </div>
              <p className="text-xs text-muted-foreground">
                Alto riesgo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vencido 31-90 días</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.by_aging.days_31_60 + summary.by_aging.days_61_90)}
              </div>
              <p className="text-xs text-muted-foreground">
                Riesgo medio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reciente &lt; 30 días</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.by_aging.current + summary.by_aging.days_1_30)}
              </div>
              <p className="text-xs text-muted-foreground">
                Bajo riesgo
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="partial">Pago Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Días Vencido (mínimo)</Label>
              <Select value={daysOverdueFilter} onValueChange={setDaysOverdueFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Cualquier vencimiento</SelectItem>
                  <SelectItem value="30">Más de 30 días</SelectItem>
                  <SelectItem value="60">Más de 60 días</SelectItem>
                  <SelectItem value="90">Más de 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadAccountsReceivable} disabled={loading} className="w-full">
                {loading ? 'Cargando...' : 'Aplicar Filtros'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas Pendientes</CardTitle>
          <CardDescription>
            Lista de facturas con saldo pendiente por cobrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-semibold">{account.invoice_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        {account.guest 
                          ? `${account.guest.first_name} ${account.guest.last_name}`
                          : 'Cliente General'
                        }
                        {account.reservation && (
                          <span className="ml-2">
                            - Habitación {account.reservation.room.room_number}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getRiskBadgeColor(account.risk_level)}>
                      {account.risk_level}
                    </Badge>
                    <Badge variant={getAgingBadgeColor(account.aging_category)}>
                      {account.days_overdue} días vencido
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha Factura</p>
                    <p className="font-medium">
                      {format(new Date(account.invoice_date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  
                  {account.due_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha Vencimiento</p>
                      <p className="font-medium">
                        {format(new Date(account.due_date), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Monto Total</p>
                    <p className="font-medium">
                      {formatCurrency(account.total_amount, account.currency)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                    <p className="font-bold text-red-600">
                      {formatCurrency(account.outstanding_balance, account.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {account.guest?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {account.guest.email}
                      </div>
                    )}
                    {account.guest?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {account.guest.phone}
                      </div>
                    )}
                    {account.guest?.vip_status && (
                      <Badge variant="secondary" className="text-xs">VIP</Badge>
                    )}
                  </div>
                  
                  <Dialog 
                    open={showActionModal && selectedAccount?.id === account.id} 
                    onOpenChange={(open) => {
                      setShowActionModal(open)
                      if (!open) setSelectedAccount(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAccount(account)}
                      >
                        Acciones de Cobranza
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          Acciones de Cobranza - {account.invoice_number}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label>Tipo de Acción</Label>
                          <Select value={actionType} onValueChange={setActionType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar acción" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REMINDER">Recordatorio</SelectItem>
                              <SelectItem value="COLLECTION_CALL">Llamada de Cobranza</SelectItem>
                              <SelectItem value="PAYMENT_PLAN">Plan de Pago</SelectItem>
                              <SelectItem value="LEGAL_ACTION">Acción Legal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {actionType === 'REMINDER' && (
                          <div>
                            <Label>Tipo de Recordatorio</Label>
                            <Select value={reminderType} onValueChange={setReminderType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EMAIL">Email</SelectItem>
                                <SelectItem value="SMS">SMS</SelectItem>
                                <SelectItem value="PHONE">Teléfono</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <Label>Notas</Label>
                          <Textarea
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            placeholder="Comentarios sobre la acción..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Próximo Seguimiento</Label>
                          <Input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                          />
                        </div>

                        {actionType === 'PAYMENT_PLAN' && (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label>Plan de Pagos</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPaymentPlanInstallment}
                              >
                                Agregar Cuota
                              </Button>
                            </div>
                            
                            {paymentPlan.map((installment, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <div className="flex-1">
                                  <Input
                                    type="date"
                                    value={installment.due_date}
                                    onChange={(e) => updatePaymentPlanInstallment(index, 'due_date', e.target.value)}
                                    placeholder="Fecha vencimiento"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={installment.amount}
                                    onChange={(e) => updatePaymentPlanInstallment(index, 'amount', e.target.value)}
                                    placeholder="Monto"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removePaymentPlanInstallment(index)}
                                  className="text-red-600"
                                >
                                  Eliminar
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowActionModal(false)
                              setSelectedAccount(null)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={createCollectionAction} disabled={loading}>
                            {loading ? 'Procesando...' : 'Crear Acción'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}

            {accounts.length === 0 && !loading && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay cuentas por cobrar</h3>
                <p className="text-muted-foreground">
                  No se encontraron facturas que coincidan con los filtros seleccionados.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
