
# ⚡ Cursor Quickstart - Hotel PMS

## 🚀 Setup Rápido (3 minutos)

### 1. **Extraer Proyecto**
```bash
# Extraer el respaldo
tar -xzf hotel_pms_completo_TIMESTAMP.tar.gz

# O usar herramientas gráficas para ZIP
```

### 2. **Abrir en Cursor**
```bash
# Opción 1: Terminal
cursor hotel_pms_paseo_las_mercedes

# Opción 2: Cursor GUI
# File → Open → Seleccionar carpeta hotel_pms_paseo_las_mercedes
```

### 3. **Setup Automático**
```bash
# Ejecutar script de setup
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

### 4. **Configurar .env**
```bash
cd app
cp .env.example .env

# Editar .env con tus configuraciones:
# DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/hotel_pms_dev"
```

### 5. **¡Desarrollar!**
```bash
yarn dev
# App en http://localhost:3000
```

## 🎯 Workflow en Cursor

### **Inicio Diario**
1. Abrir Cursor
2. **Ctrl+Shift+P** → "Tasks: Run Task" → "🚀 Start Development"
3. **Ctrl+Shift+P** → "Tasks: Run Task" → "📊 Open Prisma Studio"

### **Durante Desarrollo**
- **Ctrl+K** - AI Assistant de Cursor
- **F5** - Debug mode
- **Ctrl+`** - Terminal integrado

### **AI Features en Cursor**
- **Chat Panel** (Ctrl+L) - Pregunta sobre el código
- **Inline Editing** (Ctrl+K) - Genera/modifica código
- **Composer** - Crea archivos completos

## 📁 Estructura del Proyecto

```
hotel_pms_paseo_las_mercedes/
├── app/                           # 📱 Aplicación Next.js
│   ├── app/                       # 🛣️ App Router
│   │   ├── dashboard/            # 🏢 Panel administrativo
│   │   ├── guest-portal/         # 🚪 Portal huéspedes
│   │   └── api/                  # 🔌 API Routes
│   ├── components/               # 🧩 Componentes React
│   ├── lib/                      # 🛠️ Utilidades
│   ├── prisma/                   # 🗄️ Base de datos
│   └── scripts/                  # 📜 Scripts de seed
├── .vscode/                      # ⚙️ Configuraciones Cursor
├── scripts/                      # 🤖 Scripts de desarrollo
└── *.md                         # 📚 Documentación
```

## 🎨 Personalizar para tu Estilo

### **Themes Recomendados**
- Dark+ (default dark)
- Dracula Official
- One Dark Pro
- Material Theme

### **Font Recomendadas**
- Fira Code (con ligatures)
- JetBrains Mono
- Cascadia Code

## 💡 Tips de Productividad

### **Shortcuts Esenciales**
- **Ctrl+P** - Quick file finder
- **Ctrl+Shift+F** - Search across files
- **Ctrl+D** - Select next occurrence
- **F12** - Go to definition
- **Alt+Shift+F** - Format document

### **AI-Powered Development**
- Describe lo que quieres hacer en inglés
- Usa comentarios para guiar al AI
- Selecciona código y pide explicaciones
- Genera tests automáticamente

---

## 🎯 **¡3 Minutos al Desarrollo!**

Con estas configuraciones, tendrás el proyecto corriendo en Cursor en menos de 3 minutos.

**¡Happy coding! 🚀**
