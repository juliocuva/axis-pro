'use server';

import { supabase } from '@/shared/lib/supabase';

/**
 * AXIS PRO - AI ROAST COPILOT (SERVER-SIDE)
 * Lógica blindada para el asistente de perillas.
 * Se ejecuta en el servidor para proteger el algoritmo de predicción.
 */
export async function getRoastRecommendation(
    currentTime: number,
    currentTemp: number,
    currentRor: number,
    masterProfile: any
) {
    if (!masterProfile || !masterProfile.points) return null;

    const masterPoint = masterProfile.points.find((p: any) => p.t === currentTime);
    if (!masterPoint) return null;

    const tempDiff = currentTemp - masterPoint.temp;
    const absDiff = Math.abs(tempDiff);

    // Algoritmo de Predicción de Inercia (Simulado)
    let recommendation = "";
    let actionCode: 'INCREASE_GAS' | 'DECREASE_GAS' | 'SUBIR_AIRE' | 'ESTABLE' = 'ESTABLE';
    let intensity = 0;

    if (absDiff > 2.0) {
        if (tempDiff > 0) {
            recommendation = `ALERTA: EXCESO TÉRMICO CRÍTICO (+${absDiff.toFixed(1)}°C). Reducir GAS inmediatamente al 20% y ajustar Aire al 80%.`;
            actionCode = 'DECREASE_GAS';
            intensity = 80;
        } else {
            recommendation = `ALERTA: DÉFICIT TÉRMICO CRÍTICO (-${absDiff.toFixed(1)}°C). Aumentar GAS al 90% para recuperar inercia.`;
            actionCode = 'INCREASE_GAS';
            intensity = 90;
        }
    } else if (absDiff > 0.5) {
        if (tempDiff > 0) {
            recommendation = `Tendencia Alta. Reducir Gas 10% para evitar sobrepasar el master profile.`;
            actionCode = 'DECREASE_GAS';
            intensity = 10;
        } else {
            recommendation = `Tendencia Baja. Incrementar Gas 15% para mantener el RoR objetivo.`;
            actionCode = 'INCREASE_GAS';
            intensity = 15;
        }
    } else {
        recommendation = "SINCRONIZACIÓN MAESTRA: Perfil calcado con precisión quirúrgica.";
        actionCode = 'ESTABLE';
    }

    return {
        recommendation,
        actionCode,
        intensity,
        tempDiff,
        isSincronized: absDiff <= 0.5
    };
}

/**
 * PERSISTENCIA DE LOTE FINALIZADO
 */
export async function finalizeRoastBatch(batchData: any) {
    try {
        const { data, error } = await supabase
            .from('roast_batches')
            .insert([{
                ...batchData,
                status: 'roasted',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error("AXIS PERSISTENCE ERROR:", error.message);
        return { success: false, message: error.message };
    }
}
