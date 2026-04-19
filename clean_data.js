const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanData() {
    console.log("Fetching coffee_purchase_inventory...");
    const { data: inv, error: invErr } = await supabase.from('coffee_purchase_inventory').select('id, farmer_name');
    if (invErr) { console.error('Error fetching inv:', invErr); return; }
    
    // Deleting any record whose farmer_name doesn't contain "julio" (case insensitive)
    // admin entries often don't have "admin" as farmer_name but since we don't see any "admin" in that list, 
    // it's likely safe to delete everything except "julio" related.
    const toDeleteIds = inv.filter(record => {
        const name = (record.farmer_name || '').toLowerCase();
        return !name.includes('julio uva') && !name.includes('admin') && !name.includes('julio');
    }).map(r => r.id);

    console.log(`Found ${inv.length} total records. Planning to delete ${toDeleteIds.length} records.`);
    
    if (toDeleteIds.length > 0) {
        const { error: delErr } = await supabase.from('coffee_purchase_inventory').delete().in('id', toDeleteIds);
        if (delErr) {
            console.error("Error deleting records:", delErr);
        } else {
            console.log("Successfully deleted undesired records from coffee_purchase_inventory!");
        }
    } else {
        console.log("No records to delete.");
    }
}
cleanData();
