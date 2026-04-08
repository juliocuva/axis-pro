
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEliasLot() {
    const lotId = '80bfa159-cbdc-4c93-86bb-901b9ce414e6';
    const { data, error } = await supabase
        .from('coffee_purchase_inventory')
        .select('purchase_weight, thrashed_weight, thrashing_yield')
        .eq('id', lotId)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('DATOS DE ORIGEN (ELIAS):');
    console.log(`- Peso Ingreso (Pergamino): ${data.purchase_weight} Kg`);
    console.log(`- Peso Trillado (Excelso): ${data.thrashed_weight || 'No trillado'} Kg`);
    console.log(`- Factor de Rendimiento: ${data.thrashing_yield || 'N/A'}`);
}

checkEliasLot();
