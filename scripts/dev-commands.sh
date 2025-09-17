
#!/bin/bash

# 🛠️ Comandos Útiles para Desarrollo - Hotel PMS
# ============================================

echo "🔧 Comandos de Desarrollo Disponibles"
echo "===================================="
echo ""

case "$1" in
    "fresh")
        echo "🧹 Limpieza completa y reinstalación..."
        cd app
        rm -rf .next
        rm -rf node_modules/.cache  
        yarn install
        npx prisma generate
        echo "✅ Proyecto limpio y listo"
        ;;
    
    "db-reset")
        echo "🗄️ Reseteando base de datos..."
        cd app
        npx prisma migrate reset --force
        npm run seed
        echo "✅ Base de datos reseteada y poblada"
        ;;
    
    "full-seed")
        echo "🌱 Poblando base de datos completa..."
        cd app
        npm run seed
        echo "✅ Datos base poblados"
        ;;
    
    "type-check")
        echo "🔍 Verificando tipos TypeScript..."
        cd app
        npx tsc --noEmit
        ;;
    
    "lint-fix")
        echo "🔧 Corrigiendo errores de linting..."
        cd app
        yarn lint --fix
        ;;
    
    "studio")
        echo "📊 Abriendo Prisma Studio..."
        cd app
        npx prisma studio
        ;;
    
    "dev")
        echo "🚀 Iniciando servidor de desarrollo..."
        cd app
        yarn dev
        ;;
    
    "help"|*)
        echo "📋 Comandos disponibles:"
        echo ""
        echo "  ./dev-commands.sh fresh       # Limpieza completa y reinstalación"
        echo "  ./dev-commands.sh db-reset    # Reset completo de base de datos"
        echo "  ./dev-commands.sh full-seed   # Poblar base de datos"
        echo "  ./dev-commands.sh type-check  # Verificar tipos TypeScript"
        echo "  ./dev-commands.sh lint-fix    # Corregir linting"
        echo "  ./dev-commands.sh studio      # Abrir Prisma Studio"
        echo "  ./dev-commands.sh dev         # Iniciar desarrollo"
        echo "  ./dev-commands.sh help        # Mostrar esta ayuda"
        echo ""
        echo "💡 Ejemplos de uso:"
        echo "  chmod +x scripts/dev-commands.sh"
        echo "  ./scripts/dev-commands.sh fresh"
        echo "  ./scripts/dev-commands.sh dev"
        ;;
esac
