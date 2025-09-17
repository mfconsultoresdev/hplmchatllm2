
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/transactions - Get all transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          guest: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          },
          reservation: {
            select: {
              reservation_number: true
            }
          },
          room: {
            select: {
              room_number: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      description,
      amount,
      currency = 'USD',
      reservation_id,
      room_id,
      guest_id,
      service_id,
      payment_method,
      reference_number,
      status = 'COMPLETED',
      notes,
      created_by
    } = body;

    // Validate required fields
    if (!type || !description || !amount || !created_by) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get hotel_id (assuming single hotel for now)
    const hotel = await prisma.hotel.findFirst();
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'No hotel found' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        hotel_id: hotel.id,
        type,
        description,
        amount,
        currency,
        reservation_id: reservation_id || undefined,
        room_id: room_id || undefined,
        guest_id: guest_id || undefined,
        service_id: service_id || undefined,
        payment_method: payment_method || undefined,
        reference_number: reference_number || undefined,
        status,
        notes: notes || undefined,
        created_by,
        updated_by: created_by
      },
      include: {
        guest: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        },
        reservation: {
          select: {
            reservation_number: true
          }
        },
        room: {
          select: {
            room_number: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Error creating transaction' },
      { status: 500 }
    );
  }
}
