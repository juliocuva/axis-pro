const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables'); // This might not work if RPC doesn't exist
    if (error) {
        // Fallback: try querying a common admin table if possible, or just guess
        console.log('RPC failed, trying info schema if available (likely not for anon)');
    }
    
    // Let's try to query sca_cupping which was in the schema
    const { data: cupping } = await supabase.from('sca_cupping').select('*');
    console.log('SCA Cupping records:', cupping ? cupping.length : 0);
    if (cupping) cupping.forEach(c => console.log(`- Taster: ${c.taster_name} (Created: ${c.created_at})`));
}

listTables();
