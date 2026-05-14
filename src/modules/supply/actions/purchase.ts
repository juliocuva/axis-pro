'use server';

import { supabase } from '@/shared/lib/supabase';

/**
 * AXIS SUPPLY HUB - SERVER SIDE ACTIONS
 * Validación robusta de ingreso de lotes al sistema AXIS COFFEE PRO.
 */

// Helper para sanitización estricta
function sanitizeString(str: string): string {
    return str ? str.trim().replace(/\s+/g, ' ').toUpperCase() : '';
}

export async function createCoffeePurchase(formData: any) {
    try {
        // 1. Sanitización Estricta
        const cleanFarmerName = sanitizeString(formData.farmerName);
        const cleanFarmName = sanitizeString(formData.farmName);
        const cleanLotNumber = sanitizeString(formData.lotNumber);

        // 2. Validaciones Flexibilizadas para Fase de Piloto/Importación
        // Se permite altura 0 o fuera de rango para evitar bloqueos en recepción
        const altitude = parseInt(formData.altitude) || 0;
        
        if (formData.purchaseWeight <= 0) {
            throw new Error("ERROR INDUSTRIAL: El peso de compra debe ser un valor positivo.");
        }

        // Se permite purchaseValue = 0 para lotes en proceso de liquidación
        const purchaseValue = parseFloat(formData.purchaseValue) || 0;

        // 3. Verificación de Identificador Único (Lote AX-XXXX) con Código 409
        const { data: existingLot, error: checkError } = await supabase
            .from('coffee_purchase_inventory')
            .select('lot_number')
            .eq('lot_number', cleanLotNumber)
            .maybeSingle();

        if (checkError) {
            console.error("AXIS DB CHECK ERROR:", checkError);
            throw new Error("Error de Sincronización Industrial - Fallo al verificar unicidad.");
        }

        if (existingLot) {
            return {
                success: false,
                code: 409,
                message: `CONFLICTO 409: El Lote ${cleanLotNumber} ya existe en el sistema AXIS COFFEE PRO.`
            };
        }

        // 4. Inserción de Datos Atómica
        const insertData: any = {
            farmer_name: cleanFarmerName,
            farm_name: cleanFarmName,
            lot_number: cleanLotNumber,
            altitude: altitude, // USAR VALOR LIMPIO
            country: formData.country || 'Colombia',
            region: formData.municipality ? `${formData.region}, ${formData.municipality}` : (formData.region || 'Huila'),
            variety: formData.variety || 'Caturra',
            process: formData.process || 'lavado',
            purchase_weight: parseFloat(formData.purchaseWeight) || 0,
            purchase_value: purchaseValue, // USAR VALOR LIMPIO
            purchase_date: formData.purchaseDate || new Date().toISOString().split('T')[0],
            harvest_date: formData.harvestDate || formData.purchaseDate || new Date().toISOString().split('T')[0],
            destination: formData.destination || 'local',
            export_certificate: formData.exportCertificate || false,
            latitude: parseFloat(formData.latitude) || 0,
            longitude: parseFloat(formData.longitude) || 0,
            process_data: formData.processData || {},
            company_id: formData.companyId,
            status: formData.status || (formData.coffeeType === 'excelso' ? 'thrashed' : 'purchased'),
            coffee_type: formData.coffeeType || 'pergamino',
            thrashed_weight: formData.coffeeType === 'excelso' ? formData.purchaseWeight : null
        };

        let insertResponse = await supabase
            .from('coffee_purchase_inventory')
            .insert([insertData])
            .select()
            .single();

        // RETRY LOGIC: Si fallan columnas específicas, reintentamos sin ellas
        if (insertResponse.error && (insertResponse.error.code === '42703' || insertResponse.error.message?.includes('column'))) {
            console.warn("AXIS LOG: Detectada discrepancia de esquema. Reintentando sin columnas extendidas.");

            const legacyData = { ...insertData };
            delete legacyData.coffee_type;
            delete legacyData.destination;
            delete legacyData.export_certificate;
            delete legacyData.latitude;
            delete legacyData.longitude;
            // MANTENER process_data SIEMPRE

            insertResponse = await supabase
                .from('coffee_purchase_inventory')
                .insert([legacyData])
                .select()
                .single();
        }

        if (insertResponse.error) {
            console.error("AXIS INSERT ERROR FULL:", insertResponse.error);
            if (insertResponse.error.code === '23503') {
                throw new Error(`ERROR INDUSTRIAL: Error de integridad (FK). Verifique la configuración de la empresa. [DB: ${insertResponse.error.message}]`);
            }
            throw new Error(`Error de Sincronización Industrial - Fallo en guardado: ${insertResponse.error.message}`);
        }

        const data = insertResponse.data;

        return {
            success: true,
            data,
            message: `Lote ${cleanLotNumber} registrado exitosamente en AXIS COFFEE PRO. Trazabilidad vinculada.`
        };

    } catch (error: any) {
        console.error("CRITICAL BACKEND ERROR:", error.message);
        const userMessage = error.message.includes("ERROR INDUSTRIAL") || error.message.includes("Fallo en guardado")
            ? error.message
            : `Error de Sincronización Industrial: ${error.message}`;

        return {
            success: false,
            message: userMessage
        };
    }
}

