@echo off
REM Script de Restore para PostgreSQL - Campos Libres (Windows)
REM Uso: restore.bat <archivo_backup.sql>

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo.
    echo ERROR: Debe especificar el archivo de backup
    echo Uso: restore.bat ^<archivo_backup.sql^>
    echo.
    echo Backups disponibles:
    dir /b backups\campos_libres_backup_*.sql 2>nul
    if errorlevel 1 echo No hay backups disponibles
    exit /b 1
)

set BACKUP_FILE=%~1
set CONTAINER_NAME=campos_libres_db

REM Cargar variables de entorno desde .env
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do set %%a=%%b

REM Verificar que el archivo existe
if not exist "%BACKUP_FILE%" (
    echo ERROR: El archivo %BACKUP_FILE% no existe
    exit /b 1
)

echo.
echo ====================================
echo   ADVERTENCIA
echo ====================================
echo.
echo Esta operacion ELIMINARA todos los datos actuales
echo Archivo a restaurar: %BACKUP_FILE%
echo.
set /p CONFIRM="Desea continuar? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo Operacion cancelada
    exit /b 0
)

echo.
echo ====================================
echo   INICIANDO RESTAURACION
echo ====================================
echo.

REM Eliminar la base de datos actual y recrearla
echo Eliminando base de datos actual...
docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"
docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;"

REM Restaurar desde el backup
echo Restaurando datos...
type "%BACKUP_FILE%" | docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME%

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo   RESTAURACION COMPLETADA
    echo ====================================
    echo.
) else (
    echo.
    echo ====================================
    echo   ERROR DURANTE LA RESTAURACION
    echo ====================================
    echo.
    exit /b 1
)

pause

