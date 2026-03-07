@echo off
REM Reconstruye los contenedores del backend CON los cambios recientes.
REM NO elimina el volumen de la BD: los datos (usuarios, etc.) se mantienen.
REM Uso: desde Back-End ejecutar: scripts\rebuild-backend.bat

setlocal

cd /d "%~dp0.."
if not exist "docker-compose.yml" (
    echo Error: docker-compose.yml no encontrado. Ejecuta este script desde Back-End.
    exit /b 1
)

echo.
echo ============================================
echo   RECONSTRUIR CONTENEDORES (mantener BD)
echo ============================================
echo.
echo Deteniendo contenedores (sin borrar volumen de BD)...
docker-compose down
if %errorlevel% neq 0 (
    echo Error al detener contenedores.
    exit /b 1
)

echo.
echo Reconstruyendo imagenes y arrancando...
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo Error al levantar contenedores.
    exit /b 1
)

echo.
echo ============================================
echo   CONTENEDORES LISTOS
echo ============================================
echo.
echo La base de datos NO fue modificada (mismos usuarios y datos).
echo API: http://localhost:3000
echo.
docker-compose ps
echo.
pause
