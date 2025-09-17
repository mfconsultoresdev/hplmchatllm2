
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Initialize Stripe with conditional key check
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null

// POST - Crear setup intent para guardar métodos de pago
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no configurado' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { 
      action, // CREATE_SETUP_INTENT, CREATE_CUSTOMER, PROCESS_SUBSCRIPTION, REFUND_PAYMENT
      customer_id,
      guest_id,
      invoice_id,
      payment_intent_id,
      amount,
      currency = 'usd',
      refund_reason
    } = body

    switch (action) {
      case 'CREATE_SETUP_INTENT':
        // Crear Setup Intent para guardar métodos de pago
        const setupIntent = await stripe.setupIntents.create({
          customer: customer_id,
          payment_method_types: ['card'],
          usage: 'off_session'
        })

        return NextResponse.json({
          success: true,
          setup_intent: setupIntent,
          client_secret: setupIntent.client_secret
        })

      case 'CREATE_CUSTOMER':
        // Crear customer en Stripe
        if (!guest_id) {
          return NextResponse.json(
            { error: 'ID de huésped requerido para crear customer' },
            { status: 400 }
          )
        }

        const guest = await prisma.guest.findUnique({
          where: { id: guest_id }
        })

        if (!guest) {
          return NextResponse.json(
            { error: 'Huésped no encontrado' },
            { status: 404 }
          )
        }

        const customer = await stripe.customers.create({
          name: `${guest.first_name} ${guest.last_name}`,
          email: guest.email || undefined,
          phone: guest.phone || undefined,
          metadata: {
            guest_id: guest.id,
            hotel_id: guest.hotel_id
          }
        })

        // Guardar customer ID en la base de datos
        await prisma.guest.update({
          where: { id: guest_id },
          data: {
            stripe_customer_id: customer.id
          }
        })

        return NextResponse.json({
          success: true,
          customer
        })

      case 'PROCESS_SUBSCRIPTION':
        // Para servicios recurrentes (estadías largas, servicios mensuales)
        if (!customer_id || !amount) {
          return NextResponse.json(
            { error: 'Customer ID y monto requeridos' },
            { status: 400 }
          )
        }

        // Crear producto y precio para la suscripción
        const product = await stripe.products.create({
          name: 'Servicios Hoteleros Recurrentes',
          description: 'Servicios del hotel con facturación recurrente'
        })

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(Number(amount) * 100), // Convertir a centavos
          currency,
          recurring: {
            interval: 'month'
          }
        })

        const subscription = await stripe.subscriptions.create({
          customer: customer_id,
          items: [{ price: price.id }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent']
        })

        const latestInvoice = subscription.latest_invoice as any
        return NextResponse.json({
          success: true,
          subscription,
          client_secret: latestInvoice?.payment_intent?.client_secret
        })

      case 'REFUND_PAYMENT':
        // Procesar reembolso
        if (!payment_intent_id) {
          return NextResponse.json(
            { error: 'Payment Intent ID requerido para reembolso' },
            { status: 400 }
          )
        }

        const refund = await stripe.refunds.create({
          payment_intent: payment_intent_id,
          amount: amount ? Math.round(Number(amount) * 100) : undefined, // Reembolso parcial o total
          reason: 'requested_by_customer',
          metadata: {
            refund_reason: refund_reason || 'Solicitud de reembolso',
            processed_by: session.user?.id || ''
          }
        })

        // Registrar el reembolso en la base de datos
        if (invoice_id) {
          await prisma.payment.create({
            data: {
              payment_number: `REFUND-${Date.now()}`,
              hotel_id: session.user?.hotelId || '',
              invoice_id,
              amount: -Number(amount || 0), // Monto negativo para reembolso
              currency: currency.toUpperCase(),
              payment_method: 'STRIPE_REFUND',
              payment_gateway: 'stripe',
              gateway_transaction_id: refund.id,
              payment_date: new Date(),
              status: 'COMPLETED',
              notes: `Reembolso: ${refund_reason || 'Sin razón especificada'}`,
              created_by: session.user?.id || '',
              processed_by: session.user?.id || ''
            }
          })
        }

        return NextResponse.json({
          success: true,
          refund,
          message: 'Reembolso procesado exitosamente'
        })

      case 'GET_PAYMENT_METHODS':
        // Obtener métodos de pago guardados de un customer
        if (!customer_id) {
          return NextResponse.json(
            { error: 'Customer ID requerido' },
            { status: 400 }
          )
        }

        const paymentMethods = await stripe.paymentMethods.list({
          customer: customer_id,
          type: 'card'
        })

        return NextResponse.json({
          success: true,
          payment_methods: paymentMethods.data
        })

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error en operación Stripe avanzada:', error)
    return NextResponse.json(
      { error: 'Error procesando operación con Stripe' },
      { status: 500 }
    )
  }
}

// GET - Obtener información de Stripe
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no configurado' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const customer_id = searchParams.get('customer_id')
    const payment_intent_id = searchParams.get('payment_intent_id')

    switch (action) {
      case 'account_info':
        const account = await stripe.accounts.retrieve()
        return NextResponse.json({
          success: true,
          account: {
            id: account.id,
            country: account.country,
            currency: account.default_currency,
            charges_enabled: account.charges_enabled,
            details_submitted: account.details_submitted
          }
        })

      case 'payment_intent_details':
        if (!payment_intent_id) {
          return NextResponse.json(
            { error: 'Payment Intent ID requerido' },
            { status: 400 }
          )
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
        return NextResponse.json({
          success: true,
          payment_intent: paymentIntent
        })

      case 'customer_details':
        if (!customer_id) {
          return NextResponse.json(
            { error: 'Customer ID requerido' },
            { status: 400 }
          )
        }

        const customer = await stripe.customers.retrieve(customer_id)
        return NextResponse.json({
          success: true,
          customer
        })

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error obteniendo información de Stripe:', error)
    return NextResponse.json(
      { error: 'Error obteniendo información de Stripe' },
      { status: 500 }
    )
  }
}
