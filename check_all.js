const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
    console.log('--- BUSCANDO TODOS LOS USUARIOS ---');
    // Intentar perfiles
    const { data: p } = await supabase.from('profiles').select('*');
    console.log('Profiles:', p);

    console.log('\n--- BUSCANDO TODOS LOS LOTES ---');
    const { data: lots } = await supabase.from('coffee_purchase_inventory').select('*').limit(10);
    console.log('Lots:', lots ? lots.length : 0);
    if (lots) lots.forEach(l => console.log(`- ${l.lot_number} (Created: ${l.created_at}) Company: ${l.company_id}`));

    console.log('\n--- BUSCANDO TODA LA ACTIVIDAD EN GREEN_EXPORTS ---');
    const { data: ex } = await supabase.from('green_exports').select('*');
    console.log('Exports:', ex ? ex.length : 0);
    if (ex) ex.forEach(e => console.log(`- ${e.id} (Created: ${e.created_at}) Company: ${e.company_id}`));
}

checkAll();
