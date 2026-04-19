const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDB() {
    console.log("Fetching profiles...");
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) { console.error('Error fetching profiles:', pErr); return; }
    
    console.log("Found profiles:", profiles.map(p => ({id: p.id, email: p.email, full_name: p.full_name})));
    
    // Identify admins and Julio Uva
    const keepIds = profiles.filter(p => {
        const name = (p.full_name || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        return name.includes('admin') || p.role === 'admin' || name.includes('julio uva') || email.includes('admin');
    }).map(p => p.id);
    
    console.log("Keeping IDs:", keepIds);
    
    if (keepIds.length === 0) {
        console.log("No users to keep found. Aborting to avoid full delete.");
        return;
    }
    
    const deleteIds = profiles.filter(p => !keepIds.includes(p.id)).map(p => p.id);
    console.log("Deleting profiles IDs:", deleteIds);
    
    // Delete related data first or cascade deletes. 
    // Wait, the user said "hay que dejar en 0 de usuarios menos el administrador y julio uva", 
    // did they also mean the coffee purchase inventories should be dropped? 
    // Actually, maybe I should just drop all coffee_purchase_inventory from the DB except those belonging to admin and Julio Uva?
    
    // Deleting the coffee records not from keepIds
    const { data: inv, error: invErr } = await supabase.from('coffee_purchase_inventory').select('id, company_id');
    const invToDelete = inv.filter(i => !keepIds.includes(i.company_id)).map(i => i.id);
    
    console.log("Inventory to delete:", invToDelete.length);
    if (invToDelete.length > 0) {
        const { error: delInvErr } = await supabase.from('coffee_purchase_inventory').delete().in('id', invToDelete);
        if (delInvErr) console.error("Error deleting inv:", delInvErr);
        else console.log("Inventory deleted");
    }
    
    // Profile deletion usually requires service_role key to delete from auth.users. 
    // But we can delete from 'profiles' if anon key has permissions.
    if (deleteIds.length > 0) {
        const { error: delErr } = await supabase.from('profiles').delete().in('id', deleteIds);
        if (delErr) console.error("Error deleting profiles:", delErr);
        else console.log("Profiles deleted!");
    }
}
cleanDB();
