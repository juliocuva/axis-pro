export type ProcessType = 'lavado' | 'semilavado' | 'honey' | 'natural' | 'sumergido';

export type FermentationStyle =
    | 'estandar'
    | 'anaerobico'
    | 'otro';


export type CoffeeVariety =
    | ''
    | 'Bourbon'
    | 'Bourbon Rosado'
    | 'Castillo'
    | 'Caturra'
    | 'Cenicafe 1'
    | 'Chiroso'
    | 'Colombia'
    | 'Geisha'
    | 'Java'
    | 'Laurina'
    | 'Maragogype'
    | 'Mundo Novo'
    | 'Pacamara'
    | 'Papayo'
    | 'Sidra'
    | 'SL28'
    | 'Tabi'
    | 'Typica'
    | 'Wush Wush'
    | 'Otro';

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
    destination?: 'internal' | 'export_green' | 'export_roasted';
    exportCertificate?: string;
    moisture?: number; // Added for validation needs
}

export interface RoastBatch {
    id: string;
    batchIdLabel?: string;
    roastDate: string; // ISO format
    process: ProcessType;
    variety: CoffeeVariety | string;
    profileId: string;
    greenWeight: number;
    roastedWeight: number;
    selectedWeight?: number; // Weight after selection (defect removal)
    quakersGrams?: number;   // Weight of quakers in grams
    chargeTemp?: number;
    dropTime?: string; // MM:SS
    developmentPct?: number;
    machineId?: string;
    roasterName?: string;
    roastCurve?: Record<string, unknown>[]; // Points for chart {time, temp, ror, airflow, event}
    scaScore?: number;
    agtronBean?: number;
    agtronGround?: number;
}

export interface CVACupping {
    id: string;
    inventoryId: string;
    cuppingDate: string;
    tasterName: string;
    // SCA-103 (Descriptive)
    descriptiveData?: Record<string, unknown>; // JSON containing descriptive descriptors
    // SCA-104 (Affective 1-9 scale)
    cvaFragranceAroma?: number;
    cvaFlavorAftertaste?: number;
    cvaAcidity?: number;
    cvaSweetness?: number;
    cvaMouthfeel?: number;
    cvaUniformity?: number;
    cvaDefectsDeduction?: number;
    cvaFinalScore?: number;
    // Conversion to 100 scale for legacy compatibility
    legacy100ScoreEquivalent?: number;
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
