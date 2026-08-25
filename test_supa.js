const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.log('No Supabase credentials');
  process.exit(1);
}
const supabase = createClient(url, key);
async function test() {
  const { data, error } = await supabase.from('purchase_orders').select('*').limit(1);
  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Supabase Connection OK! Data:', data.length);
  }
}
test();
