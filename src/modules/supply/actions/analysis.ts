'use server';

import { supabase } from '@/shared/lib/supabase';

export async function submitPhysicalAnalysis(
    inventoryId: string,
    data: any,
    companyId: string,
    physicochemicalData?: any
) {
    try {
        // Validation: Moisture Range 9% - 13%
        const moisture = parseFloat(data.moisture);
        if (moisture < 9 || moisture > 13) {
            return {
                success: false,
                message: "ERROR TÉCNICO: Humedad fuera de rango (9%-13%). No apto para proceso industrial."
            };
        }

        const { error } = await supabase
            .from('physical_analysis')
            .insert([{
                inventory_id: inventoryId,
                moisture_pct: moisture,
                water_activity: data.waterActivity,
                density_gl: data.density,
                screen_size_distribution: data.sieveAnalysis || data.screenSize,
                defects_count: data.defects,
                grain_color: data.grain_color || data.grainColor,
                company_id: companyId
            }]);

        if (error) {
            console.error("Error detallado de Supabase (Physical):", error);
            return { success: false, message: "Error de Sincronización: Fallo en persistencia de análisis físico." };
        }

        // Si hay datos fisicoquímicos, actualizamos el process_data del lote
        if (physicochemicalData) {
            const { data: invData, error: fetchError } = await supabase
                .from('coffee_purchase_inventory')
                .select('process_data')
                .eq('id', inventoryId)
                .single();

            if (!fetchError && invData) {
                const updatedProcessData = {
                    ...(invData.process_data || {}),
                    ...physicochemicalData
                };

                await supabase
                    .from('coffee_purchase_inventory')
                    .update({ process_data: updatedProcessData })
                    .eq('id', inventoryId);
            }
        }

        // Atomic update of status to 'thrashed' (trillado)
        const { error: updateError } = await supabase
            .from('coffee_purchase_inventory')
            .update({ status: 'thrashed' })
            .eq('id', inventoryId)
            .eq('company_id', companyId);

        if (updateError) {
            console.error("Error updating inventory status:", updateError);
            return { success: false, message: "Error de Sincronización: Fallo al actualizar estado del lote." };
        }

        return { success: true, message: "Análisis técnico y físico registrado exitosamente." };
    } catch (err: any) {
        console.error("AXIS ANALYSIS CRITICAL ERROR:", err);
        return { success: false, message: "Error de Sincronización Industrial: Error crítico de servidor." };
    }
}
