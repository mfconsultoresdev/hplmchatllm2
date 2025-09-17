
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedGuestPortalTest() {
  console.log('🌱 Creando datos de prueba para portal de huéspedes...')

  const hotel = await prisma.hotel.findFirst()
  if (!hotel) {
    throw new Error('No hotel found')
  }

  // Obtener el usuario admin para created_by
  const adminUser = await prisma.user.findFirst({
    where: {
      hotel_id: hotel.id
    }
  })
  
  if (!adminUser) {
    throw new Error('No admin user found')
  }

  // Crear o buscar un huésped de prueba
  let testGuest = await prisma.guest.findFirst({
    where: {
      hotel_id: hotel.id,
      email: 'maria.garcia@example.com'
    }
  })

  if (!testGuest) {
    testGuest = await prisma.guest.create({
      data: {
        hotel_id: hotel.id,
        first_name: 'María',
        last_name: 'García',
        email: 'maria.garcia@example.com',
        phone: '+34 612 345 678',
        document_type: 'ID',
        document_number: '12345678A',
        nationality: 'España',
        address: 'Calle Principal 123',
        city: 'Madrid',
        country: 'España',
        postal_code: '28001',
        created_by: adminUser.id
      }
    })
  }

  // Obtener una habitación disponible
  const availableRoom = await prisma.room.findFirst({
    where: {
      hotel_id: hotel.id,
      status: 'AVAILABLE'
    }
  })

  if (!availableRoom) {
    throw new Error('No available room found')
  }

  // Crear o buscar una reserva de prueba
  const checkInDate = new Date()
  checkInDate.setDate(checkInDate.getDate() - 1) // Ayer
  const checkOutDate = new Date()
  checkOutDate.setDate(checkOutDate.getDate() + 3) // En 3 días

  let testReservation = await prisma.reservation.findFirst({
    where: {
      reservation_number: 'TEST-2024-001'
    }
  })

  if (!testReservation) {
    testReservation = await prisma.reservation.create({
      data: {
        reservation_number: 'TEST-2024-001',
        hotel_id: hotel.id,
        room_id: availableRoom.id,
        guest_id: testGuest.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        adults: 2,
        children: 0,
        nights: 4,
        currency: 'EUR',
        room_rate: 120.00,
        total_amount: 480.00,
        taxes: 48.00,
        status: 'CONFIRMED',
        created_by: adminUser.id
      }
    })
  }

  // Marcar la habitación como ocupada
  await prisma.room.update({
    where: { id: availableRoom.id },
    data: { status: 'OCCUPIED' }
  })

  // Crear algunos mensajes de prueba usando plantillas
  const welcomeTemplate = await prisma.messageTemplate.findFirst({
    where: {
      hotel_id: hotel.id,
      category: 'WELCOME',
      is_active: true
    }
  })

  if (welcomeTemplate) {
    // Mensaje de bienvenida
    const welcomeMessage = await prisma.communicationMessage.create({
      data: {
        hotel_id: hotel.id,
        subject: 'Bienvenida al Hotel Paseo Las Mercedes',
        message: `Estimada María García,

¡Le damos la más cordial bienvenida al Hotel Paseo Las Mercedes!

Esperamos que tenga una estancia excepcional con nosotros. A continuación, algunos detalles importantes:

**Información de su reserva:**
- Habitación: ${availableRoom.room_number}
- Check-in: ${checkInDate.toLocaleDateString('es-ES')}
- Check-out: ${checkOutDate.toLocaleDateString('es-ES')}
- Huéspedes: 2

**Servicios disponibles:**
- WiFi gratuito en todas las áreas
- Servicio de habitaciones 24/7
- Restaurant y bar
- Spa y centro de bienestar

Si necesita asistencia durante su estancia, no dude en contactarnos a través de nuestro portal de huéspedes o llamando al 0 desde su habitación.

¡Disfrute su estancia!

Atentamente,
El equipo de Hotel Paseo Las Mercedes`,
        priority: 'NORMAL',
        category: 'WELCOME',
        sender_name: 'Recepción - Hotel Paseo Las Mercedes',
        sender_type: 'STAFF',
        guest_id: testGuest.id,
        reservation_id: testReservation.id,
        template_id: welcomeTemplate.id,
        delivery_method: 'PORTAL',
        sent_at: new Date(),
        status: 'SENT',
        created_by: 'system'
      }
    })

    // Crear recipient para el huésped
    await prisma.guestCommunicationRecipient.create({
      data: {
        hotel_id: hotel.id,
        message_id: welcomeMessage.id,
        guest_id: testGuest.id,
        reservation_id: testReservation.id,
        contact_method: 'PORTAL',
        status: 'DELIVERED',
        delivered_at: new Date()
      }
    })
  }

  // Mensaje de información adicional
  const infoMessage = await prisma.communicationMessage.create({
    data: {
      hotel_id: hotel.id,
      subject: 'Información útil para su estancia',
      message: `Estimada María García,

Esperamos que esté disfrutando de su estancia en nuestro hotel.

**Horarios importantes:**
- Desayuno: 7:00 AM - 10:30 AM
- Restaurant: 12:00 PM - 11:00 PM
- Bar: 4:00 PM - 1:00 AM
- Gimnasio: 24 horas

**WiFi:**
- Red: HotelPaseoLM_Guest
- Contraseña: disponible en recepción

**Servicios adicionales:**
- Servicio de lavandería disponible
- Transporte al aeropuerto (solicite en recepción)
- Tours guiados de la ciudad

Si tiene alguna pregunta, no dude en contactarnos.

Saludos cordiales,
Equipo de Concierge`,
      priority: 'NORMAL',
      category: 'GENERAL',
      sender_name: 'Concierge',
      sender_type: 'STAFF',
      guest_id: testGuest.id,
      reservation_id: testReservation.id,
      delivery_method: 'PORTAL',
      sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
      status: 'SENT',
      created_by: 'system'
    }
  })

  await prisma.guestCommunicationRecipient.create({
    data: {
      hotel_id: hotel.id,
      message_id: infoMessage.id,
      guest_id: testGuest.id,
      reservation_id: testReservation.id,
      contact_method: 'PORTAL',
      status: 'DELIVERED',
      delivered_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  })

  console.log(`✅ Datos de prueba creados para portal de huéspedes:`)
  console.log(`   - Huésped: ${testGuest.first_name} ${testGuest.last_name}`)
  console.log(`   - Email: ${testGuest.email}`)
  console.log(`   - Reserva: ${testReservation.reservation_number}`)
  console.log(`   - Habitación: ${availableRoom.room_number}`)
  console.log(`   - Check-in: ${checkInDate.toLocaleDateString('es-ES')}`)
  console.log(`   - Check-out: ${checkOutDate.toLocaleDateString('es-ES')}`)
  console.log(`   - Mensajes: 2 mensajes creados`)
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedGuestPortalTest()
    .then(() => {
      console.log('🎉 Seed de datos de prueba para portal de huéspedes completado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en seed de datos de prueba:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
