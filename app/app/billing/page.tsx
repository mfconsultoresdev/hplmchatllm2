

'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, FileText, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string
  client_type: string
  guest?: {
    first_name: string
    last_name: string
    email: string
  }
  company_name?: string
  total_amount: number
  currency: string
  status: string
  payment_status: string
  reservation?: {
    reservation_number: string
    room: {
      room_number: string
    }
  }
}

interface InvoiceStats {
  total_invoices: number
  total_amount: number
  paid_amount: number
  pending_amount: number
  overdue_count: number
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStats>({
    total_invoices: 0,
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    overdue_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchInvoices()
  }, [statusFilter, paymentStatusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      if (paymentStatusFilter !== 'all') {
        params.append('paymentStatus', paymentStatusFilter)
      }

      const response = await fetch(`/api/invoices?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setInvoices(data.invoices || [])
        
        // Calcular estadísticas
        const totalInvoices = data.invoices?.length || 0
        const totalAmount = data.invoices?.reduce((sum: number, inv: Invoice) => sum + Number(inv.total_amount), 0) || 0
        const paidAmount = data.invoices?.filter((inv: Invoice) => inv.payment_status === 'PAID')
          .reduce((sum: number, inv: Invoice) => sum + Number(inv.total_amount), 0) || 0
        const pendingAmount = totalAmount - paidAmount
        const overdueCount = data.invoices?.filter((inv: Invoice) => inv.status === 'OVERDUE').length || 0

        setStats({
          total_invoices: totalInvoices,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          overdue_count: overdueCount
        })
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.guest?.first_name?.toLowerCase().includes(searchLower) ||
      invoice.guest?.last_name?.toLowerCase().includes(searchLower) ||
      invoice.guest?.email?.toLowerCase().includes(searchLower) ||
      invoice.company_name?.toLowerCase().includes(searchLower) ||
      invoice.reservation?.reservation_number?.toLowerCase().includes(searchLower) ||
      invoice.reservation?.room?.room_number?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendiente', variant: 'secondary' as const },
      SENT: { label: 'Enviada', variant: 'outline' as const },
      PAID: { label: 'Pagada', variant: 'default' as const },
      OVERDUE: { label: 'Vencida', variant: 'destructive' as const },
      CANCELLED: { label: 'Cancelada', variant: 'secondary' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      UNPAID: { label: 'Sin pagar', variant: 'destructive' as const },
      PARTIAL: { label: 'Parcial', variant: 'secondary' as const },
      PAID: { label: 'Pagado', variant: 'default' as const },
      REFUNDED: { label: 'Reembolsado', variant: 'outline' as const }
    }
    
    const config = statusConfig[paymentStatus as keyof typeof statusConfig] || statusConfig.UNPAID
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona las facturas y pagos del hotel
          </p>
        </div>
        <Link href="/billing/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Facturas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_invoices}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monto Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.total_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos totales
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monto Cobrado
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.paid_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagos recibidos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendiente de Cobro
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.pending_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overdue_count} vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
          <CardDescription>
            Lista de todas las facturas emitidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente, email, reserva..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="SENT">Enviada</SelectItem>
                <SelectItem value="PAID">Pagada</SelectItem>
                <SelectItem value="OVERDUE">Vencida</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pagos</SelectItem>
                <SelectItem value="UNPAID">Sin pagar</SelectItem>
                <SelectItem value="PARTIAL">Parcial</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Cargando facturas...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {searchTerm ? 'No se encontraron facturas que coincidan con la búsqueda' : 'No hay facturas registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/billing/invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {invoice.client_type === 'GUEST' ? (
                          <div>
                            <div className="font-medium">
                              {invoice.guest?.first_name} {invoice.guest?.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {invoice.guest?.email}
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium">
                            {invoice.company_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {invoice.reservation ? (
                          <div>
                            <div className="font-medium">
                              {invoice.reservation.reservation_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Hab. {invoice.reservation.room.room_number}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(invoice.total_amount, invoice.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(invoice.payment_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/billing/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </Link>
                          {invoice.payment_status !== 'PAID' && (
                            <Link href={`/billing/payments/new?invoice_id=${invoice.id}`}>
                              <Button variant="outline" size="sm">
                                Pagar
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
