const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('roast_batches').select('*').limit(1);
  console.log(error || (data.length > 0 ? Object.keys(data[0]) : "Empty table"));
}
run();
