
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            hotel: true,
            role: true
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.first_name} ${user.last_name}`,
          hotelId: user.hotel_id,
          hotelName: user.hotel.name,
          firstName: user.first_name,
          lastName: user.last_name,
          employeeId: user.employee_id,
          position: user.position,
          department: user.department,
          role: user.role.name,
          permissions: user.role.permissions
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.hotelId = (user as any).hotelId
        token.hotelName = (user as any).hotelName
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
        token.employeeId = (user as any).employeeId
        token.position = (user as any).position
        token.department = (user as any).department
        token.role = (user as any).role
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.hotelId = token.hotelId as string
        session.user.hotelName = token.hotelName as string
        session.user.firstName = token.firstName as string | null
        session.user.lastName = token.lastName as string | null
        session.user.employeeId = token.employeeId as string | null
        session.user.position = token.position as string | null
        session.user.department = token.department as string | null
        session.user.role = token.role as string
        if ('permissions' in token) {
          (session.user as any).permissions = token.permissions
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login'
  }
}
