

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

// Initialize Stripe with conditional key check
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !endpointSecret) {
      return NextResponse.json(
        { error: 'Sistema de pagos no configurado' },
        { status: 503 }
      )
    }

    const body = await request.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Manejar el evento
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(failedPayment)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' }, 
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata
    const amount = paymentIntent.amount / 100 // Convertir de centavos

    // Generar número de pago
    const lastPayment = await prisma.payment.findFirst({
      orderBy: { payment_number: 'desc' }
    })
    
    let nextNumber = 1
    if (lastPayment && lastPayment.payment_number) {
      const lastNumber = parseInt(lastPayment.payment_number.split('-').pop() || '0')
      nextNumber = lastNumber + 1
    }
    
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`

    // Registrar el pago en la base de datos
    const payment = await prisma.payment.create({
      data: {
        payment_number: paymentNumber,
        hotel_id: metadata.hotel_id!,
        invoice_id: metadata.invoice_id || null,
        reservation_id: metadata.reservation_id || null,
        guest_id: metadata.guest_id || null,
        amount,
        currency: paymentIntent.currency.toUpperCase(),
        payment_method: 'CREDIT_CARD',
        payment_gateway: 'stripe',
        gateway_transaction_id: paymentIntent.id,
        // Note: Charge details would be available in charges.data but accessing specific payment method details requires additional API calls
        card_brand: 'unknown', // Would need to fetch from payment method or charges
        card_last_four: 'unknown', // Would need to fetch from payment method or charges
        authorization_code: paymentIntent.id, // Using payment intent ID as reference
        status: 'COMPLETED',
        notes: `Pago procesado por Stripe - ${paymentIntent.description || ''}`,
        created_by: metadata.user_id!,
        processed_by: metadata.user_id!
      }
    })

    // Si es pago de factura, actualizar el estado de la factura
    if (metadata.invoice_id) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: metadata.invoice_id },
        include: {
          payments: {
            where: { status: 'COMPLETED' }
          }
        }
      })

      if (invoice) {
        const totalPaid = invoice.payments
          .reduce((sum, p) => sum + Number(p.amount), 0) + amount
        
        const totalAmount = Number(invoice.total_amount)
        
        let paymentStatus = 'PARTIAL'
        let invoiceStatus = invoice.status
        
        if (totalPaid >= totalAmount) {
          paymentStatus = 'PAID'
          invoiceStatus = 'PAID'
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL'
        }

        await prisma.invoice.update({
          where: { id: metadata.invoice_id },
          data: {
            payment_status: paymentStatus,
            status: invoiceStatus
          }
        })
      }
    }

    // Si es pago de reservación, actualizar el estado
    if (metadata.reservation_id && !metadata.invoice_id) {
      await prisma.reservation.update({
        where: { id: metadata.reservation_id },
        data: {
          payment_status: 'PAID'
        }
      })
    }

    console.log('Payment processed successfully:', payment.id)

  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Log the failed payment for monitoring
    console.error('Payment failed:', {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      last_payment_error: paymentIntent.last_payment_error
    })

    // TODO: Implement notification system for failed payments
    // Could send email to hotel staff, create alert, etc.

  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}
