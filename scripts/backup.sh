#!/bin/bash
# Script de Backup para PostgreSQL - Campos Libres
# Uso: ./backup.sh

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/campos_libres_backup_${TIMESTAMP}.sql"
CONTAINER_NAME="campos_libres_db"

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

echo "🔄 Iniciando backup de la base de datos..."
echo "📅 Fecha: $(date)"
echo "📁 Archivo: $BACKUP_FILE"

# Ejecutar pg_dump dentro del contenedor
docker exec -t $CONTAINER_NAME pg_dump -U ${DB_USER} ${DB_NAME} > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completado exitosamente!"
    echo "📦 Archivo guardado en: $BACKUP_FILE"
    
    # Comprimir el backup
    gzip $BACKUP_FILE
    echo "🗜️ Backup comprimido: ${BACKUP_FILE}.gz"
    
    # Mostrar tamaño
    SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "📊 Tamaño del backup: $SIZE"
    
    # Mantener solo los últimos 10 backups
    cd $BACKUP_DIR
    ls -t campos_libres_backup_*.sql.gz | tail -n +11 | xargs -r rm
    echo "🗑️ Backups antiguos eliminados (mantiene últimos 10)"
    
else
    echo "❌ Error al crear el backup"
    exit 1
fi

