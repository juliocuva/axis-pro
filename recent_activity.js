const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findRecentActivity() {
    const tables = ['coffee_purchase_inventory', 'roast_batches', 'green_exports', 'physical_analysis', 'sca_cupping'];
    const since = '2026-04-04'; // Approximately 2 weeks ago
    
    console.log(`Buscando actividad desde ${since}...`);
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').gte('created_at', since);
        if (error) {
            console.log(`Err ${table}: ${error.message}`);
            continue;
        }
        if (data && data.length > 0) {
            console.log(`\n--- ${table.toUpperCase()} (${data.length} registros) ---`);
            data.forEach(d => {
                const info = d.lot_number || d.batch_id_label || d.lot_id || d.id;
                const user = d.taster_name || d.roaster_name || d.created_by || 'Unknown';
                console.log(`Date: ${d.created_at} | Ref: ${info} | User: ${user}`);
            });
        }
    }
}

findRecentActivity();
