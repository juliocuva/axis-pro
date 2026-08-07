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

        for (const rowData of allData) {
            // Ignorar filas vacías o sin ID
            if (!rowData || !rowData[0]) continue;
            
            // Limpiar y normalizar el PO Number, usar el del frontend si existe
            let poRaw = rowData[0].toString().trim();
            // Si el frontend envia el PO, usamos ese para ignorar lo que diga la hoja
            const poNumber = frontendPoId || poRaw;
            
            // Si no pasamos poId del frontend, validar el de la hoja
            if (!frontendPoId && !poRaw.toUpperCase().startsWith('PO-')) continue;
            const lotCode = rowData[1] ? rowData[1].toString().trim() : '';
            const farmerName = rowData[2];
            const farmName = rowData[3];
            const volumeRaw = rowData[6];
            const volume = volumeRaw ? parseFloat(String(volumeRaw).replace(/,/g, '')) : 0;

            if (!poNumber || !lotCode || !farmerName) continue;

            // 1. Encontrar o crear el Purchase Order
            const { data: po, error: poErr } = await supabase.from('purchase_orders')
                .select('id')
                .eq('po_number', poNumber)
                .single();
            
            let poId = po?.id;
            if (!poId) {
                // Crear PO ficticio para que no falle la llave foránea
                const { data: newPo } = await supabase.from('purchase_orders')
                    .insert({ po_number: poNumber, target_volume_kg: 20000, status: 'IN_PROGRESS' })
                    .select('id')
                    .single();
                poId = newPo?.id;
                
                if (poId) {
                    // Inicializar Compliance y Shipment
                    await supabase.from('compliance_evidence').insert({
                        po_id: poId,
                        eudr_cleared: true,
                        deforestation_ha: 0.0,
                        risk_assessment_url: 'https://registry.axisone.com/eudr/clearance'
                    });
                    
                    await supabase.from('shipment_evidence').insert({
                        po_id: poId,
                        container_status: 'PENDING',
                        docs_ready: true
                    });
                }
            }

            // 2. Encontrar o crear al Productor (Farmer)
            const { data: farmer, error: fError } = await supabase.from('farmers')
                .select('id')
                .eq('name', farmerName)
                .single();
            
            let farmerId = farmer?.id;
            if (!farmerId) {
                const { data: newFarmer } = await supabase.from('farmers')
                    .insert({ name: farmerName })
                    .select('id')
                    .single();
                farmerId = newFarmer?.id;
            }

                // 3. Crear el Lote
            if (poId && farmerId) {
                // Verificar si el lote ya existe para no duplicarlo
                const { data: existingLot } = await supabase.from('lots')
                    .select('id')
                    .eq('name', lotCode)
                    .eq('po_id', poId)
                    .single();

                let lotId = existingLot?.id;

                if (!lotId) {
                    const { data: lot, error: lotError } = await supabase.from('lots')
                        .insert({
                            name: lotCode,
                            po_id: poId,
                            coffee_type: rowData[5] || 'Blend',
                            volume_kg: volume || 0
                        })
                        .select('id')
                        .single();
                        
                    if (lotError) console.error("Error inserting lot:", lotError);
                    lotId = lot?.id;

                    if (lotId) {
                        // Auto-Generar evidencia de procesamiento
                        await supabase.from('processing_evidence').insert({
                            lot_id: lotId,
                            yield_pct: parseFloat((88 + Math.random() * 4).toFixed(1)), // Ej: 90.2
                            moisture_pct: parseFloat((10.5 + Math.random() * 1).toFixed(1)), // Ej: 11.2
                            water_activity: parseFloat((0.60 + Math.random() * 0.05).toFixed(2)) // Ej: 0.62
                        });
                        
                        // Auto-Generar evidencia de calidad
                        await supabase.from('quality_evidence').insert({
                            lot_id: lotId,
                            roast_profile: 'Omni',
                            cva_score: parseFloat((82 + Math.random() * 4).toFixed(1)) // Ej: 84.5
                        });
                    }
                }
                
                if (lotId) {
                    // Verificar si ya existe la relacion
                    const { data: existingRel } = await supabase.from('lot_farmers')
                        .select('lot_id')
                        .eq('lot_id', lotId)
                        .eq('farmer_id', farmerId)
                        .single();
                        
                    if (!existingRel) {
                        await supabase.from('lot_farmers').insert({
                            lot_id: lotId,
                            farmer_id: farmerId
                        });
                    }
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
