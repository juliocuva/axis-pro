const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditInventory() {
    console.log("AXIS Audit: Checking inventory for 'GMAIL.COM' company_id...");
    
    try {
        const { data, error } = await supabase
            .from('coffee_purchase_inventory')
            .select('id, lot_number, farmer_name, company_id')
            .eq('company_id', 'GMAIL.COM');

        if (error) {
            console.error("Error fetching inventory:", error);
            return;
        }

        if (data.length === 0) {
            console.log("No inventory found with 'GMAIL.COM' company_id.");
        } else {
            console.log(`Found ${data.length} records with 'GMAIL.COM':`);
            data.forEach(r => console.log(` - ${r.lot_number} (${r.farmer_name})`));
        }
    } catch (err) {
        console.error("Critical error during audit:", err);
    }
}

auditInventory();
