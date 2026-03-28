-- 1. INFRAESTRUCTURA BASE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLAS NUCLEARES (Con validación de existencia)
CREATE TABLE IF NOT EXISTS coffee_purchase_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lot_number TEXT UNIQUE NOT NULL,
    farmer_name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    altitude INTEGER,
    region TEXT NOT NULL,
    variety TEXT NOT NULL,
    process TEXT NOT NULL,
    purchase_weight DECIMAL NOT NULL,
    purchase_value DECIMAL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    thrashed_weight DECIMAL,
    thrashing_yield DECIMAL,
    status TEXT CHECK (status IN ('purchased', 'thrashed', 'roasting', 'completed')) DEFAULT 'purchased',
    company_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS physical_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID NOT NULL REFERENCES coffee_purchase_inventory(id) ON DELETE CASCADE,
    moisture_pct DECIMAL,
    water_activity DECIMAL,
    density_gl DECIMAL,
    screen_size_distribution JSONB,
    defects_count JSONB,
    notes TEXT,
    company_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS sca_cupping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID NOT NULL REFERENCES coffee_purchase_inventory(id) ON DELETE CASCADE,
    fragrance_aroma DECIMAL DEFAULT 0,
    overall DECIMAL DEFAULT 0,
    notes TEXT,
    taster_name TEXT,
    company_id UUID NOT NULL
);

-- 3. MÓDULOS DE EXPORTACIÓN Y RETAIL
CREATE TABLE IF NOT EXISTS green_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lot_id TEXT NOT NULL,
    destination TEXT NOT NULL,
    export_date DATE DEFAULT CURRENT_DATE,
    transport_type TEXT,
    moisture_content DECIMAL,
    stabilization_days INTEGER,
    company_id UUID NOT NULL
);

-- 4. ACTUALIZACIÓN DINÁMICA DE COLUMNAS (A prueba de errores 42701)
DO $$ 
BEGIN 
    -- Columnas para coffee_purchase_inventory
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_purchase_inventory' AND column_name='pasilla_weight') THEN
        ALTER TABLE coffee_purchase_inventory ADD COLUMN pasilla_weight DECIMAL DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_purchase_inventory' AND column_name='cisco_weight') THEN
        ALTER TABLE coffee_purchase_inventory ADD COLUMN cisco_weight DECIMAL DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_purchase_inventory' AND column_name='country') THEN
        ALTER TABLE coffee_purchase_inventory ADD COLUMN country TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_purchase_inventory' AND column_name='destination') THEN
        ALTER TABLE coffee_purchase_inventory ADD COLUMN destination TEXT DEFAULT 'internal'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_purchase_inventory' AND column_name='export_certificate') THEN
        ALTER TABLE coffee_purchase_inventory ADD COLUMN export_certificate TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_purchase_inventory' AND column_name='moisture') THEN
        ALTER TABLE coffee_purchase_inventory ADD COLUMN moisture DECIMAL(5,2); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coffee_purchase_inventory' AND column_name='process_data') THEN
        ALTER TABLE coffee_purchase_inventory ADD COLUMN process_data JSONB DEFAULT '{}'::jsonb; END IF;

    -- Columnas para physical_analysis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='physical_analysis' AND column_name='grain_color') THEN
        ALTER TABLE physical_analysis ADD COLUMN grain_color TEXT; END IF;
        
    -- Columnas de Título Valor Inmutable para green_exports
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='status') THEN
        ALTER TABLE green_exports ADD COLUMN status TEXT DEFAULT 'Borrador'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='final_hash') THEN
        ALTER TABLE green_exports ADD COLUMN final_hash TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='port_checkin_timestamp') THEN
        ALTER TABLE green_exports ADD COLUMN port_checkin_timestamp TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='port_checkin_location') THEN
        ALTER TABLE green_exports ADD COLUMN port_checkin_location TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='port_validator_id') THEN
        ALTER TABLE green_exports ADD COLUMN port_validator_id TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='port_match_confirmed') THEN
        ALTER TABLE green_exports ADD COLUMN port_match_confirmed BOOLEAN; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='container_number') THEN
        ALTER TABLE green_exports ADD COLUMN container_number TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='seal_number') THEN
        ALTER TABLE green_exports ADD COLUMN seal_number TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='vessel_name') THEN
        ALTER TABLE green_exports ADD COLUMN vessel_name TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='bol_number') THEN
        ALTER TABLE green_exports ADD COLUMN bol_number TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='bl_type') THEN
        ALTER TABLE green_exports ADD COLUMN bl_type TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='consignee') THEN
        ALTER TABLE green_exports ADD COLUMN consignee TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='eta') THEN
        ALTER TABLE green_exports ADD COLUMN eta TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='green_exports' AND column_name='sacks_count') THEN
        ALTER TABLE green_exports ADD COLUMN sacks_count INTEGER DEFAULT 0; END IF;
END $$;

-- 5. SEGURIDAD TRL-7 (Abierto para testeo acelerado)
ALTER TABLE coffee_purchase_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE sca_cupping DISABLE ROW LEVEL SECURITY;
ALTER TABLE green_exports DISABLE ROW LEVEL SECURITY;

-- 6. REINICIO DE MOTOR API
NOTIFY pgrst, 'reload schema';
