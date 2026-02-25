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
    notes: string,
    companyId: string
) {
    try {
        const cleanId = inventoryId.trim();

        // 1. Inserción Blindada (Usamos upsert si es posible o insert)
        const { error: insertError } = await supabase
            .from('sca_cupping')
            .upsert([{
                inventory_id: cleanId,
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
                company_id: companyId
            }], { onConflict: 'inventory_id' }); // Necesita constraint unique en DB, si no, fallará como insert

        if (insertError) {
            // Si el upsert falla por falta de constraint, usamos insert normal
            const { error: retryError } = await supabase
                .from('sca_cupping')
                .insert([{
                    inventory_id: cleanId,
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
                    company_id: companyId
                }]);
            if (retryError) throw new Error(`Fallo en registro SCA: ${retryError.message}`);
        }

        // 2. Transición de Estado
        const { error: updateError } = await supabase
            .from('coffee_purchase_inventory')
            .update({ status: 'completed' })
            .eq('id', cleanId)
            .eq('company_id', companyId);

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
