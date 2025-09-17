
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Search,
  Plus,
  AlertTriangle,
  Truck,
  Edit,
  TrendingDown,
  TrendingUp,
  Box,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface Supply {
  id: string
  name: string
  description: string
  category: string
  unit_type: string
  current_stock: number
  minimum_stock: number
  maximum_stock: number
  unit_cost: number
  supplier_name: string
  supplier_contact: string
  brand: string
  is_active: boolean
  needs_reorder: boolean
  storage_location: string
  created_at: string
}

const categoryLabels: Record<string, string> = {
  CLEANING: 'Productos de Limpieza',
  LINENS: 'Ropa de Cama y Toallas',
  AMENITIES: 'Amenidades',
  MAINTENANCE: 'Mantenimiento',
  OTHER: 'Otros'
}

const categoryColors: Record<string, string> = {
  CLEANING: 'bg-blue-100 text-blue-800',
  LINENS: 'bg-green-100 text-green-800',
  AMENITIES: 'bg-purple-100 text-purple-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

const unitTypeLabels: Record<string, string> = {
  PIECE: 'Pieza',
  LITER: 'Litro',
  KG: 'Kilogramo',
  BOTTLE: 'Botella',
  PACK: 'Paquete'
}

export default function HousekeepingSuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    needs_reorder: '',
    is_active: 'true',
    name: ''
  })

  useEffect(() => {
    fetchSupplies()
  }, [filters])

  const fetchSupplies = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.append(key, value)
      })

      const response = await fetch(`/api/housekeeping/supplies?${searchParams}`)
      
      if (response.ok) {
        const result = await response.json()
        setSupplies(result.supplies)
      } else {
        toast.error('Error cargando los suministros')
      }
    } catch (error) {
      console.error('Error fetching supplies:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (supply: Supply) => {
    const stockPercentage = (supply.current_stock / supply.minimum_stock) * 100
    
    if (stockPercentage <= 50) {
      return { status: 'critical', label: 'Crítico', color: 'text-red-600' }
    } else if (stockPercentage <= 100) {
      return { status: 'low', label: 'Bajo', color: 'text-orange-600' }
    } else {
      return { status: 'good', label: 'Bueno', color: 'text-green-600' }
    }
  }

  const getSupplyTotalValue = (supply: Supply) => {
    return (supply.current_stock * supply.unit_cost).toFixed(2)
  }

  const getLowStockCount = () => {
    return supplies.filter(s => s.current_stock <= s.minimum_stock).length
  }

  const getTotalInventoryValue = () => {
    return supplies.reduce((sum, supply) => sum + (supply.current_stock * supply.unit_cost), 0).toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suministros de Housekeeping</h1>
          <p className="text-muted-foreground">
            Inventario y gestión de suministros de limpieza
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/housekeeping/supplies/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Suministro
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suministros</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplies.length}</div>
            <p className="text-xs text-muted-foreground">
              {supplies.filter(s => s.is_active).length} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {getLowStockCount()}
            </div>
            <p className="text-xs text-muted-foreground">
              Necesitan reposición
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${getTotalInventoryValue()}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventario actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(supplies.map(s => s.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Diferentes tipos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Buscar por nombre..."
              value={filters.name}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
            />

            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                <SelectItem value="CLEANING">Productos de Limpieza</SelectItem>
                <SelectItem value="LINENS">Ropa de Cama y Toallas</SelectItem>
                <SelectItem value="AMENITIES">Amenidades</SelectItem>
                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                <SelectItem value="OTHER">Otros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.needs_reorder} onValueChange={(value) => setFilters(prev => ({ ...prev, needs_reorder: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Stock bajo</SelectItem>
                <SelectItem value="false">Stock normal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.is_active} onValueChange={(value) => setFilters(prev => ({ ...prev, is_active: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchSupplies}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Supplies Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {supplies.map((supply) => {
            const stockStatus = getStockStatus(supply)
            
            return (
              <Card key={supply.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{supply.name}</h3>
                      {supply.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {supply.description}
                        </p>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        <Badge className={categoryColors[supply.category]} variant="secondary">
                          {categoryLabels[supply.category]}
                        </Badge>
                        
                        {supply.needs_reorder && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Reponer
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Link href={`/housekeeping/supplies/${supply.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Stock Actual</div>
                        <div className={`font-medium ${stockStatus.color}`}>
                          {supply.current_stock} {unitTypeLabels[supply.unit_type]}
                        </div>
                      </div>

                      <div>
                        <div className="text-muted-foreground">Stock Mínimo</div>
                        <div className="font-medium">
                          {supply.minimum_stock} {unitTypeLabels[supply.unit_type]}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Costo Unitario</div>
                        <div className="font-medium">${supply.unit_cost.toFixed(2)}</div>
                      </div>

                      <div>
                        <div className="text-muted-foreground">Valor Total</div>
                        <div className="font-medium">${getSupplyTotalValue(supply)}</div>
                      </div>
                    </div>

                    {supply.supplier_name && (
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                          <Truck className="h-3 w-3" />
                          Proveedor
                        </div>
                        <div className="font-medium">{supply.supplier_name}</div>
                        {supply.brand && (
                          <div className="text-xs text-muted-foreground">
                            Marca: {supply.brand}
                          </div>
                        )}
                      </div>
                    )}

                    {supply.storage_location && (
                      <div className="text-sm">
                        <div className="text-muted-foreground">Ubicación</div>
                        <div className="font-medium">{supply.storage_location}</div>
                      </div>
                    )}

                    {/* Stock Progress Bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Nivel de stock</span>
                        <span className={stockStatus.color}>
                          {stockStatus.label}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stockStatus.status === 'critical' ? 'bg-red-500' :
                            stockStatus.status === 'low' ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((supply.current_stock / supply.minimum_stock) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {supplies.length === 0 && !loading && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No hay suministros</h3>
                <p className="text-muted-foreground mb-4">
                  No se encontraron suministros con los filtros seleccionados
                </p>
                <Link href="/housekeeping/supplies/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar primer suministro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
