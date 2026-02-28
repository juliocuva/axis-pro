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

async function seedLegends() {
    console.log("🌟 Alimentando el sistema con Perfiles de Leyendas del Tueste...");

    // Utilizaremos un ID de usuario común para estos lotes (Ej. Julio Uva o un usuario master)
    const companyId = '33333333-3333-3333-3333-000023000009'; // Julio Uva

    const legendsData = [
        {
            year: 2016,
            champion: 'Alexandru Niculae',
            country: 'Romania',
            farm: 'Finca Deborah',
            variety: 'Geisha',
            process: 'Natural',
            lot_number: 'WCRC-2016-AN-01',
            score: 92.5,
            notes: 'Frutos rojos maduros, licor de cereza, chocolate oscuro, cuerpo aterciopelado. Tueste "Fast & Hot" para preservar notas frutales sin hornear.',
            roast_curve: [
                { time: "0:00", temp: 230, ror: 0 },
                { time: "1:00", temp: 105, ror: -25 }, // Turning Point
                { time: "3:00", temp: 155, ror: 20 }, // Drying Phase
                { time: "5:00", temp: 185, ror: 15 }, // Maillard rapid
                { time: "6:45", temp: 202, ror: 10 },  // First Crack
                { time: "7:45", temp: 208, ror: 5 }   // Drop (Development corto)
            ]
        },
        {
            year: 2017,
            champion: 'Rubens Gardelli',
            country: 'Italy',
            farm: 'Mzungu Project',
            variety: 'SL14 / SL28',
            process: 'Natural',
            lot_number: 'WCRC-2017-RG-01',
            score: 93.0,
            notes: 'Piña, maracuyá, acidez málica brillante, final limpio. Tueste "Low & Slow" adaptado, aire continuo, curva descendente lineal sin crash ni flick.',
            roast_curve: [
                { time: "0:00", temp: 210, ror: 0 },
                { time: "1:15", temp: 95, ror: -20 },
                { time: "4:00", temp: 140, ror: 16 },
                { time: "7:00", temp: 172, ror: 12 },
                { time: "9:30", temp: 196, ror: 8 },
                { time: "11:00", temp: 203, ror: 4 }
            ]
        },
        {
            year: 2024,
            champion: 'Taufan Mokoginta',
            country: 'Indonesia',
            farm: 'Anaerobic Experimental',
            variety: 'Wush Wush',
            process: 'Anaerobic',
            lot_number: 'WCRC-2024-TM-01',
            score: 91.8,
            notes: 'Especias dulces, cardamomo, kombucha de durazno. Control milimétrico en Maillard para cafés termosensibles.',
            roast_curve: [
                { time: "0:00", temp: 200, ror: 0 },
                { time: "1:10", temp: 90, ror: -18 },
                { time: "3:45", temp: 135, ror: 15 },
                { time: "7:15", temp: 168, ror: 10 },
                { time: "9:45", temp: 192, ror: 6 },
                { time: "11:20", temp: 198, ror: 3 }
            ]
        },
        {
            year: 2020,
            champion: 'Scott Rao',
            country: 'USA',
            farm: 'Yirgacheffe Classic',
            variety: 'Heirloom',
            process: 'Washed',
            lot_number: 'RAO-MASTER-01',
            score: 89.5,
            notes: 'Flor de café, té negro, lima. Perfil canónico de RoR siempre descendente, 20% DTR perfecto sin baking.',
            roast_curve: [
                { time: "0:00", temp: 220, ror: 0 },
                { time: "1:20", temp: 100, ror: -22 },
                { time: "4:00", temp: 150, ror: 18 },
                { time: "7:00", temp: 180, ror: 12 },
                { time: "9:00", temp: 199, ror: 8 },
                { time: "11:15", temp: 207, ror: 3 }
            ]
        }
    ];

    for (const champ of legendsData) {
        console.log(`\n🥇 Registrando Lote y Perfil de: ${champ.champion} (${champ.year})...`);

        // 1. Crear el lote en el inventario
        const { data: lot, error: lotError } = await supabase
            .from('coffee_purchase_inventory')
            .upsert([{
                lot_number: champ.lot_number,
                farmer_name: `Proveedor Leyenda ${champ.year}`,
                farm_name: champ.farm,
                region: 'Competición Global',
                variety: champ.variety,
                process: champ.process.toLowerCase(),
                purchase_weight: 20, // Micro Lotes
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
            taster_name: 'Panel Leyendas',
            company_id: companyId
        }]);

        // 4. Registrar la curva de Tueste Maestra
        const batchError = await supabase.from('roast_batches').upsert([{
            inventory_id: lot.id,
            batch_id_label: `LEGEND-${champ.year}-${champ.champion.split(' ')[1]?.toUpperCase() || 'RAO'}`,
            roaster_name: champ.champion,
            process: champ.process,
            green_weight: 8,
            roasted_weight: 6.8,
            roast_curve_json: champ.roast_curve,
            company_id: companyId
        }]);

        if (batchError.error) {
            console.error(`❌ Error registrando Tueste de ${champ.champion}:`, batchError.error);
        } else {
            console.log(`✅ Lote y Curva registrados exitosamente para ${champ.champion}.`);
        }
    }

    console.log("\n☕ ¡PERFILES DE LEYENDAS MEDALLA DE ORO CARGADOS CON ÉXITO!");
}

seedLegends();
