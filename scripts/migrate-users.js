
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

async function migrate() {
    console.log("🚀 Iniciando migración de datos...");

    const julioId = '33333333-3333-3333-3333-000023000009';
    const catalinaId = '33333333-3333-3333-3333-000025000009';
    const oldDefaultId = '99999999-9999-9999-9999-999999999999';

    // Catalina entró "ayer en la noche" (24 de Feb).
    // Julio es el usuario original.

    // 1. Migrar todo lo que tenga el ID viejo a Julio (él era el único antes)
    console.log("Migrando lotes antiguos a Julio...");
    const { error: errorJulio } = await supabase
        .from('coffee_purchase_inventory')
        .update({ company_id: julioId })
        .eq('company_id', oldDefaultId);

    if (errorJulio) console.error("Error migrando a Julio:", errorJulio);
    else console.log("✅ Lotes migrados a Julio.");

    // También migrar análisis y cataciones
    await supabase.from('physical_analysis').update({ company_id: julioId }).eq('company_id', oldDefaultId);
    await supabase.from('sca_cupping').update({ company_id: julioId }).eq('company_id', oldDefaultId);
    await supabase.from('roast_batches').update({ company_id: julioId }).eq('company_id', oldDefaultId);

    // 2. Identificar el lote de Catalina. 
    // Si ella entró anoche, su lote debe tener el ID que se generaba antes para gmail.com
    // El ID anterior para gmail.com (domain.length = 9) era: 22222222-2222-2222-2222-000000000009
    const oldGmailId = '22222222-2222-2222-2222-000000000009';

    console.log("Migrando lote de Catalina...");
    const { error: errorCatalina } = await supabase
        .from('coffee_purchase_inventory')
        .update({ company_id: catalinaId })
        .eq('company_id', oldGmailId);

    if (errorCatalina) console.error("Error migrando a Catalina:", errorCatalina);
    else console.log("✅ Lote migrado a Catalina.");

    // Migrar secundarios de Catalina
    await supabase.from('physical_analysis').update({ company_id: catalinaId }).eq('company_id', oldGmailId);
    await supabase.from('sca_cupping').update({ company_id: catalinaId }).eq('company_id', oldGmailId);
    await supabase.from('roast_batches').update({ company_id: catalinaId }).eq('company_id', oldGmailId);

    console.log("✨ Migración completada.");
}

migrate();
