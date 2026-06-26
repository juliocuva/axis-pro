import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

export function useThrashingData(inventoryId: string | undefined, userCompanyId: string | undefined) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAlreadyThrashed, setIsAlreadyThrashed] = useState(false);
    const [lotDetails, setLotDetails] = useState<any>(null);
    const [initialFormData, setInitialFormData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchThrashingData = async () => {
            if (!inventoryId || !userCompanyId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const { data, error: dbError } = await supabase
                    .from('coffee_purchase_inventory')
                    .select('*')
                    .eq('id', inventoryId.trim())
                    .eq('company_id', userCompanyId)
                    .maybeSingle();

                if (dbError) {
                    console.error("AXIS DB ERROR (Trilla):", dbError);
                    setError("Error al cargar datos de inventario.");
                } else if (data) {
                    let processKey = 'Lavado';
                    const dbProcess = (data.process || 'lavado').toLowerCase();

                    if (dbProcess === 'natural') {
                        processKey = 'Natural';
                    } else if (dbProcess === 'honey') {
                        processKey = 'Honey';
                    } else if (dbProcess === 'sumergido') {
                        processKey = 'Sumergido';
                    } else if (dbProcess === 'semilavado') {
                        processKey = 'Semilavado';
                    } else { 
                        processKey = 'Lavado';
                    }

                    const rawExcel = data.process_data?.raw_excel_data?.inventory;
                    const thrashedW = Number(data.thrashed_weight) || rawExcel?.thrashedWeight || 0;
                    const pasillaW = Number(data.pasilla_weight) || (rawExcel?.processData?.pasillaWeight) || 0;
                    const ciscoW = Number(data.cisco_weight) || (rawExcel?.processData?.ciscoWeight) || 0;

                    setInitialFormData({
                        excelsoWeight: thrashedW,
                        pasillaWeight: pasillaW,
                        ciscoWeight: ciscoW,
                        processType: processKey,
                        humidity: Number(data.humidity) || data.process_data?.raw_excel_data?.physicalAnalysis?.moisturePct || 11.0,
                        preparationProtocol: data.process_data?.preparation_protocol || 'EP',
                        sortingMethod: data.process_data?.sorting_method || 'Máquina Selectora Óptica',
                        sieveAnalysis: data.process_data?.sieve_analysis || data.process_data?.raw_excel_data?.physicalAnalysis?.sieveAnalysis || { m18: 50, m17: 50, m16: 0, m15: 0, m14: 0, m13: 0, m12: 0, menores: 0 }
                    });

                    if (thrashedW > 0) {
                        setIsAlreadyThrashed(true);
                    }
                    setLotDetails(data);
                }
            } catch (err) {
                console.error("AXIS CRITICAL ERROR (Trilla):", err);
                setError("Ocurrió un error crítico al cargar los datos.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchThrashingData();
    }, [inventoryId, userCompanyId]);

    return { isLoading, error, isAlreadyThrashed, lotDetails, initialFormData };
}
