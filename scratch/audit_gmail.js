
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log('--- AUDITANDO REGISTROS GMAIL.COM ---');
    
    const tables = ['coffee_purchase_inventory', 'physical_analysis', 'sca_cupping', 'green_exports'];
    
    for (const table of tables) {
        const { data, count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .eq('company_id', 'GMAIL.COM');
            
        if (error) {
            console.error(`Error en ${table}:`, error.message);
        } else {
            console.log(`Tabla ${table}: ${count} registros encontrados con company_id = 'GMAIL.COM'`);
            if (data && data.length > 0) {
                console.log('Muestra de datos (primeros 2):');
                console.log(JSON.stringify(data.slice(0, 2), null, 2));
            }
        }
    }

    console.log('\n--- AUDITANDO PERFILES ---');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*');
        
    if (pError) {
        console.error('Error en perfiles:', pError.message);
    } else {
        console.log(`Perfiles encontrados: ${profiles.length}`);
        console.log(JSON.stringify(profiles, null, 2));
    }
}

runAudit();
