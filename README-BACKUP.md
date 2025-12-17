# 📦 Sistema de Respaldo de Base de Datos - Campos Libres

## 🎯 Objetivo
Proteger los datos de producción mediante backups automáticos y manuales de la base de datos PostgreSQL.

---

## 🔧 Configuración Inicial

### 1. Asegurar persistencia de datos

El archivo `docker-compose.yml` debe tener el volumen configurado:

```yaml
services:
  db:
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ✅ Datos persisten aquí

volumes:
  postgres_data:  # ✅ Volumen nombrado
```

**✅ Ya está configurado** - Los datos persisten entre reinicios de contenedores.

---

## 💾 Crear Backup Manual

### Windows:
```bash
# En PowerShell o CMD
cd "D:\Mis Proyectos\Campos-Libres\Back-End"
backup-db.bat
```

### Linux/Mac:
```bash
cd /path/to/Back-End
chmod +x backup-db.sh
./backup-db.sh
```

**Resultado:**
- Archivo: `backups/backup_campos_libres_db_YYYYMMDD_HHMMSS.sql.gz`
- Los backups se limpian automáticamente después de 30 días

---

## 🔄 Restaurar desde Backup

### Windows:
```bash
cd "D:\Mis Proyectos\Campos-Libres\Back-End"
restore-db.bat backups\backup_campos_libres_db_20250117_143022.sql
```

### Linux/Mac:
```bash
cd /path/to/Back-End
gunzip backups/backup_campos_libres_db_20250117_143022.sql.gz
./restore-db.sh backups/backup_campos_libres_db_20250117_143022.sql
```

**⚠️ ADVERTENCIA:** La restauración eliminará todos los datos actuales.

---

## ⏰ Backup Automático (Recomendado)

### Opción 1: Tarea Programada de Windows

1. Abrir **Programador de Tareas** (Task Scheduler)
2. Crear Tarea Básica:
   - Nombre: `Backup Campos Libres DB`
   - Disparador: **Diario a las 2:00 AM**
   - Acción: **Iniciar programa**
     - Programa: `D:\Mis Proyectos\Campos-Libres\Back-End\backup-db.bat`
     - Iniciar en: `D:\Mis Proyectos\Campos-Libres\Back-End`

### Opción 2: Cron (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Agregar línea (backup diario a las 2:00 AM)
0 2 * * * cd /path/to/Back-End && ./backup-db.sh >> backup.log 2>&1
```

---

## 📂 Estructura de Archivos

```
Back-End/
├── backups/                              # ✅ Backups almacenados aquí
│   ├── backup_campos_libres_db_20250117_020000.sql.gz
│   ├── backup_campos_libres_db_20250116_020000.sql.gz
│   └── ...
├── backup-db.bat                         # Script de backup (Windows)
├── backup-db.sh                          # Script de backup (Linux/Mac)
├── restore-db.bat                        # Script de restauración (Windows)
└── README-BACKUP.md                      # Esta guía
```

---

## 🔐 Mejores Prácticas

### 1. **Backup Antes de Cambios Críticos**
```bash
# Antes de actualizaciones o migraciones
backup-db.bat
```

### 2. **Copias Externas**
Copia los backups a otra ubicación:
- ☁️ Google Drive / OneDrive / Dropbox
- 💾 Disco externo
- 🌐 Servidor remoto

### 3. **Verificar Backups Regularmente**
```bash
# Restaurar en ambiente de prueba
restore-db.bat backups\ultimo_backup.sql
```

### 4. **Mantener Múltiples Copias**
- Backups diarios (últimos 30 días)
- Backups semanales (últimos 3 meses)
- Backups mensuales (último año)

---

## 🚨 Recuperación de Desastres

### Si pierdes todos los datos:

1. **Detener contenedores:**
   ```bash
   docker-compose down
   ```

2. **Restaurar desde backup:**
   ```bash
   docker-compose up -d db
   # Esperar 10 segundos
   restore-db.bat backups\backup_mas_reciente.sql
   ```

3. **Reiniciar todos los servicios:**
   ```bash
   docker-compose up -d
   ```

---

## 📊 Comandos Útiles

### Ver tamaño de la base de datos:
```bash
docker exec -it campos_libres_db psql -U postgres -d campos_libres_db -c "SELECT pg_size_pretty(pg_database_size('campos_libres_db'));"
```

### Listar backups:
```bash
# Windows
dir /O-D backups

# Linux/Mac
ls -lht backups/
```

### Verificar último backup:
```bash
# Windows
dir /O-D /B backups | more

# Linux/Mac
ls -t backups/ | head -1
```

---

## ⚡ Backup Rápido con Docker Compose

Agregar al `docker-compose.yml`:

```yaml
services:
  backup:
    image: postgres:15-alpine
    depends_on:
      - db
    volumes:
      - ./backups:/backups
      - postgres_data:/var/lib/postgresql/data:ro
    environment:
      PGPASSWORD: tu_password
    command: >
      sh -c "while true; do
        pg_dump -h db -U postgres -d campos_libres_db > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql
        sleep 86400
      done"
    profiles: ["backup"]  # Solo se ejecuta con: docker-compose --profile backup up
```

**Uso:**
```bash
# Iniciar servicio de backup automático
docker-compose --profile backup up -d backup
```

---

## ✅ Checklist de Seguridad

- [ ] Backups automáticos configurados (diarios)
- [ ] Backups guardados en ubicación externa
- [ ] Probado proceso de restauración
- [ ] Documentado último backup exitoso
- [ ] Monitoreo de espacio en disco
- [ ] Notificaciones de errores configuradas

---

## 📞 Soporte

Si tienes problemas con los backups:
1. Verificar que Docker esté corriendo
2. Verificar permisos de escritura en carpeta `backups/`
3. Revisar logs: `docker logs campos_libres_db`

---

**🔒 ¡Tus datos están seguros!**


