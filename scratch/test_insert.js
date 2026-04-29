const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { error: error1 } = await supabase
        .from('roast_batches')
        .insert([{
            batch_id_label: 'TEST-123',
            company_id: '33333333-3333-3333-3333-000000000001', // Valid UUID
            roast_curve: []
        }]);
    
    console.log('TEST roast_curve:', error1 ? error1.message : 'SUCCESS');

    const { error: error2 } = await supabase
        .from('roast_batches')
        .insert([{
            batch_id_label: 'TEST-124',
            company_id: '33333333-3333-3333-3333-000000000001', // Valid UUID
            roast_curve_json: []
        }]);
    
    console.log('TEST roast_curve_json:', error2 ? error2.message : 'SUCCESS');
}

testInsert();
