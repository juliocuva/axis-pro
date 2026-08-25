const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);
async function wipeLots() {
  const { data: po } = await supabase.from('purchase_orders').select('id, po_number').eq('po_number', 'PO-2026-08-001PR').single();
  if (po) {
    const { data: lots } = await supabase.from('lots').select('id').eq('po_id', po.id);
    if(lots && lots.length > 0) {
      const lotIds = lots.map(l => l.id);
      await supabase.from('quality_evidence').delete().in('lot_id', lotIds);
      await supabase.from('processing_evidence').delete().in('lot_id', lotIds);
      await supabase.from('lot_farmers').delete().in('lot_id', lotIds);
      const { error } = await supabase.from('lots').delete().eq('po_id', po.id);
      console.log(error ? error : 'Wiped lots for ' + po.po_number);
    }
  }
}
wipeLots();
