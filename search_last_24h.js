const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

const tables = ['coffee_purchase_inventory', 'roast_batches', 'green_exports', 'physical_analysis', 'sca_cupping', 'profiles'];

async function searchLast24h() {
    // 24 hours ago
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log(`Buscando actividad en las últimas 24 HORAS (desde: ${since})`);

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .gte('created_at', since);

        if (error) {
            console.log(`Error en ${table}: ${error.message}`);
            continue;
        }

        if (data && data.length > 0) {
            console.log(`\n--- ${table.toUpperCase()} (${data.length} encontrados) ---`);
            data.forEach(d => {
                const identifier = d.lot_number || d.email || d.batch_id || d.id || d.full_name;
                console.log(`ID: ${d.id} | Info: ${identifier} | Created: ${d.created_at} | Company: ${d.company_id || 'N/A'}`);
            });
        }
    }
    
    // Búsqueda específica por nombres de usuario comunes
    console.log('\n--- BÚSQUEDA ESPECÍFICA DE USUARIOS ---');
    const { data: users } = await supabase.from('profiles').select('*').or('full_name.ilike.%usuario%,email.ilike.%usuario%');
    console.log('Perfiles con "usuario":', users?.length || 0);
    users?.forEach(u => console.log(`- ${u.full_name} (${u.email}) -> ${u.company_id}`));
}

searchLast24h();
