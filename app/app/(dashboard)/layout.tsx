
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Home, 
  Bed, 
  Calendar, 
  Users, 
  CreditCard, 
  Settings, 
  Menu,
  LogOut,
  Hotel,
  BarChart3,
  ShoppingCart,
  FileText,
  AlertTriangle,
  Calculator
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

interface SidebarNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Resumen general del hotel'
  },
  {
    title: 'Habitaciones',
    href: '/rooms',
    icon: Bed,
    description: 'Gestión de habitaciones y estados'
  },
  {
    title: 'Reservas',
    href: '/reservations',
    icon: Calendar,
    description: 'Sistema de reservas'
  },
  {
    title: 'Huéspedes',
    href: '/guests',
    icon: Users,
    description: 'Base de datos de huéspedes'
  },
  {
    title: 'Facturación',
    href: '/billing',
    icon: CreditCard,
    description: 'Facturación y pagos'
  },
  {
    title: 'POS/Ventas',
    href: '/pos',
    icon: ShoppingCart,
    description: 'Punto de venta integrado'
  },
  {
    title: 'Cuentas x Cobrar',
    href: '/accounts-receivable',
    icon: AlertTriangle,
    description: 'Gestión de cobranza'
  },
  {
    title: 'Reportes Fiscales',
    href: '/fiscal/reports',
    icon: Calculator,
    description: 'Reportes para SENIAT'
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    description: 'Reportes y analytics'
  },
  {
    title: 'Configuración',
    href: '/settings',
    icon: Settings,
    description: 'Configuración del sistema'
  }
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 overflow-y-auto border-r bg-background lg:block">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b p-6">
            <Hotel className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">Hotel PMS</h2>
              <p className="text-sm text-muted-foreground">Paseo Las Mercedes</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <div>
                    <div>{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 border-b p-6">
              <Hotel className="h-6 w-6" />
              <div>
                <h2 className="text-lg font-semibold">Hotel PMS</h2>
                <p className="text-sm text-muted-foreground">Paseo Las Mercedes</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {sidebarNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <div>
                      <div>{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="border-b bg-background p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Hotel PMS</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
