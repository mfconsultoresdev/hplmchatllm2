
'use client'

import { useEffect, useState } from 'react'
// Dashboard layout is handled by the parent layout.tsx
import { MetricsCards } from '@/components/dashboard/metrics-cards'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RoomsOverview } from '@/components/dashboard/rooms-overview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

interface DashboardData {
  totalRooms: number
  occupiedRooms: number
  availableRooms: number
  occupancyRate: number
  todayArrivals: number
  todayDepartures: number
  pendingCheckIns: number
  todayRevenue: number
  recentTransactions: Array<{
    id: string
    type: string
    description: string
    amount: number
    currency: string
    created_at: string
    guest_name: string | null
    room_number: string | null
    service_name: string | null
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard')
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos del dashboard')
      }
      
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, {session?.user?.firstName || 'Usuario'}!
          </h1>
          <p className="text-gray-600">
            {session?.user?.hotelName} - {session?.user?.role}
          </p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-VE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
          disabled={loading}
          className="mt-4 md:mt-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              className="ml-2"
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dashboard Content */}
      {data && !loading && (
        <>
          {/* Metrics Cards */}
          <MetricsCards metrics={data} />

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1">
              <QuickActions />
            </div>
            <div className="xl:col-span-2">
              <RecentActivity transactions={data.recentTransactions} />
            </div>
          </div>

          {/* Rooms Overview */}
          <RoomsOverview />
        </>
      )}
    </div>
  )
}
