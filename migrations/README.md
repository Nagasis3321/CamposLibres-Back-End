# 🔄 Migraciones de Base de Datos

Este directorio contiene scripts SQL para migrar la base de datos cuando hay cambios en el esquema.

## 📋 Migraciones Disponibles

### `add-estado-column.sql`
**Fecha:** 2025-12-17  
**Descripción:** Agrega el campo `estado` a la tabla `campaigns` para trackear el progreso de las campañas de vacunación.

**Estados disponibles:**
- `Pendiente` - Campaña planificada pero no iniciada
- `En Progreso` - Campaña en proceso de ejecución
- `Completada` - Campaña finalizada exitosamente
- `Cancelada` - Campaña cancelada

## 🚀 Cómo Ejecutar Migraciones

### Opción 1: Ejecutar directamente en el contenedor (Recomendado)

```bash
# Desde el directorio Back-End
docker exec -i campos_libres_db psql -U campos_user -d campos_libres < migrations/add-estado-column.sql
```

### Opción 2: Ejecutar con psql desde el host

```bash
# Si tienes PostgreSQL client instalado localmente
psql -h localhost -p 5432 -U campos_user -d campos_libres -f migrations/add-estado-column.sql
```

### Opción 3: Conectarse al contenedor y ejecutar manualmente

```bash
# 1. Conectarse al contenedor
docker exec -it campos_libres_db psql -U campos_user -d campos_libres

# 2. Copiar y pegar el contenido del archivo SQL
# O usar \i si el archivo está montado en el contenedor
```

### Opción 4: Reconstruir contenedores (más lento pero garantiza sincronización)

```bash
cd Back-End
docker-compose down
docker-compose up --build -d
```

**Nota:** TypeORM sincroniza automáticamente el esquema en desarrollo, pero para producción se recomienda usar migraciones.

## ✅ Verificar Migración

```bash
# Conectarse a la base de datos
docker exec -it campos_libres_db psql -U campos_user -d campos_libres

# Verificar que la columna existe
\d campaigns

# Verificar datos
SELECT COUNT(*) as total, estado FROM campaigns GROUP BY estado;
```

## 🔐 Backup Antes de Migrar

**⚠️ IMPORTANTE:** Siempre haz un backup antes de ejecutar migraciones en producción.

```bash
cd Back-End/scripts
./backup.sh       # Linux/Mac
backup.bat        # Windows
```

## 📝 Crear Nueva Migración

1. Crear archivo SQL en este directorio
2. Usar nomenclatura: `YYYY-MM-DD-descripcion.sql`
3. Incluir:
   - Comentarios descriptivos
   - Verificaciones (IF NOT EXISTS)
   - Mensajes de log (RAISE NOTICE)
   - Script de rollback si es posible
4. Documentar en este README

## 🔄 Orden de Ejecución

Las migraciones deben ejecutarse en orden cronológico:

1. `add-estado-column.sql` - 2025-12-17

## 🛠️ Troubleshooting

### Error: "relation campaigns does not exist"
- La base de datos no está inicializada
- Solución: Ejecutar `docker-compose up -d` para que TypeORM cree las tablas

### Error: "column already exists"
- La migración ya se ejecutó
- Es seguro ignorar este error, el script lo maneja automáticamente

### Error: "permission denied"
- Usuario sin permisos
- Solución: Verificar usuario y credenciales en `.env`

