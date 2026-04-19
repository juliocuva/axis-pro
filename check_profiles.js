const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.log('ERROR:', error.message);
    } else {
        console.log('SUCCESS:', data);
    }
}
run();
