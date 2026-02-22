-- Migration to Modular Architecture
-- Phase 1: Isolation of Supply and Quality Analysis

-- 1. Create Physical Analysis table
CREATE TABLE IF NOT EXISTS physical_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID REFERENCES coffee_purchase_inventory(id) ON DELETE CASCADE,
    moisture_pct DECIMAL, -- Humedad %
    water_activity DECIMAL, -- Actividad de agua (aW)
    density_gl DECIMAL, -- Densidad g/L
    screen_size_distribution JSONB, -- Distribución de mallas (Ej: { "size_18": 15, "size_17": 40 ... })
    defects_count JSONB, -- Conteo de defectos (Primarios/Secundarios)
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

-- Indices para optimización
CREATE INDEX IF NOT EXISTS idx_physical_analysis_inventory ON physical_analysis(inventory_id);
CREATE INDEX IF NOT EXISTS idx_sca_cupping_inventory ON sca_cupping(inventory_id);
CREATE INDEX IF NOT EXISTS idx_physical_analysis_company ON physical_analysis(company_id);
CREATE INDEX IF NOT EXISTS idx_sca_cupping_company ON sca_cupping(company_id);
