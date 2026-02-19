import { ProcessType, ProcessRule, DegassingResult, RoastBatch } from '@/types';

const PROCESS_RULES: Record<ProcessType, ProcessRule> = {
    washed: { min: 7, optimal: 10, risk: 1 },
    honey: { min: 10, optimal: 14, risk: 2 },
    natural: { min: 14, optimal: 18, risk: 3 }
};

export function calculateDegassing(
    batch: Pick<RoastBatch, 'id' | 'roastDate' | 'process'>,
    route: string = 'BOG-DXB',
    flightFrequencyDays: number = 7
): DegassingResult {
    const rule = PROCESS_RULES[batch.process];

    if (!rule) {
        throw new Error(`Proceso "${batch.process}" no reconocido por el sistema.`);
    }

    let extraDays = 0;
    let riskScore = rule.risk;

    // Ruta crítica (ejemplo Dubái)
    if (route.includes("DXB")) {
        extraDays += 2;
        riskScore += 1;
    }

    // Frecuencia de vuelo baja incrementa el riesgo logístico
    if (flightFrequencyDays > 3) {
        riskScore += 1;
    }

    // Determinar nivel de riesgo
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 3) riskLevel = 'medium';
    if (riskScore >= 5) riskLevel = 'high';

    let dispatchBlocked = false;
    let blockReason = "";

    if (riskLevel === "high") {
        dispatchBlocked = true;
        blockReason = "ALERTA: Riesgo crítico por desgasificación insuficiente para ruta aérea prolongada.";
    }

    const roastDate = new Date(batch.roastDate);

    // Cálculo de fechas
    const optimalPackDate = new Date(roastDate);
    optimalPackDate.setDate(roastDate.getDate() + rule.optimal + extraDays);

    const latestSafeDate = new Date(roastDate);
    latestSafeDate.setDate(roastDate.getDate() + rule.optimal + extraDays + 5);

    return {
        batchId: batch.id,
        optimalPackDate: optimalPackDate.toISOString().split("T")[0],
        latestSafeDispatch: latestSafeDate.toISOString().split("T")[0],
        riskLevel,
        dispatchBlocked,
        blockReason,
        reasoning: `Análisis para ${batch.process}: Ruta ${route} (+2d), Frecuencia ${flightFrequencyDays}d. Score: ${riskScore}`
    };
}
