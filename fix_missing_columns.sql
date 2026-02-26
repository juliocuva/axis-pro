-- AXIS COFFEE PRO - SCHEMA FIX
-- Agregando columnas faltantes identificadas en el módulo de suministros

ALTER TABLE coffee_purchase_inventory 
ADD COLUMN IF NOT EXISTS coffee_type TEXT DEFAULT 'pergamino',
ADD COLUMN IF NOT EXISTS destination TEXT CHECK (destination IN ('internal', 'export_green', 'export_roasted')) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS export_certificate TEXT;

-- Forzar recarga del esquema en PostgREST
NOTIFY pgrst, 'reload schema';
