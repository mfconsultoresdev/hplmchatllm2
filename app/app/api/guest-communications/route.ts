
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guest_id = searchParams.get('guest_id')
    const reservation_id = searchParams.get('reservation_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Get the hotel (assuming single hotel setup)
    const hotel = await prisma.hotel.findFirst()
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      hotel_id: hotel.id,
      OR: [
        { guest_id: { not: null } }, // Messages from guests
        { guest_recipients: { some: {} } } // Messages to guests
      ]
    }
    
    if (guest_id) {
      where.OR = [
        { guest_id: guest_id },
        { guest_recipients: { some: { guest_id: guest_id } } }
      ]
    }
    
    if (reservation_id) {
      where.reservation_id = reservation_id
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }

    const [messages, total] = await Promise.all([
      prisma.communicationMessage.findMany({
        where,
        include: {
          guest: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          reservation: {
            select: {
              id: true,
              reservation_number: true,
              room: {
                select: {
                  room_number: true
                }
              }
            }
          },
          sender_staff: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              department: true,
              position: true
            }
          },
          guest_recipients: {
            include: {
              guest: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          _count: {
            select: {
              guest_recipients: true,
              replies: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.communicationMessage.count({ where })
    ])

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching guest communications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest communications' },
      { status: 500 }
    )
  }
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
      subject,
      message,
      priority = 'NORMAL',
      category = 'GUEST_SERVICE',
      sender_name,
      sender_type = 'STAFF',
      sender_id,
      guest_id,
      reservation_id,
      template_id,
      template_variables = {},
      delivery_method = 'PORTAL',
      scheduled_send,
      contact_method = 'PORTAL',
      contact_value
    } = body

    let finalSubject = subject
    let finalMessage = message

    // Si se usa una plantilla, obtenerla y procesar variables
    if (template_id) {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: template_id }
      })
      
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      
      finalSubject = replaceTemplateVariables(template.subject, template_variables)
      finalMessage = replaceTemplateVariables(template.content, template_variables)
    }

    // Validate required fields
    if (!finalSubject || !finalMessage || !sender_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the message
    const communicationMessage = await prisma.communicationMessage.create({
      data: {
        hotel_id: hotel.id,
        subject: finalSubject,
        message: finalMessage,
        priority,
        category,
        sender_name,
        sender_type,
        sender_id,
        guest_id,
        reservation_id,
        template_id,
        template_variables: template_variables || undefined,
        delivery_method,
        scheduled_send: scheduled_send ? new Date(scheduled_send) : null,
        sent_at: scheduled_send ? null : new Date(),
        status: scheduled_send ? 'DRAFT' : 'SENT',
        created_by: 'system' // TODO: Get from auth context
      }
    })

    // Si no es el huésped enviando el mensaje, crear el recipient
    if (!guest_id && guest_id !== sender_id) {
      // Determinar el huésped destinatario
      let targetGuestId = guest_id
      
      if (!targetGuestId && reservation_id) {
        const reservation = await prisma.reservation.findUnique({
          where: { id: reservation_id },
          select: { guest_id: true }
        })
        targetGuestId = reservation?.guest_id
      }

      if (targetGuestId) {
        await prisma.guestCommunicationRecipient.create({
          data: {
            hotel_id: hotel.id,
            message_id: communicationMessage.id,
            guest_id: targetGuestId,
            reservation_id,
            contact_method,
            contact_value,
            status: 'PENDING'
          }
        })
      }
    }

    // Fetch the created message with relations
    const messageWithRelations = await prisma.communicationMessage.findUnique({
      where: { id: communicationMessage.id },
      include: {
        guest: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        reservation: {
          select: {
            id: true,
            reservation_number: true,
            room: {
              select: {
                room_number: true
              }
            }
          }
        },
        guest_recipients: {
          include: {
            guest: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            }
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    })

    return NextResponse.json(messageWithRelations, { status: 201 })

  } catch (error: any) {
    console.error('Error creating guest communication:', error)
    return NextResponse.json(
      { error: 'Failed to create guest communication' },
      { status: 500 }
    )
  }
}
