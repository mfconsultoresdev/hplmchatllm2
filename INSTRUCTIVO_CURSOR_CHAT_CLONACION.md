# 🚀 Instructivo: Clonar PMS Hotel desde GitHub usando Cursor Chat

## 📋 **Guía Paso a Paso para Ventana de Chat de Cursor**

Este instructivo te permitirá **clonar y ejecutar** el Sistema PMS Hotel Paseo Las Mercedes desde GitHub usando **exclusivamente la ventana de chat de Cursor** en Windows.

---

## 🎯 **Paso 1: Clonar el Repositorio**

### **Comando para Cursor Chat:**
```
@terminal git clone https://github.com/mfconsultoresdev/hotel-pms-paseo-las-mercedes-chatllm.git
```

### **Explicación:**
- El `@terminal` le dice a Cursor que ejecute el comando en la terminal
- Esto descargará todo el proyecto en tu carpeta actual

### **Verificar que funcionó:**
```
@terminal dir hotel-pms-paseo-las-mercedes-chatllm
```

---

## 🎯 **Paso 2: Abrir el Proyecto en Cursor**

### **Comando para Cursor Chat:**
```
@terminal cd hotel-pms-paseo-las-mercedes-chatllm
```

### **Luego usar Cursor UI:**
- **File** → **Open Folder**
- Seleccionar la carpeta `hotel-pms-paseo-las-mercedes-chatllm`
- Hacer clic en **"Trust the authors"** si aparece

---

## 🎯 **Paso 3: Navegar a la Carpeta de la App**

### **Comando para Cursor Chat:**
```
@terminal cd app
```

### **Verificar ubicación:**
```
@terminal pwd
```
Debe mostrar algo como: `C:\tu-ruta\hotel-pms-paseo-las-mercedes-chatllm\app`

---

## 🎯 **Paso 4: Instalar Dependencias**

### **Comando para Cursor Chat:**
```
@terminal yarn install
```

### **Si no tienes Yarn instalado:**
```
@terminal npm install -g yarn
```

### **Verificar instalación:**
```
@terminal yarn --version
```

### **Tiempo estimado:** 2-3 minutos dependiendo de tu conexión

---

## 🎯 **Paso 5: Crear Variables de Entorno**

### **Comando para Cursor Chat:**
```
Crear un archivo .env en la carpeta app con esta configuración:

DATABASE_URL="postgresql://usuario:password@localhost:5432/hotel_pms"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secreto-de-32-caracteres-minimo-para-auth"
STRIPE_PUBLISHABLE_KEY="pk_test_opcional"
STRIPE_SECRET_KEY="sk_test_opcional"
```

### **O usar comando directo:**
```
@terminal echo DATABASE_URL="postgresql://usuario:password@localhost:5432/hotel_pms" > .env
```

```
@terminal echo NEXTAUTH_URL="http://localhost:3000" >> .env
```

```
@terminal echo NEXTAUTH_SECRET="mi-secreto-super-seguro-de-32-caracteres-para-nextauth-hotel-pms" >> .env
```

---

## 🎯 **Paso 6: Configurar PostgreSQL**

### **Opción A: PostgreSQL Local (Si ya está instalado)**
```
@terminal psql -U postgres -c "CREATE DATABASE hotel_pms;"
```

### **Opción B: Docker (Más Fácil)**
```
@terminal docker run --name postgres-hotel -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=hotel_pms -p 5432:5432 -d postgres:15
```

