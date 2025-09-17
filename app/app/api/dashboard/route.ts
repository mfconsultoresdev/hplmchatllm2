
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const hotelId = session.user.hotelId;
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Parallel queries for better performance
    const [
      totalRooms,
      occupiedRooms,
      todayArrivals,
      todayDepartures,
      pendingCheckIns,
      recentTransactions
    ] = await Promise.all([
      // Total rooms
      prisma.room.count({
        where: { hotel_id: hotelId }
      }),

      // Occupied rooms
      prisma.room.count({
        where: { 
          hotel_id: hotelId,
          status: "OCCUPIED"
        }
      }),

      // Today arrivals
      prisma.reservation.count({
        where: {
          hotel_id: hotelId,
          check_in_date: {
            gte: todayStart,
            lte: todayEnd
          },
          status: "CONFIRMED"
        }
      }),

      // Today departures
      prisma.reservation.count({
        where: {
          hotel_id: hotelId,
          check_out_date: {
            gte: todayStart,
            lte: todayEnd
          },
          status: "CHECKED_IN"
        }
      }),

      // Pending check-ins
      prisma.reservation.count({
        where: {
          hotel_id: hotelId,
          status: "CONFIRMED",
          check_in_date: {
            lte: todayEnd
          }
        }
      }),

      // Recent transactions
      prisma.transaction.findMany({
        where: {
          hotel_id: hotelId,
          created_at: {
            gte: todayStart
          }
        },
        take: 10,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          guest: true,
          room: true,
          service: true
        }
      })
    ]);

    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Calculate revenue
    const todayRevenue = recentTransactions
      .filter(t => t.type !== 'REFUND')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const metrics = {
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      todayArrivals,
      todayDepartures,
      pendingCheckIns,
      todayRevenue,
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: Number(t.amount),
        currency: t.currency,
        created_at: t.created_at.toISOString(),
        guest_name: t.guest ? `${t.guest.first_name} ${t.guest.last_name}` : null,
        room_number: t.room?.room_number || null,
        service_name: t.service?.name || null
      }))
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
