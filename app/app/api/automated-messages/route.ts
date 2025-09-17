
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Función auxiliar para reemplazar variables en plantillas
function replaceTemplateVariables(content: string, variables: any): string {
  let result = content
  
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    })
  }
  
  return result
}

// Función para crear variables automáticamente desde datos de contexto
function createTemplateVariables(triggerEvent: string, data: any) {
  const variables: any = {}

  switch (triggerEvent) {
    case 'CHECK_IN':
      if (data.guest) {
        variables.guest_name = `${data.guest.first_name} ${data.guest.last_name}`
      }
      if (data.room) {
        variables.room_number = data.room.room_number
      }
      if (data.reservation) {
        variables.check_in_date = data.reservation.check_in_date?.toLocaleDateString('es-ES')
        variables.check_out_date = data.reservation.check_out_date?.toLocaleDateString('es-ES')
        variables.guest_count = data.reservation.adults + data.reservation.children
      }
      break

    case 'CHECKOUT':
      if (data.guest) {
        variables.guest_name = `${data.guest.first_name} ${data.guest.last_name}`
      }
      if (data.reservation) {
        variables.check_out_date = data.reservation.check_out_date?.toLocaleDateString('es-ES')
      }
      break

    case 'SERVICE_REQUEST':
      if (data.guest) {
        variables.guest_name = `${data.guest.first_name} ${data.guest.last_name}`
      }
      if (data.room) {
        variables.room_number = data.room.room_number
      }
      if (data.service) {
        variables.service_type = data.service.name
      }
      variables.request_date = new Date().toLocaleDateString('es-ES')
      break

    case 'RESERVATION_CREATED':
      if (data.guest) {
        variables.guest_name = `${data.guest.first_name} ${data.guest.last_name}`
      }
      if (data.room) {
        variables.room_number = data.room.room_number
      }
      if (data.reservation) {
        variables.check_in_date = data.reservation.check_in_date?.toLocaleDateString('es-ES')
        variables.check_out_date = data.reservation.check_out_date?.toLocaleDateString('es-ES')
        variables.guest_count = data.reservation.adults + data.reservation.children
        variables.total_amount = `$${data.reservation.total_amount}`
      }
      break
  }

  return variables
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    const {
      trigger_event,
      context_data = {},
      reservation_id,
      guest_id,
      room_id
    } = body

    // Validate required fields
    if (!trigger_event) {
      return NextResponse.json(
        { error: 'trigger_event is required' },
        { status: 400 }
      )
    }

    // Find active automatic templates for this trigger event
    const templates = await prisma.messageTemplate.findMany({
      where: {
        hotel_id: hotel.id,
        is_active: true,
        is_automatic: true,
        trigger_event
      }
    })

    if (templates.length === 0) {
      return NextResponse.json({
        message: 'No automatic templates found for this trigger event',
        triggered_messages: []
      })
    }

    const triggeredMessages = []

    // Get context data if not provided
    let enrichedContextData = { ...context_data }

    if (reservation_id && !enrichedContextData.reservation) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservation_id },
        include: {
          guest: true,
          room: true
        }
      })
      if (reservation) {
        enrichedContextData.reservation = reservation
        enrichedContextData.guest = reservation.guest
        enrichedContextData.room = reservation.room
      }
    }

    if (guest_id && !enrichedContextData.guest) {
      const guest = await prisma.guest.findUnique({
        where: { id: guest_id }
      })
      if (guest) {
        enrichedContextData.guest = guest
      }
    }

    // Process each template
    for (const template of templates) {
      try {
        // Create variables from context data
        const templateVariables = createTemplateVariables(trigger_event, enrichedContextData)

        // Replace template variables in subject and content
        const finalSubject = replaceTemplateVariables(template.subject, templateVariables)
        const finalMessage = replaceTemplateVariables(template.content, templateVariables)

        // Determine recipients based on template type
        let sender_name = 'Sistema de Hotel'
        let sender_type = 'SYSTEM'

        // Calculate send time based on delay
        const sendTime = new Date()
        if (template.send_delay_hours !== 0) {
          sendTime.setHours(sendTime.getHours() + template.send_delay_hours)
        }

        // Create the message
        const communicationMessage = await prisma.communicationMessage.create({
          data: {
            hotel_id: hotel.id,
            subject: finalSubject,
            message: finalMessage,
            priority: 'NORMAL',
            category: template.category,
            sender_name,
            sender_type,
            guest_id: template.type === 'GUEST' ? (guest_id || enrichedContextData.guest?.id) : undefined,
            reservation_id,
            template_id: template.id,
            template_variables: templateVariables || undefined,
            delivery_method: template.type === 'GUEST' ? 'PORTAL' : 'INTERNAL',
            scheduled_send: template.send_delay_hours !== 0 ? sendTime : null,
            sent_at: template.send_delay_hours === 0 ? new Date() : null,
            status: template.send_delay_hours === 0 ? 'SENT' : 'DRAFT',
            created_by: 'system'
          }
        })

        // Create recipients based on template type
        if (template.type === 'GUEST') {
          const targetGuestId = guest_id || enrichedContextData.guest?.id
          if (targetGuestId) {
            await prisma.guestCommunicationRecipient.create({
              data: {
                hotel_id: hotel.id,
                message_id: communicationMessage.id,
                guest_id: targetGuestId,
                reservation_id,
                contact_method: 'PORTAL',
                status: 'PENDING'
              }
            })
          }
        } else if (template.type === 'STAFF') {
          // Send to relevant staff (e.g., front desk, housekeeping)
          const staffMembers = await prisma.staff.findMany({
            where: {
              hotel_id: hotel.id,
              is_active: true,
              // You can add specific department filtering here based on trigger_event
            },
            select: { id: true }
          })

          if (staffMembers.length > 0) {
            const recipientData = staffMembers.map(staff => ({
              hotel_id: hotel.id,
              message_id: communicationMessage.id,
              staff_id: staff.id,
              status: 'PENDING'
            }))

            await prisma.communicationRecipient.createMany({
              data: recipientData
            })
          }
        }

        // Add to triggered messages
        triggeredMessages.push({
          id: communicationMessage.id,
          template_name: template.name,
          subject: finalSubject,
          scheduled_for: template.send_delay_hours === 0 ? 'immediate' : sendTime.toISOString(),
          recipients_type: template.type,
          status: communicationMessage.status
        })

      } catch (error) {
        console.error(`Error processing template ${template.id}:`, error)
        // Continue with other templates
      }
    }

    return NextResponse.json({
      message: `Triggered ${triggeredMessages.length} automated messages`,
      trigger_event,
      triggered_messages: triggeredMessages
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error triggering automated messages:', error)
    return NextResponse.json(
      { error: 'Failed to trigger automated messages' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trigger_event = searchParams.get('trigger_event')

    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Build where clause for automatic templates
    const where: any = {
      hotel_id: hotel.id,
      is_active: true,
      is_automatic: true
    }
    
    if (trigger_event) {
      where.trigger_event = trigger_event
    }

    const templates = await prisma.messageTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        trigger_event: true,
        send_delay_hours: true,
        subject: true,
        is_active: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: [
        { trigger_event: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      automatic_templates: templates,
      total: templates.length
    })

  } catch (error) {
    console.error('Error fetching automatic templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automatic templates' },
      { status: 500 }
    )
  }
}
