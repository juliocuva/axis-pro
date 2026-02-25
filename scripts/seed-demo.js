
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer .env.local manualmente para evitar dependencias extra
const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERROR: No se encontraron las variables de entorno de Supabase.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDemo() {
    console.log("🚀 Iniciando creación de Lote Maestro Demo...");

    const axisCompanyId = '99999999-9999-9999-9999-999999999999';
    const sagradoCompanyId = '11111111-1111-1111-1111-111111111111';

    const companies = [
        { id: axisCompanyId, name: 'AXIS MASTER DEMO', farmer: 'ALEJANDRA PÉREZ', farm: 'LA ESPERANZA', variety: 'GEISHA', lot: 'AX-DEMO-01' },
        { id: sagradoCompanyId, name: 'SAGRADO CORAZÓN DEMO', farmer: 'CARLOS RUÍZ', farm: 'MONTE SAGRADO', variety: 'PINK BOURBON', lot: 'SC-DEMO-01' }
    ];

    for (const company of companies) {
        console.log(`\n📦 Creando data para: ${company.name}...`);

        const { data: lot, error: lotError } = await supabase
            .from('coffee_purchase_inventory')
            .upsert([{
                lot_number: company.lot,
                farmer_name: company.farmer,
                farm_name: company.farm,
                altitude: 1850,
                country: 'Colombia',
                region: 'Huila',
                variety: company.variety,
                process: 'honey',
                purchase_weight: 120,
                purchase_value: 2400000,
                purchase_date: new Date().toISOString().split('T')[0],
                thrashed_weight: 98.4,
                pasilla_weight: 4.2,
                cisco_weight: 3.1,
                thrashing_yield: 18.2,
                status: 'completed',
                company_id: company.id
            }], { onConflict: 'lot_number' })
            .select()
            .single();

        if (lotError) {
            console.error(`❌ Error creando lote para ${company.name}:`, lotError.message);
            continue;
        }

        console.log(`✅ Lote ${company.lot} creado ID: ${lot.id}`);

        await supabase.from('physical_analysis').upsert([{
            inventory_id: lot.id,
            moisture_pct: 11.2,
            water_activity: 0.58,
            density_gl: 720,
            grain_color: 'Verde Azulado',
            notes: 'Grano de tamaño homogéneo, malla 17/18 predominante.',
            company_id: company.id
        }]);

        await supabase.from('sca_cupping').upsert([{
            inventory_id: lot.id,
            fragrance_aroma: 8.75,
            flavor: 8.5,
            aftertaste: 8.25,
            acidity: 8.5,
            body: 8.25,
            balance: 8.5,
            overall: 8.5,
            notes: 'Notas intensas a jazmín, miel de abejas y frutos rojos. Acidez vibrante.',
            taster_name: 'IA SENSOR AXIS',
            company_id: company.id
        }]);
    }
    console.log("\n✨ PROCESO COMPLETADO.");
}

seedDemo();
