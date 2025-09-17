

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Settings, 
  ClipboardList,
  Calendar,
  Bed
} from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      title: 'Nueva Reserva',
      description: 'Crear una nueva reserva',
      icon: Plus,
      href: '/reservations/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Nuevo Huésped',
      description: 'Registrar huésped',
      icon: UserPlus,
      href: '/guests/new',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Check-in',
      description: 'Procesar llegada',
      icon: LogIn,
      href: '/checkin',
      color: 'bg-amber-500 hover:bg-amber-600'
    },
    {
      title: 'Check-out',
      description: 'Procesar salida',
      icon: LogOut,
      href: '/checkout',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Ver Habitaciones',
      description: 'Estado de habitaciones',
      icon: Bed,
      href: '/rooms',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Calendarios',
      description: 'Ver reservas',
      icon: Calendar,
      href: '/reservations',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardList className="h-5 w-5 mr-2" />
          Acciones Rápidas
        </CardTitle>
        <CardDescription>
          Operaciones más utilizadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${action.color} flex items-center justify-center mr-3`}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
