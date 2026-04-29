const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentMappings() {
    console.log('--- BUSCANDO MAPEOS RECIENTES (SEMANA DEL 20 DE ABRIL 2026) ---');

    // 1. Chequear en coffee_purchase_inventory
    const { data: lots, error: lotsError } = await supabase
        .from('coffee_purchase_inventory')
        .select('lot_number, farmer_name, farm_name, created_at, process_data')
        .gte('created_at', '2026-04-20T00:00:00.000Z')
        .order('created_at', { ascending: false });

    if (lotsError) {
        console.error('Error buscando lotes:', lotsError.message);
    } else {
        console.log(`\nLotes encontrados en coffee_purchase_inventory: ${lots.length}`);
        lots.forEach(lot => {
            const hasPolygon = lot.process_data && (lot.process_data.eudr_polygon || lot.process_data.polygon);
            console.log(`- Lote: ${lot.lot_number} | Finca: ${lot.farm_name} | Polígono: ${hasPolygon ? 'SÍ' : 'NO'} | Fecha: ${lot.created_at}`);
        });
    }

    // 2. Chequear en eudr_validations (si existe)
    try {
        const { data: eudr, error: eudrError } = await supabase
            .from('eudr_validations')
            .select('*')
            .gte('created_at', '2026-04-20T00:00:00.000Z');

        if (!eudrError) {
            console.log(`\nValidaciones EUDR encontradas: ${eudr.length}`);
            eudr.forEach(v => {
                console.log(`- Parcela: ${v.parcel_name || v.farm_name} | Status: ${v.status} | Fecha: ${v.created_at}`);
            });
        }
    } catch (e) { }

    // 3. Chequear en verification_logs_db (si existe)
    try {
        const { data: logs, error: logsError } = await supabase
            .from('verification_logs_db')
            .select('*')
            .gte('verified_at', '2026-04-20T00:00:00.000Z');

        if (!logsError) {
            console.log(`\nLogs de Verificación encontrados: ${logs.length}`);
            logs.forEach(l => {
                console.log(`- Lote: ${l.lot_id} | Email: ${l.email} | Fecha: ${l.verified_at}`);
            });
        }
    } catch (e) { }

    console.log('\n--- VERIFICACIÓN LOCAL (PUBLIC LOGS) ---');
}

checkRecentMappings();
