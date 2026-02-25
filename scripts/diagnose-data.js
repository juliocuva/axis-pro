
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

async function diagnose() {
    console.log("🔍 Diagnosticando datos de lotes...");

    // Ver todos los lotes y sus company_id
    const { data: lots, error } = await supabase
        .from('coffee_purchase_inventory')
        .select('id, lot_number, farmer_name, company_id, created_at');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("\nLotes encontrados:");
    lots.forEach(l => {
        console.log(`- Lote: ${l.lot_number} | Productor: ${l.farmer_name} | Company: ${l.company_id} | Creado: ${l.created_at}`);
    });
}

diagnose();
