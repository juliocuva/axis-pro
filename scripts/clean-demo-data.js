const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const KEEP_COMPANY_IDS = [
    '33333333-3333-3333-3333-000023000009', // Julio
    '33333333-3333-3333-3333-000025000009', // Catalina
    '11111111-1111-1111-1111-111111111111', // admin/demo
    '22222222-2222-2222-2222-000000000009'  // Legends/Champions (global/open layer data)
];

const TABLES_TO_CLEAN = [
    'roast_batches',
    'sca_cupping',
    'physical_analysis',
    'coffee_purchase_inventory' // This one last because of foreign keys
];

async function cleanData() {
    console.log("🧹 Iniciando limpieza de datos ajenos a Julio, Catalina y Admin...");

    for (const table of TABLES_TO_CLEAN) {
        console.log(`Borrando de la tabla: ${table}...`);

        // As ANON key with RLS, we might not have permission to delete everything, but let's try 
        // using the JS client. We usually do delete().neq('company_id', ID).
        // Since we have multiple IDs to save, we can fetch the ones to delete first.

        const { data: recordsToKeep, error: fetchKeepError } = await supabase
            .from(table)
            .select('id, company_id');

        if (fetchKeepError) {
            console.log("Error consultando tabla", table, fetchKeepError.message);
            continue;
        }

        const idsToDelete = recordsToKeep
            .filter(record => record.company_id && !KEEP_COMPANY_IDS.includes(record.company_id))
            .map(r => r.id);

        if (idsToDelete.length === 0) {
            console.log(`No hay registros para borrar en ${table}`);
            continue;
        }

        console.log(`Se encontrarón ${idsToDelete.length} registros para borrar en ${table}.`);

        // Borrar en lotes de 100 para no fallar
        for (let i = 0; i < idsToDelete.length; i += 100) {
            const batch = idsToDelete.slice(i, i + 100);
            const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .in('id', batch);

            if (deleteError) {
                console.error(`Error borrando lote en ${table}:`, deleteError.message);
            } else {
                console.log(`✅ Lote borrado en ${table}.`);
            }
        }
    }
    console.log("✨ Limpieza terminada.");
}

cleanData();
