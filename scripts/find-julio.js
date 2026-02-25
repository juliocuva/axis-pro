
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

async function findJulioData() {
    console.log("🔍 Buscando registros de Julio...");

    const { data: lots, error } = await supabase
        .from('coffee_purchase_inventory')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    lots.forEach(lot => {
        // Buscamos algo que parezca de Julio o lotes con el ID antiguo
        console.log(`Lote: ${lot.lot_number} | Productor: ${lot.farmer_name} | Company: ${lot.company_id}`);
    });
}

findJulioData();
