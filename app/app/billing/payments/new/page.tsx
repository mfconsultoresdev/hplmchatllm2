

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CreditCard, DollarSign, Receipt, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'

// Stripe initialization
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  currency: string
  guest?: {
    first_name: string
    last_name: string
    email: string
  }
  payments: Array<{
    amount: number
    status: string
  }>
}

interface PaymentMethod {
  id: string
  name: string
  type: string
  code: string
  fee_type: string
  fee_amount: number
  fee_percentage: number
  min_amount?: number
  max_amount?: number
  description: string
}

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get('invoice_id')
  
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  
  // Payment form data
  const [amount, setAmount] = useState<number>(0)
  const [paymentMethodCode, setPaymentMethodCode] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  
  // Card payment details
  const [cardLastFour, setCardLastFour] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [authorizationCode, setAuthorizationCode] = useState('')
  
  // Bank transfer details
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [invoiceId])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Fetch invoice details if provided
      if (invoiceId) {
        const invoiceResponse = await fetch(`/api/invoices/${invoiceId}`)
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json()
          setInvoice(invoiceData.invoice)
          
          // Calculate remaining amount
          const totalPaid = invoiceData.invoice.payments
            ?.filter((p: any) => p.status === 'COMPLETED')
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
          
          const remainingAmount = Number(invoiceData.invoice.total_amount) - totalPaid
          setAmount(remainingAmount > 0 ? remainingAmount : 0)
          
          if (invoiceData.invoice.guest?.email) {
            setCustomerEmail(invoiceData.invoice.guest.email)
          }
        } else {
          toast.error('Factura no encontrada')
          router.back()
          return
        }
      }
      
      // Fetch payment methods
      const methodsResponse = await fetch('/api/payment-methods')
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json()
        setPaymentMethods(methodsData.paymentMethods || [])
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const selectedMethod = paymentMethods.find(m => m.code === paymentMethodCode)
  
  // Calculate fees
  let feeAmount = 0
  if (selectedMethod && selectedMethod.fee_type !== 'NONE') {
    if (selectedMethod.fee_type === 'FIXED') {
      feeAmount = Number(selectedMethod.fee_amount)
    } else if (selectedMethod.fee_type === 'PERCENTAGE') {
      feeAmount = amount * (Number(selectedMethod.fee_percentage) / 100)
    }
  }
  
  const totalAmount = amount + feeAmount

  const handleStripePayment = async () => {
    if (!selectedMethod || selectedMethod.code !== 'CREDIT_CARD') return
    
    try {
      setLoading(true)
      
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: invoice?.currency.toLowerCase() || 'usd',
          description: `Pago de factura ${invoice?.invoice_number || 'N/A'}`,
          customer_email: customerEmail,
          customer_name: invoice?.guest ? `${invoice.guest.first_name} ${invoice.guest.last_name}` : '',
          invoice_id: invoiceId,
          metadata: {
            payment_method: 'CREDIT_CARD'
          }
        })
      })

      const { client_secret } = await response.json()

      if (client_secret) {
        const stripe = await stripePromise
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: client_secret
          })
          
          if (error) {
            toast.error('Error procesando el pago')
          }
        }
      }
    } catch (error) {
      console.error('Error with Stripe payment:', error)
      toast.error('Error procesando el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || amount <= 0) {
      toast.error('El monto debe ser mayor a cero')
      return
    }
    
    if (!paymentMethodCode) {
      toast.error('Debe seleccionar un método de pago')
      return
    }
    
    // Validate amount limits
    if (selectedMethod?.min_amount && amount < selectedMethod.min_amount) {
      toast.error(`El monto mínimo es ${selectedMethod.min_amount}`)
      return
    }
    
    if (selectedMethod?.max_amount && amount > selectedMethod.max_amount) {
      toast.error(`El monto máximo es ${selectedMethod.max_amount}`)
      return
    }
    
    setLoading(true)
    
    try {
      const paymentData = {
        invoice_id: invoiceId,
        amount: totalAmount, // Include fees
        currency: invoice?.currency || 'USD',
        payment_method: selectedMethod?.type,
        reference_number: referenceNumber,
        notes,
        card_last_four: cardLastFour || undefined,
        card_brand: cardBrand || undefined,
        authorization_code: authorizationCode || undefined,
        bank_name: bankName || undefined,
        account_number: accountNumber || undefined
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Pago registrado exitosamente')
        router.push(`/billing/invoices/${invoiceId}`)
      } else {
        toast.error(result.error || 'Error registrando el pago')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading && !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando información del pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={invoiceId ? `/billing/invoices/${invoiceId}` : '/billing'}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procesar Pago</h1>
          <p className="text-muted-foreground">
            {invoice ? `Factura ${invoice.invoice_number}` : 'Nuevo pago'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información del Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualPayment} className="space-y-6">
                {/* Amount */}
                <div>
                  <Label>Monto a Pagar *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="pl-10"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label>Método de Pago *</Label>
                  <Select value={paymentMethodCode} onValueChange={setPaymentMethodCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.code}>
                          <div className="flex items-center justify-between w-full">
                            <span>{method.name}</span>
                            {method.fee_percentage > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                +{method.fee_percentage}%
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMethod && selectedMethod.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedMethod.description}
                    </p>
                  )}
                </div>

                {/* Reference Number */}
                <div>
                  <Label>Número de Referencia</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Número de confirmación, cheque, etc."
                  />
                </div>

                {/* Customer Email */}
                <div>
                  <Label>Email del Cliente</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                  />
                </div>

                {/* Payment Method Specific Fields */}
                {selectedMethod?.type === 'CREDIT_CARD' && (
                  <div className="space-y-4">
                    <Alert>
                      <CreditCard className="h-4 w-4" />
                      <AlertDescription>
                        Para pagos con tarjeta, use el procesador automático de Stripe para mayor seguridad.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Últimos 4 dígitos</Label>
                        <Input
                          value={cardLastFour}
                          onChange={(e) => setCardLastFour(e.target.value)}
                          placeholder="1234"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <Label>Marca de tarjeta</Label>
                        <Select value={cardBrand} onValueChange={setCardBrand}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visa">Visa</SelectItem>
                            <SelectItem value="mastercard">Mastercard</SelectItem>
                            <SelectItem value="amex">American Express</SelectItem>
                            <SelectItem value="discover">Discover</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Código de Autorización</Label>
                      <Input
                        value={authorizationCode}
                        onChange={(e) => setAuthorizationCode(e.target.value)}
                        placeholder="Código de autorización"
                      />
                    </div>
                  </div>
                )}

                {selectedMethod?.type === 'BANK_TRANSFER' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Banco</Label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Nombre del banco"
                      />
                    </div>
                    <div>
                      <Label>Últimos 4 dígitos de cuenta</Label>
                      <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="1234"
                        maxLength={4}
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales sobre el pago"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {selectedMethod?.code === 'CREDIT_CARD' ? (
                    <Button
                      type="button"
                      onClick={handleStripePayment}
                      className="flex-1"
                      disabled={loading || amount <= 0}
                    >
                      {loading ? 'Procesando...' : 'Pagar con Tarjeta'}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={loading || amount <= 0 || !paymentMethodCode}
                    >
                      {loading ? 'Registrando...' : 'Registrar Pago'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          {invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Resumen de Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Número:</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">
                    {invoice.guest ? 
                      `${invoice.guest.first_name} ${invoice.guest.last_name}` : 
                      'Cliente directo'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Total factura:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </span>
                </div>
                
                {invoice.payments && invoice.payments.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Pagado:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(
                          invoice.payments
                            .filter(p => p.status === 'COMPLETED')
                            .reduce((sum, p) => sum + Number(p.amount), 0),
                          invoice.currency
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-bold text-orange-600">
                      <span>Pendiente:</span>
                      <span>
                        {formatCurrency(
                          Number(invoice.total_amount) - invoice.payments
                            .filter(p => p.status === 'COMPLETED')
                            .reduce((sum, p) => sum + Number(p.amount), 0),
                          invoice.currency
                        )}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Monto base:</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              
              {feeAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Comisión ({selectedMethod?.fee_percentage}%):</span>
                  <span>{formatCurrency(feeAmount)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL A PAGAR:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              
              {selectedMethod && (
                <div className="mt-4">
                  <Badge variant="outline" className="w-full justify-center">
                    {selectedMethod.name}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Alerts */}
          {selectedMethod?.min_amount && amount < selectedMethod.min_amount && (
            <Alert>
              <AlertDescription>
                El monto mínimo para este método es {formatCurrency(selectedMethod.min_amount)}
              </AlertDescription>
            </Alert>
          )}
          
          {selectedMethod?.max_amount && amount > selectedMethod.max_amount && (
            <Alert>
              <AlertDescription>
                El monto máximo para este método es {formatCurrency(selectedMethod.max_amount)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
