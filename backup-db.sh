#!/bin/bash
# Script de backup de PostgreSQL para Campos Libres
# Uso: ./backup-db.sh

# Configuración
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="campos_libres_db"
DB_USER="postgres"
CONTAINER_NAME="campos_libres_db"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Nombre del archivo de backup
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql"

echo "🔄 Iniciando backup de la base de datos..."
echo "📅 Fecha: $(date)"
echo "📂 Archivo: $BACKUP_FILE"

# Ejecutar pg_dump dentro del contenedor
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Comprimir el backup
    gzip "$BACKUP_FILE"
    echo "✅ Backup completado exitosamente!"
    echo "📦 Archivo comprimido: ${BACKUP_FILE}.gz"
    echo "💾 Tamaño: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
    
    # Limpiar backups antiguos (mantener solo los últimos 30 días)
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
    echo "🧹 Backups antiguos limpiados (>30 días)"
else
    echo "❌ Error al crear el backup"
    exit 1
fi

echo "📊 Backups disponibles:"
ls -lh "$BACKUP_DIR"