### **Opción C: Base de Datos Online (Recomendada)**
1. Ir a [Supabase.com](https://supabase.com)
2. Crear proyecto gratuito
3. Copiar la URL de conexión al `.env`

---

## 🎯 **Paso 7: Configurar Base de Datos**

### **Comandos para Cursor Chat:**

**Generar cliente Prisma:**
```
@terminal npx prisma generate
```

**Aplicar migraciones:**
```
@terminal npx prisma migrate deploy
```

**Poblar con datos de prueba:**
```
@terminal npm run seed
```

### **Verificar que funcionó:**
```
@terminal npx prisma studio
```
Esto abre una interfaz web para ver la base de datos en el navegador.

---

## 🎯 **Paso 8: Ejecutar el Proyecto**

### **Comando para Cursor Chat:**
```
@terminal yarn dev
```

### **Resultado esperado:**
```
▲ Next.js 14.2.28
- Local:        http://localhost:3000
- Environments: .env

✓ Ready in 2.3s
```

### **Abrir en navegador:**
```
Ir a: http://localhost:3000
```

---

## 🔑 **Paso 9: Hacer Login**

### **Credenciales de Prueba:**
- **Email**: `admin@hotelpaseolm.com`
- **Contraseña**: `admin123`

### **Otras cuentas disponibles:**
- **Gerente**: `gerente@hotelpaseolm.com` / `admin123`
- **Recepción**: `recepcion@hotelpaseolm.com` / `admin123`

---

## 🛠️ **Solución de Problemas Comunes**

### **❌ Error: "git no reconocido"**
```
@terminal winget install Git.Git
```

### **❌ Error: "yarn no reconocido"**
```
@terminal npm install -g yarn
```

### **❌ Error: "PowerShell execution policy"**
```
@terminal Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **❌ Error: "Puerto 3000 ocupado"**
```
@terminal netstat -ano | findstr :3000
```
```
@terminal set PORT=3001 && yarn dev
```

### **❌ Error de base de datos:**
```
@terminal npx prisma migrate reset
```
```
@terminal npm run seed
```

---

## 📋 **Checklist de Verificación**

### **✅ Antes de ejecutar, verifica que tengas:**
- [ ] Git instalado (`git --version`)
- [ ] Node.js v18+ (`node --version`)  
- [ ] Yarn instalado (`yarn --version`)
- [ ] PostgreSQL configurado (local, Docker o online)

### **✅ Después de ejecutar, debes ver:**
- [ ] Carpeta clonada exitosamente
- [ ] `node_modules` creado después de `yarn install`
- [ ] Archivo `.env` configurado
- [ ] Comando `yarn dev` ejecutándose sin errores
- [ ] Página de login en `http://localhost:3000`

---

## 🚀 **Comandos Completos de un Tirón**

### **Para Cursor Chat (Copiar todo junto):**
```
@terminal git clone https://github.com/mfconsultoresdev/hotel-pms-paseo-las-mercedes-chatllm.git && cd hotel-pms-paseo-las-mercedes-chatllm/app && yarn install && echo DATABASE_URL="postgresql://usuario:password@localhost:5432/hotel_pms" > .env && echo NEXTAUTH_URL="http://localhost:3000" >> .env && echo NEXTAUTH_SECRET="mi-secreto-super-seguro-de-32-caracteres-para-nextauth-hotel-pms" >> .env && npx prisma generate && npx prisma migrate deploy && npm run seed && yarn dev
```

### **⚠️ Importante:**
- Reemplaza `usuario:password@localhost:5432` con tu configuración real de PostgreSQL
- Si usas base de datos online (Supabase), reemplaza toda la `DATABASE_URL`

---

## 🎉 **Resultado Final**

Al seguir estos pasos desde **Cursor Chat**, obtendrás:

### **✅ Sistema PMS Completo Funcionando:**
- 🏠 **Dashboard principal** con métricas
- 📅 **Gestión de habitaciones** visual
- 🎯 **Sistema de reservas** con calendario
- ✅ **Check-in/Check-out** automatizado  
- 💰 **Facturación con Stripe** 
- 🧹 **Módulo de Housekeeping** completo
- 👥 **Gestión de personal** con métricas
- 📊 **Reportes ejecutivos**
- 🚪 **Portal de huéspedes**
- 🔐 **Sistema de seguridad** completo

### **📊 Métricas del Sistema:**
- **23 páginas** completamente funcionales
- **60+ APIs endpoints** operativos
- **10 módulos** de gestión hotelera
- **Sistema enterprise-grade** listo para producción

---

## 💡 **Consejos Adicionales**

### **Para desarrollo continuo:**
```
# Actualizar desde GitHub
@terminal git pull origin master

# Ver cambios locales
@terminal git status

# Subir cambios
@terminal git add . && git commit -m "Mensaje" && git push
```

### **Para trabajar en equipo:**
- Cada desarrollador puede clonar desde GitHub
- Usar ramas: `@terminal git checkout -b feature/nueva-funcionalidad`
- Colaborar con Pull Requests

---

## 🎯 **Nota Final**

**Este instructivo te permite clonar y ejecutar el Sistema PMS completo usando exclusivamente comandos desde la ventana de chat de Cursor en Windows.**

**¡El resultado será exactamente el mismo sistema funcional que viste en el preview! 🌟**

---

*📝 Instructivo creado específicamente para Cursor Chat en Windows*  
*🏨 Proyecto: Hotel PMS Paseo Las Mercedes*  
*📅 Fecha: Septiembre 2025*