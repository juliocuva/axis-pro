const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findSergioEverywhere() {
    console.log('--- BUSCANDO A SERGIO LONDOÑO EN TODO EL SISTEMA ---');
    const term = 'SERGIO';
    
    // 1. Buscar en Inventario de Lotes
    const { data: lots, error: lotsError } = await supabase
        .from('coffee_purchase_inventory')
        .select('*')
        .ilike('farmer_name', `%${term}%`);

    if (lots && lots.length > 0) {
        console.log(`[LOTES ENCONTRADOS: ${lots.length}]`);
        lots.forEach(l => console.log(` - ID: ${l.id} | Productor: ${l.farmer_name} | Company: ${l.company_id} | Creado: ${l.created_at}`));
    } else {
        console.log('[LOTES] No se encontró historial para Sergio.');
    }

    // 2. Buscar en Perfiles
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${term}%`);
        
    if (profiles && profiles.length > 0) {
        console.log(`[PERFILES ENCONTRADOS: ${profiles.length}]`);
        profiles.forEach(p => console.log(` - Email: ${p.email} | Nombre: ${p.full_name} | Company: ${p.company_id}`));
    } else {
        console.log('[PERFILES] No se encontró perfil para Sergio.');
    }
}

findSergioEverywhere();
