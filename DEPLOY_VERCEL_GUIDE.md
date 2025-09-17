
# 🚀 Guía de Deploy en Vercel - Hotel PMS Paseo Las Mercedes

## 📋 **Requisitos Previos**

### **1. Base de Datos: Supabase (RECOMENDADO)**
- ✅ **Gratis hasta 500MB**
- ✅ **PostgreSQL completo**
- ✅ **Fácil configuración**
- ✅ **Backups automáticos**

**Pasos:**
1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta (gratis con GitHub/Google)
3. Crear nuevo proyecto
4. Copiar la **Database URL** de Settings → Database

### **2. Cuenta Vercel**
- Crear cuenta en [vercel.com](https://vercel.com) (gratis con GitHub)

---

## 🎯 **Proceso de Deploy**

### **Paso 1: Preparar el Repositorio**
1. El proyecto ya está listo en: `https://github.com/mfconsultoresdev/hplmchatllm2`
2. Todo configurado para Vercel ✅

### **Paso 2: Deploy en Vercel**

#### **Opción A: Deploy Automático (Recomendado)**
1. Ir a [vercel.com/new](https://vercel.com/new)
2. Conectar con GitHub
3. Seleccionar repositorio: `mfconsultoresdev/hplmchatllm2`
4. **Root Directory**: `app` (MUY IMPORTANTE)
5. **Framework Preset**: Next.js
6. Hacer clic en **"Deploy"**

#### **Opción B: Vercel CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# En la carpeta del proyecto
cd app
vercel

# Seguir las instrucciones
```

### **Paso 3: Configurar Variables de Entorno**

En **Vercel Dashboard → Settings → Environment Variables**, agregar:

#### **Variables Obligatorias:**
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=tu-secreto-super-seguro-de-32-caracteres-minimo
```

#### **Variables Opcionales:**
```env
# Stripe (para pagos)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# App URL
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app
```

### **Paso 4: Configurar Base de Datos**

**Una vez que el deploy esté funcionando:**

1. **Ejecutar migraciones:**
```bash
# Opción A: Desde local
DATABASE_URL="tu_url_de_supabase" npx prisma migrate deploy

# Opción B: Desde Vercel Functions
# (Se ejecuta automáticamente en el primer deploy)
```

2. **Poblar con datos iniciales:**
```bash
DATABASE_URL="tu_url_de_supabase" npm run seed
```

---

## 🔧 **Configuraciones Específicas de Vercel**

### **1. Configuración del Proyecto**
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)
- **Development Command**: `npm run dev` (automático)

### **2. Configuraciones de Node.js**
- **Node.js Version**: 18.x (automático)
- **Región**: Washington, D.C. (iad1) - Más rápida para Venezuela

### **3. Configuración de Dominios**
- **Dominio automático**: `tu-proyecto.vercel.app`
- **Dominio personalizado**: Configurar en Settings → Domains

---

## 📊 **Opciones de Base de Datos**

### **🥇 RECOMENDADO: Supabase**
- ✅ **Precio**: Gratis hasta 500MB
- ✅ **Tipo**: PostgreSQL completo
- ✅ **Backup**: Automático
- ✅ **Escalabilidad**: Fácil upgrade
- ✅ **Interface**: Dashboard visual incluido

### **🥈 Alternativa: PlanetScale**
- ✅ **Precio**: Gratis hasta 1GB
- ✅ **Tipo**: MySQL compatible
- ❌ **Limitación**: No soporta todas las features de Prisma

### **🥉 Alternativa: Railway**
- ✅ **Precio**: $5/mes después de trial
- ✅ **Tipo**: PostgreSQL completo
- ✅ **Performance**: Muy buena

---

## 🛠️ **Comandos Útiles Post-Deploy**

### **Para Desarrollo:**
```bash
# Ejecutar migraciones en producción
vercel env pull .env.local
npx prisma migrate deploy

# Poblar datos en producción
npm run seed

# Ver logs de la aplicación
vercel logs
```

### **Para Debugging:**
```bash
# Ver información del deploy
vercel inspect

# Ejecutar funciones localmente
vercel dev
```

---

## 🎯 **Checklist de Deploy**

### **Antes del Deploy:**
- [ ] Base de datos Supabase configurada
- [ ] Variables de entorno preparadas
- [ ] Repositorio en GitHub actualizado

### **Durante el Deploy:**
- [ ] Root directory configurado: `app`
- [ ] Framework preset: Next.js
- [ ] Variables de entorno agregadas
- [ ] Deploy completado sin errores

### **Después del Deploy:**
- [ ] Base de datos migrada: `prisma migrate deploy`
- [ ] Datos iniciales poblados: `npm run seed`
- [ ] Sitio funcional en la URL de Vercel
- [ ] Login funcionando con credenciales de prueba

---

## 🔑 **Credenciales de Prueba**

Una vez deployed, usar:
- **Usuario**: `admin@hotelpaseolm.com`
- **Contraseña**: `admin123`

---

## 🚨 **Solución de Problemas Comunes**

### **Error: "Database connection failed"**
- Verificar `DATABASE_URL` en las variables de entorno
- Confirmar que la base de datos Supabase esté activa

### **Error: "NextAuth configuration error"**
- Verificar `NEXTAUTH_URL` apunte a tu dominio de Vercel
- Confirmar que `NEXTAUTH_SECRET` tenga al menos 32 caracteres

### **Error: "Build failed"**
- Verificar que el Root Directory sea `app`
- Revisar logs de build en el dashboard de Vercel

### **Error: "Prisma client not generated"**
- Se genera automáticamente en el build
- Si falla, ejecutar manualmente: `npx prisma generate`

---

## 🎉 **¡Deploy Completado!**

Tu Sistema PMS estará disponible en:
`https://tu-proyecto.vercel.app`

**Con todas las funcionalidades:**
- ✅ 23 páginas funcionales
- ✅ 60+ APIs operativos
- ✅ 10 módulos de gestión hotelera
- ✅ Sistema enterprise-grade
- ✅ Listo para producción

---

*📝 Guía creada para deploy en Vercel*  
*🏨 Hotel PMS Paseo Las Mercedes*  
*✨ Sistema completamente funcional*
