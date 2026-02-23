'use server';

import { supabase } from '@/shared/lib/supabase';

export async function submitPhysicalAnalysis(
    inventoryId: string,
    data: any
) {
    try {
        const { error } = await supabase
            .from('physical_analysis')
            .insert([{
                inventory_id: inventoryId,
                moisture_pct: data.moisture,
                water_activity: data.waterActivity,
                density_gl: data.density,
                screen_size_distribution: data.screenSize,
                company_id: '99999999-9999-9999-9999-999999999999'
            }]);

        if (error) {
            console.error("Error detallado de Supabase:", error);
            return { success: false, message: error.message };
        }

        // No necesitamos actualizar el estado a 'thrashed' otra vez, 
        // ya lo estaba desde la trilla. Lo ideal es avanzar.
        await supabase
            .from('coffee_purchase_inventory')
            .update({ status: 'thrashed' })
            .eq('id', inventoryId);

        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || "Error de servidor" };
    }
}
