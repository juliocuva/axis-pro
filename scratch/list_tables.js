const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('--- LISTANDO TABLAS DEL SISTEMA ---');
    const { data, error } = await supabase
        .from('coffee_purchase_inventory')
        .select('*')
        .limit(1);
    
    // We can't directly list tables via RPC/Studio without proper permissions usually, 
    // but we can try to guess or use common ones.
    
    const tables = [
        'coffee_purchase_inventory',
        'physical_analysis',
        'sca_cupping',
        'profiles',
        'eudr_validations',
        'verification_logs_db'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
            console.log(`[EXISTE] Table: ${table}`);
        } else {
            console.log(`[NO EXISTE/ERROR] Table: ${table} - ${error.message}`);
        }
    }
}

listTables();
