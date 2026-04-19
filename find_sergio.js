const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findSergio() {
    console.log('--- BUSCANDO A SERGIO LONDOÑO ---');
    
    // 1. En coffee_purchase_inventory
    const { data: lots } = await supabase.from('coffee_purchase_inventory').select('*').ilike('farmer_name', '%Sergio%');
    console.log('Lotes encontrados:', lots?.length || 0);
    lots?.forEach(l => console.log(`- Lote: ${l.lot_number}, Farmer: ${l.farmer_name}, Company ID: ${l.company_id}`));

    // 2. En profiles
    const { data: profs } = await supabase.from('profiles').select('*').ilike('full_name', '%Sergio%');
    console.log('Perfiles encontrados:', profs?.length || 0);
    profs?.forEach(p => console.log(`- User: ${p.full_name}, Email: ${p.email}, Company ID: ${p.company_id}`));

    // 3. Ver todos los perfiles para comparar
    const { data: allProfs } = await supabase.from('profiles').select('*');
    console.log('\nTodos los perfiles registrados:');
    allProfs?.forEach(p => console.log(`- ${p.full_name} (${p.email}) -> ${p.company_id}`));
}

findSergio();
