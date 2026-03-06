import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    console.log("Testing insert against roast_batches...");
    const { data, error } = await supabase.from('roast_batches').insert({
        batch_id_label: 'TEST-1234',
        roast_date: new Date().toISOString().split('T')[0],
        process: 'Lavado',
        green_weight: 20,
        roasted_weight: 16,
        company_id: '33333333-3333-3333-3333-000023000009',
        status: 'roasted'
    });
    console.log(JSON.stringify({ data, error }, null, 2));
}
run();
