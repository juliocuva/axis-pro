export type ProcessType = 'washed' | 'honey' | 'natural' | 'semi-washed';

export type CoffeeVariety =
    | '' | 'Castillo' | 'Caturra' | 'Colombia' | 'Tabi' | 'Bourbon'
    | 'Geisha' | 'Typica' | 'Maragogype' | 'Pacamara' | 'Sidra'
    | 'Wush Wush' | 'Java' | 'SL28' | 'Pink Bourbon' | 'Laurina'
    | 'Mundo Novo' | 'Cenicafe 1' | 'Papayo' | 'Chiroso';

export interface InventoryBatch {
    id: string;
    purchaseDate: string;
    variety: CoffeeVariety | string;
    process: ProcessType;
    farmerName: string;
    farmName: string;
    altitude: number;
    country?: string;
    region: string;
    purchaseWeight: number; // Kilos in parchment (Verde/Pergamino)
    thrashedWeight?: number; // Kilos after thrashing (Excelso)
    thrashingYield?: number; // % Efficiency (Factor de rendimiento)
    status: 'purchased' | 'thrashed' | 'roasting' | 'completed';
}

export interface RoastBatch {
    id: string;
    roastDate: string; // ISO format
    process: ProcessType;
    variety: CoffeeVariety;
    profileId: string;
    greenWeight: number;
    roastedWeight: number;
    chargeTemp: number;
    dropTime: string; // MM:SS
    developmentPct: number;
    machineId?: string;
    roasterName?: string;
}

export interface DegassingResult {
    batchId: string;
    optimalPackDate: string;
    latestSafeDispatch: string;
    riskLevel: 'low' | 'medium' | 'high';
    dispatchBlocked: boolean;
    blockReason: string;
    reasoning: string;
}

export interface ProcessRule {
    min: number;
    optimal: number;
    risk: number;
}
