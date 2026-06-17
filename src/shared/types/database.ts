export interface CoffeePurchaseInventory {
    id: string;
    farmer_name: string;
    farm_name: string;
    lot_number: string;
    altitude: number;
    country: string;
    region: string;
    variety: string;
    process: string;
    purchase_weight: number;
    purchase_value: number;
    purchase_date: string;
    harvest_date: string;
    destination?: string;
    export_certificate?: boolean;
    latitude?: number;
    longitude?: number;
    process_data?: Record<string, unknown>;
    sica_id?: string | null;
    company_id: string;
    status: string;
    coffee_type: string;
    thrashed_weight?: number | null;
    thrashing_yield?: number | null;
    created_at?: string;
    area_ha?: number;
    eudr_polygon?: unknown;
}

export interface PurchaseProcessData {
    fermentation_style?: string;
    ph_inicial?: string | number;
    ph_final?: string | number;
    brix_inicial?: string | number;
    temperatura_masa_max?: string | number;
    duracion_fermentacion_horas?: string | number;
    actividad_agua_aw?: string | number;
    recipiente_fermentacion?: string;
    tipo_secado?: string;
    duracion_secado?: string | number;
    agente_infusion?: string;
    fermentation_notes?: string;
    sica_id?: string;
    farmer_phone?: string;
    raw_excel_data?: unknown;
    [key: string]: unknown;
}

export interface PurchaseFormData {
    farmerName: string;
    farmName: string;
    lotNumber: string;
    altitude: number | string;
    country: string;
    region: string;
    municipality?: string;
    variety: string;
    process: string;
    purchaseWeight: number | string;
    purchaseValue: number | string;
    purchaseDate: string;
    harvestDate: string;
    destination?: string;
    exportCertificate?: boolean | string;
    latitude?: number | string;
    longitude?: number | string;
    processData: PurchaseProcessData;
    sicaId?: string;
    companyId?: string;
    status?: string;
    coffeeType?: string;
    isEuropeDestination?: boolean;
    farmSizeHectares?: number;
    [key: string]: any;
}

export interface UserSession {
    id: string;
    email: string;
    companyId?: string;
    role?: string;
}
