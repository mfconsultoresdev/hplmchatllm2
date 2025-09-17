
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Process check-out
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { reservationId, charges, notes, roomCondition, keyCardsReturned } = await request.json()

    if (!reservationId) {
      return NextResponse.json(
        { error: 'ID de reservación requerido' },
        { status: 400 }
      )
    }

    // Find the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { 
        guest: true,
        room: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservación no encontrada' },
        { status: 404 }
      )
    }

    // Check if already checked out
    if (reservation.status === 'CHECKED_OUT') {
      return NextResponse.json(
        { error: 'El huésped ya hizo check-out' },
        { status: 400 }
      )
    }

    // Calculate final charges
    const totalCharges = charges || Number(reservation.total_amount)

    // Update reservation status
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CHECKED_OUT',
        actual_check_out: new Date(),
        total_amount: totalCharges,
        notes: notes || reservation.notes
      }
    })

    // Update room status based on condition
    let roomStatus = 'OUT_OF_ORDER'
    if (roomCondition === 'clean') {
      roomStatus = 'AVAILABLE'
    } else if (roomCondition === 'needs_cleaning') {
      roomStatus = 'OUT_OF_ORDER'
    } else if (roomCondition === 'maintenance_required') {
      roomStatus = 'MAINTENANCE'
    }

    await prisma.room.update({
      where: { id: reservation.room_id },
      data: { status: roomStatus }
    })

    // Create check-out record
    const checkOutRecord = await prisma.checkOut.create({
      data: {
        hotel_id: reservation.hotel_id,
        reservation_id: reservationId,
        guest_id: reservation.guest_id,
        room_id: reservation.room_id,
        check_out_time: new Date(),
        total_charges: totalCharges,
        key_cards_returned: keyCardsReturned || true,
        room_condition: roomCondition || 'needs_cleaning',
        notes: notes || '',
        checked_out_by: session.user?.email || 'system'
      }
    })

    // Generate invoice automatically if charges exist
    let invoice = null
    if (totalCharges > 0) {
      // Generate invoice number
      const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { invoice_number: 'desc' }
      })
      
      let nextNumber = 1
      if (lastInvoice && lastInvoice.invoice_number) {
        const lastNumber = parseInt(lastInvoice.invoice_number.split('-').pop() || '0')
        nextNumber = lastNumber + 1
      }
      
      const invoiceNumber = `PMS-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`

      // Calculate room charges and taxes
      const subtotal = totalCharges
      const ivaRate = 16.00 // Venezuelan IVA rate
      const ivaAmount = subtotal * (ivaRate / 100)
      const totalWithTax = subtotal + ivaAmount

      // Create invoice items array
      const invoiceItems: any[] = [
        {
          line_number: 1,
          description: `Alojamiento - Hab. ${reservation.room.room_number} - ${reservation.nights} noche(s)`,
          quantity: reservation.nights,
          unit_price: Number(reservation.room_rate),
          line_total: Number(reservation.room_rate) * reservation.nights,
          is_taxable: true,
          tax_rate: ivaRate,
          tax_amount: (Number(reservation.room_rate) * reservation.nights) * (ivaRate / 100),
          item_type: 'ROOM',
          room_id: reservation.room_id
        }
      ]

      // Add service charges if any
      const serviceRequests = await prisma.serviceRequest.findMany({
        where: {
          reservation_id: reservationId,
          status: 'COMPLETED'
        },
        include: {
          service: true
        }
      })

      let lineNumber = 2
      serviceRequests.forEach(serviceRequest => {
        if (serviceRequest.total_amount && serviceRequest.service) {
          const serviceAmount = Number(serviceRequest.total_amount)
          invoiceItems.push({
            line_number: lineNumber++,
            description: `${serviceRequest.service.name} - ${serviceRequest.quantity}x`,
            quantity: serviceRequest.quantity,
            unit_price: serviceAmount / serviceRequest.quantity,
            line_total: serviceAmount,
            is_taxable: true,
            tax_rate: ivaRate,
            tax_amount: serviceAmount * (ivaRate / 100),
            item_type: 'SERVICE',
            service_id: serviceRequest.service_id
          })
        }
      })

      // Recalculate totals including services
      const finalSubtotal = invoiceItems.reduce((sum, item) => sum + item.line_total, 0)
      const finalIvaAmount = finalSubtotal * (ivaRate / 100)
      const finalTotal = finalSubtotal + finalIvaAmount

      // Create the invoice
      invoice = await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          hotel_id: reservation.hotel_id,
          client_type: 'GUEST',
          guest_id: reservation.guest_id,
          reservation_id: reservationId,
          client_document: reservation.guest.document_number,
          client_address: reservation.guest.address,
          client_phone: reservation.guest.phone,
          client_email: reservation.guest.email,
          currency: reservation.currency || 'USD',
          subtotal: finalSubtotal,
          tax_amount: finalIvaAmount,
          total_amount: finalTotal,
          iva_rate: ivaRate,
          iva_amount: finalIvaAmount,
          status: 'PENDING',
          payment_status: 'UNPAID',
          payment_terms: 'IMMEDIATE',
          notes: `Factura generada automáticamente en check-out - ${notes || ''}`,
          created_by: session.user?.id || '',
          invoice_items: {
            create: invoiceItems
          }
        },
        include: {
          invoice_items: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      checkOut: checkOutRecord,
      invoice: invoice,
      totalCharges: totalCharges,
      message: 'Check-out procesado exitosamente' + (invoice ? ' - Factura generada' : '')
    })

  } catch (error) {
    console.error('Error en check-out:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Get pending check-outs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const pendingCheckOuts = await prisma.reservation.findMany({
      where: {
        check_out_date: {
          gte: today,
          lt: tomorrow
        },
        status: 'CHECKED_IN'
      },
      include: {
        guest: true,
        room: true
      },
      orderBy: {
        check_out_date: 'asc'
      }
    })

    return NextResponse.json({ checkOuts: pendingCheckOuts })

  } catch (error) {
    console.error('Error obteniendo check-outs pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
