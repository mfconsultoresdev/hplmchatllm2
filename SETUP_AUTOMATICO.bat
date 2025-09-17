
@echo off
echo ========================================
echo    PMS Hotel Paseo Las Mercedes
echo    Configuracion Automatica
echo ========================================
echo.

echo [1/5] Verificando Node.js y Yarn...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Descarga Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

yarn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando Yarn...
    npm install -g yarn
)

echo [2/5] Navegando a la carpeta app...
cd app

echo [3/5] Instalando dependencias (esto puede tomar unos minutos)...
yarn install

echo [4/5] Creando archivo .env basico...
echo DATABASE_URL="postgresql://usuario:password@localhost:5432/hotel_pms" > .env
echo NEXTAUTH_URL="http://localhost:3000" >> .env
echo NEXTAUTH_SECRET="mi-secreto-super-seguro-de-32-caracteres-para-nextauth-hotel-pms" >> .env
echo STRIPE_PUBLISHABLE_KEY="" >> .env
echo STRIPE_SECRET_KEY="" >> .env

echo [5/5] Generando cliente de base de datos...
npx prisma generate

echo.
echo ========================================
echo    CONFIGURACION COMPLETADA!
echo ========================================
echo.
echo SIGUIENTES PASOS:
echo 1. Configurar base de datos en .env
echo    - Usar Supabase: https://supabase.com
echo    - O PostgreSQL local
echo.
echo 2. Ejecutar migraciones:
echo    npx prisma migrate deploy
echo    npm run seed
echo.
echo 3. Iniciar servidor:
echo    yarn dev
echo.
echo 4. Abrir: http://localhost:3000
echo    Login: admin@hotelpaseolm.com / admin123
echo.
pause
