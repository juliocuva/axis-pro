-- =========================================================
-- REINICIO MAESTRO AXIS COFFEE PRO - ESQUEMA INTEGRAL V2.0
-- =========================================================

-- Limpieza Total (Cuidado: Borra datos existentes)
DROP TABLE IF EXISTS green_exports;
DROP TABLE IF EXISTS roast_batches;
DROP TABLE IF EXISTS coffee_purchase_inventory;
DROP TABLE IF EXISTS roast_profiles;
DROP TABLE IF EXISTS machines;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MAQUINARIA
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    model TEXT,
    company_id UUID NOT NULL
);

-- 2. PERFILES MAESTROS
CREATE TABLE roast_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    master_development_pct DECIMAL NOT NULL,
    master_drop_time TEXT, -- MM:SS
    company_id UUID NOT NULL
);

-- 3. INVENTARIO Y ORIGEN (MODULO 1)
CREATE TABLE coffee_purchase_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lot_number TEXT UNIQUE NOT NULL, -- ID Manual o AX-XXXX
    farmer_name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    altitude INTEGER,
    country TEXT,
    region TEXT NOT NULL,
    variety TEXT NOT NULL,
    process TEXT NOT NULL,
    purchase_weight DECIMAL NOT NULL, -- Pergamino
    purchase_value DECIMAL, -- Valor en COP
    purchase_date DATE DEFAULT CURRENT_DATE,
    thrashed_weight DECIMAL, -- Excelso
    pasilla_weight DECIMAL DEFAULT 0, -- Pasilla
    cisco_weight DECIMAL DEFAULT 0, -- Cisco
    thrashing_yield DECIMAL, -- Factor
    humidity DECIMAL, -- Humedad en trilla
    status TEXT CHECK (status IN ('purchased', 'thrashed', 'roasting', 'completed')) DEFAULT 'purchased',
    company_id UUID NOT NULL,
    coffee_type TEXT DEFAULT 'pergamino',
    destination TEXT CHECK (destination IN ('internal', 'export_green', 'export_roasted')) DEFAULT 'internal',
    export_certificate TEXT
);

-- 4. PRODUCCIÓN (ROAST INTELLIGENCE)
CREATE TABLE roast_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID REFERENCES coffee_purchase_inventory(id) ON DELETE SET NULL,
    batch_id_label TEXT NOT NULL, 
    process TEXT NOT NULL,
    roast_date DATE NOT NULL DEFAULT CURRENT_DATE,
    green_weight DECIMAL NOT NULL,
    roasted_weight DECIMAL NOT NULL,
    yield_loss DECIMAL GENERATED ALWAYS AS ((green_weight - roasted_weight) / NULLIF(green_weight, 0) * 100) STORED,
    profile_id UUID REFERENCES roast_profiles(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    roaster_name TEXT,
    consistency_score DECIMAL, -- Puntaje de Calibración Espectral
    sca_score_predicted DECIMAL, -- Basado en la IA del Cierre de Círculo
    company_id UUID NOT NULL
);

-- 5. GLOBAL TRADE (EXPORTS)
CREATE TABLE green_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lot_id TEXT NOT NULL, -- Flexible para Global Trade
    moisture_content DECIMAL NOT NULL,
    stabilization_days INTEGER NOT NULL,
    destination TEXT NOT NULL,
    transport_type TEXT CHECK (transport_type IN ('air', 'sea')),
    export_date DATE DEFAULT CURRENT_DATE,
    company_id UUID NOT NULL
);

-- 6. RETAIL CONNECT (PRODUCTO TERMINADO)
CREATE TABLE retail_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    batch_id UUID REFERENCES roast_batches(id) ON DELETE CASCADE,
    package_size_grams INTEGER NOT NULL DEFAULT 250, -- 250, 500, 1000
    units_produced INTEGER NOT NULL,
    total_grams_produced DECIMAL NOT NULL, -- CMT: Masa Total Inicial
    total_grams_available DECIMAL NOT NULL, -- CMT: Masa Total Actual
    sku TEXT UNIQUE, -- Código de barras o SKU interno
    retail_price_cop DECIMAL,
    status TEXT CHECK (status IN ('fresh', 'stale', 'sold_out')) DEFAULT 'fresh',
    company_id UUID NOT NULL
);

CREATE TABLE sales_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID REFERENCES retail_inventory(id) ON DELETE SET NULL,
    units_sold INTEGER NOT NULL,
    grams_deducted DECIMAL NOT NULL, -- CMT: Masa real restada
    delivery_type TEXT CHECK (delivery_type IN ('grano', 'molido')), 
    total_sale_cop DECIMAL NOT NULL,
    sale_channel TEXT NOT NULL, -- Ej: E-commerce, POS Físico
    customer_feedback_score INTEGER CHECK (customer_feedback_score BETWEEN 1 AND 5),
    customer_comments TEXT,
    company_id UUID NOT NULL
);

-- INDEXACIÓN PARA RENDIMIENTO
CREATE INDEX idx_cp_inventory_lot ON coffee_purchase_inventory(lot_number);
CREATE INDEX idx_roast_batches_label ON roast_batches(batch_id_label);
CREATE INDEX idx_green_exports_lot ON green_exports(lot_id);
CREATE INDEX idx_retail_sku ON retail_inventory(sku);

-- =========================================================
-- MÓDULO DE CALIDAD (MIGRACIÓN MODULAR)
-- =========================================================

-- 1. Create Physical Analysis table
CREATE TABLE IF NOT EXISTS physical_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID REFERENCES coffee_purchase_inventory(id) ON DELETE CASCADE,
    moisture_pct DECIMAL, -- Humedad %
    water_activity DECIMAL, -- Actividad de agua (aW)
    density_gl DECIMAL, -- Densidad g/L
    screen_size_distribution JSONB, -- Distribución de mallas
    defects_count JSONB, -- Conteo de defectos
    grain_color TEXT,
    notes TEXT,
    company_id UUID NOT NULL
);

-- 2. Create SCA Cupping table
CREATE TABLE IF NOT EXISTS sca_cupping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID REFERENCES coffee_purchase_inventory(id) ON DELETE CASCADE,
    fragrance_aroma DECIMAL DEFAULT 0,
    flavor DECIMAL DEFAULT 0,
    aftertaste DECIMAL DEFAULT 0,
    acidity DECIMAL DEFAULT 0,
    body DECIMAL DEFAULT 0,
    balance DECIMAL DEFAULT 0,
    uniformity DECIMAL DEFAULT 10,
    clean_cup DECIMAL DEFAULT 10,
    sweetness DECIMAL DEFAULT 10,
    overall DECIMAL DEFAULT 0,
    defects_score DECIMAL DEFAULT 0,
    total_score DECIMAL GENERATED ALWAYS AS (
        fragrance_aroma + flavor + aftertaste + acidity + body + balance + uniformity + clean_cup + sweetness + overall - (defects_score * 2)
    ) STORED,
    notes TEXT,
    taster_name TEXT,
    company_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_physical_analysis_inventory ON physical_analysis(inventory_id);
CREATE INDEX IF NOT EXISTS idx_sca_cupping_inventory ON sca_cupping(inventory_id);

-- SEGURIDAD RLS (OPCIONAL)
ALTER TABLE roast_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffee_purchase_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sca_cupping ENABLE ROW LEVEL SECURITY;

-- RECARGAR CACHÉ DE ESQUEMA (CRÍTICO)
NOTIFY pgrst, 'reload schema';
