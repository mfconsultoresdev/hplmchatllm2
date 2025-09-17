

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bed, 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface MetricsCardsProps {
  metrics: {
    totalRooms: number
    occupiedRooms: number
    availableRooms: number
    occupancyRate: number
    todayArrivals: number
    todayDepartures: number
    pendingCheckIns: number
    todayRevenue: number
  }
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Ocupación Total',
      value: `${metrics.occupiedRooms}/${metrics.totalRooms}`,
      description: `${metrics.occupancyRate.toFixed(1)}% de ocupación`,
      icon: Bed,
      trend: metrics.occupancyRate >= 70 ? 'up' : 'down',
      trendValue: `${metrics.occupancyRate.toFixed(1)}%`,
      color: metrics.occupancyRate >= 70 ? 'text-green-600' : 'text-amber-600'
    },
    {
      title: 'Habitaciones Disponibles',
      value: metrics.availableRooms.toString(),
      description: `${metrics.totalRooms} habitaciones en total`,
      icon: Bed,
      trend: 'neutral',
      trendValue: '',
      color: 'text-blue-600'
    },
    {
      title: 'Check-ins Hoy',
      value: metrics.todayArrivals.toString(),
      description: `${metrics.pendingCheckIns} pendientes`,
      icon: Calendar,
      trend: metrics.pendingCheckIns > 0 ? 'up' : 'neutral',
      trendValue: metrics.pendingCheckIns > 0 ? `${metrics.pendingCheckIns} pendientes` : '',
      color: 'text-green-600'
    },
    {
      title: 'Check-outs Hoy',
      value: metrics.todayDepartures.toString(),
      description: 'Salidas programadas',
      icon: Calendar,
      trend: 'neutral',
      trendValue: '',
      color: 'text-amber-600'
    },
    {
      title: 'Ingresos Hoy',
      value: `$${metrics.todayRevenue.toLocaleString()}`,
      description: 'Ingresos del día actual',
      icon: DollarSign,
      trend: metrics.todayRevenue > 0 ? 'up' : 'neutral',
      trendValue: metrics.todayRevenue > 0 ? 'Activo' : 'Sin ingresos',
      color: 'text-green-600'
    },
    {
      title: 'Huéspedes Activos',
      value: metrics.occupiedRooms.toString(),
      description: 'Huéspedes registrados',
      icon: Users,
      trend: 'neutral',
      trendValue: '',
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{card.description}</span>
              {card.trend === 'up' && (
                <div className="flex items-center text-green-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>{card.trendValue}</span>
                </div>
              )}
              {card.trend === 'down' && (
                <div className="flex items-center text-red-600">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  <span>{card.trendValue}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
