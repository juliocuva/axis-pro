const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLot() {
    const { data: lots, error: lotError } = await supabase
        .from('coffee_purchase_inventory')
        .select('id, lot_number')
        .ilike('lot_number', '%FINCA-27/04/26-LOTE1%');

    if (lotError) {
        console.error('Error fetching lot:', lotError);
        return;
    }

    if (!lots || lots.length === 0) {
        console.log('Lot not found');
        return;
    }

    const lotId = lots[0].id;
    console.log('Lot ID:', lotId);

    const { data: sca, error: scaError } = await supabase
        .from('sca_cupping')
        .select('*')
        .eq('inventory_id', lotId)
        .order('created_at', { ascending: false });

    if (scaError) {
        console.error('Error fetching SCA:', scaError);
        return;
    }

    console.log('SCA Records:', JSON.stringify(sca, null, 2));
}

checkLot();
