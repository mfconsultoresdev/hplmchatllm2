
#!/bin/bash

# 🚀 Script de Setup Local para Hotel PMS
# ======================================

echo "🏨 Setup Local - Sistema PMS Hotel Paseo Las Mercedes"
echo "===================================================="
echo ""

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar prerequisitos
echo "🔍 Verificando prerequisitos..."
echo ""

# Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js no encontrado. Instalar desde https://nodejs.org"
    exit 1
fi

# Yarn
if command_exists yarn; then
    YARN_VERSION=$(yarn --version)
    echo "✅ Yarn: v$YARN_VERSION"
else
    echo "⚠️  Yarn no encontrado. Instalando..."
    npm install -g yarn
fi

# PostgreSQL
if command_exists psql; then
    PSQL_VERSION=$(psql --version)
    echo "✅ PostgreSQL: $PSQL_VERSION"
else
    echo "❌ PostgreSQL no encontrado. Instalar desde https://postgresql.org"
    echo "   O usar Docker: docker run --name hotel-pms-db -e POSTGRES_DB=hotel_pms_dev -e POSTGRES_USER=usuario -e POSTGRES_PASSWORD=contraseña -p 5432:5432 -d postgres:14"
fi

echo ""
echo "📁 Navegando al directorio de la app..."
cd app || { echo "❌ Directorio app/ no encontrado"; exit 1; }

echo ""
echo "📦 Instalando dependencias..."
echo "Esto puede tomar varios minutos..."
yarn install

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

echo ""
echo "🔧 Configurando variables de entorno..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado desde .env.example"
        echo "⚠️  IMPORTANTE: Editar .env con tus configuraciones locales"
    else
        echo "❌ Archivo .env.example no encontrado"
    fi
else
    echo "✅ Archivo .env ya existe"
fi

echo ""
echo "🗄️ Configurando base de datos..."
echo "Generando cliente Prisma..."
npx prisma generate

echo ""
echo "📊 ¿Ejecutar migraciones? (y/n)"
read -r MIGRATE
if [ "$MIGRATE" = "y" ] || [ "$MIGRATE" = "Y" ]; then
    echo "Ejecutando migraciones..."
    npx prisma migrate deploy
    
    echo ""
    echo "🌱 ¿Poblar con datos de prueba? (y/n)"
    read -r SEED
    if [ "$SEED" = "y" ] || [ "$SEED" = "Y" ]; then
        echo "Poblando base de datos..."
        npm run seed
    fi
fi

echo ""
echo "✅ ¡Setup completado!"
echo ""
echo "🚀 Comandos para iniciar desarrollo:"
echo "  yarn dev                    # Servidor de desarrollo"
echo "  npx prisma studio          # Explorador de base de datos"
echo ""
echo "🎯 URLs importantes:"
echo "  http://localhost:3000       # Aplicación principal"
echo "  http://localhost:5555       # Prisma Studio (si está ejecutándose)"
echo ""
echo "💡 En Cursor:"
echo "  - Presiona Ctrl+Shift+P para command palette"
echo "  - Usa F5 para debugging"
echo "  - Panel de tareas: Ctrl+Shift+P → 'Tasks: Run Task'"
echo ""
echo "¡Feliz desarrollo! 🎉"
