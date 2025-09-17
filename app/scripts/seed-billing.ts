

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBillingData() {
  try {
    console.log('🏨 Seeding billing data...')

    // Get the first hotel (should exist from previous seed)
    const hotel = await prisma.hotel.findFirst()
    
    if (!hotel) {
      console.error('No hotel found. Please run the main seed script first.')
      return
    }

    // Create payment methods
    console.log('💳 Creating payment methods...')
    
    const paymentMethods = [
      {
        name: 'Efectivo USD',
        type: 'CASH',
        code: 'CASH_USD',
        is_active: true,
        display_order: 1,
        description: 'Pago en efectivo en dólares estadounidenses'
      },
      {
        name: 'Efectivo VES',
        type: 'CASH',
        code: 'CASH_VES',
        is_active: true,
        display_order: 2,
        description: 'Pago en efectivo en bolívares venezuelanos'
      },
      {
        name: 'Tarjeta de Crédito',
        type: 'CREDIT_CARD',
        code: 'CREDIT_CARD',
        is_active: true,
        fee_type: 'PERCENTAGE',
        fee_percentage: 3.5,
        gateway_name: 'stripe',
        display_order: 3,
        description: 'Visa, Mastercard, American Express'
      },
      {
        name: 'Tarjeta de Débito',
        type: 'DEBIT_CARD',
        code: 'DEBIT_CARD',
        is_active: true,
        fee_type: 'PERCENTAGE',
        fee_percentage: 2.0,
        display_order: 4,
        description: 'Tarjeta de débito bancaria'
      },
      {
        name: 'Transferencia Bancaria',
        type: 'BANK_TRANSFER',
        code: 'BANK_TRANSFER',
        is_active: true,
        display_order: 5,
        description: 'Transferencia bancaria directa'
      },
      {
        name: 'Zelle',
        type: 'DIGITAL_WALLET',
        code: 'ZELLE',
        is_active: true,
        min_amount: 1,
        max_amount: 2500,
        display_order: 6,
        description: 'Pago vía Zelle (USD)'
      },
      {
        name: 'PayPal',
        type: 'DIGITAL_WALLET',
        code: 'PAYPAL',
        is_active: true,
        fee_type: 'PERCENTAGE',
        fee_percentage: 4.4,
        gateway_name: 'paypal',
        display_order: 7,
        description: 'Pago vía PayPal'
      },
      {
        name: 'Pago Móvil',
        type: 'DIGITAL_WALLET',
        code: 'MOBILE_PAYMENT',
        is_active: true,
        display_order: 8,
        description: 'Pago móvil bancario (VES)'
      }
    ]

    for (const method of paymentMethods) {
      await prisma.paymentMethod.upsert({
        where: { 
          hotel_id_code: {
            hotel_id: hotel.id,
            code: method.code
          }
        },
        update: method,
        create: {
          ...method,
          hotel_id: hotel.id,
          created_by: 'system'
        }
      })
    }

    // Create tax configuration
    console.log('📊 Creating tax configuration...')
    
    const taxConfigs = [
      {
        name: 'IVA General',
        type: 'IVA',
        rate: 16.00,
        is_active: true,
        is_inclusive: false,
        tax_authority: 'SENIAT',
        legal_reference: 'Ley del IVA - Artículo 1',
        applies_to: { 
          services: true, 
          rooms: true, 
          products: true 
        }
      },
      {
        name: 'Impuesto Municipal',
        type: 'MUNICIPAL',
        rate: 1.5,
        is_active: false, // Disabled by default, enable as needed
        is_inclusive: false,
        tax_authority: 'Municipio Libertador',
        legal_reference: 'Ordenanza Municipal de Tributos',
        applies_to: { 
          services: true, 
          rooms: true 
        }
      },
      {
        name: 'Impuesto al Turismo',
        type: 'TOURISM',
        rate: 3.0,
        is_active: false, // Disabled by default
        is_inclusive: false,
        tax_authority: 'Instituto Nacional de Turismo',
        legal_reference: 'Ley de Turismo',
        applies_to: { 
          rooms: true 
        }
      }
    ]

    for (const taxConfig of taxConfigs) {
      const existing = await prisma.taxConfig.findFirst({
        where: {
          hotel_id: hotel.id,
          name: taxConfig.name
        }
      })
      
      if (!existing) {
        await prisma.taxConfig.create({
          data: {
            ...taxConfig,
            hotel_id: hotel.id,
            created_by: 'system'
          }
        })
      }
    }

    // Create current fiscal period
    console.log('📅 Creating fiscal periods...')
    
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    const fiscalPeriods = []
    
    // Create monthly periods for current year
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1)
      const endDate = new Date(currentYear, month + 1, 0) // Last day of month
      
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      
      fiscalPeriods.push({
        name: `${monthNames[month]} ${currentYear}`,
        period_type: 'MONTHLY',
        start_date: startDate,
        end_date: endDate,
        is_closed: month < currentMonth // Close previous months
      })
    }

    for (const period of fiscalPeriods) {
      const existing = await prisma.fiscalPeriod.findFirst({
        where: {
          hotel_id: hotel.id,
          start_date: period.start_date,
          end_date: period.end_date
        }
      })
      
      if (!existing) {
        await prisma.fiscalPeriod.create({
          data: {
            ...period,
            hotel_id: hotel.id,
            created_by: 'system'
          }
        })
      }
    }

    console.log('✅ Billing data seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding billing data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedBillingData()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
