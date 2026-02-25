import { supabase } from './src/shared/lib/supabase';

async function diagnose() {
    console.log("Checking coffee_purchase_inventory columns...");
    const { data, error } = await supabase
        .from('coffee_purchase_inventory')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching table:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
    } else {
        console.log("Table is empty, trying to insert a dummy to see errors...");
        const { error: insertError } = await supabase
            .from('coffee_purchase_inventory')
            .insert([{ farmer_name: 'DIAGNOSTIC' }]);
        console.error("Insert error (if any):", insertError);
    }
}

diagnose();
