
'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Hotel,
  LayoutDashboard,
  BedDouble,
  Calendar,
  Users,
  UserCheck,
  UserX,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Wallet,
  CreditCard,
  Sparkles,
  MessageSquare,
  FileText,
  UserCog,
  Clock
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Panel principal con métricas'
  },
  {
    name: 'Habitaciones',
    href: '/rooms',
    icon: BedDouble,
    description: 'Gestión de habitaciones por pisos'
  },
  {
    name: 'Reservas',
    href: '/reservations',
    icon: Calendar,
    description: 'Sistema de reservas y calendario'
  },
  {
    name: 'Huéspedes',
    href: '/guests',
    icon: Users,
    description: 'Registro de huéspedes'
  },
  {
    name: 'Check-in',
    href: '/checkin',
    icon: UserCheck,
    description: 'Proceso de llegada'
  },
  {
    name: 'Check-out',
    href: '/checkout',
    icon: UserX,
    description: 'Proceso de salida'
  },
  {
    name: 'Servicios',
    href: '/services',
    icon: ShoppingCart,
    description: 'Gestión de servicios del hotel'
  },
  {
    name: 'Housekeeping',
    href: '/housekeeping',
    icon: Sparkles,
    description: 'Limpieza y mantenimiento'
  },
  {
    name: 'Personal',
    href: '/staff',
    icon: UserCog,
    description: 'Gestión de personal y empleados'
  },
  {
    name: 'Horarios',
    href: '/schedules',
    icon: Clock,
    description: 'Turnos y horarios del personal'
  },
  {
    name: 'Comunicaciones',
    href: '/communications',
    icon: MessageSquare,
    description: 'Centro de comunicaciones y mensajería'
  },
  {
    name: 'Plantillas',
    href: '/communication-templates',
    icon: FileText,
    description: 'Plantillas de mensajes y comunicación'
  },
  {
    name: 'Facturación',
    href: '/billing',
    icon: CreditCard,
    description: 'Facturas y pagos del hotel'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    description: 'Reportes y análisis'
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    description: 'Configuración del sistema'
  }
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm">Hotel Paseo</h1>
                <p className="text-xs text-gray-500">Las Mercedes</p>
              </div>
            </div>
          )}
          
          {collapsed && (
            <div className="bg-blue-600 p-2 rounded-lg mx-auto">
              <Hotel className="w-5 h-5 text-white" />
            </div>
          )}
          
          {!collapsed && onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* User Info */}
      {session && (
        <div className="p-4 border-b border-gray-200">
          {!collapsed ? (
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {session.user?.firstName?.[0] || 'U'}{session.user?.lastName?.[0] || 'S'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user?.firstName} {session.user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user?.role}
                </p>
                <p className="text-xs text-blue-600 truncate">
                  {session.user?.department}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {session.user?.firstName?.[0] || 'U'}{session.user?.lastName?.[0] || 'S'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-5 w-5 mr-3")} />
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-400 font-normal">{item.description}</div>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50",
            collapsed ? "px-0 justify-center" : ""
          )}
          onClick={handleSignOut}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && "Cerrar Sesión"}
        </Button>
      </div>
    </div>
  )
}
