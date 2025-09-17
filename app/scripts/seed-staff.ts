
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedStaffManagement() {
  console.log('🧑‍💼 Seeding Staff Management System...')
  
  // Get the hotel
  const hotel = await prisma.hotel.findFirst()
  if (!hotel) throw new Error('Hotel not found')

  // Get admin role
  const adminRole = await prisma.role.findFirst({
    where: { 
      name: { 
        in: ['admin', 'Admin'] 
      } 
    }
  })
  if (!adminRole) throw new Error('Admin role not found')

  // Create staff management roles if they don't exist
  const staffRoles = [
    {
      name: 'manager',
      description: 'Department Manager',
      permissions: JSON.stringify([
        'staff:read', 'staff:create', 'staff:update',
        'schedule:read', 'schedule:create', 'schedule:update',
        'attendance:read', 'attendance:update',
        'evaluation:read', 'evaluation:create', 'evaluation:update',
        'communication:read', 'communication:create'
      ])
    },
    {
      name: 'supervisor',
      description: 'Department Supervisor',
      permissions: JSON.stringify([
        'staff:read',
        'schedule:read', 'schedule:update',
        'attendance:read', 'attendance:update',
        'communication:read', 'communication:create'
      ])
    },
    {
      name: 'hr_manager',
      description: 'Human Resources Manager',
      permissions: JSON.stringify([
        'staff:read', 'staff:create', 'staff:update', 'staff:delete',
        'schedule:read', 'schedule:create', 'schedule:update', 'schedule:delete',
        'attendance:read', 'attendance:create', 'attendance:update',
        'evaluation:read', 'evaluation:create', 'evaluation:update', 'evaluation:delete',
        'communication:read', 'communication:create', 'communication:update'
      ])
    }
  ]

  // Create roles
  for (const roleData of staffRoles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData
    })
  }

  // Get HR Manager role
  const hrRole = await prisma.role.findUnique({
    where: { name: 'hr_manager' }
  })

  // Create HR Manager user if doesn't exist
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@paseolasmercedes.com' },
    update: {},
    create: {
      email: 'hr@paseolasmercedes.com',
      first_name: 'Recursos',
      last_name: 'Humanos',
      name: 'Recursos Humanos',
      password: hashedPassword,
      employee_id: 'HR001',
      phone: '+58-414-1234567',
      position: 'HR Manager',
      department: 'ADMINISTRATION',
      hotel_id: hotel.id,
      role_id: hrRole?.id || adminRole.id,
      is_active: true,
      created_by: 'system'
    }
  })

  // Create sample staff members
  const sampleStaff = [
    {
      employee_number: 'FD001',
      first_name: 'María',
      last_name: 'González',
      email: 'maria.gonzalez@paseolasmercedes.com',
      phone: '+58-414-2345678',
      department: 'FRONT_DESK',
      position: 'Recepcionista Senior',
      employment_type: 'FULL_TIME',
      shift_type: 'DAY',
      salary_type: 'MONTHLY',
      base_salary: 800.00,
      hire_date: new Date('2023-01-15'),
      is_active: true,
      can_login: true,
      access_level: 'MANAGER'
    },
    {
      employee_number: 'FD002',
      first_name: 'Carlos',
      last_name: 'Rodríguez',
      email: 'carlos.rodriguez@paseolasmercedes.com',
      phone: '+58-424-3456789',
      department: 'FRONT_DESK',
      position: 'Recepcionista',
      employment_type: 'FULL_TIME',
      shift_type: 'NIGHT',
      salary_type: 'MONTHLY',
      base_salary: 650.00,
      hire_date: new Date('2023-03-01'),
      is_active: true,
      can_login: true,
      access_level: 'BASIC'
    },
    {
      employee_number: 'HK001',
      first_name: 'Ana',
      last_name: 'Martínez',
      email: 'ana.martinez@paseolasmercedes.com',
      phone: '+58-414-4567890',
      department: 'HOUSEKEEPING',
      position: 'Supervisora de Limpieza',
      employment_type: 'FULL_TIME',
      shift_type: 'DAY',
      salary_type: 'MONTHLY',
      base_salary: 700.00,
      hire_date: new Date('2022-11-01'),
      is_active: true,
      can_login: true,
      access_level: 'MANAGER'
    },
    {
      employee_number: 'HK002',
      first_name: 'José',
      last_name: 'Pérez',
      email: null,
      phone: '+58-424-5678901',
      department: 'HOUSEKEEPING',
      position: 'Camarero',
      employment_type: 'FULL_TIME',
      shift_type: 'DAY',
      salary_type: 'HOURLY',
      base_salary: 8.50,
      hire_date: new Date('2023-05-15'),
      is_active: true,
      can_login: false,
      access_level: 'BASIC'
    },
    {
      employee_number: 'MT001',
      first_name: 'Roberto',
      last_name: 'Silva',
      email: 'roberto.silva@paseolasmercedes.com',
      phone: '+58-414-6789012',
      department: 'MAINTENANCE',
      position: 'Técnico de Mantenimiento',
      employment_type: 'FULL_TIME',
      shift_type: 'DAY',
      salary_type: 'MONTHLY',
      base_salary: 750.00,
      hire_date: new Date('2022-08-01'),
      is_active: true,
      can_login: true,
      access_level: 'BASIC'
    },
    {
      employee_number: 'SC001',
      first_name: 'Luis',
      last_name: 'Morales',
      email: null,
      phone: '+58-424-7890123',
      department: 'SECURITY',
      position: 'Vigilante',
      employment_type: 'PART_TIME',
      shift_type: 'NIGHT',
      salary_type: 'HOURLY',
      base_salary: 7.00,
      hire_date: new Date('2023-06-01'),
      is_active: true,
      can_login: false,
      access_level: 'BASIC'
    }
  ]

  // Create staff records
  for (const staffData of sampleStaff) {
    await prisma.staff.upsert({
      where: { employee_number: staffData.employee_number },
      update: {},
      create: {
        ...staffData,
        hotel_id: hotel.id,
        created_by: hrUser.id
      }
    })
  }

  // Create sample schedules for next 7 days
  const today = new Date()
  const staff = await prisma.staff.findMany({
    where: { hotel_id: hotel.id }
  })

  for (let i = 0; i < 7; i++) {
    const scheduleDate = new Date(today)
    scheduleDate.setDate(today.getDate() + i)
    
    for (const staffMember of staff) {
      // Skip part-time security on some days
      if (staffMember.employment_type === 'PART_TIME' && i % 2 === 0) continue
      
      const shift_start = new Date(scheduleDate)
      const shift_end = new Date(scheduleDate)
      
      if (staffMember.shift_type === 'DAY') {
        shift_start.setHours(8, 0, 0, 0)
        shift_end.setHours(16, 0, 0, 0)
      } else if (staffMember.shift_type === 'NIGHT') {
        shift_start.setHours(22, 0, 0, 0)
        shift_end.setHours(6, 0, 0, 0)
        shift_end.setDate(shift_end.getDate() + 1) // Next day
      }

      await prisma.staffSchedule.upsert({
        where: {
          hotel_id_staff_id_schedule_date: {
            hotel_id: hotel.id,
            staff_id: staffMember.id,
            schedule_date: scheduleDate
          }
        },
        update: {},
        create: {
          hotel_id: hotel.id,
          staff_id: staffMember.id,
          schedule_date: scheduleDate,
          shift_start,
          shift_end,
          scheduled_hours: staffMember.shift_type === 'DAY' ? 8.0 : 8.0,
          break_minutes: 60,
          schedule_type: 'REGULAR',
          status: 'SCHEDULED',
          created_by: hrUser.id
        }
      })
    }
  }

  // Create sample attendance for the past 3 days
  for (let i = 1; i <= 3; i++) {
    const attendanceDate = new Date(today)
    attendanceDate.setDate(today.getDate() - i)
    
    for (const staffMember of staff) {
      if (staffMember.employment_type === 'PART_TIME' && i % 2 === 0) continue
      
      const clock_in = new Date(attendanceDate)
      const clock_out = new Date(attendanceDate)
      
      if (staffMember.shift_type === 'DAY') {
        clock_in.setHours(8 + Math.floor(Math.random() * 30 / 60), Math.floor(Math.random() * 30), 0, 0)
        clock_out.setHours(16 + Math.floor(Math.random() * 30 / 60), Math.floor(Math.random() * 30), 0, 0)
      } else {
        clock_in.setHours(22 + Math.floor(Math.random() * 30 / 60), Math.floor(Math.random() * 30), 0, 0)
        clock_out.setHours(6 + Math.floor(Math.random() * 30 / 60), Math.floor(Math.random() * 30), 0, 0)
        clock_out.setDate(clock_out.getDate() + 1)
      }

      const actualHours = (clock_out.getTime() - clock_in.getTime()) / (1000 * 60 * 60) - 1 // Minus 1 hour break
      
      await prisma.staffAttendance.upsert({
        where: {
          hotel_id_staff_id_attendance_date: {
            hotel_id: hotel.id,
            staff_id: staffMember.id,
            attendance_date: attendanceDate
          }
        },
        update: {},
        create: {
          hotel_id: hotel.id,
          staff_id: staffMember.id,
          attendance_date: attendanceDate,
          clock_in,
          clock_out,
          scheduled_hours: 8.0,
          actual_hours: Math.round(actualHours * 100) / 100,
          break_minutes: 60,
          status: Math.random() > 0.1 ? 'PRESENT' : 'LATE',
          productivity_rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
          created_by: hrUser.id
        }
      })
    }
  }

  // Create sample communication messages
  await prisma.communicationMessage.create({
    data: {
      hotel_id: hotel.id,
      subject: 'Bienvenida al Nuevo Sistema de Personal',
      message: 'Estimados compañeros, nos complace anunciar el lanzamiento de nuestro nuevo sistema de gestión de personal. Este sistema nos permitirá una mejor organización de horarios, seguimiento de asistencia y comunicación interna.',
      priority: 'HIGH',
      category: 'ANNOUNCEMENT',
      sender_name: 'Recursos Humanos',
      sender_type: 'MANAGEMENT',
      send_to_all: true,
      delivery_method: 'INTERNAL',
      status: 'SENT',
      sent_at: new Date(),
      created_by: hrUser.id
    }
  })

  await prisma.communicationMessage.create({
    data: {
      hotel_id: hotel.id,
      subject: 'Recordatorio: Política de Puntualidad',
      message: 'Recordamos a todo el personal la importancia de la puntualidad. Los retrasos constantes pueden afectar la operación del hotel y la experiencia de nuestros huéspedes.',
      priority: 'NORMAL',
      category: 'POLICY',
      sender_name: 'Gerencia General',
      sender_type: 'MANAGEMENT',
      department: 'ALL',
      delivery_method: 'INTERNAL',
      status: 'SENT',
      sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      created_by: hrUser.id
    }
  })

  console.log('✅ Staff Management System seeded successfully')
  console.log(`📊 Created ${staff.length} staff members`)
  console.log(`📅 Created ${7 * staff.length} schedule entries`)
  console.log(`⏰ Created ${3 * staff.length} attendance records`)
  console.log('💬 Created 2 communication messages')
}

export { seedStaffManagement }

if (require.main === module) {
  seedStaffManagement()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
