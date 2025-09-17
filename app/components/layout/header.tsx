
'use client'

import { Button } from '@/components/ui/button'
import { Menu, Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  onMenuClick?: () => void
  title?: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {title && (
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar huéspedes, reservas..."
            className="pl-10 w-64"
          />
        </div>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          onClick={() => {
            // TODO: Implementar panel de notificaciones
            alert('Panel de notificaciones - Próximamente')
          }}
          title="Ver notificaciones"
        >
          <Bell className="h-5 w-5" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
            3
          </Badge>
        </Button>
      </div>
    </header>
  )
}
