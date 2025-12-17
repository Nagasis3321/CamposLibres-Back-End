-- Migración: Agregar columna 'estado' a la tabla campaigns
-- Fecha: 2025-12-17
-- Descripción: Agrega el campo estado para trackear el progreso de las campañas de vacunación

-- Agregar columna estado si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE campaigns 
        ADD COLUMN estado VARCHAR(50) DEFAULT 'Pendiente';
        
        RAISE NOTICE 'Columna estado agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna estado ya existe';
    END IF;
END $$;

-- Actualizar campañas existentes sin estado a 'Pendiente'
UPDATE campaigns 
SET estado = 'Pendiente' 
WHERE estado IS NULL OR estado = '';

-- Verificar resultado
SELECT COUNT(*) as total_campaigns, estado 
FROM campaigns 
GROUP BY estado;

