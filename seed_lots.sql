-- AXIS COFFEE PRO - Demo Seed Data
-- 5 Lotes Reales para el Historial del Módulo Supply

INSERT INTO coffee_purchase_inventory 
(farmer_name, farm_name, lot_number, altitude, country, region, variety, process, purchase_weight, purchase_value, purchase_date, company_id, status)
VALUES 
('CARLOS SALAZAR', 'FINCA LA ESPERANZA', 'AX-7721', 1850, 'Colombia', 'Huila', 'Pink Bourbon', 'washed', 250, 4500000, CURRENT_DATE - INTERVAL '2 days', '99999999-9999-9999-9999-999999999999', 'purchased'),
('CESAR RAMIREZ', 'EL MIRADOR', 'AX-8942', 1720, 'Colombia', 'Antioquia', 'Caturra', 'honey', 180, 2800000, CURRENT_DATE - INTERVAL '1 day', '99999999-9999-9999-9999-999999999999', 'purchased'),
('MARIA FORERO', 'VILLA RICA', 'AX-3310', 1600, 'Colombia', 'Tolima', 'Castillo', 'washed', 400, 5200000, CURRENT_DATE - INTERVAL '3 days', '99999999-9999-9999-9999-999999999999', 'purchased'),
('JUAN VALDEZ', 'ALTOS DEL CAUCA', 'AX-5567', 2100, 'Colombia', 'Cauca', 'Geisha', 'natural', 120, 6500000, CURRENT_DATE - INTERVAL '5 days', '99999999-9999-9999-9999-999999999999', 'purchased'),
('ALBA LUCIA', 'SANTA HELENA', 'AX-1289', 1950, 'Colombia', 'Nariño', 'Tabi', 'semi-washed', 300, 3900000, CURRENT_DATE - INTERVAL '4 days', '99999999-9999-9999-9999-999999999999', 'purchased');
