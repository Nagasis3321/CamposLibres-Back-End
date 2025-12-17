# 🔐 Sistema de Respaldo de Base de Datos - Campos Libres

## 📋 Descripción

Este sistema proporciona scripts automatizados para realizar backups y restauraciones de la base de datos PostgreSQL del proyecto Campos Libres.

## 🚀 Uso Rápido

### Windows

#### Crear un Backup
```bash
cd Back-End\scripts
backup.bat
```

#### Restaurar desde un Backup
```bash
cd Back-End\scripts
restore.bat ..\backups\campos_libres_backup_YYYYMMDD_HHMMSS.sql
```

### Linux/Mac

#### Crear un Backup
```bash
cd Back-End/scripts
chmod +x backup.sh
./backup.sh
```

#### Restaurar desde un Backup
```bash
cd Back-End/scripts
chmod +x restore.sh
./restore.sh ../backups/campos_libres_backup_YYYYMMDD_HHMMSS.sql.gz
```

## 📁 Estructura de Archivos

```
Back-End/
├── scripts/
│   ├── backup.bat          # Script de backup para Windows
│   ├── backup.sh           # Script de backup para Linux/Mac
│   ├── restore.bat         # Script de restauración para Windows
│   └── restore.sh          # Script de restauración para Linux/Mac
└── backups/                # Directorio donde se guardan los backups
    └── campos_libres_backup_YYYYMMDD_HHMMSS.sql[.gz]
```

## ⚙️ Características

### Backup Automático
- ✅ Genera backups con timestamp en el nombre
- ✅ Comprime automáticamente los backups (Linux/Mac)
- ✅ Mantiene solo los últimos 10 backups
- ✅ Muestra el tamaño del archivo generado

### Restauración Segura
- ✅ Solicita confirmación antes de eliminar datos
- ✅ Lista backups disponibles si no se especifica archivo
- ✅ Maneja archivos comprimidos automáticamente (Linux/Mac)
- ✅ Elimina y recrea la base de datos completamente

## 📝 Procedimientos Recomendados

### Backup Manual Antes de Cambios Importantes

Antes de realizar cambios significativos o cargar datos reales:

```bash
# Windows
cd Back-End\scripts
backup.bat

# Linux/Mac
cd Back-End/scripts
./backup.sh
```

### Backup Programado (Recomendado)

#### Windows (Programador de Tareas)

1. Abrir "Programador de tareas"
2. Crear tarea básica
3. Nombre: "Backup Campos Libres Diario"
4. Desencadenador: Diario a las 2:00 AM
5. Acción: Iniciar programa
   - Programa: `C:\Mis Proyectos\Campos-Libres\Back-End\scripts\backup.bat`
   - Directorio: `C:\Mis Proyectos\Campos-Libres\Back-End`

#### Linux/Mac (Cron)

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2:00 AM
0 2 * * * cd /ruta/a/Campos-Libres/Back-End && ./scripts/backup.sh
```

## 🔄 Backup con Docker Compose

### Volúmenes Persistentes

El `docker-compose.yml` ya está configurado con un volumen persistente:

```yaml
volumes:
  postgres_data:/var/lib/postgresql/data
```

**⚠️ IMPORTANTE:** Al ejecutar `docker-compose down -v`, se eliminan TODOS los volúmenes y datos. Para mantener los datos, usar solo:

```bash
docker-compose down     # Detiene sin eliminar volúmenes
docker-compose up -d    # Reinicia manteniendo datos
```

### Backup del Volumen de Docker

```bash
# Crear backup del volumen completo
docker run --rm -v campos_libres_postgres_data:/data -v ${PWD}/backups:/backup ubuntu tar czf /backup/volume_backup_$(date +%Y%m%d).tar.gz /data
```

## 🆘 Recuperación ante Desastres

### Escenario 1: Datos Corruptos o Erróneos

```bash
# 1. Listar backups disponibles
dir backups\campos_libres_backup_*.sql     # Windows
ls -lh backups/campos_libres_backup_*.sql.gz  # Linux/Mac

# 2. Restaurar desde el backup más reciente
restore.bat backups\campos_libres_backup_YYYYMMDD_HHMMSS.sql
./restore.sh backups/campos_libres_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Escenario 2: Contenedores Eliminados Accidentalmente

```bash
# 1. Reconstruir contenedores
docker-compose up -d

# 2. Si se usó -v y se perdieron los datos, restaurar desde backup
restore.bat backups\campos_libres_backup_YYYYMMDD_HHMMSS.sql
```

### Escenario 3: Migración a Nuevo Servidor

```bash
# 1. En el servidor antiguo, crear backup
backup.bat  # o ./backup.sh

# 2. Copiar el archivo de backup al nuevo servidor
# 3. En el nuevo servidor, levantar los contenedores
docker-compose up -d

# 4. Restaurar el backup
restore.bat backups\campos_libres_backup_YYYYMMDD_HHMMSS.sql
```

## ✅ Verificación de Backups

Después de crear un backup, verifica que sea válido:

```bash
# Windows
dir backups

# Linux/Mac
ls -lh backups/

# Verificar contenido del backup (primeras líneas)
head -n 20 backups\campos_libres_backup_YYYYMMDD_HHMMSS.sql
zcat backups/campos_libres_backup_YYYYMMDD_HHMMSS.sql.gz | head -n 20
```

## 🔒 Seguridad

### Recomendaciones

1. **Backups Offsite**: Copiar backups a almacenamiento externo (Google Drive, Dropbox, etc.)
2. **Encriptación**: Para datos sensibles, encriptar los backups
3. **Pruebas Regulares**: Probar restauraciones periódicamente
4. **Múltiples Versiones**: El sistema mantiene los últimos 10 backups automáticamente

### Encriptar un Backup (Opcional)

```bash
# Windows (requiere 7-Zip instalado)
7z a -p -mhe=on backups\backup_encrypted.7z backups\campos_libres_backup_YYYYMMDD_HHMMSS.sql

# Linux/Mac
gpg -c backups/campos_libres_backup_YYYYMMDD_HHMMSS.sql.gz
```

## 📊 Monitoreo

### Tamaño de Backups

Los backups típicamente ocupan:
- Base de datos pequeña (desarrollo): 1-5 MB
- Base de datos con datos reales: 10-100 MB
- Base de datos grande: > 100 MB

### Espacio en Disco

Verificar espacio disponible regularmente:

```bash
# Windows
dir backups

# Linux/Mac
du -sh backups/
df -h
```

## 🐛 Solución de Problemas

### Error: "docker: command not found"

Asegúrate de que Docker Desktop esté instalado y en ejecución.

### Error: "Permission denied"

```bash
# Linux/Mac: Dar permisos de ejecución
chmod +x backup.sh restore.sh
```

### Error: "Container not found"

```bash
# Verificar que los contenedores estén corriendo
docker ps

# Si no están corriendo, iniciarlos
docker-compose up -d
```

### Backup muy lento

Si el backup tarda mucho:
1. Verificar espacio en disco
2. Verificar que Docker tenga recursos suficientes (Settings > Resources)
3. Considerar limpiar datos antiguos no necesarios

## 📞 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Verificar logs de Docker: `docker-compose logs db`
3. Contactar al administrador del sistema

