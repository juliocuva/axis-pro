const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsage() {
    console.log('--- REVISANDO USUARIOS EN PROFILES ---');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error('Error en profiles:', pError.message);
    } else {
        console.log('Usuarios encontrados:', profiles.length);
        profiles.forEach(p => console.log(`- ${p.email || p.username || p.id} (Created: ${p.created_at || 'N/A'})`));
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const dateStr = twoWeeksAgo.toISOString();

    console.log('\n--- ACTIVIDAD RECIENTE (ÚLTIMAS 2 SEMANAS) ---');

    const tables = ['coffee_purchase_inventory', 'roast_batches', 'green_exports', 'retail_inventory', 'sales_records'];
    
    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .gte('created_at', dateStr)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error en table ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Tabla ${table}: ${data.length} registros nuevos.`);
            // Intentar ver quién los creó si hay alguna columna de usuario
            data.forEach(item => {
                const userRef = item.user_id || item.created_by || item.taster_name || item.roaster_name || 'Desconocido';
                console.log(`  - [${item.created_at}] Ref: ${userRef}`);
            });
        } else {
            console.log(`Tabla ${table}: Sin actividad reciente.`);
        }
    }
}

checkUsage();
