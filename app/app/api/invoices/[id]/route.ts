

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener factura por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        guest: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            document_number: true,
            document_type: true,
            address: true,
            city: true,
            country: true
          }
        },
        reservation: {
          select: {
            id: true,
            reservation_number: true,
            check_in_date: true,
            check_out_date: true,
            nights: true,
            room: {
              select: {
                room_number: true,
                room_type: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        invoice_items: {
          include: {
            service: {
              select: {
                name: true,
                category: true
              }
            },
            room: {
              select: {
                room_number: true
              }
            }
          },
          orderBy: {
            line_number: 'asc'
          }
        },
        payments: {
          orderBy: {
            payment_date: 'desc'
          }
        },
        hotel: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
            tax_id: true,
            logo_url: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invoice })

  } catch (error) {
    console.error('Error obteniendo factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar factura
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      status,
      payment_status,
      notes,
      internal_notes,
      due_date
    } = body

    // Verificar que la factura existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // No permitir cambios en facturas pagadas o canceladas
    if (existingInvoice.status === 'PAID' || existingInvoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'No se puede modificar una factura pagada o cancelada' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status,
        payment_status,
        notes,
        internal_notes,
        due_date: due_date ? new Date(due_date) : undefined,
        updated_by: session.user?.id,
        updated_at: new Date()
      },
      include: {
        guest: true,
        reservation: true,
        invoice_items: true,
        payments: true
      }
    })

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Factura actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error actualizando factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar factura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que la factura existe y se puede cancelar
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        payments: true
      }
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // No permitir cancelar facturas con pagos
    if (existingInvoice.payments.length > 0) {
      return NextResponse.json(
        { error: 'No se puede cancelar una factura con pagos registrados' },
        { status: 400 }
      )
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        payment_status: 'CANCELLED',
        updated_by: session.user?.id,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Factura cancelada exitosamente'
    })

  } catch (error) {
    console.error('Error cancelando factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
