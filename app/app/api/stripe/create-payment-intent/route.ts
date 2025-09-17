

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

// Initialize Stripe with conditional key check
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null

// POST - Crear PaymentIntent de Stripe
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Sistema de pagos no configurado' },
        { status: 503 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      amount, // en centavos
      currency = 'usd',
      description,
      customer_email,
      customer_name,
      invoice_id,
      reservation_id,
      metadata = {}
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      )
    }

    // Crear PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100), // Convertir a centavos
      currency: currency.toLowerCase(),
      description,
      receipt_email: customer_email,
      metadata: {
        hotel_id: session.user?.hotelId || '',
        user_id: session.user?.id || '',
        invoice_id: invoice_id || '',
        reservation_id: reservation_id || '',
        customer_name: customer_name || '',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      }
    })

    return NextResponse.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    })

  } catch (error) {
    console.error('Error creando PaymentIntent:', error)
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    )
  }
}
