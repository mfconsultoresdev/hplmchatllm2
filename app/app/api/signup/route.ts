
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roleId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, roleId } = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    // Get hotel and default role
    const hotel = await prisma.hotel.findFirst();
    const defaultRole = await prisma.role.findUnique({
      where: { name: "Recepcionista" },
    });

    if (!hotel || !defaultRole) {
      return NextResponse.json(
        { error: "Error de configuración del sistema" },
        { status: 500 }
      );
    }

    const role = roleId
      ? await prisma.role.findUnique({ where: { id: roleId } })
      : defaultRole;

    if (!role) {
      return NextResponse.json(
        { error: "Rol no encontrado" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        hotel_id: hotel.id,
        role_id: role.id,
        employee_id: `EMP${Date.now()}`,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: { select: { name: true } },
        hotel: { select: { name: true } },
      },
    });

    return NextResponse.json({
      user,
      message: "Usuario creado exitosamente",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
