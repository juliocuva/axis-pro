
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

const OK  = (v) => v != null && v !== '' && v !== '--' && v !== '---' ? '✅' : '❌';
const VAL = (v) => v ?? 'NULL';

async function inspectPrintDocs() {
    const lotId = '80bfa159-cbdc-4c93-86bb-901b9ce414e6';

    const { data: lot }    = await supabase.from('coffee_purchase_inventory').select('*').eq('id', lotId).single();
    const { data: phys }   = await supabase.from('physical_analysis').select('*').eq('inventory_id', lotId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: sca }    = await supabase.from('sca_cupping').select('*').eq('inventory_id', lotId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: expRaw } = await supabase.from('green_exports').select('*').eq('lot_id', lotId).maybeSingle();

    // Calcular score SCA igual que el componente
    let scaScore = sca?.total_score;
    if (sca && scaScore == null) {
        scaScore = (
            Number(sca.fragrance_aroma || 0) + Number(sca.flavor || 0) +
            Number(sca.aftertaste || 0)      + Number(sca.acidity || 0) +
            Number(sca.body || 0)            + Number(sca.balance || 0) +
            Number(sca.uniformity || 10)     + Number(sca.clean_cup || 10) +
            Number(sca.sweetness || 10)      + Number(sca.overall || 0) -
            (Number(sca.defects_score || 0) * 2)
        );
    }

    const sd = phys?.screen_size_distribution;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║     INSPECCIÓN DOM — DOCUMENTOS DE IMPRESIÓN AXIS COFFEE     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PÁGINA 1 — IDENTIDAD DEL LOTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${OK(lot?.farm_name)}    Finca (h1):           "${VAL(lot?.farm_name)}"`);
    console.log(`${OK(lot?.farmer_name)} Productor:            "${VAL(lot?.farmer_name)}"`);
    console.log(`${OK(lot?.lot_number)}  Lote ID:              "${VAL(lot?.lot_number)}"`);
    console.log(`${OK(lot?.variety)}     Variedad:             "${VAL(lot?.variety)}"`);
    console.log(`${OK(lot?.region)}      Región:               "${VAL(lot?.region)}"`);
    console.log(`${OK(lot?.process)}     Beneficio:            "${VAL(lot?.process)}"`);
    console.log(`${OK(lot?.latitude)}    Latitud (EUDR):       "${VAL(lot?.latitude)}"`);
    console.log(`${OK(lot?.longitude)}   Longitud (EUDR):      "${VAL(lot?.longitude)}"`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PÁGINA 1 — PRODUCCIÓN / PESOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${OK(lot?.purchase_weight)}   Materia Prima (Kg):   "${VAL(lot?.purchase_weight)}"`);
    console.log(`${OK(lot?.thrashed_weight)}   Excelso / Trilla:     "${VAL(lot?.thrashed_weight)}"`);
    console.log(`${OK(lot?.thrashing_yield)}   Factor Rendimiento:   "${VAL(lot?.thrashing_yield) !== 'NULL' ? Number(lot?.thrashing_yield).toFixed(2) : 'NULL'}"`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PÁGINA 1 — ANÁLSIS FÍSICO (CALIDAD)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!phys) {
        console.log('❌ NO HAY REGISTRO EN physical_analysis para este lote');
    } else {
        console.log(`${OK(phys.moisture_pct)}     Humedad (%):         "${VAL(phys.moisture_pct)}"`);
        console.log(`${OK(phys.grain_color)}      Color de Grano:      "${VAL(phys.grain_color)}"`);
        console.log(`${OK(phys.density_gl)}       Densidad (g/L):      "${VAL(phys.density_gl)}"`);
        console.log(`${OK(phys.water_activity)}   Actividad Agua (AW): "${VAL(phys.water_activity)}"`);
        const primary   = phys?.defects_count?.primary;
        const secondary = phys?.defects_count?.secondary;
        console.log(`${OK(primary)}    Defectos Primarios:  "${VAL(primary)}"`);
        console.log(`${OK(secondary)}  Defectos Secundarios:"${VAL(secondary)}"`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PÁGINA 1 — GRANULOMETRÍA (MALLAS)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!sd) {
        console.log('❌ screen_size_distribution es NULL — Las barras estarán vacías');
    } else {
        const mallas = { M18: sd.size18, M17: sd.size17, M16: sd.size16, M15: sd.size15, M14: sd.size14, M13: sd.size13, M12: sd.size12, Fondo: sd.under12 };
        const total = Object.values(mallas).reduce((a, v) => a + Number(v || 0), 0);
        for (const [m, v] of Object.entries(mallas)) {
            const bar = '█'.repeat(Math.round((Number(v||0)/Math.max(total,1))*30));
            console.log(`${OK(v)}  ${m.padEnd(5)} ${String(Number(v||0).toFixed(1)).padStart(5)}%  ${bar}`);
        }
        const maxV = Math.max(...Object.values(mallas).map(v => Number(v||0)));
        console.log(`\n   Malla dominante: ${Object.entries(mallas).find(([,v]) => Number(v||0) === maxV)?.[0] || 'N/A'} (${Number(maxV).toFixed(1)}%)`);
        console.log(`   Total mallas: ${total.toFixed(1)}%`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PÁGINA 2 — SCA SCORE Y RADAR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!sca) {
        console.log('❌ NO HAY REGISTRO en sca_cupping — Score mostrará 00.00 y radar vacío');
    } else {
        console.log(`${OK(scaScore)}    Score Total SCA:     "${scaScore != null ? Number(scaScore).toFixed(2) : 'CALCULADO NULL'}"`);
        console.log(`${OK(sca.fragrance_aroma)}  Fragancia/Aroma:     "${VAL(sca.fragrance_aroma)}"`);
        console.log(`${OK(sca.flavor)}           Sabor:               "${VAL(sca.flavor)}"`);
        console.log(`${OK(sca.aftertaste)}       Post-gusto:          "${VAL(sca.aftertaste)}"`);
        console.log(`${OK(sca.acidity)}          Acidez:              "${VAL(sca.acidity)}"`);
        console.log(`${OK(sca.body)}             Cuerpo:              "${VAL(sca.body)}"`);
        console.log(`${OK(sca.balance)}          Balance:             "${VAL(sca.balance)}"`);
        console.log(`${OK(sca.overall)}          Global:              "${VAL(sca.overall)}"`);
        console.log(`${OK(sca.notes)}            Notas/Descriptores:  "${VAL(sca.notes)}"`);
        console.log(`${OK(sca.taster_name)}      Q-Grader:            "${VAL(sca.taster_name)}"`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PÁGINA 3 — LOGÍSTICA / SHIPMENT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!expRaw) {
        console.log('❌ NO HAY REGISTRO en green_exports para lot_id = inventory.id');
        console.log('   ⚠️  NOTA: green_exports.lot_id debería ser inventory.id pero puede ser lot_number');
    } else {
        console.log(`${OK(expRaw.vessel_name)}         Buque:               "${VAL(expRaw.vessel_name)}"`);
        console.log(`${OK(expRaw.bol_number)}          B/L Number:          "${VAL(expRaw.bol_number)}"`);
        console.log(`${OK(expRaw.eta)}                 ETA:                 "${VAL(expRaw.eta)}"`);
        console.log(`${OK(expRaw.seal_number)}         Precinto/Seal:       "${VAL(expRaw.seal_number)}"`);
        console.log(`${OK(expRaw.container_number)}    Contenedor:          "${VAL(expRaw.container_number)}"`);
        console.log(`${OK(expRaw.consignee)}           Consignatario:       "${VAL(expRaw.consignee)}"`);
        console.log(`${OK(expRaw.destination)}         Puerto Destino:      "${VAL(expRaw.destination)}"`);
        console.log(`${OK(expRaw.port_checkin_location)} GPS Location:      "${VAL(expRaw.port_checkin_location)}"`);
        console.log(`${OK(expRaw.port_checkin_timestamp)} Port Timestamp:   "${VAL(expRaw.port_checkin_timestamp)}"`);
        console.log(`${OK(expRaw.final_hash)}          Hash Blockchain:     "${VAL(expRaw.final_hash)}"`);
        console.log(`${OK(expRaw.status)}              Status Export:       "${VAL(expRaw.status)}"`);
    }

    // Verificar el mapeo clave: CoffeePassport usa lot?.export_data?.vessel_name
    // pero el export record viene de green_exports donde lot_id = inventory UUID o lot_number?
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNÓSTICO DE MAPEO DE DATOS (CoffeePassport)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   inventory.id (UUID):         "${lot?.id}"`);
    console.log(`   inventory.lot_number:         "${lot?.lot_number}"`);
    console.log(`   green_exports.lot_id value:   "${expRaw?.lot_id}"`);
    const matchesId     = expRaw?.lot_id === lot?.id;
    const matchesLotNum = expRaw?.lot_id === lot?.lot_number;
    console.log(`\n   ¿lot_id == inventory.id?       ${matchesId ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   ¿lot_id == lot_number?         ${matchesLotNum ? '✅ SÍ' : '❌ NO'}`);

    if (!matchesId && !matchesLotNum) {
        console.log(`\n   ⚠️  PROBLEMA: El CoffeePassport busca export_data desde`);
        console.log(`      GlobalHistoryArchive pasando lot?.export_data.`);
        console.log(`      Verificar cómo se pasa export_data al componente.`);
    }

    // Verificar cómo GlobalHistoryArchive pasa los datos al CoffeePassport
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 QUÉ VERÁ EL PASSPORT EN lot?.export_data');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // En GlobalHistoryArchive, cuando type === EXPORT, pasa:
    // lotData = { ...selectedItem.raw, batch_id: ..., export_data: selectedItem.raw }
    // Entonces lot.export_data === el registro green_exports completo
    if (expRaw) {
        console.log('   Cuando viene de GlobalHistoryArchive (EXPORT):');
        console.log(`   lot.export_data.vessel_name:            "${expRaw.vessel_name || '???'}"`);
        console.log(`   lot.export_data.bol_number:             "${expRaw.bol_number || '???'}"`);
        console.log(`   lot.export_data.eta:                    "${expRaw.eta || '???'}"`);
        console.log(`   lot.export_data.final_hash:             "${expRaw.final_hash || '???'}"`);
        console.log(`   lot.export_data.seal_number:            "${expRaw.seal_number || '???'}"`);
        console.log(`   lot.export_data.port_checkin_location:  "${expRaw.port_checkin_location || '???'}"`);
        console.log(`   lot.export_data.consignee:              "${expRaw.consignee || '???'}"`);
    } else {
        console.log('   ❌ No hay export record — P3 mostrará todo como "---"');
    }

    // También buscar por lot_number en green_exports
    const { data: expByLotNum } = await supabase.from('green_exports').select('*').eq('lot_id', lot?.lot_number).maybeSingle();
    if (expByLotNum) {
        console.log('\n   ✅ ENCONTRADO por lot_number en green_exports:');
        console.log(`   Buque: ${expByLotNum.vessel_name}`);
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN FINAL                             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    const issues = [];
    if (!phys) issues.push('❌ Sin datos de análisis físico → Humedad/Densidad/Defectos/Granulometría vacíos');
    if (!sca)  issues.push('❌ Sin datos SCA → Score "00.00", Radar vacío, sin notas');
    if (!expRaw) issues.push('❌ Sin registro green_exports → P3 toda en "---"');
    if (expRaw && !matchesId && !matchesLotNum) issues.push('⚠️  green_exports.lot_id no coincide con inventory.id ni lot_number');
    if (!lot?.latitude) issues.push('⚠️  Sin coordenadas GPS (latitud/longitud) → EUDR WGS84 no mostrará');

    if (issues.length === 0) {
        console.log('\n   ✅ TODOS LOS DATOS ESTÁN DISPONIBLES PARA IMPRESIÓN');
    } else {
        console.log('\n   Problemas detectados:');
        issues.forEach(i => console.log(`   ${i}`));
    }
    console.log('');
}

inspectPrintDocs().catch(console.error);
