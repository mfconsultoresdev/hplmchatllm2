
# 🏨 Hotel PMS Paseo Las Mercedes - Sistema Completo

**Sistema de Gestión Hotelera Enterprise** desarrollado con Next.js 14, TypeScript, PostgreSQL y tecnologías modernas.

## 🌟 Estado del Proyecto

✅ **SISTEMA COMPLETAMENTE FUNCIONAL**  
✅ **10 MÓDULOS IMPLEMENTADOS**  
✅ **LISTO PARA PRODUCCIÓN**  
✅ **OPTIMIZADO PARA VERCEL DEPLOY**

---

## 🚀 Deploy en Vercel (Recomendado)

### **🎯 Deploy Rápido**
1. **Fork/Clone**: Este repositorio
2. **Vercel**: Conectar en [vercel.com/new](https://vercel.com/new)
3. **Root Directory**: `app` ⚠️ **IMPORTANTE**
4. **Variables**: Configurar según `.env.example`
5. **Deploy**: ¡Automático!

### **📋 Variables de Entorno Requeridas**
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
NEXTAUTH_URL="https://tu-proyecto.vercel.app"
NEXTAUTH_SECRET="tu-secreto-seguro-32-caracteres-minimo"
```

### **💾 Base de Datos Recomendada**
**[Supabase](https://supabase.com)** - PostgreSQL gratis hasta 500MB
- Crear proyecto → Copiar Database URL → Pegar en Vercel

**📖 [Guía Completa de Deploy](DEPLOY_VERCEL_GUIDE.md)**

---

## 🏨 Sistema PMS Completo

### **✨ 10 Módulos Implementados**

1. **🏠 Dashboard Principal**
   - Métricas en tiempo real
   - Ocupación y ingresos
   - Actividad reciente

2. **📅 Gestión de Habitaciones**
   - Grilla visual interactiva
   - Estados en tiempo real
   - Tipos y categorías

3. **🎯 Reservaciones**
   - Calendario avanzado
   - Verificación de disponibilidad
   - Gestión de huéspedes

4. **✅ Check-in/Check-out**
   - Procesos automatizados
   - Asignación de habitaciones
   - Facturación integrada

5. **💰 Facturación y Pagos**
   - Integración Stripe
   - Facturación SENIAT (Venezuela)
   - Múltiples métodos de pago

6. **🧹 Housekeeping**
   - Gestión de limpieza
   - Control de inventario
   - Métricas de personal

7. **👥 Gestión de Personal**
   - Horarios y turnos
   - Control de asistencia
   - Evaluaciones

8. **📱 Comunicaciones**
   - Mensajería con huéspedes
   - Plantillas automáticas
   - Notificaciones

9. **🚪 Portal de Huéspedes**
   - Acceso independiente
   - Visualización de reservas
   - Solicitudes de servicio

10. **📊 Reportes y Analytics**
    - Dashboard ejecutivo
    - Métricas financieras
    - Análisis de tendencias

---

## 💻 Desarrollo Local

### **Instalación Rápida**
```bash
# Clonar repositorio
git clone https://github.com/mfconsultoresdev/hplmchatllm2.git
cd hplmchatllm2/app

# Instalar dependencias
npm install

# Configurar .env (copiar de .env.example)
# Configurar base de datos

# Configurar base de datos
npx prisma generate
npx prisma migrate dev
npm run seed

# Ejecutar en desarrollo
npm run dev
```

### **🔑 Credenciales de Prueba**
- **Admin**: `admin@hotelpaseolm.com` / `admin123`
- **Gerente**: `gerente@hotelpaseolm.com` / `admin123`
- **Recepción**: `recepcion@hotelpaseolm.com` / `admin123`

---

## 🛠️ Stack Tecnológico

### **Frontend**
- **Next.js 14** - App Router + Server Components
- **TypeScript** - Tipado estático completo
- **Tailwind CSS** - Estilos responsivos
- **Radix UI** - Componentes accesibles
- **React Hook Form** - Formularios optimizados

### **Backend**
- **Next.js API Routes** - APIs RESTful
- **PostgreSQL** - Base de datos robusta
- **Prisma ORM** - Abstracción de BD
- **NextAuth.js** - Autenticación segura

### **Servicios**
- **Stripe** - Procesamiento de pagos
- **Vercel** - Deploy y hosting
- **Supabase** - Base de datos en la nube

---

## 📊 Especificaciones

### **📈 Métricas del Sistema**
- **23 páginas** completamente funcionales
- **60+ API endpoints** operativos
- **30+ modelos** de base de datos
- **100+ componentes** UI reutilizables
- **Sistema multirol** completo

### **💰 Valor Comercial**
- **Equivalente**: Sistemas PMS comerciales de $50,000+
- **Funcionalidades**: Enterprise-grade completas
- **Escalabilidad**: Lista para cientos de habitaciones
- **Mantenibilidad**: Código limpio y documentado

---

## 🎯 Casos de Uso

### **Hoteles Medianos (20-100 habitaciones)**
- Gestión completa de operaciones
- Control financiero detallado
- Automatización de procesos

### **Boutique Hotels**
- Experiencia personalizada
- Comunicación directa con huéspedes
- Analytics detallados

### **Cadenas Hoteleras**
- Base escalable para múltiples propiedades
- Reportes consolidados
- Gestión centralizada

---

## 📚 Documentación

- **[Guía de Deploy en Vercel](DEPLOY_VERCEL_GUIDE.md)**
- **[Documentación Técnica](docs/)**
- **[Guías de Usuario](docs/user-guides/)**
- **[API Documentation](docs/api/)**

---

## 🤝 Contribución

### **Para Desarrolladores**
1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### **Reportar Issues**
- Usar el sistema de issues de GitHub
- Incluir pasos para reproducir
- Especificar navegador y versión

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para detalles.

---

## 🎉 ¡Listo para Usar!

**Este sistema PMS está completamente funcional y listo para deploy en producción.**

### **🚀 Deploy Inmediato**
[![Deploy to Vercel](https://i.ytimg.com/vi/lAJ6LyvW_cw/sddefault.jpg)

### **⭐ Características Principales**
- ✅ Deploy en 1-click con Vercel
- ✅ Base de datos gratis con Supabase
- ✅ Sistema completo funcionando en minutos
- ✅ Documentación completa incluida
- ✅ Soporte técnico disponible

---

**Desarrollado con ❤️ para la industria hotelera**

*Sistema PMS moderno, escalable y listo para producción*

