
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedCommunicationTemplates() {
  console.log('🌱 Creando plantillas de comunicación...')

  const hotel = await prisma.hotel.findFirst()
  if (!hotel) {
    throw new Error('No hotel found')
  }

  // Plantillas para huéspedes
  const guestTemplates = [
    {
      name: 'Bienvenida al Hotel',
      category: 'WELCOME',
      type: 'GUEST',
      subject: '¡Bienvenido al Hotel Paseo Las Mercedes!',
      content: `Estimado/a {{guest_name}},

¡Le damos la más cordial bienvenida al Hotel Paseo Las Mercedes!

Esperamos que tenga una estancia excepcional con nosotros. A continuación, algunos detalles importantes:

**Información de su reserva:**
- Habitación: {{room_number}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Huéspedes: {{guest_count}}

**Servicios disponibles:**
- WiFi gratuito en todas las áreas
- Servicio de habitaciones 24/7
- Restaurant y bar
- Spa y centro de bienestar

Si necesita asistencia durante su estancia, no dude en contactarnos a través de nuestro portal de huéspedes o llamando al 0 desde su habitación.

¡Disfrute su estancia!

Atentamente,
El equipo de Hotel Paseo Las Mercedes`,
      variables: { 
        guest_name: 'Nombre del huésped',
        room_number: 'Número de habitación',
        check_in_date: 'Fecha de check-in',
        check_out_date: 'Fecha de check-out',
        guest_count: 'Cantidad de huéspedes'
      },
      is_automatic: true,
      trigger_event: 'CHECK_IN',
      send_delay_hours: 0
    },
    {
      name: 'Preparación para Check-out',
      category: 'CHECKOUT',
      type: 'GUEST',
      subject: 'Preparación para su salida - Hotel Paseo Las Mercedes',
      content: `Estimado/a {{guest_name}},

Esperamos que haya disfrutado su estancia en el Hotel Paseo Las Mercedes.

**Recordatorio de check-out:**
- Hora límite: 11:00 AM
- Su reserva finaliza: {{check_out_date}}

**Servicios de salida:**
- Check-out express disponible
- Custodia de equipaje sin costo
- Servicios de taxi y transporte

**Su cuenta:**
- Puede revisar su factura en nuestro portal
- Checkout express: deje la llave en su habitación

¡Esperamos verle pronto nuevamente!

Atentamente,
El equipo de Hotel Paseo Las Mercedes`,
      variables: { 
        guest_name: 'Nombre del huésped',
        check_out_date: 'Fecha de check-out'
      },
      is_automatic: true,
      trigger_event: 'CHECKOUT',
      send_delay_hours: -2 // 2 horas antes del checkout
    },
    {
      name: 'Solicitud de Servicio Recibida',
      category: 'SERVICE',
      type: 'GUEST',
      subject: 'Solicitud de servicio recibida - Hotel Paseo Las Mercedes',
      content: `Estimado/a {{guest_name}},

Hemos recibido su solicitud de servicio:

**Detalles de la solicitud:**
- Tipo: {{service_type}}
- Habitación: {{room_number}}
- Fecha: {{request_date}}
- Estado: En proceso

Nuestro equipo se encargará de atender su solicitud a la brevedad posible. Le mantendremos informado del progreso.

Si tiene alguna pregunta adicional, no dude en contactarnos.

Atentamente,
El equipo de Hotel Paseo Las Mercedes`,
      variables: { 
        guest_name: 'Nombre del huésped',
        service_type: 'Tipo de servicio',
        room_number: 'Número de habitación',
        request_date: 'Fecha de solicitud'
      },
      is_automatic: true,
      trigger_event: 'SERVICE_REQUEST'
    }
  ]

  // Plantillas para personal
  const staffTemplates = [
    {
      name: 'Nueva Reserva Creada',
      category: 'GENERAL',
      type: 'STAFF',
      subject: 'Nueva reserva - Habitación {{room_number}}',
      content: `Estimado equipo,

Se ha creado una nueva reserva:

**Detalles:**
- Huésped: {{guest_name}}
- Habitación: {{room_number}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Huéspedes: {{guest_count}}
- Total: {{total_amount}}

**Preparativos necesarios:**
- Verificar disponibilidad de la habitación
- Preparar servicios de bienvenida
- Informar a housekeeping

Saludos,
Sistema de reservas`,
      variables: { 
        guest_name: 'Nombre del huésped',
        room_number: 'Número de habitación',
        check_in_date: 'Fecha de check-in',
        check_out_date: 'Fecha de check-out',
        guest_count: 'Cantidad de huéspedes',
        total_amount: 'Monto total'
      },
      is_automatic: true,
      trigger_event: 'RESERVATION_CREATED'
    },
    {
      name: 'Mantenimiento Programado',
      category: 'ANNOUNCEMENT',
      type: 'STAFF',
      subject: 'Mantenimiento programado - {{maintenance_area}}',
      content: `Estimado equipo,

Se ha programado un mantenimiento:

**Detalles:**
- Área: {{maintenance_area}}
- Fecha: {{maintenance_date}}
- Hora: {{maintenance_time}}
- Duración estimada: {{duration}}

**Instrucciones:**
- Coordinar con huéspedes afectados
- Preparar avisos informativos
- Asegurar rutas alternativas

Por favor, tomen las precauciones necesarias.

Saludos,
Equipo de mantenimiento`,
      variables: { 
        maintenance_area: 'Área de mantenimiento',
        maintenance_date: 'Fecha de mantenimiento',
        maintenance_time: 'Hora de mantenimiento',
        duration: 'Duración estimada'
      }
    }
  ]

  // Crear plantillas para huéspedes
  for (const template of guestTemplates) {
    await prisma.messageTemplate.create({
      data: {
        hotel_id: hotel.id,
        ...template,
        created_by: 'system'
      }
    })
  }

  // Crear plantillas para personal
  for (const template of staffTemplates) {
    await prisma.messageTemplate.create({
      data: {
        hotel_id: hotel.id,
        ...template,
        created_by: 'system'
      }
    })
  }

  console.log(`✅ ${guestTemplates.length + staffTemplates.length} plantillas de comunicación creadas`)
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedCommunicationTemplates()
    .then(() => {
      console.log('🎉 Seed de plantillas de comunicación completado!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en seed de plantillas:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
