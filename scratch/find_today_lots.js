const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTodaysLots() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`--- BUSCANDO LOTES CREADOS EL: ${today} ---`);
    
    // Queried with filter for today
    const { data, error } = await supabase
        .from('coffee_purchase_inventory')
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No se encontraron lotes para hoy.');
    } else {
        data.forEach(lot => {
            console.log(`ID: ${lot.id} | Lote: ${lot.lot_number} | Productor: ${lot.farmer_name} | Creado: ${lot.created_at} | Company: ${lot.company_id}`);
        });
    }
}

findTodaysLots();
