import { ProcessType, RoastBatch } from '@/shared/types';

export interface DegassingConfig {
    process: ProcessType;
    roastDevelopment: 'light' | 'medium' | 'dark'; // Darker = more CO2
    packagingType: 'valve' | 'no-valve' | 'sealed-tin';
    routeTemperature: 'arctic' | 'temperate' | 'tropical'; // High temp = faster gas release/higher pressure
}

export interface AdvancedDegassingResult {
    batchId: string;
    pressureCurve: { day: number; pressure: number; limit: number }[];
    daysToSafety: number;
    recommendedShipDate: string;
    criticalWarning: string | null;
    safetyFactor: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const BASE_PRESSURE: Record<'light' | 'medium' | 'dark', number> = {
    light: 1.2,
    medium: 1.8,
    dark: 2.5
};

const DECAY_K: Record<ProcessType, number> = {
    lavado: 0.15,
    'Lavado': 0.15,
    washed: 0.15,
    honey: 0.12,
    honey_yellow: 0.12,
    'Yellow Honey': 0.12,
    honey_red: 0.11,
    'Red Honey': 0.11,
    honey_black: 0.10,
    'Black Honey': 0.10,
    natural: 0.10,
    'Natural': 0.10,
    semi_lavado: 0.14,
    'semi-washed': 0.14,
    doble_fermentacion: 0.13,
    co_fermentacion: 0.13,
    anaerobico: 0.11
};

const TEMP_FACTOR: Record<'arctic' | 'temperate' | 'tropical', number> = {
    arctic: 0.7,
    temperate: 1.0,
    tropical: 1.4 // Speed up decay but also increases instant pressure risk
};

export function calculateAdvancedDegassing(
    batch: { id: string; roastDate: string },
    config: DegassingConfig
): AdvancedDegassingResult {
    const k = DECAY_K[config.process] * TEMP_FACTOR[config.routeTemperature];
    const p0 = BASE_PRESSURE[config.roastDevelopment];
    const safetyLimit = config.packagingType === 'valve' ? 0.8 : 0.3; // Valve allows more initial gas

    const pressureCurve = [];
    let daysToSafety = 0;
    const roastDate = new Date(batch.roastDate);

    for (let day = 0; day <= 21; day++) {
        // P(t) = P0 * e^(-kt)
        const pressure = p0 * Math.exp(-k * day);
        pressureCurve.push({
            day,
            pressure: parseFloat(pressure.toFixed(3)),
            limit: safetyLimit
        });

        if (pressure > safetyLimit) {
            daysToSafety = day + 1;
        }
    }

    const shipDate = new Date(roastDate);
    shipDate.setDate(roastDate.getDate() + daysToSafety + 2); // 2 days extra safety margin

    let riskLevel: AdvancedDegassingResult['riskLevel'] = 'low';
    let warning = null;

    if (daysToSafety > 14) {
        riskLevel = 'critical';
        warning = "ALERTA: Tiempo de estabilización excesivo. Riesgo de rancidez o ruptura de empaque en clima tropical.";
    } else if (daysToSafety > 7) {
        riskLevel = 'medium';
    }

    return {
        batchId: batch.id,
        pressureCurve,
        daysToSafety,
        recommendedShipDate: shipDate.toISOString().split('T')[0],
        criticalWarning: warning,
        safetyFactor: parseFloat(((1 - (p0 * Math.exp(-k * daysToSafety)) / safetyLimit) * 100).toFixed(1)),
        riskLevel
    };
}

