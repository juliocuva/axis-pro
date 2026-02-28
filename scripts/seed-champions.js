const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seedChampions() {
    console.log("🏆 Alimentando el sistema con Perfiles de Campeones de Tueste...");

    // Utilizaremos un ID de usuario común para estos lotes (Ej. Julio Uva o un usuario master)
    const companyId = '33333333-3333-3333-3333-000023000009'; // Julio Uva

    const championsData = [
        {
            year: 2022,
            champion: 'Felix Teiretzbacher',
            country: 'Austria',
            farm: 'Finca Deborah',
            variety: 'Geisha',
            process: 'Carbonic Maceration',
            lot_number: 'WCRC-2022-FT-01',
            score: 90.5,
            notes: 'Mandarina, Jazmín, Miel, Té verde. Tueste enfocado en preservar la acidez vibrante y florales explosivos.',
            roast_curve: [
                { time: "0:00", temp: 215, ror: 0 },
                { time: "1:00", temp: 90, ror: -25 }, // Turning Point
                { time: "3:00", temp: 135, ror: 15 }, // Drying Phase
                { time: "5:30", temp: 168, ror: 12 }, // Maillard
                { time: "7:45", temp: 195, ror: 8 },  // First Crack
                { time: "8:55", temp: 204, ror: 4 }   // Drop (Development 14%)
            ]
        },
        {
            year: 2019,
            champion: 'Arseny Kuznetsov',
            country: 'Russia',
            farm: 'Hacienda La Esmeralda',
            variety: 'Geisha',
            process: 'Washed',
            lot_number: 'WCRC-2019-AK-01',
            score: 91.2,
            notes: 'Bergamota, Melocotón, Lemongrass, Floral. Curva muy agresiva al inicio, desarrollo corto tras primer crack.',
            roast_curve: [
                { time: "0:00", temp: 225, ror: 0 },
                { time: "1:15", temp: 98, ror: -22 },
                { time: "3:30", temp: 145, ror: 18 },
                { time: "6:00", temp: 175, ror: 14 },
                { time: "8:10", temp: 198, ror: 9 },
                { time: "9:15", temp: 206, ror: 5 }
            ]
        },
        {
            year: 2018,
            champion: 'Vladimir Nenashev',
            country: 'Russia',
            farm: 'Finca Inmaculada',
            variety: 'Eugenioides',
            process: 'Natural',
            lot_number: 'WCRC-2018-VN-01',
            score: 89.8,
            notes: 'Fresa, Crema vainilla, Licor de cacao. Modulación suave post primer crack para maximizar el dulzor complejo.',
            roast_curve: [
                { time: "0:00", temp: 205, ror: 0 },
                { time: "1:00", temp: 88, ror: -20 },
                { time: "3:00", temp: 125, ror: 13 },
                { time: "5:30", temp: 160, ror: 11 },
                { time: "8:00", temp: 190, ror: 7 },
                { time: "9:40", temp: 201, ror: 3 }
            ]
        }
    ];

    for (const champ of championsData) {
        console.log(`\n🥇 Registrando Lote y Perfil de: ${champ.champion} (WCRC ${champ.year})...`);

        // 1. Crear el lote en el inventario
        const { data: lot, error: lotError } = await supabase
            .from('coffee_purchase_inventory')
            .upsert([{
                lot_number: champ.lot_number,
                farmer_name: `Proveedor WCRC ${champ.year}`,
                farm_name: champ.farm,
                region: 'Competición Global',
                variety: champ.variety,
                process: champ.process.toLowerCase(),
                purchase_weight: 15, // Micro Lotes
                purchase_date: new Date().toISOString().split('T')[0],
                status: 'completed',
                company_id: companyId,
                altitude: 1800 + Math.floor(Math.random() * 400),
                country: champ.country
            }], { onConflict: 'lot_number' })
            .select().single();

        if (lotError) {
            console.error(`❌ Error creando lote de ${champ.champion}:`, lotError);
            continue;
        }

        // 2. Asociar Análisis Físico
        await supabase.from('physical_analysis').upsert([{
            inventory_id: lot.id,
            moisture_pct: 10.5,
            water_activity: 0.55,
            density_gl: 800,
            grain_color: 'Verde Brillante',
            company_id: companyId
        }]);

        // 3. Asociar Puntaje SCA (Cupping)
        await supabase.from('sca_cupping').upsert([{
            inventory_id: lot.id,
            fragrance_aroma: 9,
            flavor: 9.25,
            aftertaste: 8.75,
            acidity: 9.25,
            body: 8.5,
            balance: 8.75,
            overall: 9,
            notes: champ.notes,
            taster_name: 'Panel WCRC',
            company_id: companyId
        }]);

        // 4. Registrar la curva de Tueste Maestra (El verdadero "Ghost Profile")
        const batchError = await supabase.from('roast_batches').upsert([{
            inventory_id: lot.id,
            batch_id_label: `CHAMPION-${champ.year}-${champ.champion.split(' ')[1].toUpperCase()}`,
            roaster_name: champ.champion,
            process: champ.process,
            green_weight: 6,
            roasted_weight: 5.1,
            roast_curve_json: champ.roast_curve, // Aquí guardamos el perfil espejo
            company_id: companyId
        }]);

        if (batchError.error) {
            console.error(`❌ Error registrando Tueste de ${champ.champion}:`, batchError.error);
        } else {
            console.log(`✅ Lote y Curva registrados exitosamente para ${champ.champion}.`);
        }
    }

    console.log("\n☕ ¡PERFILES DE CAMPEONATO CARGADOS CON ÉXITO!");
}

seedChampions();
