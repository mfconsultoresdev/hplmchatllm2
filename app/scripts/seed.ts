
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // 1. Crear Hotel
  let hotel = await prisma.hotel.findFirst({
    where: { name: 'Hotel Paseo Las Mercedes' }
  })
  
  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        name: 'Hotel Paseo Las Mercedes',
        address: 'Av. Principal Paseo Las Mercedes, Caracas, Venezuela',
        phone: '+58-212-555-0100',
        email: 'info@hotelpaseolm.com',
        description: 'Hotel de lujo en el corazón de Las Mercedes',
        tax_id: 'J-12345678-9',
        default_currency: 'USD'
      }
    })
  }

  console.log('✅ Hotel creado:', hotel.name)

  // 2. Crear Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrador del sistema',
      permissions: {
        rooms: ['read', 'write', 'delete'],
        reservations: ['read', 'write', 'delete'],
        guests: ['read', 'write', 'delete'],
        billing: ['read', 'write', 'delete'],
        reports: ['read', 'write'],
        settings: ['read', 'write']
      }
    }
  })

  const receptionistRole = await prisma.role.upsert({
    where: { name: 'Recepcionista' },
    update: {},
    create: {
      name: 'Recepcionista',
      description: 'Personal de recepción',
      permissions: {
        rooms: ['read', 'write'],
        reservations: ['read', 'write'],
        guests: ['read', 'write'],
        billing: ['read', 'write'],
        reports: ['read']
      }
    }
  })

  console.log('✅ Roles creados')

  // 3. Crear Usuario Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hotelpaseolm.com' },
    update: {},
    create: {
      email: 'admin@hotelpaseolm.com',
      name: 'Administrador Sistema',
      first_name: 'Admin',
      last_name: 'Sistema',
      password: await bcrypt.hash('admin123', 10),
      employee_id: 'EMP001',
      phone: '+58-414-555-0001',
      position: 'Administrador General',
      department: 'Administración',
      hotel_id: hotel.id,
      role_id: adminRole.id,
      is_active: true
    }
  })

  console.log('✅ Usuario admin creado: admin@hotelpaseolm.com / admin123')

  // 4. Crear Pisos
  const floors = []
  for (let i = 1; i <= 9; i++) {
    const floor = await prisma.floor.upsert({
      where: {
        hotel_id_floor_number: {
          hotel_id: hotel.id,
          floor_number: i
        }
      },
      update: {},
      create: {
        hotel_id: hotel.id,
        floor_number: i,
        name: `Piso ${i}`,
        description: `Piso ${i} del hotel`,
        is_active: true
      }
    })
    floors.push(floor)
  }

  console.log('✅ Pisos creados: 1-9')

  // 5. Crear Tipos de Habitación
  let individualType = await prisma.roomType.findFirst({
    where: { name: 'Individual' }
  })
  
  if (!individualType) {
    individualType = await prisma.roomType.create({
      data: {
        name: 'Individual',
        description: 'Habitación individual con cama sencilla',
        max_occupancy: 1,
        base_rate_usd: 80.00,
        base_rate_usdt: 80.00,
        base_rate_eur: 75.00,
        base_rate_bnb: 0.00025,
        base_rate_etc: 0.0035,
        amenities: ['WiFi', 'TV', 'Aire Acondicionado', 'Baño Privado'],
        size_sqm: 25.0,
        bed_type: 'Single',
        bed_count: 1
      }
    })
  }

  let dobleType = await prisma.roomType.findFirst({
    where: { name: 'Doble' }
  })
  
  if (!dobleType) {
    dobleType = await prisma.roomType.create({
      data: {
        name: 'Doble',
        description: 'Habitación doble con dos camas sencillas o una matrimonial',
        max_occupancy: 2,
        base_rate_usd: 120.00,
        base_rate_usdt: 120.00,
        base_rate_eur: 110.00,
        base_rate_bnb: 0.00037,
        base_rate_etc: 0.0052,
        amenities: ['WiFi', 'TV', 'Aire Acondicionado', 'Baño Privado', 'Minibar'],
        size_sqm: 35.0,
        bed_type: 'Double',
        bed_count: 1
      }
    })
  }

  let suiteType = await prisma.roomType.findFirst({
    where: { name: 'Suite' }
  })
  
  if (!suiteType) {
    suiteType = await prisma.roomType.create({
      data: {
        name: 'Suite',
        description: 'Suite de lujo con sala de estar separada',
        max_occupancy: 4,
        base_rate_usd: 250.00,
        base_rate_usdt: 250.00,
        base_rate_eur: 230.00,
        base_rate_bnb: 0.00077,
        base_rate_etc: 0.0108,
        amenities: ['WiFi', 'TV', 'Aire Acondicionado', 'Baño Privado', 'Minibar', 'Jacuzzi', 'Vista'],
        size_sqm: 60.0,
        bed_type: 'King',
        bed_count: 1
      }
    })
  }

  console.log('✅ Tipos de habitación creados')

  // 6. Crear Habitaciones
  const roomTypes = [individualType, dobleType, suiteType]
  let roomCounter = 1
  
  for (const floor of floors) {
    const roomsPerFloor = Math.floor(200 / 9) // Aproximadamente 22 habitaciones por piso
    
    for (let i = 1; i <= roomsPerFloor && roomCounter <= 200; i++) {
      const roomNumber = `${floor.floor_number}${i.toString().padStart(2, '0')}`
      const roomTypeIndex = Math.floor(Math.random() * roomTypes.length)
      const roomType = roomTypes[roomTypeIndex]
      
      await prisma.room.upsert({
        where: {
          hotel_id_room_number: {
            hotel_id: hotel.id,
            room_number: roomNumber
          }
        },
        update: {},
        create: {
          room_number: roomNumber,
          hotel_id: hotel.id,
          floor_id: floor.id,
          room_type_id: roomType.id,
          status: 'AVAILABLE',
          has_minibar: roomType.name !== 'Individual',
          has_balcony: Math.random() > 0.5,
          has_view: floor.floor_number >= 5 ? Math.random() > 0.3 : Math.random() > 0.7,
          wifi_password: `WiFi${roomNumber}`,
          created_by: adminUser.id,
          updated_by: adminUser.id
        }
      })
      
      roomCounter++
    }
  }

  console.log(`✅ ${roomCounter - 1} habitaciones creadas`)

  // 7. Crear algunos servicios básicos
  const services = [
    {
      name: 'Desayuno Continental',
      description: 'Desayuno buffet con opciones internacionales',
      category: 'RESTAURANT',
      price_usd: 25.00,
      price_usdt: 25.00,
      price_eur: 23.00,
      is_active: true,
      is_taxable: true,
      tax_rate: 16.00
    },
    {
      name: 'Servicio de Lavandería',
      description: 'Lavado y planchado de ropa',
      category: 'LAUNDRY',
      price_usd: 15.00,
      price_usdt: 15.00,
      price_eur: 14.00,
      is_active: true,
      is_taxable: true,
      tax_rate: 16.00
    },
    {
      name: 'Spa - Masaje Relajante',
      description: 'Masaje de relajación de 60 minutos',
      category: 'SPA',
      price_usd: 80.00,
      price_usdt: 80.00,
      price_eur: 75.00,
      is_active: true,
      is_taxable: true,
      tax_rate: 16.00
    },
    {
      name: 'Minibar - Agua',
      description: 'Botella de agua 500ml',
      category: 'MINIBAR',
      price_usd: 3.00,
      price_usdt: 3.00,
      price_eur: 2.80,
      is_active: true,
      is_taxable: true,
      tax_rate: 16.00
    }
  ]

  for (const service of services) {
    const existingService = await prisma.service.findFirst({
      where: {
        hotel_id: hotel.id,
        name: service.name
      }
    })
    
    if (!existingService) {
      await prisma.service.create({
        data: {
          ...service,
          hotel_id: hotel.id,
          created_by: adminUser.id,
          updated_by: adminUser.id
        }
      })
    }
  }

  console.log('✅ Servicios básicos creados')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📋 Datos de acceso:')
  console.log('   Email: admin@hotelpaseolm.com')
  console.log('   Password: admin123')
  console.log('\n📊 Datos creados:')
  console.log(`   - 1 Hotel: ${hotel.name}`)
  console.log('   - 2 Roles: Admin, Recepcionista')
  console.log('   - 1 Usuario administrador')
  console.log('   - 9 Pisos')
  console.log('   - 3 Tipos de habitación')
  console.log(`   - ${roomCounter - 1} Habitaciones`)
  console.log('   - 4 Servicios básicos')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
