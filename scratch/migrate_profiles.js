
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateProfiles() {
    console.log('🚀 Iniciando Migración de Perfiles y Datos (GMAIL.COM -> Unique ID)...');

    // 1. Obtener perfiles a migrar
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, company_id')
        .eq('company_id', 'GMAIL.COM');

    if (pError) {
        console.error('❌ Error al obtener perfiles:', pError.message);
        return;
    }

    console.log(`📋 Se encontraron ${profiles.length} perfiles con ID genérico GMAIL.COM.`);

    for (const profile of profiles) {
        const newCompanyId = profile.email.toUpperCase();
        console.log(`\n🔄 Procesando: ${profile.email} -> ${newCompanyId}`);

        // A. Actualizar Perfil
        const { error: upError } = await supabase
            .from('profiles')
            .update({ company_id: newCompanyId })
            .eq('id', profile.id);

        if (upError) {
            console.error(`   ❌ Error actualizando perfil ${profile.email}:`, upError.message);
            continue;
        }
        console.log(`   ✅ Perfil actualizado.`);

        // B. Actualizar registros en tablas de datos
        const tables = ['coffee_purchase_inventory', 'physical_analysis', 'sca_cupping', 'green_exports', 'roast_batches'];
        for (const table of tables) {
            const { data, error: tError, count } = await supabase
                .from(table)
                .update({ company_id: newCompanyId })
                .eq('company_id', 'GMAIL.COM')
                .select('id', { count: 'exact' });

            if (tError) {
                // Algunas tablas pueden no existir o no tener la columna, ignoramos errores de columna faltante
                if (!tError.message.includes('column "company_id" does not exist')) {
                    console.error(`   ⚠️ Error en tabla ${table}:`, tError.message);
                }
            } else if (count > 0) {
                console.log(`   📦 Actualizados ${count} registros en ${table}.`);
            }
        }
    }

    console.log('\n✨ Migración finalizada.');
}

migrateProfiles();
