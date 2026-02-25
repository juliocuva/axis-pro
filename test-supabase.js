const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing ENV variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Connecting to:", supabaseUrl);
    try {
        const { data, error } = await supabase.from('coffee_purchase_inventory').select('*').limit(1);
        if (error) {
            console.error("Supabase Error:", error.message);
            console.error("Full Error:", error);
        } else {
            console.log("Successfully connected! Found data:", data.length > 0 ? "Yes" : "Empty table");
        }
    } catch (err) {
        console.error("Connection Failed:", err.message);
    }
}

testConnection();
