

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, DollarSign, CreditCard, Minus } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  currency: string
  created_at: string
  guest_name: string | null
  room_number: string | null
  service_name: string | null
}

interface RecentActivityProps {
  transactions: Transaction[]
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'CHARGE':
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case 'REFUND':
        return <Minus className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'PAYMENT':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>
      case 'CHARGE':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Cargo</Badge>
      case 'REFUND':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Reembolso</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-VE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    }).format(date)
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Actividad Reciente
        </CardTitle>
        <CardDescription>
          Últimas transacciones del día
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay transacciones recientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center space-x-4 p-3 rounded-lg border bg-card"
              >
                <div className="flex-shrink-0">
                  {getTransactionIcon(transaction.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getTransactionBadge(transaction.type)}
                      <p className="text-sm font-semibold">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      {transaction.guest_name && (
                        <span>• {transaction.guest_name}</span>
                      )}
                      {transaction.room_number && (
                        <span>• Hab. {transaction.room_number}</span>
                      )}
                      {transaction.service_name && (
                        <span>• {transaction.service_name}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
