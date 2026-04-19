const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Fetching coffee_purchase_inventory...");
    const { data: inv, error: invErr } = await supabase.from('coffee_purchase_inventory').select('id, company_id, farmer_name, lot_number');
    if (invErr) { console.error('Error fetching inv:', invErr); return; }
    
    console.log("Inventory entries:", inv);
}
checkData();
