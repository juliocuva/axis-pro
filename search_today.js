const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
    'coffee_purchase_inventory', 
    'roast_batches', 
    'green_exports', 
    'physical_analysis', 
    'sca_cupping', 
    'profiles'
];

async function searchToday() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Buscando actividad Global para hoy: ${today}`);

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .gte('created_at', `${today}T00:00:00Z`);

        if (error) {
            console.log(`Error en ${table}: ${error.message}`);
            continue;
        }

        if (data && data.length > 0) {
            console.log(`\n--- ${table.toUpperCase()} (${data.length} encontrados) ---`);
            data.forEach(d => {
                const identifier = d.lot_number || d.email || d.batch_id || d.id;
                console.log(`ID: ${d.id} | Info: ${identifier} | Created: ${d.created_at} | Company: ${d.company_id || 'N/A'}`);
            });
        }
    }
}

searchToday();
