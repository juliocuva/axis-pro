const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditProfiles() {
    console.log("AXIS Audit: Checking profiles for 'GMAIL.COM' company_id...");
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('email, company_id')
            .eq('company_id', 'GMAIL.COM');

        if (error) {
            console.error("Error fetching profiles:", error);
            return;
        }

        if (data.length === 0) {
            console.log("No profiles found with 'GMAIL.COM' company_id. Clean state confirmed.");
        } else {
            console.log(`Found ${data.length} profiles with 'GMAIL.COM':`);
            data.forEach(p => console.log(` - ${p.email}`));
            
            console.log("\nProposed migration: SET company_id = UPPER(email) WHERE company_id = 'GMAIL.COM'");
        }
    } catch (err) {
        console.error("Critical error during audit:", err);
    }
}

auditProfiles();
