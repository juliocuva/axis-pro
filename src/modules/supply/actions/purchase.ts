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

        // 2. Validaciones de Rangos Físicos y Lógica de Negocio
        if (formData.altitude < 800 || formData.altitude > 2500) {
            throw new Error(`La altura (${formData.altitude} MSNM) está fuera del rango permitido (800-2500).`);
        }

        if (formData.purchaseWeight <= 0) {
            throw new Error("ERROR INDUSTRIAL: El peso de compra debe ser un valor positivo.");
        }

        if (formData.purchaseValue <= 0) {
            throw new Error("ERROR INDUSTRIAL: El valor de compra debe ser un valor positivo.");
        }

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
        let insertResponse = await supabase
            .from('coffee_purchase_inventory')
            .insert([{
                farmer_name: cleanFarmerName,
                farm_name: cleanFarmName,
                lot_number: cleanLotNumber,
                altitude: formData.altitude,
                country: formData.country,
                region: formData.region,
                variety: formData.variety,
                process: formData.process,
                purchase_weight: formData.purchaseWeight,
                purchase_value: formData.purchaseValue,
                purchase_date: formData.purchaseDate,
                destination: formData.destination,
                export_certificate: formData.exportCertificate,
                company_id: formData.companyId,
                status: 'purchased'
            }])
            .select()
            .single();

        // RETRY LOGIC: Si fallan las columnas de exportación (error PGRST204 o 42703), reintentamos sin ellas
        const isColumnError = insertResponse.error && (
            insertResponse.error.code === '42703' ||
            insertResponse.error.message?.includes('column') ||
            insertResponse.error.message?.includes('destination')
        );

        if (isColumnError) {
            console.warn("AXIS LOG: Detectada discrepancia de esquema. Reintentando sin columnas de exportación.");
            insertResponse = await supabase
                .from('coffee_purchase_inventory')
                .insert([{
                    farmer_name: cleanFarmerName,
                    farm_name: cleanFarmName,
                    lot_number: cleanLotNumber,
                    altitude: formData.altitude,
                    country: formData.country,
                    region: formData.region,
                    variety: formData.variety,
                    process: formData.process,
                    purchase_weight: formData.purchaseWeight,
                    purchase_value: formData.purchaseValue,
                    purchase_date: formData.purchaseDate,
                    company_id: formData.companyId,
                    status: 'purchased'
                }])
                .select()
                .single();
        }

        if (insertResponse.error) {
            console.error("AXIS INSERT ERROR FULL:", insertResponse.error);
            // Si el error es una violación de llave foránea (e.g. company_id que no existe)
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
