
import NextAuth from 'next-auth'
import { JsonValue } from '@prisma/client/runtime/library'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      hotelId: string
      hotelName: string
      firstName: string | null
      lastName: string | null
      employeeId: string | null
      position: string | null
      department: string | null
      role: string
      permissions: JsonValue
    }
  }

  interface User {
    id: string
    email: string
    name: string | null
    hotelId: string
    hotelName: string
    firstName: string | null
    lastName: string | null
    employeeId: string | null
    position: string | null
    department: string | null
    role: string
    permissions: JsonValue
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    hotelId: string
    hotelName: string
    firstName: string | null
    lastName: string | null
    employeeId: string | null
    position: string | null
    department: string | null
    role: string
    permissions: JsonValue
  }
}
