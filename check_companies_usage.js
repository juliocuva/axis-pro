const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMore() {
    // Try to check if there are more company IDs in ANY table that we haven't seen yet
    const tables = ['coffee_purchase_inventory', 'roast_batches', 'green_exports', 'physical_analysis', 'sca_cupping'];
    const allCompanies = new Set();
    
    for (const table of tables) {
        const { data } = await supabase.from(table).select('company_id');
        if (data) data.forEach(d => allCompanies.add(d.company_id));
    }
    
    console.log('Todos los Company IDs encontrados en la base de datos:');
    allCompanies.forEach(id => {
        // Interpretar ID según AuthScreen.tsx
        if (id === '99999999-9999-9999-9999-999999999999') console.log(`- ${id} (Admin / Default)`);
        else if (id === '11111111-1111-1111-1111-111111111111') console.log(`- ${id} (sagradocorazon.com)`);
        else if (id.startsWith('33333333')) {
            const emailLen = parseInt(id.substring(24, 30));
            const domainLen = parseInt(id.substring(30, 36));
            console.log(`- ${id} (Public domain email, len: ${emailLen}, domain_len: ${domainLen})`);
            if (emailLen === 19 && domainLen === 9) console.log(`  -> Es juliocuva@gmail.com`);
        } else if (id.startsWith('22222222')) {
            const domainLen = parseInt(id.substring(24, 36));
            console.log(`- ${id} (Corporate domain, domain_len: ${domainLen})`);
        } else {
            console.log(`- ${id} (Unknown pattern)`);
        }
    });

}

checkMore();
