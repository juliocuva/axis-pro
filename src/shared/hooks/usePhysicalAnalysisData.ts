import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

export function usePhysicalAnalysisData(inventoryId: string | undefined, userCompanyId: string | undefined) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAlreadyAnalyzed, setIsAlreadyAnalyzed] = useState(false);
    const [lotDetails, setLotDetails] = useState<any>(null);
    const [initialFormData, setInitialFormData] = useState<any>(null);
    const [initialPhysicochemicalData, setInitialPhysicochemicalData] = useState<any>(null);
    const [millSievesAnalyzed, setMillSievesAnalyzed] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!inventoryId) {
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                // Fetch physical analysis
                const { data: physicalData, error: physicalError } = await supabase
                    .from('physical_analysis')
                    .select('*')
                    .eq('inventory_id', inventoryId.trim())
                    .eq('company_id', userCompanyId || '')
                    .order('created_at', { ascending: false })
                    .limit(1);

                // Fetch lot details for EUDR and physicochemical analysis
                const { data: lotData, error: lotError } = await supabase
                    .from('coffee_purchase_inventory')
                    .select('*')
                    .eq('id', inventoryId.trim())
                    .single();

                let formDataToSet: any = null;
                let physicochemicalDataToSet: any = null;
                let alreadyAnalyzed = false;

                if (physicalError) {
                    console.error("AXIS DB ERROR (Physical):", physicalError);
                    setError("Error al cargar datos de laboratorio físico.");
                } else if (physicalData && physicalData.length > 0) {
                    const record = physicalData[0];
                    formDataToSet = {
                        moisture: Number(record.moisture_pct) || 0,
                        waterActivity: Number(record.water_activity) || 0,
                        density: Number(record.density_gl) || 0,
                        sieveAnalysis: record.screen_size_distribution || {
                            m18: 0, m17: 0, m16: 0, m15: 0, m14: 0, m13: 0, m12: 0, menores: 0
                        },
                        defects: record.defects_count || {
                            primary: 0.0, secondary: 0.0
                        },
                        grainColor: record.grain_color || 'VERDE OLIVA'
                    };
                    alreadyAnalyzed = true;
                } else if (!lotError && lotData) {
                    // Fallback to Excel pre-loaded data
                    const excelData = lotData.process_data?.raw_excel_data?.physicalAnalysis;
                    if (excelData) {
                        formDataToSet = {
                            moisture: excelData.moisturePct || 11.5,
                            waterActivity: excelData.waterActivity || 0.58,
                            density: excelData.density || 720,
                            sieveAnalysis: excelData.sieveAnalysis || {
                                m18: 0, m17: 0, m16: 0, m15: 0, m14: 0, m13: 0, m12: 0, menores: 0
                            },
                            defects: excelData.defects || { primary: 0, secondary: 0 },
                            grainColor: excelData.grainColor || 'VERDE OLIVA'
                        };
                    }
                }

                if (!lotError && lotData) {
                    setLotDetails(lotData);
                    const pd = lotData.process_data;
                    
                    // Pre-fill screen size from thrashing data if not already analyzed or if analyzed but empty
                    if (pd?.sieve_analysis) {
                        const sa = pd.sieve_analysis;
                        
                        // Extract which sieves were actually recorded in mill
                        const activeSieves = [];
                        if (Number(sa.m18) > 0) activeSieves.push('m18');
                        if (Number(sa.m17) > 0) activeSieves.push('m17');
                        if (Number(sa.m16) > 0) activeSieves.push('m16');
                        if (Number(sa.m15) > 0) activeSieves.push('m15');
                        if (Number(sa.caracol) > 0 || Number(sa.m14) > 0) activeSieves.push('m14');
                        if (Number(sa.m13) > 0) activeSieves.push('m13');
                        if (Number(sa.m12) > 0) activeSieves.push('m12');
                        if (Number(sa.menores) > 0) activeSieves.push('menores');
                        setMillSievesAnalyzed(activeSieves);

                        if (formDataToSet) {
                            const currentValues = Object.values(formDataToSet.sieveAnalysis);
                            const isCurrentlyEmpty = currentValues.length === 0 || currentValues.every(v => Number(v) === 0);
                            
                            if (isCurrentlyEmpty) {
                                formDataToSet.sieveAnalysis = {
                                    m18: Number(sa.m18) || 0,
                                    m17: Number(sa.m17) || 0,
                                    m16: Number(sa.m16) || 0,
                                    m15: Number(sa.m15) || 0,
                                    m14: Number(sa.caracol) || Number(sa.m14) || 0,
                                    m13: Number(sa.m13) || 0,
                                    m12: Number(sa.m12) || 0,
                                    menores: Number(sa.menores) || 0
                                };
                            }
                        }
                    }

                    if (pd) {
                        physicochemicalDataToSet = {
                            ph_inicial: pd.ph_inicial || '4.5',
                            ph_final: pd.ph_final || '3.8',
                            brix_inicial: pd.brix_inicial || '18.5',
                            temperatura_masa_max: pd.temperatura_masa_max || '35',
                            duracion_fermentacion_horas: pd.duracion_fermentacion_horas || '72',
                            actividad_agua_aw: pd.actividad_agua_aw || '',
                            recipiente_fermentacion: pd.recipiente_fermentacion || '',
                            agente_infusion: pd.agente_infusion || ''
                        };
                    }
                }

                if (formDataToSet) setInitialFormData(formDataToSet);
                if (physicochemicalDataToSet) setInitialPhysicochemicalData(physicochemicalDataToSet);
                setIsAlreadyAnalyzed(alreadyAnalyzed);

            } catch (err) {
                console.error("AXIS CRITICAL ERROR (Physical):", err);
                setError("Ocurrió un error crítico al cargar el análisis.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [inventoryId, userCompanyId]);

    return { isLoading, error, isAlreadyAnalyzed, lotDetails, initialFormData, initialPhysicochemicalData, millSievesAnalyzed };
}
