const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkCompanies() {
    const { data, error } = await supabase
        .from('coffee_purchase_inventory')
        .select('company_id');

    if (error) {
        console.error(error);
        return;
    }

    const set = new Set(data.map(r => r.company_id).filter(Boolean));
    console.log("Compañías actuales en el inventario:", Array.from(set));
}

checkCompanies();
