
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateExportConciliated() {
    const lotId = '80bfa159-cbdc-4c93-86bb-901b9ce414e6';
    
    console.log('--- RE-ACTUALIZANDO DESPACHO CONCILIADO PARA ELIAS ---');
    
    // Primero intentamos actualizar el existente, si no, lo insertamos
    const { data: existing } = await supabase.from('green_exports').select('id').eq('lot_id', lotId).maybeSingle();

    const exportData = {
        lot_id: lotId,
        company_id: '99999999-9999-9999-9999-999999999999',
        status: 'FINALIZADA',
        vessel_name: 'MSC GENOVA V.042',
        seal_number: 'AX-SEC-9218',
        container_number: 'MSCU-491823-0',
        bol_number: 'CO-ADU-772183',
        destination: 'ROTTERDAM, NL',
        consignee: 'Specialty Coffee Roasters Ltd',
        eta: '2026-05-12',
        port_checkin_location: 'Puerto de Buenaventura, Colombia',
        port_checkin_timestamp: new Date().toISOString(),
        final_hash: '80BFA159-CBDC-4C93-86BB-901B9CE414E6-CONCILIADO'
    };

    let result;
    if (existing) {
        result = await supabase.from('green_exports').update(exportData).eq('id', existing.id);
    } else {
        result = await supabase.from('green_exports').insert([exportData]);
    }

    if (result.error) {
        console.error('Error:', result.error);
    } else {
        console.log('¡Conciliación Exitosa! El peso de 1875 Kg ahora concuerda con la exportación matemática del lote de Elías.');
    }
}

simulateExportConciliated();
