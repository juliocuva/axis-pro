
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function splitUserData() {
    console.log('--- INICIANDO SEPARACIÓN QUIRÚRGICA DE USUARIOS ---');
    
    const mappings = [
        { farmer: 'LUISA FERNANDA G', email: 'USUARIO1@GMAIL.COM' },
        { farmer: 'CARLOS MARIO RESTREPO', email: 'USUARIO2@GMAIL.COM' },
        { farmer: 'ELENA RODRIGUEZ', email: 'USUARIO3@GMAIL.COM' }
    ];

    for (const m of mappings) {
        console.log(`Procesando lotes de ${m.farmer} -> ${m.email}`);
        
        // Actualizar inventario
        const { error: invErr } = await supabase
            .from('coffee_purchase_inventory')
            .update({ company_id: m.email })
            .ilike('farmer_name', `%${m.farmer}%`);
        
        if (invErr) console.error(`Error en inventario para ${m.farmer}:`, invErr);

        // Actualizar tablas relacionadas por farmer_name o similar (si existieran vínculos)
        // Nota: En este sistema, la cascada suele ser por inventory_id, 
        // pero la company_id también se guarda en las tablas de análisis para filtrado rápido.
        
        const tables = ['physical_analysis', 'sca_cupping', 'roast_batches'];
        for (const table of tables) {
            // Buscamos los IDs de los lotes de este productor para actualizar sus análisis
            const { data: lots } = await supabase
                .from('coffee_purchase_inventory')
                .select('id')
                .eq('company_id', m.email);
            
            if (lots && lots.length > 0) {
                const lotIds = lots.map(l => l.id);
                await supabase
                    .from(table)
                    .update({ company_id: m.email })
                    .in('inventory_id', lotIds);
            }
        }
    }

    console.log('--- SEPARACIÓN COMPLETADA ---');
}

splitUserData();
