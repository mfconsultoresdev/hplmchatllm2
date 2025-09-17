
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAdvancedPayments() {
  console.log('🏦 Seeding advanced payment data...')
  
  try {
    // Get existing hotel
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      throw new Error('No hotel found')
    }

    // Create exchange rates
    const exchangeRates = [
      {
        hotel_id: hotel.id,
        from_currency: 'USD',
        to_currency: 'VES',
        rate: 36.50,
        effective_date: new Date(),
        source: 'BCV',
        is_active: true,
        created_by: 'system'
      },
      {
        hotel_id: hotel.id,
        from_currency: 'EUR',
        to_currency: 'USD',
        rate: 1.08,
        effective_date: new Date(),
        source: 'ECB',
        is_active: true,
        created_by: 'system'
      },
      {
        hotel_id: hotel.id,
        from_currency: 'EUR',
        to_currency: 'VES',
        rate: 39.42,
        effective_date: new Date(),
        source: 'Calculated',
        is_active: true,
        created_by: 'system'
      }
    ]

    console.log('Creating exchange rates...')
    for (const rate of exchangeRates) {
      await prisma.exchangeRate.create({
        data: rate
      })
    }

    // Create fiscal documents
    const fiscalDocs = [
      {
        hotel_id: hotel.id,
        document_type: 'CREDIT_NOTE',
        document_number: 'CN-2024-001',
        reference_invoice: 'PMS-2024-000001',
        issue_date: new Date(),
        description: 'Nota de crédito por cancelación de servicio',
        amount: -50.00,
        currency: 'USD',
        iva_amount: -8.00,
        municipal_tax: 0,
        legal_reference: 'Art. 73 Ley IVA',
        authorized_by: 'Gerencia General',
        created_by: 'system'
      },
      {
        hotel_id: hotel.id,
        document_type: 'DEBIT_NOTE',
        document_number: 'DN-2024-001',
        reference_invoice: 'PMS-2024-000002',
        issue_date: new Date(),
        description: 'Nota de débito por servicios adicionales',
        amount: 25.00,
        currency: 'USD',
        iva_amount: 4.00,
        municipal_tax: 0,
        legal_reference: 'Servicios adicionales',
        authorized_by: 'Gerencia General',
        created_by: 'system'
      }
    ]

    console.log('Creating fiscal documents...')
    for (const doc of fiscalDocs) {
      await prisma.fiscalDocument.create({
        data: doc
      })
    }

    // Get some existing invoices to create collection actions
    const invoices = await prisma.invoice.findMany({
      where: {
        payment_status: {
          in: ['UNPAID', 'PARTIAL']
        }
      },
      take: 5
    })

    if (invoices.length > 0) {
      console.log('Creating collection actions...')
      
      // Create collection actions for some invoices
      const collectionActions = [
        {
          hotel_id: hotel.id,
          invoice_id: invoices[0].id,
          action_type: 'REMINDER',
          action_date: new Date(),
          notes: 'Primer recordatorio de pago enviado por email',
          reminder_type: 'EMAIL',
          next_follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          outstanding_amount: invoices[0].total_amount,
          status: 'COMPLETED',
          created_by: 'system'
        },
        {
          hotel_id: hotel.id,
          invoice_id: invoices[1]?.id || invoices[0].id,
          action_type: 'COLLECTION_CALL',
          action_date: new Date(),
          notes: 'Llamada telefónica realizada, cliente promete pagar en 3 días',
          next_follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          outstanding_amount: invoices[1]?.total_amount || invoices[0].total_amount,
          status: 'COMPLETED',
          created_by: 'system'
        }
      ]

      for (const action of collectionActions) {
        if (action.invoice_id) {
          await prisma.collectionAction.create({
            data: action
          })
        }
      }

      // Create a payment plan for one invoice
      if (invoices[2]) {
        console.log('Creating payment plan...')
        
        const paymentPlan = await prisma.paymentPlan.create({
          data: {
            hotel_id: hotel.id,
            invoice_id: invoices[2].id,
            total_amount: invoices[2].total_amount,
            status: 'ACTIVE',
            created_by: 'system'
          }
        })

        // Create installments for the payment plan
        const installmentAmount = Number(invoices[2].total_amount) / 3
        const installments = [
          {
            payment_plan_id: paymentPlan.id,
            installment_number: 1,
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
            amount: installmentAmount,
            status: 'PENDING'
          },
          {
            payment_plan_id: paymentPlan.id,
            installment_number: 2,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            amount: installmentAmount,
            status: 'PENDING'
          },
          {
            payment_plan_id: paymentPlan.id,
            installment_number: 3,
            due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
            amount: installmentAmount,
            status: 'PENDING'
          }
        ]

        for (const installment of installments) {
          await prisma.paymentPlanInstallment.create({
            data: installment
          })
        }

        // Create a collection action for the payment plan
        await prisma.collectionAction.create({
          data: {
            hotel_id: hotel.id,
            invoice_id: invoices[2].id,
            action_type: 'PAYMENT_PLAN',
            action_date: new Date(),
            notes: 'Plan de pago acordado con el cliente: 3 cuotas de $' + installmentAmount.toFixed(2),
            outstanding_amount: invoices[2].total_amount,
            status: 'COMPLETED',
            created_by: 'system'
          }
        })
      }
    }

    // Update some existing guests with Stripe customer IDs (simulated)
    const guests = await prisma.guest.findMany({ take: 3 })
    
    console.log('Updating guests with Stripe customer IDs...')
    for (let i = 0; i < guests.length; i++) {
      await prisma.guest.update({
        where: { id: guests[i].id },
        data: {
          stripe_customer_id: `cus_simulated_${i + 1}_${Date.now()}`
        }
      })
    }

    console.log('✅ Advanced payment data seeded successfully')

  } catch (error) {
    console.error('❌ Error seeding advanced payment data:', error)
    throw error
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedAdvancedPayments()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export default seedAdvancedPayments
