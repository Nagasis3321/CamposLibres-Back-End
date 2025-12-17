@echo off
REM Script de backup de PostgreSQL para Windows
REM Uso: backup-db.bat

setlocal enabledelayedexpansion

REM Configuración
set BACKUP_DIR=backups
set DB_NAME=campos_libres_db
set DB_USER=postgres
set CONTAINER_NAME=campos_libres_db

REM Crear timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"
set DATE=%YYYY%%MM%%DD%_%HH%%Min%%Sec%

REM Crear directorio de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Nombre del archivo de backup
set BACKUP_FILE=%BACKUP_DIR%\backup_%DB_NAME%_%DATE%.sql

echo ============================================
echo  BACKUP DE BASE DE DATOS - CAMPOS LIBRES
echo ============================================
echo.
echo Fecha: %DATE% %TIME%
echo Archivo: %BACKUP_FILE%
echo.
echo Iniciando backup...

REM Ejecutar pg_dump dentro del contenedor
docker exec -t %CONTAINER_NAME% pg_dump -U %DB_USER% -d %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Backup completado exitosamente!
    echo.
    echo Archivo: %BACKUP_FILE%
    for %%A in ("%BACKUP_FILE%") do echo Tamano: %%~zA bytes
    echo.
    echo Backups disponibles:
    dir /B /O-D "%BACKUP_DIR%\backup_*.sql"
) else (
    echo.
    echo × Error al crear el backup
    exit /b 1
)

echo.
echo ============================================
echo  BACKUP FINALIZADO
echo ============================================
pause


