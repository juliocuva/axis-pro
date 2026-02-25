'use server';

import { supabase } from '@/shared/lib/supabase';

export async function submitPhysicalAnalysis(
    inventoryId: string,
    data: any,
    companyId: string
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
                screen_size_distribution: data.screenSize,
                defects_count: data.defects,
                grain_color: data.grainColor,
                company_id: companyId
            }]);

        if (error) {
            console.error("Error detallado de Supabase:", error);
            return { success: false, message: "Error de Sincronización Industrial: Fallo en persistencia de laboratorio." };
        }

        // Atomic update of status
        const { error: updateError } = await supabase
            .from('coffee_purchase_inventory')
            .update({ status: 'thrashed' })
            .eq('id', inventoryId)
            .eq('company_id', companyId);

        if (updateError) {
            console.error("Error updating inventory status:", updateError);
            return { success: false, message: "Error de Sincronización Industrial: Fallo al actualizar estado del lote." };
        }

        return { success: true, message: "Análisis físico registrado y sincronizado exitosamente." };
    } catch (err: any) {
        console.error("AXIS ANALYSIS CRITICAL ERROR:", err);
        return { success: false, message: "Error de Sincronización Industrial: Error crítico de servidor." };
    }
}
