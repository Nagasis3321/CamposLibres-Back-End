#!/bin/bash
# Reconstruye los contenedores del backend CON los cambios recientes.
# NO elimina el volumen de la BD: los datos (usuarios, etc.) se mantienen.
# Uso: desde Back-End ejecutar: ./scripts/rebuild-backend.sh

set -e
cd "$(dirname "$0")/.."

if [ ! -f "docker-compose.yml" ]; then
  echo "Error: docker-compose.yml no encontrado. Ejecuta este script desde Back-End."
  exit 1
fi

echo ""
echo "============================================"
echo "  RECONSTRUIR CONTENEDORES (mantener BD)"
echo "============================================"
echo ""
echo "Deteniendo contenedores (sin borrar volumen de BD)..."
docker-compose down

echo ""
echo "Reconstruyendo imágenes y arrancando..."
docker-compose up --build -d

echo ""
echo "============================================"
echo "  CONTENEDORES LISTOS"
echo "============================================"
echo ""
echo "La base de datos NO fue modificada (mismos usuarios y datos)."
echo "API: http://localhost:3000"
echo ""
docker-compose ps
