
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seedMassive() {
    console.log("🚀 Generando Ecosistema de Datos para reunión de las 2:00 PM...");

    const users = [
        { email: 'juliocesaruba@gmail.com', name: 'JULIO UVA', id: '33333333-3333-3333-3333-000023000009', lots: 8 },
        { email: 'catalinaperez86@gmail.com', name: 'CATALINA PÉREZ', id: '33333333-3333-3333-3333-000025000009', lots: 3 },
        { email: 'operador1@gmail.com', name: 'MARCOS DÍAZ', id: '33333333-3333-3333-3333-000018000009', lots: 5 },
        { email: 'tostador_master@gmail.com', name: 'SANTIAGO G.', id: '33333333-3333-3333-3333-000100000009', lots: 12 }
    ];

    for (const user of users) {
        console.log(`\n📦 Creando ${user.lots} lotes para ${user.name}...`);

        for (let i = 1; i <= user.lots; i++) {
            const lotNum = `BATCH-${user.name.substring(0, 2)}-${1000 + i}`;
            const status = i % 3 === 0 ? 'completed' : (i % 2 === 0 ? 'thrashed' : 'purchased');

            const { data: lot, error: lotError } = await supabase
                .from('coffee_purchase_inventory')
                .upsert([{
                    lot_number: lotNum,
                    farmer_name: `Productor ${i}`,
                    farm_name: `Finca El Recreo ${i}`,
                    region: 'Huila',
                    variety: i % 2 === 0 ? 'Caturra' : 'Castillo',
                    process: 'washed',
                    purchase_weight: 150 + i * 10,
                    purchase_date: new Date().toISOString().split('T')[0],
                    status: status,
                    company_id: user.id
                }], { onConflict: 'lot_number' })
                .select().single();

            if (lotError) continue;

            if (status === 'completed' || status === 'thrashed') {
                await supabase.from('physical_analysis').upsert([{
                    inventory_id: lot.id,
                    moisture_pct: 11.2,
                    company_id: user.id
                }]);
            }

            if (status === 'completed') {
                await supabase.from('sca_cupping').upsert([{
                    inventory_id: lot.id,
                    overall: 8.5,
                    total_score: 84 + (i % 5),
                    company_id: user.id
                }]);

                // Algunos batches de tueste para estos lotes
                await supabase.from('roast_batches').upsert([{
                    inventory_id: lot.id,
                    batch_id_label: `ROAST-${lotNum}`,
                    process: 'washed',
                    green_weight: 12,
                    roasted_weight: 10.2,
                    company_id: user.id
                }]);
            }
        }
    }

    console.log("\n✨ DATA LISTA PARA PRESENTACIÓN.");
}

seedMassive();
