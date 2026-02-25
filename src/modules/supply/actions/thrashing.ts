'use server';

import { supabase } from '@/shared/lib/supabase';

/**
 * AXIS INDUSTRIAL LOGIC - SERVER SIDE ONLY
 * Cálculo oficial del Factor de Rendimiento Colombiano (Base 70kg).
 * Este algoritmo está blindado en el servidor para prevenir manipulación
 * de rendimientos en la cadena de custodia.
 */
export async function processThrashingAction(
    inventoryId: string,
    excelsoWeight: number,
    pasillaWeight: number,
    ciscoWeight: number,
    companyId: string
) {
    try {
        // 1. Obtener Peso Pergamino desde la fuente de verdad (DB)
        const { data: lot, error: fetchError } = await supabase
            .from('coffee_purchase_inventory')
            .select('purchase_weight')
            .eq('id', inventoryId)
            .eq('company_id', companyId)
            .single();

        if (fetchError || !lot) {
            throw new Error(`Error al recuperar datos del lote: ${fetchError?.message}`);
        }

        const parchmentWeight = lot.purchase_weight;

        // 2. Ejecutar Algoritmo Industrial (Fórmula Blindada)
        // Factor = (Peso Pergamino base 70 / Peso Excelso) * 70
        if (excelsoWeight <= 0) throw new Error("Peso excelso debe ser mayor a cero.");

        const yieldFactor = (parchmentWeight / excelsoWeight) * 70;

        // 3. Persistencia Unidireccional
        // AXIS SMART UPDATE: Intentamos actualizar todo, si las columnas no existen, retrocedemos
        const { error: updateError } = await supabase
            .from('coffee_purchase_inventory')
            .update({
                thrashed_weight: excelsoWeight,
                pasilla_weight: pasillaWeight,
                cisco_weight: ciscoWeight,
                thrashing_yield: yieldFactor,
                status: 'thrashed'
            })
            .eq('id', inventoryId)
            .eq('company_id', companyId);

        if (updateError) {
            // Si el error es PGRST204 (columna no encontrada), reintentamos sin pasilla/cisco
            if (updateError.code === 'PGRST204') {
                const { error: retryError } = await supabase
                    .from('coffee_purchase_inventory')
                    .update({
                        thrashed_weight: excelsoWeight,
                        thrashing_yield: yieldFactor,
                        status: 'thrashed'
                    })
                    .eq('id', inventoryId)
                    .eq('company_id', companyId);

                if (retryError) throw new Error(`Error en persistencia (Reintento): ${retryError.message}`);
            } else {
                throw new Error(`Error en persistencia: ${updateError.message}`);
            }
        }

        return {
            success: true,
            yieldFactor,
            message: "Transformación de trilla completada y blindada."
        };

    } catch (error: any) {
        console.error("AXIS SERVER ERROR [Thrashing]:", error.message);
        return {
            success: false,
            message: error.message
        };
    }
}
