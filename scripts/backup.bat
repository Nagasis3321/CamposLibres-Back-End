@echo off
REM Script de Backup para PostgreSQL - Campos Libres (Windows)
REM Uso: backup.bat

setlocal enabledelayedexpansion

REM Configuración
set BACKUP_DIR=backups
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\campos_libres_backup_%TIMESTAMP%.sql
set CONTAINER_NAME=campos_libres_db

REM Cargar variables de entorno desde .env
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do set %%a=%%b

REM Crear directorio de backups si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo ====================================
echo   BACKUP DE BASE DE DATOS
echo ====================================
echo.
echo Fecha: %date% %time%
echo Archivo: %BACKUP_FILE%
echo.

REM Ejecutar pg_dump dentro del contenedor
docker exec -t %CONTAINER_NAME% pg_dump -U %DB_USER% %DB_NAME% > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo   BACKUP COMPLETADO EXITOSAMENTE
    echo ====================================
    echo.
    echo Archivo guardado en: %BACKUP_FILE%
    echo.
    
    REM Mantener solo los últimos 10 backups
    for /f "skip=10 delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\campos_libres_backup_*.sql" 2^>nul') do (
        del "%BACKUP_DIR%\%%f"
        echo Backup antiguo eliminado: %%f
    )
) else (
    echo.
    echo ====================================
    echo   ERROR AL CREAR EL BACKUP
    echo ====================================
    echo.
    exit /b 1
)

pause

