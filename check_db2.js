require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: po } = await supabase.from('purchase_orders').select('*').eq('po_number', 'PO-cofinet-2026-08-001').single();
  console.log("PO:", po);
  
  const { data: lots } = await supabase.from('lots').select('*').eq('po_id', po.id);
  console.log("Lots:", lots);
}

test();
