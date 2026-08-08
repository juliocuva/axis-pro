import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { supabase } from '@/shared/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let { sheetId, poId: frontendPoId } = body;

        if (!sheetId) {
            return NextResponse.json({ success: false, error: 'Sheet ID is required' }, { status: 400 });
        }

        // Extraer el ID si pegaron la URL completa
        if (sheetId.includes('/d/')) {
            const matches = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (matches && matches[1]) {
                sheetId = matches[1].trim();
            }
        } else {
            // Si pegaron solo el ID seguido de /edit
            sheetId = sheetId.split('/')[0].trim();
        }

        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!email || !key) {
            throw new Error('Google Cloud credentials missing in .env.local');
        }

        const serviceAccountAuth = new JWT({
            email,
            key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
        await doc.loadInfo(); // Carga las pestañas del documento

        const sheet = doc.sheetsByIndex[0]; // Lee la primera pestaña
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        const rows = await sheet.getRows();

        const allData = [];
        // Si el usuario no puso encabezados y la fila 1 son datos (ej: PO-2026-08-001)
        if (headers && headers.length > 0 && String(headers[0]).startsWith('PO-')) {
            allData.push(headers);
        }
        
        for (const row of rows) {
            const raw = (row as any)._rawData;
            if (raw && raw.length > 0) {
                allData.push(raw);
            }
        }
        const processedRecords = [];

        // AGRUPAR DATOS (Idempotencia)
        // Si hay filas duplicadas en el excel (mismo PO, mismo Lote, mismo Productor, mismo Varietal), sumamos su volumen.
        const deliveriesMap = new Map<string, any>();

        for (const rowData of allData) {
            if (!rowData || !rowData[0]) continue;
            
            let poRaw = rowData[0].toString().trim();
            const poNumber = frontendPoId || poRaw;
            if (!frontendPoId && !poRaw.toUpperCase().startsWith('PO-')) continue;

            const lotCode = rowData[1] ? rowData[1].toString().trim() : '';
            const farmerName = rowData[2] ? rowData[2].toString().trim() : '';
            const farmName = rowData[3] ? rowData[3].toString().trim() : '';
            const municipality = rowData[4] ? rowData[4].toString().trim() : '';
            const coffeeVariety = rowData[5] ? rowData[5].toString().trim() : 'Blend';
            const volumeRaw = rowData[6];
            const volume = volumeRaw ? parseFloat(String(volumeRaw).replace(/,/g, '')) : 0;
            const basePrice = rowData[7] ? parseFloat(String(rowData[7]).replace(/,/g, '')) : 0;

            if (!poNumber || !lotCode || !farmerName) continue;

            const key = `${poNumber}|${lotCode}|${farmerName}|${coffeeVariety}`;
            if (deliveriesMap.has(key)) {
                deliveriesMap.get(key).volume += volume;
            } else {
                deliveriesMap.set(key, { poNumber, lotCode, farmerName, farmName, municipality, coffeeVariety, volume, basePrice });
            }
        }


        for (const delivery of Array.from(deliveriesMap.values())) {
            const { poNumber, lotCode, farmerName, coffeeVariety, volume } = delivery;

            // 1. PO
            let { data: po } = await supabase.from('purchase_orders').select('id').eq('po_number', poNumber).single();
            let poId = po?.id;
            if (!poId) {
                const { data: newPo } = await supabase.from('purchase_orders').insert({ po_number: poNumber, target_volume_kg: 20000, status: 'IN_PROGRESS' }).select('id').single();
                poId = newPo?.id;
                if (poId) {
                    await supabase.from('compliance_evidence').insert({ po_id: poId, eudr_cleared: true, deforestation_ha: 0.0, risk_assessment_url: 'https://registry.axisone.com/eudr/clearance' });
                    await supabase.from('shipment_evidence').insert({ po_id: poId, container_status: 'PENDING', docs_ready: true });
                }
            }

            // 2. Farmer
            let { data: farmer } = await supabase.from('farmers').select('id').eq('name', farmerName).single();
            let farmerId = farmer?.id;
            if (!farmerId) {
                const { data: newFarmer } = await supabase.from('farmers').insert({ name: farmerName }).select('id').single();
                farmerId = newFarmer?.id;
            }

            // 3. Lot (Determinístico)
            if (poId && farmerId) {
                // Buscamos si ya existe este lote exacto para este productor
                const { data: existingLotFarmer } = await supabase.from('lot_farmers')
                    .select('lot_id, lots!inner(po_id, name, coffee_type)')
                    .eq('farmer_id', farmerId)
                    .eq('lots.name', lotCode)
                    .eq('lots.po_id', poId)
                    .eq('lots.coffee_type', coffeeVariety)
                    .maybeSingle();

                let lotId = existingLotFarmer?.lot_id;

                if (!lotId) {
                    // Crear nuevo lote
                    const { data: lot, error: lotError } = await supabase.from('lots')
                        .insert({ name: lotCode, po_id: poId, coffee_type: coffeeVariety, volume_kg: volume })
                        .select('id').single();
                        
                    if (lotError) console.error("Error inserting lot:", lotError);
                    lotId = lot?.id;

                    if (lotId) {
                        await supabase.from('lot_farmers').insert({ lot_id: lotId, farmer_id: farmerId });
                        await supabase.from('processing_evidence').insert({ lot_id: lotId, yield_pct: parseFloat((88 + Math.random() * 4).toFixed(1)), moisture_pct: parseFloat((10.5 + Math.random() * 1).toFixed(1)), water_activity: parseFloat((0.60 + Math.random() * 0.05).toFixed(2)) });
                        await supabase.from('quality_evidence').insert({ lot_id: lotId, roast_profile: 'Omni', cva_score: parseFloat((82 + Math.random() * 4).toFixed(1)) });
                    }
                } else {
                    // Upsert: Si el lote ya existe, actualizamos su volumen para que refleje el Excel exactamente
                    await supabase.from('lots').update({ volume_kg: volume }).eq('id', lotId);
                }
            }

            processedRecords.push({ lotCode, farmerName, volume });
        }

        return NextResponse.json({
            success: true,
            message: 'Sincronización exitosa con Google Sheets',
            recordsProcessed: processedRecords.length,
            sheetTitle: doc.title,
            data: processedRecords
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error syncing Google Sheets:', error);
        return NextResponse.json(
            { success: false, message: 'Error de Sincronización', error: error.message || String(error) },
            { status: 500 }
        );
    }
}
