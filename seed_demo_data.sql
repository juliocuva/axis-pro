-- SCRIPT DE DATOS DE PRUEBA (DATA DEMO) PARA AXIS OIL
-- Copia y pega esto en el SQL Editor de Supabase después de haber creado las tablas.

-- 1. Insertar una empresa ficticia (Axis Demo)
INSERT INTO coffee_purchase_inventory (id, farmer_name, farm_name, altitude, region, variety, process, purchase_weight, purchase_date, status, company_id)
VALUES 
(uuid_generate_v4(), 'Ricardo Gómez', 'Finca La Esperanza', 1750, 'Huila', 'Pink Bourbon', 'honey', 500, CURRENT_DATE - INTERVAL '15 days', 'thrashed', '99999999-9999-9999-9999-999999999999'),
(uuid_generate_v4(), 'Elena Martínez', 'Los Cafetales', 1850, 'Nariño', 'Geisha', 'washed', 250, CURRENT_DATE - INTERVAL '10 days', 'purchased', '99999999-9999-9999-9999-999999999999'),
(uuid_generate_v4(), 'Carlos Rojas', 'Villa Coffee', 1600, 'Antioquia', 'Castillo', 'natural', 1200, CURRENT_DATE - INTERVAL '5 days', 'purchased', '99999999-9999-9999-9999-999999999999');

-- 2. Insertar una máquina de tostión
INSERT INTO machines (id, name, model, company_id)
VALUES ('77777777-7777-7777-7777-777777777777', 'Probat G45', '2024 Series', '99999999-9999-9999-9999-999999999999');

-- 3. Insertar perfiles maestros
INSERT INTO roast_profiles (id, name, master_development_pct, master_drop_time, company_id)
VALUES 
('88888888-8888-8888-8888-888888888888', 'SUPREMO-DXB-OMNI', 18.5, '11:45', '99999999-9999-9999-9999-999999999999'),
(uuid_generate_v4(), 'GEISHA-FILTER-PRO', 15.2, '09:30', '99999999-9999-9999-9999-999999999999');

-- 4. Insertar lotes tostados (Batches) para que el Monitor de Calidad tenga info
INSERT INTO roast_batches (batch_id_label, roast_date, green_weight, roasted_weight, profile_id, machine_id, roaster_name, company_id)
VALUES 
('AX-9421', CURRENT_DATE - INTERVAL '2 days', 30.0, 25.2, '88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'Master Roaster', '99999999-9999-9999-9999-999999999999'),
('AX-9422', CURRENT_DATE - INTERVAL '1 day', 35.0, 29.5, '88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'Master Roaster', '99999999-9999-9999-9999-999999999999');
