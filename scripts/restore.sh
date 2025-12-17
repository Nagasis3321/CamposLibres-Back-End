#!/bin/bash
# Script de Restore para PostgreSQL - Campos Libres
# Uso: ./restore.sh <archivo_backup.sql.gz>

if [ -z "$1" ]; then
    echo "❌ Error: Debe especificar el archivo de backup"
    echo "Uso: ./restore.sh <archivo_backup.sql.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -lh ./backups/campos_libres_backup_*.sql.gz 2>/dev/null || echo "No hay backups disponibles"
    exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="campos_libres_db"

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo $BACKUP_FILE no existe"
    exit 1
fi

echo "⚠️  ADVERTENCIA: Esta operación eliminará todos los datos actuales"
echo "📁 Archivo a restaurar: $BACKUP_FILE"
read -p "¿Desea continuar? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo "🔄 Iniciando restauración..."

# Descomprimir si es necesario
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "🗜️ Descomprimiendo backup..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c $BACKUP_FILE > $TEMP_FILE
    RESTORE_FROM=$TEMP_FILE
else
    RESTORE_FROM=$BACKUP_FILE
fi

# Eliminar la base de datos actual y recrearla
echo "🗑️ Eliminando base de datos actual..."
docker exec -t $CONTAINER_NAME psql -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec -t $CONTAINER_NAME psql -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DB_NAME};"

# Restaurar desde el backup
echo "📥 Restaurando datos..."
cat $RESTORE_FROM | docker exec -i $CONTAINER_NAME psql -U ${DB_USER} -d ${DB_NAME}

if [ $? -eq 0 ]; then
    echo "✅ Restauración completada exitosamente!"
    
    # Limpiar archivo temporal si se descomprimió
    if [[ $BACKUP_FILE == *.gz ]]; then
        rm -f $TEMP_FILE
    fi
else
    echo "❌ Error durante la restauración"
    exit 1
fi

