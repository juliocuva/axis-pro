
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    console.log('--- INICIANDO MIGRACIÓN DE DATOS GMAIL.COM ---');
    
    // 1. Migrar inventario
    const { data: invData, error: invError } = await supabase
        .from('coffee_purchase_inventory')
        .update({ company_id: 'USUARIO1@GMAIL.COM' })
        .eq('company_id', 'GMAIL.COM');

    if (invError) console.error('Error migrando inventario:', invError);
    else console.log('Inventario migrado exitosamente.');

    // 2. Migrar otros registros si existen (Análisis, Catación, etc.)
    const tables = ['roast_batches', 'physical_analysis', 'sca_cupping', 'roast_profiles'];
    for (const table of tables) {
        const { error } = await supabase
            .from(table)
            .update({ company_id: 'USUARIO1@GMAIL.COM' })
            .eq('company_id', 'GMAIL.COM');
        if (error) console.log(`Nota: No se encontraron registros para migrar en ${table} o hubo un error.`);
        else console.log(`Tabla ${table} procesada.`);
    }

    console.log('--- MIGRACIÓN COMPLETADA ---');
}

migrateData();
