
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      hotelId: string;
      hotelName: string;
      firstName: string | null;
      lastName: string | null;
      employeeId: string | null;
      position: string | null;
      department: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    hotelId: string;
    hotelName: string;
    firstName: string | null;
    lastName: string | null;
    employeeId: string | null;
    position: string | null;
    department: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    hotelId: string;
    hotelName: string;
    firstName: string | null;
    lastName: string | null;
    employeeId: string | null;
    position: string | null;
    department: string | null;
  }
}

export interface Room {
  id: string;
  room_number: string;
  status: string;
  floor_number: number;
  room_type_name: string;
  guest_name?: string;
  check_out_date?: string;
}

export interface DashboardMetrics {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  todayArrivals: number;
  todayDepartures: number;
  pendingCheckIns: number;
  totalRevenue: number;
  todayRevenue: number;
}
