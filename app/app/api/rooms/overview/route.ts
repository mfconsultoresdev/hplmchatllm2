
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

    // Get room stats by floor
    const floorStatsRaw = await prisma.room.groupBy({
      by: ['floor_id', 'status'],
      where: {
        hotel_id: hotelId
      },
      _count: true,
      orderBy: {
        floor_id: 'asc'
      }
    });

    // Get floor information
    const floors = await prisma.floor.findMany({
      where: { hotel_id: hotelId },
      orderBy: { floor_number: 'asc' }
    });

    // Process floor stats
    const floorStats = floors.map(floor => {
      const floorRooms = floorStatsRaw.filter(stat => stat.floor_id === floor.id);
      
      return {
        floor_number: floor.floor_number,
        total: floorRooms.reduce((sum, stat) => sum + stat._count, 0),
        available: floorRooms.find(stat => stat.status === 'AVAILABLE')?._count || 0,
        occupied: floorRooms.find(stat => stat.status === 'OCCUPIED')?._count || 0,
        cleaning: floorRooms.find(stat => stat.status === 'CLEANING')?._count || 0,
        maintenance: floorRooms.find(stat => stat.status === 'MAINTENANCE')?._count || 0
      };
    });

    // Get room stats by type
    const roomTypeStatsRaw = await prisma.room.groupBy({
      by: ['room_type_id', 'status'],
      where: {
        hotel_id: hotelId
      },
      _count: true
    });

    // Get room types
    const roomTypes = await prisma.roomType.findMany();

    // Process room type stats
    const roomTypeStats = roomTypes.map(type => {
      const typeRooms = roomTypeStatsRaw.filter(stat => stat.room_type_id === type.id);
      const total = typeRooms.reduce((sum, stat) => sum + stat._count, 0);
      const occupied = typeRooms.find(stat => stat.status === 'OCCUPIED')?._count || 0;
      const available = typeRooms.find(stat => stat.status === 'AVAILABLE')?._count || 0;
      
      return {
        room_type: type.name,
        total,
        available,
        occupied
      };
    }).filter(stat => stat.total > 0); // Only include types that have rooms

    return NextResponse.json({
      floorStats,
      roomTypeStats
    });
  } catch (error) {
    console.error("Rooms overview API error:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de habitaciones" },
      { status: 500 }
    );
  }
}
