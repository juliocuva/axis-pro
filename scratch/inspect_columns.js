const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data, error } = await supabase.from('sca_cupping').select('*').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No data found to inspect columns.');
    // Try to get schema via RPC or just query a non-existent column to see error
    const { error: schemaError } = await supabase.from('sca_cupping').select('cva_extrinsic').limit(1);
    if (schemaError) {
      console.log('Column cva_extrinsic does NOT exist or other error:', schemaError.message);
    } else {
      console.log('Column cva_extrinsic exists.');
    }
  }
}

inspect();
