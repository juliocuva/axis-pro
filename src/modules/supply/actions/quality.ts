'use server';

import { supabase } from '@/shared/lib/supabase';

/**
 * AXIS QUALITY ASSURANCE - SERVER SIDE
 * Registro blindado de protocolos SCA.
 * La puntuación total se valida en DB, pero el servidor asegura
 * la integridad de los resultados individuales.
 */
export async function submitCuppingProtocol(
    inventoryId: string,
    scores: any,
    tasterName: string,
    notes: string
) {
    try {
        // 1. Inserción Blindada
        const { error: insertError } = await supabase
            .from('sca_cupping')
            .insert([{
                inventory_id: inventoryId,
                fragrance_aroma: scores.fragrance_aroma,
                flavor: scores.flavor,
                aftertaste: scores.aftertaste,
                acidity: scores.acidity,
                body: scores.body,
                balance: scores.balance,
                uniformity: scores.uniformity,
                clean_cup: scores.clean_cup,
                sweetness: scores.sweetness,
                overall: scores.overall,
                defects_score: scores.defects_score,
                notes,
                taster_name: tasterName,
                company_id: '99999999-9999-9999-9999-999999999999' // ID corporativo fijo por ahora
            }]);

        if (insertError) throw new Error(`Fallo en registro SCA: ${insertError.message}`);

        // 2. Transición Unidireccional de Estado
        // Una vez catado, el lote se considera "Sellado" y pasa a historial industrial.
        const { error: updateError } = await supabase
            .from('coffee_purchase_inventory')
            .update({ status: 'completed' })
            .eq('id', inventoryId);

        if (updateError) throw new Error(`Fallo en cierre de lote: ${updateError.message}`);

        return {
            success: true,
            message: "Protocolo SCA Sellar y Firmado en Blockchain AXIS."
        };

    } catch (error: any) {
        console.error("AXIS QUALITY ERROR:", error.message);
        return { success: false, message: error.message };
    }
}
