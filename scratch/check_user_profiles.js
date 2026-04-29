const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserProfiles() {
    console.log('--- BUSCANDO PERFILES DE USUARIO ---');
    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach(user => {
        console.log(`Email: ${user.email} | Name: ${user.full_name} | Company ID: ${user.company_id}`);
    });
}

checkUserProfiles();
