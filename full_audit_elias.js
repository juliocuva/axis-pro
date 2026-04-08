
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fullAudit() {
    const lotId = '80bfa159-cbdc-4c93-86bb-901b9ce414e6';
    console.log('--- AUDITANDO LOTE PR29/26 (ELIAS) ---');

    const { data: lot } = await supabase.from('coffee_purchase_inventory').select('*').eq('id', lotId).single();
    const { data: physical } = await supabase.from('physical_analysis').select('*').eq('inventory_id', lotId).maybeSingle();
    const { data: sca } = await supabase.from('sca_cupping').select('*').eq('inventory_id', lotId).maybeSingle();
    const { data: exportData } = await supabase.from('green_exports').select('*').eq('lot_id', lotId).maybeSingle();

    console.log('\n[1] DATOS BASE (INVENTARIO):');
    console.log(`- Finca: ${lot?.farm_name}`);
    console.log(`- Ingreso: ${lot?.purchase_weight} Kg`);
    console.log(`- Trilla (Excelso): ${lot?.thrashed_weight} Kg`);
    console.log(`- Rendimiento (FR): ${lot?.thrashing_yield}`);

    console.log('\n[2] ANÁLISIS FÍSICO (MALLAS):');
    if (!physical) console.log('!!! ADVERTENCIA: No hay registro físico para este lote.');
    else console.log(JSON.stringify(physical.screen_size_distribution, null, 2));

    console.log('\n[3] CALIDAD SCA:');
    if (!sca) console.log('!!! ADVERTENCIA: No hay registro SCA para este lote.');
    else console.log(`- Score: ${sca.total_score} | Notas: ${sca.notes}`);

    console.log('\n[4] DATOS PUERTO:');
    if (!exportData) console.log('!!! ADVERTENCIA: No hay registro de exportación.');
    else console.log(`- Buque: ${exportData.vessel_name} | Precinto: ${exportData.seal_number}`);
}

fullAudit();
