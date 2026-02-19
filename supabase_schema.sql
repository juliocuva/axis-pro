-- AXIS OIL - Professional Database Schema

-- 1. Enable Row Level Security (RLS) for Multi-Tenancy
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    model TEXT,
    company_id UUID NOT NULL -- For Multi-Tenancy
);

CREATE TABLE roast_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    master_development_pct DECIMAL NOT NULL,
    master_drop_time TEXT, -- MM:SS
    company_id UUID NOT NULL
);

-- Tabla de Inventario de Compra y Trilla
CREATE TABLE coffee_purchase_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    farmer_name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    altitude INTEGER,
    region TEXT NOT NULL,
    variety TEXT NOT NULL, -- Ej: Geisha, Castillo, Bourbon
    process TEXT NOT NULL, -- Ej: Lavado, Honey, Natural, Semi-Lavado
    purchase_weight DECIMAL NOT NULL, -- Peso en Pergamino
    purchase_date DATE DEFAULT CURRENT_DATE,
    thrashed_weight DECIMAL, -- Peso Excelso después de trilla
    thrashing_yield DECIMAL, -- Factor de rendimiento
    status TEXT CHECK (status IN ('purchased', 'thrashed', 'roasting', 'completed')) DEFAULT 'purchased',
    company_id UUID NOT NULL
);

-- Actualización de Lotes de Tostión para referenciar el inventario
CREATE TABLE roast_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID REFERENCES coffee_purchase_inventory(id),
    batch_id_label TEXT NOT NULL, 
    roast_date DATE NOT NULL,
    green_weight DECIMAL NOT NULL, -- Viene del inventario trillado
    roasted_weight DECIMAL NOT NULL,
    yield_loss DECIMAL GENERATED ALWAYS AS ((green_weight - roasted_weight) / green_weight * 100) STORED,
    profile_id UUID REFERENCES roast_profiles(id),
    machine_id UUID REFERENCES machines(id),
    roaster_name TEXT,
    company_id UUID NOT NULL
);

-- Tabla de Exportaciones de Café Verde
CREATE TABLE green_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_id UUID REFERENCES coffee_purchase_inventory(id),
    lot_id TEXT NOT NULL,
    moisture_content DECIMAL NOT NULL,
    stabilization_days INTEGER NOT NULL,
    destination TEXT NOT NULL,
    transport_type TEXT CHECK (transport_type IN ('air', 'sea')),
    company_id UUID NOT NULL
);

CREATE INDEX idx_green_exports_company ON green_exports(company_id);

-- 2. Indexes for fast retrieval
CREATE INDEX idx_roast_batches_company ON roast_batches(company_id);
CREATE INDEX idx_roast_batches_date ON roast_batches(roast_date);

-- 3. Basic Security Policy (Simplified for MVP)
ALTER TABLE roast_batches ENABLE ROW LEVEL SECURITY;

-- Each user can only see batches from their same company_id
-- (Requires authentication setup in Supabase)
-- CREATE POLICY "Users only see their company batches" ON roast_batches
-- FOR ALL USING (auth.jwt() ->> 'company_id' = company_id::text);
