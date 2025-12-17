@echo off
REM Script de restauración de PostgreSQL para Windows
REM Uso: restore-db.bat [archivo_backup.sql]

setlocal enabledelayedexpansion

set DB_NAME=campos_libres_db
set DB_USER=postgres
set CONTAINER_NAME=campos_libres_db

echo ============================================
echo  RESTAURAR BASE DE DATOS - CAMPOS LIBRES
echo ============================================
echo.

REM Verificar si se proporcionó archivo de backup
if "%~1"=="" (
    echo ERROR: Debes especificar el archivo de backup
    echo Uso: restore-db.bat [archivo_backup.sql]
    echo.
    echo Backups disponibles:
    dir /B /O-D "backups\backup_*.sql"
    pause
    exit /b 1
)

set BACKUP_FILE=%~1

if not exist "%BACKUP_FILE%" (
    echo ERROR: El archivo %BACKUP_FILE% no existe
    pause
    exit /b 1
)

echo Archivo a restaurar: %BACKUP_FILE%
echo.
echo ADVERTENCIA: Esta operación eliminará todos los datos actuales
echo y los reemplazará con los datos del backup.
echo.
set /p CONFIRM="¿Estás seguro? (S/N): "

if /i not "%CONFIRM%"=="S" (
    echo Operación cancelada
    pause
    exit /b 0
)

echo.
echo Restaurando base de datos...
echo.

REM Copiar archivo al contenedor
docker cp "%BACKUP_FILE%" %CONTAINER_NAME%:/tmp/restore.sql

REM Eliminar conexiones existentes
docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%DB_NAME%' AND pid <> pg_backend_pid();"

REM Eliminar y recrear la base de datos
docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;"
docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;"

REM Restaurar el backup
docker exec -t %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -f /tmp/restore.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Base de datos restaurada exitosamente!
    docker exec -t %CONTAINER_NAME% rm /tmp/restore.sql
) else (
    echo.
    echo × Error al restaurar la base de datos
    exit /b 1
)

echo.
echo ============================================
echo  RESTAURACIÓN FINALIZADA
echo ============================================
pause


