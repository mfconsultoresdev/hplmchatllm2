
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧽 Iniciando seed del módulo de housekeeping...')

  // Get the hotel and admin user
  const hotel = await prisma.hotel.findFirst()
  if (!hotel) {
    throw new Error('No hotel found. Please run the main seed first.')
  }

  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@hotelpaseolm.com' }
  })

  if (!adminUser) {
    throw new Error('No admin user found. Please run the main seed first.')
  }

  // 1. Create housekeeping staff users and profiles
  const housekeepingRole = await prisma.role.findFirst({
    where: { name: 'Recepcionista' }
  })

  if (!housekeepingRole) {
    throw new Error('Recepcionista role not found')
  }

  const housekeepingStaff = [
    {
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@hotelpaseolm.com',
      employeeCode: 'HK001',
      skillLevel: 'SENIOR',
      shiftStart: '06:00',
      shiftEnd: '14:00'
    },
    {
      firstName: 'Carmen',
      lastName: 'Rodríguez',
      email: 'carmen.rodriguez@hotelpaseolm.com',
      employeeCode: 'HK002',
      skillLevel: 'JUNIOR',
      shiftStart: '06:00',
      shiftEnd: '14:00'
    },
    {
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@hotelpaseolm.com',
      employeeCode: 'HK003',
      skillLevel: 'SENIOR',
      shiftStart: '14:00',
      shiftEnd: '22:00'
    },
    {
      firstName: 'Luis',
      lastName: 'García',
      email: 'luis.garcia@hotelpaseolm.com',
      employeeCode: 'HK004',
      skillLevel: 'JUNIOR',
      shiftStart: '14:00',
      shiftEnd: '22:00'
    },
    {
      firstName: 'Rosa',
      lastName: 'López',
      email: 'rosa.lopez@hotelpaseolm.com',
      employeeCode: 'HK005',
      skillLevel: 'SUPERVISOR',
      shiftStart: '08:00',
      shiftEnd: '16:00'
    }
  ]

  const createdStaff = []

  for (const staff of housekeepingStaff) {
    // Create user
    const user = await prisma.user.create({
      data: {
        first_name: staff.firstName,
        last_name: staff.lastName,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        password: await bcrypt.hash('hk123456', 12),
        employee_id: staff.employeeCode,
        position: 'Housekeeping Staff',
        department: 'Housekeeping',
        hotel_id: hotel.id,
        role_id: housekeepingRole.id,
        created_by: adminUser.id
      }
    })

    // Create housekeeping staff profile
    const housekeepingProfile = await prisma.housekeepingStaff.create({
      data: {
        hotel_id: hotel.id,
        user_id: user.id,
        employee_code: staff.employeeCode,
        shift_start: staff.shiftStart,
        shift_end: staff.shiftEnd,
        days_of_week: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        skill_level: staff.skillLevel as any,
        certifications: ['Basic Housekeeping', 'Hotel Safety'],
        languages: ['Spanish', 'English'],
        created_by: adminUser.id
      }
    })

    createdStaff.push(housekeepingProfile)
  }

  console.log(`✅ ${createdStaff.length} miembros del personal de housekeeping creados`)

  // 2. Create housekeeping supplies
  const supplies = [
    {
      name: 'Detergente multiusos',
      category: 'CLEANING',
      unitType: 'LITER',
      currentStock: 50,
      minimumStock: 10,
      unitCost: 5.50,
      supplierName: 'Productos de Limpieza SA'
    },
    {
      name: 'Desinfectante',
      category: 'CLEANING',
      unitType: 'LITER',
      currentStock: 30,
      minimumStock: 8,
      unitCost: 7.25,
      supplierName: 'Productos de Limpieza SA'
    },
    {
      name: 'Sábanas blancas individuales',
      category: 'LINENS',
      unitType: 'PIECE',
      currentStock: 200,
      minimumStock: 50,
      unitCost: 12.00,
      supplierName: 'Textiles Hoteleros CA'
    },
    {
      name: 'Sábanas blancas matrimoniales',
      category: 'LINENS',
      unitType: 'PIECE',
      currentStock: 150,
      minimumStock: 30,
      unitCost: 18.00,
      supplierName: 'Textiles Hoteleros CA'
    },
    {
      name: 'Toallas de baño',
      category: 'LINENS',
      unitType: 'PIECE',
      currentStock: 300,
      minimumStock: 60,
      unitCost: 8.50,
      supplierName: 'Textiles Hoteleros CA'
    },
    {
      name: 'Toallas de mano',
      category: 'LINENS',
      unitType: 'PIECE',
      currentStock: 250,
      minimumStock: 50,
      unitCost: 5.25,
      supplierName: 'Textiles Hoteleros CA'
    },
    {
      name: 'Jabón de tocador',
      category: 'AMENITIES',
      unitType: 'PIECE',
      currentStock: 500,
      minimumStock: 100,
      unitCost: 1.50,
      supplierName: 'Amenidades Premium'
    },
    {
      name: 'Champú',
      category: 'AMENITIES',
      unitType: 'BOTTLE',
      currentStock: 200,
      minimumStock: 40,
      unitCost: 3.25,
      supplierName: 'Amenidades Premium'
    },
    {
      name: 'Papel higiénico',
      category: 'AMENITIES',
      unitType: 'PIECE',
      currentStock: 800,
      minimumStock: 150,
      unitCost: 2.00,
      supplierName: 'Suministros Hoteleros'
    },
    {
      name: 'Aspiradora industrial',
      category: 'MAINTENANCE',
      unitType: 'PIECE',
      currentStock: 3,
      minimumStock: 1,
      unitCost: 450.00,
      supplierName: 'Equipos de Limpieza Pro'
    }
  ]

  const createdSupplies = []

  for (const supply of supplies) {
    const createdSupply = await prisma.housekeepingSupply.create({
      data: {
        hotel_id: hotel.id,
        name: supply.name,
        category: supply.category as any,
        unit_type: supply.unitType as any,
        current_stock: supply.currentStock,
        minimum_stock: supply.minimumStock,
        unit_cost: supply.unitCost,
        supplier_name: supply.supplierName,
        created_by: adminUser.id
      }
    })

    // Create initial inventory movement
    await prisma.housekeepingInventoryMovement.create({
      data: {
        hotel_id: hotel.id,
        supply_id: createdSupply.id,
        movement_type: 'IN',
        quantity: supply.currentStock,
        previous_stock: 0,
        new_stock: supply.currentStock,
        unit_cost: supply.unitCost,
        total_value: supply.currentStock * supply.unitCost,
        reference_type: 'INITIAL_STOCK',
        reference_number: 'SEED-001',
        reason: 'Initial stock creation',
        created_by: adminUser.id
      }
    })

    createdSupplies.push(createdSupply)
  }

  console.log(`✅ ${createdSupplies.length} suministros de housekeeping creados`)

  // 3. Create some sample housekeeping tasks
  const rooms = await prisma.room.findMany({
    take: 10,
    include: { room_type: true }
  })

  const tasks = []

  for (let i = 0; i < 5; i++) {
    const room = rooms[i]
    const staff = createdStaff[i % createdStaff.length]

    const task = await prisma.housekeepingTask.create({
      data: {
        hotel_id: hotel.id,
        room_id: room.id,
        task_type: 'CHECKOUT_CLEANING',
        priority: i < 2 ? 'HIGH' : 'NORMAL',
        status: i < 2 ? 'COMPLETED' : 'PENDING',
        assigned_to: staff.user_id,
        assigned_date: new Date(),
        started_date: i < 2 ? new Date(Date.now() - 3600000) : null, // 1 hour ago
        completed_date: i < 2 ? new Date() : null,
        description: `Limpieza post checkout - Habitación ${room.room_number}`,
        estimated_duration: 45,
        actual_duration: i < 2 ? 42 : null,
        created_by: adminUser.id
      }
    })

    // Create task items
    const taskItems = [
      'Limpiar baño completo',
      'Cambiar ropa de cama',
      'Aspirar alfombras',
      'Limpiar muebles',
      'Reabastecer amenidades',
      'Revisar minibar',
      'Inspección final'
    ]

    for (const [index, itemName] of taskItems.entries()) {
      await prisma.housekeepingTaskItem.create({
        data: {
          task_id: task.id,
          item_name: itemName,
          is_required: true,
          is_completed: i < 2, // First 2 tasks are completed
          completed_by: i < 2 ? staff.user_id : null,
          completed_date: i < 2 ? new Date() : null
        }
      })
    }

    tasks.push(task)
  }

  console.log(`✅ ${tasks.length} tareas de housekeeping de ejemplo creadas`)

  // 4. Create some attendance records
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const staff of createdStaff) {
    await prisma.housekeepingAttendance.create({
      data: {
        hotel_id: hotel.id,
        staff_id: staff.id,
        date: today,
        clock_in: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6:00 AM
        clock_out: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
        scheduled_hours: 8.0,
        actual_hours: 8.0,
        status: 'PRESENT',
        rating: 4,
        created_by: adminUser.id
      }
    })
  }

  console.log(`✅ Registros de asistencia creados para ${createdStaff.length} empleados`)

  // 5. Create some room inspections
  for (let i = 0; i < 3; i++) {
    const room = rooms[i]
    const task = tasks[i]

    await prisma.roomInspection.create({
      data: {
        hotel_id: hotel.id,
        room_id: room.id,
        task_id: task.id,
        inspection_date: new Date(),
        inspection_type: 'CHECKOUT',
        inspector_id: createdStaff[4].user_id, // Supervisor
        overall_status: 'PASSED',
        overall_score: 90 + i * 2,
        bathroom_score: 9,
        bedroom_score: 9,
        furniture_score: 8,
        amenities_score: 9,
        cleanliness_score: 10,
        issues_found: [],
        notes: `Habitación ${room.room_number} en excelente estado`,
        created_by: adminUser.id
      }
    })
  }

  console.log('✅ 3 inspecciones de habitación de ejemplo creadas')

  console.log('\n🎉 Seed del módulo de housekeeping completado exitosamente!')

  console.log('\n📊 Datos del módulo de housekeeping creados:')
  console.log(`   - ${createdStaff.length} Empleados de housekeeping`)
  console.log(`   - ${createdSupplies.length} Suministros`)
  console.log(`   - ${tasks.length} Tareas de limpieza`)
  console.log(`   - ${createdStaff.length} Registros de asistencia`)
  console.log('   - 3 Inspecciones de habitación')
  
  console.log('\n👥 Usuarios de housekeeping creados:')
  for (const staff of housekeepingStaff) {
    console.log(`   - ${staff.firstName} ${staff.lastName}: ${staff.email} / hk123456`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed de housekeeping:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