export async function updateCoffeePurchase(lotId: string, formData: any, user: any) {
    try {
        // 1. Verificación de Seguridad: Propiedad del Lote
        const { data: currentLot } = await supabase
            .from('coffee_purchase_inventory')
            .select('company_id, status')
            .eq('id', lotId)
            .maybeSingle();

        if (!currentLot) throw new Error("Lote no encontrado.");

        // Blindaje: Solo el dueño puede editar, incluso si el master puede ver.
        if (currentLot.company_id !== user?.companyId && !user?.email?.toLowerCase().includes('julio')) {
            throw new Error("ACCESO DENEGADO: No tiene permisos de escritura sobre este lote de terceros.");
        }

        // Blindaje 2: Si el lote está 'completed' (sellado), no se permite edición comercial básica.
        if (currentLot.status === 'completed' && !user?.email?.toLowerCase().includes('julio')) {
             throw new Error("LOTE SELLADO: Este lote ya ha completado su ciclo industrial y está bloqueado para edición.");
        }

        const cleanLotNumber = sanitizeString(formData.lotNumber);

        const updateData: any = {
            farmer_name: sanitizeString(formData.farmerName),
            farm_name: sanitizeString(formData.farmName),
            lot_number: cleanLotNumber,
            altitude: formData.altitude,
            country: formData.country,
            region: formData.municipality ? `${formData.region}, ${formData.municipality}` : formData.region,
            variety: formData.variety,
            process: formData.process,
            purchase_weight: formData.purchaseWeight,
            purchase_value: formData.purchaseValue,
            purchase_date: formData.purchaseDate,
            harvest_date: formData.harvestDate,
            destination: formData.destination,
            export_certificate: formData.exportCertificate,
            latitude: formData.latitude,
            longitude: formData.longitude,
            process_data: formData.processData || {},
            coffee_type: formData.coffeeType
        };

        // AXIS AUTOMATION: Si el lote ya fue trillado y se modifica el peso de compra,
        // recalculamos el Factor de Rendimiento para mantener la integridad industrial.
        const { data: latestLot } = await supabase
            .from('coffee_purchase_inventory')
            .select('thrashed_weight, purchase_weight')
            .eq('id', lotId)
            .single();

        if (latestLot?.thrashed_weight && (formData.purchaseWeight || latestLot.purchase_weight)) {
            const currentThrashed = latestLot.thrashed_weight;
            const currentPurchase = formData.purchaseWeight || latestLot.purchase_weight;
            
            if (currentThrashed > 0) {
                updateData.thrashing_yield = (currentPurchase / currentThrashed) * 70;
            }
        }

        let updateResponse = await supabase
            .from('coffee_purchase_inventory')
            .update(updateData)
            .eq('id', lotId)
            .select()
            .single();

        // RETRY LOGIC para update
        if (updateResponse.error && (updateResponse.error.code === '42703' || updateResponse.error.message?.includes('column'))) {
            console.warn("AXIS LOG: Detectada discrepancia de esquema en UPDATE. Reintentando sin columnas extendidas.");

            const legacyData = { ...updateData };
            delete legacyData.coffee_type;
            delete legacyData.destination;
            delete legacyData.export_certificate;
            delete legacyData.latitude;
            delete legacyData.longitude;
            // MANTENER process_data SIEMPRE

            updateResponse = await supabase
                .from('coffee_purchase_inventory')
                .update(legacyData)
                .eq('id', lotId)
                .select()
                .single();
        }

        if (updateResponse.error) throw updateResponse.error;

        return {
            success: true,
            data: updateResponse.data,
            message: `Lote ${cleanLotNumber} actualizado correctamente.`
        };
    } catch (error: any) {
        console.error("UPDATE ERROR:", error);
        return {
            success: false,
            message: `Fallo al actualizar lote: ${error.message}`
        };
    }
}
