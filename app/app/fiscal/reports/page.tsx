
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar, Download, FileText, Calculator, TrendingUp, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface FiscalSummary {
  period: {
    type: string
    year: number
    month?: number
    startDate: string
    endDate: string
  }
  totals: {
    total_invoices: number
    gross_revenue: number
    net_revenue: number
    total_iva: number
    total_municipal_tax: number
    total_service_tax: number
    total_discounts: number
    total_payments: number
    outstanding_balance: number
  }
  by_currency: Record<string, any>
  by_tax_rate: Record<string, any>
  by_payment_method: Record<string, any>
  daily_breakdown: any[]
}

export default function FiscalReportsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [fiscalData, setFiscalData] = useState<FiscalSummary | null>(null)

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        year: year.toString(),
        month: month.toString()
      })

      if (reportType === 'custom' && startDate && endDate) {
        params.set('startDate', startDate)
        params.set('endDate', endDate)
      }

      const response = await fetch(`/api/fiscal/reports?${params}`)
      const data = await response.json()

      if (data.success) {
        setFiscalData(data.fiscal_summary)
      }
    } catch (error) {
      console.error('Error generating fiscal report:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSeniatReport = async () => {
    setLoading(true)
    try {
      const periodStart = reportType === 'custom' && startDate 
        ? startDate 
        : new Date(year, month - 1, 1).toISOString().split('T')[0]
      
      const periodEnd = reportType === 'custom' && endDate
        ? endDate
        : new Date(year, month, 0).toISOString().split('T')[0]

      const response = await fetch('/api/fiscal/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          report_format: 'SENIAT_XML'
        })
      })

      const data = await response.json()

      if (data.success) {
        // Crear y descargar archivo JSON del reporte SENIAT
        const blob = new Blob([JSON.stringify(data.seniat_report, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `seniat_report_${periodStart}_${periodEnd}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error generating SENIAT report:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  useEffect(() => {
    generateReport()
  }, [])

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes Fiscales</h1>
          <p className="text-gray-600 mt-2">
            Generación de reportes para declaraciones y cumplimiento fiscal
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateSeniatReport}
            variant="outline"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar SENIAT
          </Button>
        </div>
      </div>

      {/* Configuración de Período */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configuración del Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report-type">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                  <SelectItem value="custom">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max="2030"
              />
            </div>

            {reportType === 'monthly' && (
              <div>
                <Label htmlFor="month">Mes</Label>
                <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {format(new Date(2024, i), 'MMMM', { locale: es })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === 'custom' && (
              <>
                <div>
                  <Label htmlFor="start-date">Fecha Inicio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Fecha Fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del Reporte */}
      {fiscalData && (
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Resumen</TabsTrigger>
            <TabsTrigger value="taxes">Impuestos</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="breakdown">Desglose</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(fiscalData.totals.gross_revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    De {fiscalData.totals.total_invoices} facturas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">IVA Total</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(fiscalData.totals.total_iva)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    16% promedio aplicado
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(fiscalData.totals.outstanding_balance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saldo pendiente de cobro
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Resumen por Moneda */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Resumen por Moneda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(fiscalData.by_currency).map(([currency, data]: [string, any]) => (
                    <div key={currency} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{currency}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {data.count} facturas
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Bruto:</span>
                          <span className="font-medium">
                            {formatCurrency(data.gross_revenue, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">IVA:</span>
                          <span className="font-medium">
                            {formatCurrency(data.total_iva, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-sm font-medium">Neto:</span>
                          <span className="font-bold">
                            {formatCurrency(data.net_revenue, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxes">
            <Card>
              <CardHeader>
                <CardTitle>Desglose de Impuestos por Tasa</CardTitle>
                <CardDescription>
                  Análisis detallado de impuestos aplicados según las tasas vigentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(fiscalData.by_tax_rate).map(([rate, data]: [string, any]) => (
                    <div key={rate} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            Tasa {rate}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {data.count} facturas
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Base Imponible</p>
                          <p className="font-semibold">
                            {formatCurrency(data.base_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Impuesto</p>
                          <p className="font-semibold text-blue-600">
                            {formatCurrency(data.tax_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">% del Total</p>
                          <p className="font-semibold">
                            {((data.tax_amount / fiscalData.totals.total_iva) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago Utilizados</CardTitle>
                <CardDescription>
                  Distribución de pagos recibidos por método
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(fiscalData.by_payment_method).map(([method, data]: [string, any]) => (
                    <div key={method} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{method}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {data.count} pagos
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Monto:</span>
                          <span className="font-semibold">
                            {formatCurrency(data.total_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">% del Total:</span>
                          <span className="font-medium">
                            {((data.total_amount / fiscalData.totals.total_payments) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown">
            {reportType === 'monthly' && fiscalData.daily_breakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Desglose Diario</CardTitle>
                  <CardDescription>
                    Actividad diaria durante el período seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {fiscalData.daily_breakdown.map((day: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">
                            {format(new Date(day.date), 'dd MMM yyyy', { locale: es })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {day.count} facturas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(day.net_revenue)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            IVA: {formatCurrency(day.iva_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
