
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, Users, Bed, Calendar, FileText, Download } from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface ReportData {
  occupancy: any[]
  revenue: any[]
  guestStats: any[]
  roomStats: any[]
  trends: any[]
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('last_30_days')
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [reportData, setReportData] = useState<ReportData>({
    occupancy: [],
    revenue: [],
    guestStats: [],
    roomStats: [],
    trends: []
  })

  // Stats summary
  const [stats, setStats] = useState({
    totalRevenue: 0,
    occupancyRate: 0,
    avgDailyRate: 0,
    totalReservations: 0,
    totalGuests: 0,
    repeatGuests: 0
  })

  useEffect(() => {
    updateDateRange()
  }, [dateRange])

  useEffect(() => {
    fetchReportData()
  }, [startDate, endDate])

  const updateDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'last_7_days':
        setStartDate(subDays(now, 7))
        setEndDate(now)
        break
      case 'last_30_days':
        setStartDate(subDays(now, 30))
        setEndDate(now)
        break
      case 'last_3_months':
        setStartDate(subMonths(now, 3))
        setEndDate(now)
        break
      case 'this_month':
        setStartDate(startOfMonth(now))
        setEndDate(endOfMonth(now))
        break
      case 'last_month':
        const lastMonth = subMonths(now, 1)
        setStartDate(startOfMonth(lastMonth))
        setEndDate(endOfMonth(lastMonth))
        break
    }
  }

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Simulate API calls - in real app, these would be actual API endpoints
      const [occupancyResponse, revenueResponse, guestResponse] = await Promise.all([
        fetchOccupancyData(),
        fetchRevenueData(),
        fetchGuestData()
      ])

      setReportData({
        occupancy: occupancyResponse,
        revenue: revenueResponse,
        guestStats: guestResponse.guestStats,
        roomStats: await fetchRoomStats(),
        trends: await fetchTrends()
      })

      calculateStats()
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOccupancyData = async () => {
    // Simulate occupancy data
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const data = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      data.push({
        date: format(date, 'MMM dd'),
        occupancy: Math.floor(Math.random() * 40) + 60, // 60-100%
        revenue: Math.floor(Math.random() * 5000) + 3000 // $3000-8000
      })
    }
    return data
  }

  const fetchRevenueData = async () => {
    // Simulate revenue breakdown
    return [
      { category: 'Habitaciones', amount: 45000, percentage: 70 },
      { category: 'Servicios', amount: 12000, percentage: 20 },
      { category: 'Minibar', amount: 4000, percentage: 6 },
      { category: 'Otros', amount: 3000, percentage: 4 }
    ]
  }

  const fetchGuestData = async () => {
    return {
      guestStats: [
        { segment: 'Corporativo', count: 45, percentage: 35 },
        { segment: 'Turismo', count: 65, percentage: 50 },
        { segment: 'Eventos', count: 20, percentage: 15 }
      ]
    }
  }

  const fetchRoomStats = async () => {
    return [
      { type: 'Individual', occupied: 15, total: 20 },
      { type: 'Doble', occupied: 18, total: 25 },
      { type: 'Suite', occupied: 8, total: 10 },
      { type: 'Familiar', occupied: 5, total: 8 }
    ]
  }

  const fetchTrends = async () => {
    return [
      { month: 'Ene', reservations: 120, revenue: 25000 },
      { month: 'Feb', reservations: 140, revenue: 28000 },
      { month: 'Mar', reservations: 160, revenue: 32000 },
      { month: 'Abr', reservations: 150, revenue: 30000 },
      { month: 'May', reservations: 180, revenue: 36000 },
      { month: 'Jun', reservations: 200, revenue: 40000 }
    ]
  }

  const calculateStats = () => {
    // Simulate stats calculation
    setStats({
      totalRevenue: 64000,
      occupancyRate: 85,
      avgDailyRate: 180,
      totalReservations: 156,
      totalGuests: 284,
      repeatGuests: 42
    })
  }

  const exportReport = (format: string) => {
    // Implement export functionality
    console.log(`Exporting report in ${format} format`)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Cargando reportes...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Analytics</h1>
          <p className="text-muted-foreground">Análisis detallado del rendimiento del hotel</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Últimos 7 días</SelectItem>
                <SelectItem value="last_30_days">Últimos 30 días</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                <SelectItem value="this_month">Este mes</SelectItem>
                <SelectItem value="last_month">Mes pasado</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <>
                <DatePicker
                  date={startDate}
                  setDate={(date) => date && setStartDate(date)}
                  placeholder="Fecha inicio"
                />
                <DatePicker
                  date={endDate}
                  setDate={(date) => date && setEndDate(date)}
                  placeholder="Fecha fin"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600">+12.5% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-green-600">+3.2% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarifa Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgDailyRate}</div>
            <p className="text-xs text-red-600">-2.1% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReservations}</div>
            <p className="text-xs text-green-600">+8.7% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Huéspedes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuests}</div>
            <p className="text-xs text-green-600">+15.3% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Recurrentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repeatGuests}</div>
            <p className="text-xs text-muted-foreground">14.8% del total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="occupancy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="guests">Huéspedes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="occupancy">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Ocupación</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.occupancy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="occupancy" stroke="#8884d8" name="Ocupación %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Diarios</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.occupancy}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.revenue}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percentage}) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {reportData.revenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guests">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Segmentación de Huéspedes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.guestStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({segment, percentage}) => `${segment}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {reportData.guestStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ocupación por Tipo de Habitación</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.roomStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="occupied" fill="#8884d8" name="Ocupadas" />
                    <Bar dataKey="total" fill="#82ca9d" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="reservations" fill="#8884d8" name="Reservas" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Ingresos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
