import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('coffee_purchase_inventory').select('id, physical_analysis(id), sca_cupping(id)').limit(1);
    console.log(JSON.stringify({ data, error }, null, 2));
}
run();
