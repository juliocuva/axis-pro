require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsage() {
    console.log('--- Axis Coffee Pro: Chequeo de Uso en Base de Datos ---');

    const tables = [
        'profiles',
        'roles',
        'farms',
        'coffee_purchase_inventory',
        'quality_evaluations',
        'roast_batches',
        'production_yields'
    ];

    let hasData = false;

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`- Tabla [${table}]: Error al consultar (${error.message})`);
        } else {
            console.log(`- Tabla [${table}]: ${count} registros encontrados.`);
            if (count > 0) hasData = true;
        }
    }

    console.log('\n======================================================');
    if (hasData) {
        console.log('CONCLUSIÓN: Sí, hay registros en la base de datos,');
        console.log('lo que indica que usuarios reales han usado la plataforma');
        console.log('y guardado información (o se han creado datos de prueba).');
    } else {
        console.log('CONCLUSIÓN: No hay registros en las tablas principales.');
        console.log('Todo parece estar vacío o limpio.');
    }
    console.log('======================================================\n');
}

checkUsage();
