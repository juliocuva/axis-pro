import React, { useState, useEffect } from 'react';
import { CoffeeVariety, ProcessType } from '@/shared/types';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import { createCoffeePurchase, updateCoffeePurchase } from '../actions/purchase';
import { supabase } from '@/shared/lib/supabase';
import EUDRGeoreference from './EUDRGeoreference';


const COFFEE_VARIETIES_BASE: string[] = [
    'Bourbon', 'Bourbon Rosado', 'Castillo', 'Caturra', 'Cenicafe 1',
    'Chiroso', 'Colombia', 'Geisha', 'Java', 'Laurina',
    'Maragogype', 'Mundo Novo', 'Pacamara', 'Papayo', 'Sidra',
    'SL28', 'Tabi', 'Typica', 'Wush Wush'
];

const PROCESS_TYPES: ProcessType[] = [
    'lavado', 'honey', 'honey_yellow', 'honey_red', 'honey_black', 'natural', 'anaerobico', 'semi_lavado', 'doble_fermentacion', 'co_fermentacion'
];

const EXCEL_TEMPLATE_HEADER = "Fecha(DD/MM/AA),Caficultor,Finca,Variedad,Proceso(lavado/natural/honey),Peso(Kg),HorasFerm,pH_Final,Brix_Inicial\n";
const EXCEL_TEMPLATE_EXAMPLE = "13/04/24,Juan Perez,El Roble,Caturra,Lavado,120,36,4.2,18";

const COLOMBIAN_REGIONS = [
    'Huila', 'Antioquia', 'Tolima', 'Cauca', 'Caldas', 'Santander',
    'Valle del Cauca', 'Risaralda', 'Nariño', 'Quindío', 'Cundinamarca',
    'Sierra Nevada', 'Cesar', 'Boyacá', 'Casanare', 'Meta', 'Caquetá'
];

const COUNTRIES = [
    'Colombia', 'Etiopía', 'Brasil', 'Perú', 'Costa Rica', 'Panamá', 'Honduras', 'Guatemala'
];

interface PurchaseFormProps {
    onPurchaseComplete?: (lot: any) => void;
    selectedLot?: any;
    user: { email: string, name: string, companyId: string } | null;
}

export default function PurchaseForm({ onPurchaseComplete, selectedLot, user }: PurchaseFormProps) {
    const [dynamicVarieties, setDynamicVarieties] = useState<string[]>(COFFEE_VARIETIES_BASE);
    const [customVariety, setCustomVariety] = useState('');

    const initialFormState = {
        sicaId: '',
        farmerName: '',
        farmName: '',
        farmSizeHectares: undefined as number | undefined,
        altitude: 1600,
        country: 'Colombia',
        region: '',
        variety: '' as CoffeeVariety | string,
        process: 'lavado' as ProcessType,
        purchaseWeight: 0,
        purchaseValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        lotNumber: `FINCA-${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}-LOTE1`,
        destination: 'export_green' as 'export_green',
        exportCertificate: '',
        isEuropeDestination: false as boolean,
        coffeeType: 'pergamino' as 'pergamino' | 'excelso',
        latitude: 0,
        longitude: 0,
        processData: {
            ph_inicial: '4.5',
            ph_final: '3.8',
            brix_inicial: '18.5',
            temperatura_masa_max: '35',
            duracion_fermentacion_horas: '72',
            actividad_agua_aw: '',
            recipiente_fermentacion: '',
            tipo_secado: '',
            duracion_secado: '',
            agente_infusion: ''
        } as any
    };

    const [formData, setFormData] = useState(initialFormState);
    const [displayValue, setDisplayValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [expectedYield, setExpectedYield] = useState<number>(0);
    const [smartLinkText, setSmartLinkText] = useState('');
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [availableLots, setAvailableLots] = useState<any[]>([]);
    const [selectedLotId, setSelectedLotId] = useState<string>('');
    const [recentFarmers, setRecentFarmers] = useState<any[]>([]);
    const [showFarmerDirectory, setShowFarmerDirectory] = useState(false);
    const [isSearchingSica, setIsSearchingSica] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const nextStep = () => setCurrentStep(p => (Math.min(p + 1, 3) as 1 | 2 | 3));
    const prevStep = () => setCurrentStep(p => (Math.max(p - 1, 1) as 1 | 2 | 3));

    // Cargar variedades dinámicas desde la DB
    useEffect(() => {
        const fetchVarieties = async () => {
            if (!user?.companyId) return;

            const { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .select('variety')
                .eq('company_id', user.companyId);

            if (!error && data) {
                const uniqueFromDb = Array.from(new Set(data.map(i => i.variety)))
                    .filter(v => v && !COFFEE_VARIETIES_BASE.includes(v as string)) as string[];

                const merged = [...COFFEE_VARIETIES_BASE, ...uniqueFromDb].sort((a, b) => a.localeCompare(b));
                setDynamicVarieties(merged);
            }
        };
        
        const fetchRecentFarmers = async () => {
            if (!user?.companyId) return;
            const { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .select('farmer_name, farm_name, altitude, country, region, latitude, longitude, sicaId:process_data->sica_id')
                .eq('company_id', user.companyId)
                .order('created_at', { ascending: false })
                .limit(40);

            if (!error && data) {
                // Unique by farmer name
                const unique = Array.from(new Map(data.map(item => [item.farmer_name, item])).values());
                setRecentFarmers(unique.slice(0, 8));
            }
        };

        fetchVarieties();
        fetchRecentFarmers();
    }, [user?.companyId]);

    useEffect(() => {
        if (selectedLot) {
            const isBase = COFFEE_VARIETIES_BASE.includes(selectedLot.variety);
            setFormData({
                sicaId: selectedLot.process_data?.sica_id || '',
                farmerName: selectedLot.farmer_name || '',
                farmName: selectedLot.farm_name || '',
                farmSizeHectares: selectedLot.farm_size_hectares || undefined,
                altitude: selectedLot.altitude || 1600,
                country: selectedLot.country || 'Colombia',
                region: selectedLot.region || '',
                variety: isBase ? selectedLot.variety : 'Otro',
                process: (selectedLot.process as ProcessType) || 'lavado',
                purchaseWeight: Number(selectedLot.purchase_weight) || 0,
                purchaseValue: Number(selectedLot.purchase_value) || 0,
                purchaseDate: selectedLot.purchase_date || new Date().toISOString().split('T')[0],
                lotNumber: selectedLot.lot_number || `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
                destination: 'export_green',
                exportCertificate: selectedLot.export_certificate || '',
                isEuropeDestination: selectedLot.is_europe_destination || false,
                coffeeType: (selectedLot.coffee_type as 'pergamino' | 'excelso') || 'pergamino',
                latitude: selectedLot.latitude || 0,
                longitude: selectedLot.longitude || 0,
                processData: (() => {
                    const pd = selectedLot.process_data;
                    const isSpecialty = ['anaerobico', 'doble_fermentacion', 'co_fermentacion'].includes((selectedLot.process as ProcessType) || 'lavado');
                    const hasData = pd && Object.keys(pd).length > 0;
                    const hasValues = hasData && Object.values(pd).some(v => v !== null && v !== '');

                    if (isSpecialty && hasData && !hasValues) {
                        return {
                            ph_inicial: '4.5',
                            ph_final: '3.8',
                            brix_inicial: '18.5',
                            temperatura_masa_max: '35',
                            duracion_fermentacion_horas: '72',
                            actividad_agua_aw: '',
                            recipiente_fermentacion: '',
                            tipo_secado: '',
                            duracion_secado: '',
                            agente_infusion: ''
                        };
                    }
                    return hasData ? pd : {
                        ph_inicial: '4.5',
                        ph_final: '3.8',
                        brix_inicial: '18.5',
                        temperatura_masa_max: '35',
                        duracion_fermentacion_horas: '72',
                        actividad_agua_aw: '',
                        recipiente_fermentacion: '',
                        tipo_secado: '',
                        duracion_secado: '',
                        agente_infusion: ''
                    };
                })()
            });
            if (!isBase) setCustomVariety(selectedLot.variety);
            setDisplayValue(formatCOP(String(selectedLot.purchase_value || 0)));
        } else {
            setFormData(initialFormState);
            setCustomVariety('');
            setDisplayValue('');
            setSmartLinkText('');
            setStatus(null);
            setShowSuccessModal(false);
            setCurrentStep(1);
        }
    }, [selectedLot]);

    // Cálculo dinámico de rendimiento esperado (Factor de rendimiento estándar ~81%)
    useEffect(() => {
        setExpectedYield(formData.purchaseWeight * 0.81);
    }, [formData.purchaseWeight]);

    const formatCOP = (val: string) => {
        const number = val.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const formatted = formatCOP(rawValue);
        setDisplayValue(formatted);
        setFormData({ ...formData, purchaseValue: parseInt(rawValue) || 0 });
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([EXCEL_TEMPLATE_HEADER + EXCEL_TEMPLATE_EXAMPLE], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Plantilla_Recoleccion_Axis.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus({ type: 'success', message: '¡Plantilla descargada! Compártela con tus caficultores.' });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setStatus({ type: 'success', message: 'Anexus: Procesando planilla de recolección...' });

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target?.result as string;
                const lines = text.split('\n').map(l => l.trim()).filter(line => line !== '');
                
                if (lines.length > 1) {
                    // Detectar Separador (Coma o Punto y Coma)
                    const header = lines[0];
                    const separator = header.includes(';') ? ';' : ',';
                    
                    const dataLines = lines.slice(1);
                    let successCount = 0;
                    let lastError = '';

                    for (const line of dataLines) {
                        const data = line.split(separator);
                        if (data.length < 5) continue; // Salto líneas vacías

                        const lotInput = {
                            purchaseDate: data[0]?.trim(),
                            farmerName: data[1]?.trim(),
                            sicaId: data[2]?.trim(),
                            lotNumber: data[3]?.trim() || `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
                            farmName: data[4]?.trim(),
                            region: data[5]?.trim(),
                            variety: data[6]?.trim(),
                            process: (data[7]?.trim().toLowerCase() as ProcessType) || 'lavado',
                            altitude: parseInt(data[8]) || 1600,
                            purchaseWeight: parseFloat(data[9]) || 0,
                            companyId: user?.companyId || '99999999-9999-9999-9999-999999999999',
                            processData: {
                                sica_id: data[2]?.trim(),
                                duracion_fermentacion_horas: data[10]?.trim() || '36',
                                ph_final: data[11]?.trim() || '4.0',
                                brix_inicial: data[12]?.trim() || '18',
                                notes_excel: data[32]?.trim()
                            }
                        };

                        try {
                            // 1. Crear el Lote en el Inventario
                            const { data: lot, error: lotError } = await supabase
                                .from('coffee_purchase_inventory')
                                .insert([{
                                    lot_number: lotInput.lotNumber,
                                    farmer_name: lotInput.farmerName,
                                    farm_name: lotInput.farmName,
                                    altitude: lotInput.altitude,
                                    country: 'Colombia',
                                    region: lotInput.region,
                                    variety: lotInput.variety,
                                    process: lotInput.process,
                                    purchase_weight: lotInput.purchaseWeight,
                                    purchase_date: lotInput.purchaseDate,
                                    company_id: lotInput.companyId,
                                    process_data: lotInput.processData,
                                    status: 'completed' // Ya viene con toda la data
                                }])
                                .select()
                                .single();

                            if (lotError) throw lotError;

                            // 2. Crear Análisis Físico si hay data
                            if (data[13] || data[14]) {
                                await supabase.from('physical_analysis').insert([{
                                    inventory_id: lot.id,
                                    moisture_pct: parseFloat(data[13]) || 0,
                                    density_gl: parseFloat(data[14]) || 0,
                                    screen_size_distribution: {
                                        m18: data[15], m17: data[16], m16: data[17]
                                    },
                                    defects_count: { total: data[18] },
                                    grain_color: data[19],
                                    company_id: lotInput.companyId
                                }]);
                            }

                            // 3. Crear Catación SCA si hay data
                            if (data[28]) {
                                await supabase.from('sca_cupping').insert([{
                                    inventory_id: lot.id,
                                    fragrance_aroma: parseFloat(data[20]) || 0,
                                    flavor: parseFloat(data[21]) || 0,
                                    acidity: parseFloat(data[22]) || 0,
                                    body: parseFloat(data[23]) || 0,
                                    balance: parseFloat(data[24]) || 0,
                                    uniformity: parseFloat(data[25]) || 10,
                                    clean_cup: parseFloat(data[26]) || 10,
                                    sweetness: parseFloat(data[27]) || 10,
                                    overall: parseFloat(data[28]) ? 8.0 : 0, // Ajuste dinámico
                                    notes: data[32]?.trim() || 'Importación Masiva AXIS',
                                    company_id: lotInput.companyId
                                }]);
                            }

                            successCount++;
                        } catch (err: any) {
                            console.error("Error importando fila:", err);
                            lastError = err.message || 'Error desconocido en base de datos';
                        }
                    }

                    if (successCount > 0) {
                        setStatus({ 
                            type: 'success', 
                            message: `¡Misión Cumplida! Se han importado ${successCount} lotes integrales.` 
                        });
                        setTimeout(() => {
                            if (onPurchaseComplete) onPurchaseComplete(null);
                            else window.location.reload();
                        }, 2000);
                    } else {
                        setStatus({ 
                            type: 'error', 
                            message: `Fallo en la carga: ${lastError || 'No se detectaron datos válidos en el archivo.'}. Verifica que el formato coincida con la plantilla.` 
                        });
                    }
                }
                setIsImporting(false);
            };
            reader.readAsText(file);
        } catch (err) {
            setStatus({ type: 'error', message: 'Error al leer el archivo. Asegúrate de que sea un CSV válido.' });
            setIsImporting(false);
        }
    };

    const handleSicaSearch = async () => {
        if (!formData.sicaId) return;
        setIsSearchingSica(true);
        setStatus(null);
        try {
            const res = await fetch('/sica_mock_db.json');
            if (res.ok) {
                const data = await res.json();
                // Buscar por codigo_sica o cedula_productor
                const found = data.find((p: any) => p.codigo_sica === formData.sicaId || p.cedula_productor === formData.sicaId);

                if (found) {
                    setFormData(prev => ({
                        ...prev,
                        farmerName: found.nombre_productor || prev.farmerName,
                        farmName: found.nombre_finca || prev.farmName,
                        farmSizeHectares: found.area_total_ha || prev.farmSizeHectares,
                        altitude: found.altitud_promedio_msnm || prev.altitude,
                        country: 'Colombia', // Por defecto para FNC/SICA
                        region: found.departamento ? `${found.departamento}, ${found.municipio}` : prev.region,
                        processData: { ...prev.processData, eudr_polygon: found.poligono_geojson || '' }
                    }));

                    if (found.lotes) {
                        setAvailableLots(found.lotes);
                    } else {
                        setAvailableLots([]);
                    }
                    
                    setStatus({ type: 'success', message: `Anexus: Datos de finca "${found.nombre_finca}" extraídos mágicamente.` });
                    setTimeout(() => setStatus(null), 4000);
                } else {
                    setStatus({ type: 'error', message: 'Cédula / SICA no encontrado en base de datos FNC.' });
                    setAvailableLots([]);
                    setTimeout(() => setStatus(null), 4000);
                }
            }
        } catch (error) {
            console.error("Error buscando SICA:", error);
        } finally {
            setIsSearchingSica(false);
        }
    };

    const handleFarmerSelect = (farmer: any) => {
        setFormData(prev => ({
            ...prev,
            farmerName: farmer.farmer_name,
            farmName: farmer.farm_name,
            altitude: farmer.altitude,
            country: farmer.country,
            region: farmer.region,
            latitude: farmer.latitude,
            longitude: farmer.longitude,
            sicaId: farmer.sicaId || prev.sicaId
        }));
        setShowFarmerDirectory(false);
        setStatus({ type: 'success', message: `Perfil de ${farmer.farmer_name} cargado correctamente.` });
        setTimeout(() => setStatus(null), 3000);
    };

    const handleLotSelect = (lotId: string) => {
        setSelectedLotId(lotId);
        const lot = availableLots.find(l => l.id === lotId);
        if (lot) {
            setFormData(prev => ({
                ...prev,
                variety: lot.variedad || prev.variety,
                altitude: lot.altitud || prev.altitude,
                latitude: lot.lat || prev.latitude,
                longitude: lot.lon || prev.longitude,
                processData: { 
                    ...prev.processData, 
                    eudr_polygon: lot.poligono || prev.processData.eudr_polygon 
                }
            }));
            if (lot.variedad && !COFFEE_VARIETIES_BASE.includes(lot.variedad)) {
                setCustomVariety(lot.variedad);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const finalVariety = formData.variety === 'Otro' ? customVariety : formData.variety;
            if (!finalVariety) throw new Error("Debe especificar una variedad.");

            // VALIDACIÓN ESTRICTA EUDR
            const isEudrRequired = (formData.farmSizeHectares ?? 0) >= 4;
            if (isEudrRequired && formData.isEuropeDestination && !formData.processData?.eudr_polygon) {
                setCurrentStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                throw new Error("ALERTA REGULATORIA EUDR: Ha declarado envío a Europa desde una finca de 4 Hectáreas o más. Es obligatorio anexar el polígono de georreferenciación antes de continuar.");
            }

            let result;
            if (selectedLot?.id) {
                // Modo Edición
                result = await updateCoffeePurchase(selectedLot.id, {
                    ...formData,
                    variety: finalVariety,
                    processData: { ...formData.processData, sica_id: formData.sicaId }
                });
            } else {
                // Modo Creación
                result = await createCoffeePurchase({
                    ...formData,
                    variety: finalVariety,
                    processData: { ...formData.processData, sica_id: formData.sicaId },
                    companyId: user?.companyId || '99999999-9999-9999-9999-999999999999'
                });
            }

            if (!result.success) {
                setStatus({ type: 'error', message: result.message });
            } else {
                setStatus({ type: 'success', message: result.message });
                setShowSuccessModal(true);

                // Actualizar lista de variedades
                if (formData.variety === 'Otro' && !dynamicVarieties.includes(customVariety)) {
                    setDynamicVarieties(prev => [...prev, customVariety].sort((a, b) => a.localeCompare(b)));
                }

                if (onPurchaseComplete && result.data) {
                    onPurchaseComplete(result.data);
                }
            }
        } catch (err: any) {
            console.error("DEBUG SUBMISSION:", err);
            setStatus({
                type: 'error',
                message: err.message || 'Error de Sincronización Industrial: Fallo crítico en el procesamiento.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewLot = () => {
        setShowSuccessModal(false);
        setFormData({
            ...initialFormState,
            lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}`
        });
        setDisplayValue('');
        setStatus(null);
        setCurrentStep(1);
    };

    // Removed AIPatternBox as per MVP requirement


    const isAlreadyRegistered = !!selectedLot;

    return (
        <form autoComplete="off" onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-bg-card border border-brand-green/30 p-10 rounded-industrial max-w-md w-full text-center space-y-6 shadow-2xl shadow-brand-green/20">
                        <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-green/30">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="3" className="animate-bounce">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Lote Registrado</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Identificador <span className="text-brand-green-bright font-mono font-bold">{formData.lotNumber}</span> ha sido persistido exitosamente en el Core de <span className="text-white font-bold">Axis Coffee Pro</span>.
                        </p>
                        <button
                            type="button"
                            onClick={handleNewLot}
                            className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-industrial-sm transition-all uppercase tracking-widest text-sm shadow-lg shadow-brand-green/20 active:scale-95"
                        >
                            Crear Nuevo Lote
                        </button>
                    </div>
                </div>
            )}

            {status && (
                <div className={`p-4 rounded-industrial-sm text-sm font-bold border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                    {status.message}
                </div>
            )}

            {/* Stepper Wizard Header */}
            <div className="flex justify-between items-center mb-8 relative px-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-0.5 bg-white/5 z-0 mx-4">
                    <div className="h-full bg-brand-green/50 transition-all duration-500" style={{ width: `${(currentStep - 1) * 50}%` }}></div>
                </div>

                <button type="button" onClick={() => setCurrentStep(1)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${currentStep >= 1 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}`}>1</div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${currentStep === 1 ? 'text-brand-green-bright' : (currentStep > 1 ? 'text-brand-green/70' : 'text-gray-500')}`}>Origen y Productor</span>
                </button>
                <button type="button" onClick={() => setCurrentStep(2)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${currentStep >= 2 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}`}>2</div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${currentStep === 2 ? 'text-brand-green-bright' : (currentStep > 2 ? 'text-brand-green/70' : 'text-gray-500')}`}>Comercialización</span>
                </button>
                <button type="button" onClick={() => setCurrentStep(3)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${currentStep >= 3 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}`}>3</div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${currentStep === 3 ? 'text-brand-green-bright' : 'text-gray-500'}`}>Beneficio (Productor)</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-bg-card border border-white/5 p-6 rounded-industrial mb-8">
                <div className="space-y-1">
                    <p className="text-[10px] text-brand-green font-black uppercase tracking-[0.3em]">Herramientas de Recolección Externa</p>
                    <p className="text-xs text-gray-500 font-medium tracking-tight italic">Usa estas herramientas para que el caficultor llene la data técnica en Excel.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Descargar Plantilla
                    </button>
                    <label className="cursor-pointer bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/30 px-6 py-3 rounded-full text-[10px] text-brand-green-bright font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Cargar Excel Lleno
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>

            <fieldset disabled={isSubmitting} className="border-none p-0 m-0 min-h-[450px] relative transition-all">
                {currentStep === 1 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Datos Principales de Origen
                        </h3>

                        <div className="flex flex-col items-center justify-center p-8 bg-bg-main border border-white/5 rounded-industrial-sm group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-green/20"></div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20" /></svg>
                                Identificador de Lote (Manual / Auto)
                            </p>
                            <div className="flex items-center gap-4 w-full max-w-2xl px-4">
                                <input
                                    type="text"
                                    placeholder="FINCA-DD/MM/AA-LOTE1"
                                    value={formData.lotNumber}
                                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value.toUpperCase() })}
                                    className="bg-bg-main/40 text-xl font-bold tracking-tight text-white hover:text-brand-green-bright transition-colors uppercase outline-none text-center border border-white/5 focus:border-brand-green px-6 py-4 rounded-xl flex-1 shadow-inner"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const farm = formData.farmName.trim().toUpperCase() || 'FINCA';
                                        const date = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
                                        setFormData({ ...formData, lotNumber: `${farm.replace(/\s+/g, '-')}-${date}-LOTE1` });
                                    }}
                                    className="p-4 bg-brand-green/10 hover:bg-brand-green/20 rounded-xl border border-brand-green/20 text-brand-green transition-all group/gen"
                                    title="Auto-generar nombre por Finca"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover/gen:rotate-180 transition-transform duration-500"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3 bg-brand-green/5 border border-brand-green/20 p-6 rounded-industrial relative overflow-hidden group mb-6">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl group-hover:bg-brand-green/20 transition-all pointer-events-none"></div>
                                <label className="text-xs font-bold text-brand-green uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                                    Asistente Anexus: Auto-Completar SICA / Cédula
                                </label>
                                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                                    <input
                                        type="text"
                                        placeholder="Ej. Cédula Cafetera (1109417355) o Scanner OCR"
                                        value={formData.sicaId}
                                        onChange={(e) => setFormData({ ...formData, sicaId: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSicaSearch();
                                            }
                                        }}
                                        className="flex-1 bg-bg-main border border-brand-green/30 rounded-full px-6 py-4 focus:border-brand-green outline-none font-mono text-brand-green-bright text-lg shadow-inner"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSicaSearch}
                                        disabled={isSearchingSica || !formData.sicaId}
                                        className="bg-brand-green hover:bg-brand-green-bright disabled:opacity-50 text-bg-main px-8 py-4 rounded-full font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,223,154,0.3)] hover:shadow-[0_0_30px_rgba(0,223,154,0.5)] flex items-center justify-center gap-2 group/btn"
                                        title="Autocompletar"
                                    >
                                        {isSearchingSica ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path></svg>
                                                Extrayendo...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                Buscar Productor
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-brand-green/60 uppercase tracking-widest mt-4 font-mono">
                                    Demo: Digita "1081492345" (Luisa Fernanda) para ver extracción de lotes del mapa georreferenciado.
                                </p>
                            </div>

                            {availableLots.length > 0 && (
                                <div className="md:col-span-3 bg-blue-600/5 border border-blue-500/20 p-6 rounded-industrial animate-in zoom-in-95 duration-500 mb-6">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        Selección de Lote Específico (Cruce de Mapa)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                        {availableLots.map(lot => (
                                            <button
                                                key={lot.id}
                                                type="button"
                                                onClick={() => handleLotSelect(lot.id)}
                                                className={`p-3 rounded-industrial-sm border transition-all flex flex-col items-center gap-1 ${selectedLotId === lot.id ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20' : 'bg-bg-main border-white/5 text-gray-500 hover:border-white/20'}`}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-tight">{lot.id}</span>
                                                <span className="text-[8px] font-mono opacity-60 italic">{lot.area_ha} HA</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-blue-400/60 uppercase tracking-widest mt-4 font-medium italic">
                                        * Al seleccionar un lote, se cruzarán los datos con Global Forest Watch para validación EUDR.
                                    </p>
                                </div>
                            )}

                            <div className="md:col-span-3 my-4 border-t border-white/5 pt-10 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-bg-card px-4 flex items-center gap-3">
                                    <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.3em]">Directorio de Confianza (Modo Concierge)</span>
                                </div>
                                
                                <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
                                    {recentFarmers.length > 0 ? recentFarmers.map((f, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleFarmerSelect(f)}
                                            className="flex-shrink-0 bg-white/5 border border-white/10 hover:border-brand-green/40 hover:bg-brand-green/5 p-4 rounded-industrial-sm transition-all text-left min-w-[200px]"
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="text-[10px] font-black text-white uppercase truncate">{f.farmer_name}</p>
                                                <span className="text-[8px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-mono font-bold">LOTE {f.lot_number?.split('-').pop() || '01'}</span>
                                            </div>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-tighter mt-1 truncate">{f.farm_name} • {f.region}</p>
                                        </button>
                                    )) : (
                                        <div className="w-full text-center py-4 text-[9px] text-gray-700 uppercase tracking-widest italic">Inicia tu primer registro para construir tu directorio</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="md:col-span-3 my-2 relative py-4">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Identificación Individual de Lote
                                </span>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Caficultor</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Alejandra Pérez"
                                    required
                                    value={formData.farmerName}
                                    onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre de la Finca</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Alejandría"
                                    required
                                    value={formData.farmName}
                                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <NumericInput
                                    label="Altura (msnm)"
                                    value={formData.altitude}
                                    onChange={(val) => setFormData({ ...formData, altitude: val })}
                                    min={800}
                                    max={2500}
                                    step={1}
                                    variant={formData.altitude < 1000 || formData.altitude > 2500 ? 'red' : 'default'}
                                    inputClassName="font-bold"
                                    unit="M"
                                />
                                <p className="text-[10px] mt-2 text-gray-500 uppercase">Rango: 800 - 2500 msnm</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha de Compra</label>
                                <div className="relative group/date">
                                    <input
                                        type="date"
                                        required
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className={`w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none text-brand-green-bright font-bold scheme-dark pr-12 cursor-pointer
                                            [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                        disabled={isSubmitting}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-green-bright group-focus-within/date:opacity-100 opacity-60 transition-opacity">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="bg-bg-main/50 border border-white/5 rounded-industrial-sm p-4 h-full flex flex-col justify-center">
                                <label className="text-xs font-bold text-brand-green uppercase tracking-widest block mb-2">Tamaño de la Finca (Hectáreas) *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ej. 4.5"
                                    value={formData.farmSizeHectares || ''}
                                    onChange={(e) => setFormData({ ...formData, farmSizeHectares: parseFloat(e.target.value) || undefined })}
                                    className="w-full bg-bg-main border border-brand-green/30 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none text-brand-green-bright font-bold text-lg"
                                    disabled={isSubmitting}
                                />
                                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-tight">Utilizado para requerimiento EUDR (≥ 4 He).</p>
                            </div>

                            <div className="bg-[#ea580c]/5 border border-[#ea580c]/20 p-4 rounded-industrial-sm h-full flex flex-col justify-center">
                                <label className="text-[10px] font-bold text-[#ea580c] uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    Vínculo de Ubicación Smart (Maps)
                                </label>
                                <div className="flex gap-2 w-full mt-1">
                                    <input
                                        type="text"
                                        placeholder="Pegue aquí el enlace..."
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-[#ea580c] outline-none text-xs text-gray-300 italic"
                                        value={smartLinkText}
                                        onChange={(e) => setSmartLinkText(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        disabled={!smartLinkText || isSubmitting}
                                        onClick={() => {
                                            let decodedText = smartLinkText;
                                            try { decodedText = decodeURIComponent(smartLinkText).replace(/\+/g, ' '); } catch (e) { }
                                            const queryRegex = /q=([-+]?\d*\.\d+)[,\s]([-+]?\d*\.\d+)/;
                                            const placeRegex = /@([-+]?\d*\.\d+)[,\s]([-+]?\d*\.\d+)/;
                                            const rawCoordsRegex = /([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/;

                                            let extracted = false;
                                            [queryRegex, placeRegex, rawCoordsRegex].forEach(r => {
                                                if (extracted) return;
                                                const match = decodedText.match(r);
                                                if (match) {
                                                    setFormData(prev => ({ ...prev, latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) }));
                                                    setStatus({ type: 'success', message: '¡Coordenadas extraídas!' });
                                                    extracted = true;
                                                }
                                            });
                                            if (!extracted) setStatus({ type: 'error', message: 'No se encontraron coordenadas válidas.' });
                                        }}
                                        className="bg-[#ea580c]/20 hover:bg-[#ea580c] text-[#ea580c] hover:text-white border border-[#ea580c]/50 transition-colors px-4 py-3 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Extraer GPS"
                                    >
                                        Extraer GPS
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-bg-card/50 border border-white/5 rounded-industrial-sm p-4 mt-2 mb-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isEuropeDestination}
                                    onChange={(e) => setFormData({ ...formData, isEuropeDestination: e.target.checked })}
                                    className="w-5 h-5 accent-brand-green bg-bg-main border-white/20 rounded cursor-pointer"
                                />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest block">¿Este lote será exportado a la Unión Europea? (Requisito EUDR)</span>
                            </label>
                            {formData.isEuropeDestination && (
                                <div className="mt-4 pl-8 border-l-2 border-brand-green/30 space-y-4 animate-in fade-in">
                                    <p className="text-[10px] text-brand-green-bright uppercase tracking-tight">Se activará la Validación EUDR satelital si la finca es ≥ 4 Hectáreas.</p>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer mt-4">
                                        <input
                                            type="checkbox"
                                            checked={formData.processData?.eudr_deforestation_free || false}
                                            onChange={(e) => setFormData({ ...formData, processData: { ...formData.processData, eudr_deforestation_free: e.target.checked } })}
                                            className="w-5 h-5 accent-brand-green bg-bg-main border-white/20 rounded cursor-pointer"
                                        />
                                        <span className="text-xs font-bold text-white uppercase tracking-widest block">DDS - Declaración de Libre Deforestación (Post 31 Dic 2020)</span>
                                    </label>
                                    {formData.processData?.eudr_deforestation_free && (
                                        <div className="mt-2 ml-8">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Evidencia Documental (Carga Opcional)</label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.png"
                                                className="w-full max-w-sm bg-bg-main border border-brand-green/30 rounded-industrial-sm px-4 py-2 focus:border-brand-green outline-none text-[10px] text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-brand-green/10 file:text-brand-green-bright hover:file:bg-brand-green/20"
                                                onChange={(e) => {
                                                    const fileName = e.target.files?.[0]?.name || '';
                                                    setFormData({ ...formData, processData: { ...formData.processData, eudr_evidence_file: fileName } })
                                                }}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Campo Manual GPS Global */}
                        <div className="bg-bg-card/30 border border-brand-green/20 rounded-industrial-sm p-4 mb-4">
                            <label className="text-xs font-bold text-brand-green uppercase tracking-widest block mb-2 flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                                Geolocalización GPS / Polígono de la Finca (Texto Simple)
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. 2.220140 N, -75.890120 W o cadena GeoJSON/WKT"
                                value={formData.processData?.eudr_gps_text || ''}
                                onChange={(e) => setFormData({ ...formData, processData: { ...formData.processData, eudr_gps_text: e.target.value } })}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none text-xs font-mono text-white placeholder:text-gray-600"
                                disabled={isSubmitting}
                            />
                            <p className="text-[10px] text-gray-500 uppercase mt-2">Soporte directo para DDS Europeo (Reg. UE 2023/1115).</p>
                        </div>

                        {/* EUDR Conditional Module */}
                        {(formData.farmSizeHectares ?? 0) >= 4 ? (
                            <div className="bg-brand-green/5 border border-brand-green/30 rounded-industrial-sm p-4 animate-in slide-in-from-top-4 duration-500 shadow-inner mb-4">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                                        <h4 className="text-sm font-bold text-brand-green-bright uppercase tracking-tight">Georreferenciación EUDR Requerida</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded uppercase font-bold">Europa</span>
                                        <span className="px-2 py-0.5 bg-brand-green/20 text-brand-green text-[10px] rounded uppercase font-bold">&ge; 4 Hectáreas</span>
                                    </div>
                                </div>
                                <p className="text-xs text-brand-green/80 mb-6 leading-relaxed">
                                    La finca excede el área mínima (≥ 4 He) y su destino es Europa. Para cumplir con la normativa de la UE, ¿tiene los datos en un archivo digital (SICA) para cargarlo y que el sistema monte las coordenadas, o prefiere realizar la captura de puntos en campo ahora mismo?
                                </p>

                                <EUDRGeoreference
                                    onPolygonChange={(geoJson) => {
                                        console.log("Polygon Updated for EUDR:", geoJson);
                                        setFormData(prev => ({
                                            ...prev,
                                            processData: {
                                                ...prev.processData,
                                                eudr_polygon: geoJson
                                            }
                                        }));
                                    }}
                                />
                            </div>
                        ) : ((formData.farmSizeHectares ?? 0) > 0) ? (
                            <div className="bg-white/5 border border-white/10 rounded-sm p-4 flex items-center gap-3 mb-4 animate-in fade-in">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Finca exenta de georreferenciación en polígono (&lt; 4 He).</p>
                            </div>
                        ) : null}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[#ea580c] uppercase tracking-widest flex items-center gap-2">
                                    Latitud
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Ej. 4.570868"
                                    value={formData.latitude || ''}
                                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-[#ea580c] outline-none font-mono text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#ea580c] uppercase tracking-widest flex items-center gap-2">
                                    Longitud
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Ej. -74.297333"
                                    value={formData.longitude || ''}
                                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-[#ea580c] outline-none font-mono text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Región / Departamento</label>
                                <select
                                    required
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 mt-1 focus:border-brand-green outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Seleccionar</option>
                                    {COLOMBIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">País</label>
                                <select
                                    required
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 mt-1 focus:border-brand-green outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Seleccionar</option>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>
                )}

                {currentStep === 2 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Negocio, Destino y Tipo de Grano
                        </h3>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Estado del Café al Ingreso</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, coffeeType: 'pergamino' })}
                                        className={`py-4 px-4 rounded-industrial-sm flex flex-col items-center gap-2 transition-all border ${formData.coffeeType === 'pergamino' ? 'bg-brand-green/10 border-brand-green text-brand-green-bright shadow-lg shadow-brand-green/5' : 'bg-bg-main border-white/5 text-gray-500 hover:border-white/10'}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-widest">CAFÉ PERGAMINO</span>
                                        <span className="text-[8px] opacity-60 font-bold uppercase">(Requiere Trilla)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, coffeeType: 'excelso' })}
                                        className={`py-4 px-4 rounded-industrial-sm flex flex-col items-center gap-2 transition-all border ${formData.coffeeType === 'excelso' ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5' : 'bg-bg-main border-white/5 text-gray-500 hover:border-white/10'}`}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-widest">CAFÉ VERDE / ORO</span>
                                        <span className="text-[10px] opacity-60 font-bold uppercase">(Salto a Calidad)</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Destino Exclusivo del Lote</label>
                                <div className="w-full py-4 px-4 rounded-industrial-sm flex items-center justify-between border bg-indigo-600/10 border-indigo-500/30 text-indigo-400 shadow-inner">
                                    <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                        EXPORTACIÓN VERDE
                                    </span>
                                    <span className="text-[10px] text-indigo-400/60 uppercase font-bold">(Ruta Única)</span>
                                </div>
                            </div>

                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest flex justify-between">
                                    Certificado / Lote de Exportación Internacional
                                    <span className="text-gray-500 font-normal">(Opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. SNT-2026-X001"
                                    value={formData.exportCertificate}
                                    onChange={(e) => setFormData({ ...formData, exportCertificate: e.target.value })}
                                    className="w-full bg-bg-main border border-blue-500/30 rounded-industrial-sm px-4 py-3 mt-1 focus:border-blue-400 outline-none text-white font-mono shadow-inner shadow-blue-500/5 placeholder:text-gray-700"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <NumericInput
                            label="Cantidad Pack de Compra"
                            value={formData.purchaseWeight}
                            onChange={(val) => setFormData({ ...formData, purchaseWeight: val })}
                            min={1}
                            step={0.1}
                            unit="KG"
                            required
                            disabled={isSubmitting}
                            variant={formData.purchaseWeight <= 0 ? 'red' : 'industrial'}
                            inputClassName="text-2xl py-4"
                        />

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-white uppercase tracking-widest block border-l-2 border-brand-green pl-3">Valor Total Pagado al Productor</label>
                                <span className="text-[10px] bg-[#ea580c]/20 text-[#ea580c] px-2 py-1 rounded font-bold uppercase tracking-widest border border-[#ea580c]/30">Auditoría Fair Trade</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={displayValue}
                                    onChange={handleValueChange}
                                    className={`w-full bg-bg-main border rounded-industrial-sm px-6 py-5 text-4xl font-bold tracking-tighter outline-none transition-all pr-32 ${formData.purchaseValue <= 0 ? 'border-brand-red/50 text-brand-red' : 'border-white/10 text-brand-green-bright focus:border-brand-green'}`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-12 top-6 text-xs text-gray-400 font-bold tracking-widest opacity-60">COP</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase">Manejando Pesos Colombianos (COP)</p>
                    </section>
                )}

                {currentStep === 3 && (
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                                Beneficio: Datos Básicos del Productor
                            </h3>
                            <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand-green/20">Campo Mínimo</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 1. Variedad del Café */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Variedad del Café</label>
                                <select
                                    required
                                    value={formData.variety}
                                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 mt-1 focus:border-brand-green outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Seleccionar</option>
                                    {dynamicVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                                    <option value="Otro" className="text-brand-green font-bold">+ OTRO (INGRESAR NUEVO)</option>
                                </select>
                            </div>

                            {/* 2. Tipo de proceso */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Proceso</label>
                                <select
                                    value={formData.process}
                                    onChange={(e) => setFormData(prev => ({ ...prev, process: e.target.value as ProcessType }))}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 focus:border-brand-green outline-none uppercase appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                    disabled={isSubmitting}
                                >
                                    {PROCESS_TYPES.map(p => (
                                        <option key={p} value={p}>
                                            {p.replace(/_/g, ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Método de secado */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Método de Secado</label>
                                <select
                                    value={formData.processData.tipo_secado || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, processData: { ...p.processData, tipo_secado: e.target.value } }))}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 focus:border-brand-green outline-none text-[12px] font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                    disabled={isSubmitting}
                                >
                                    <option value="" className="text-gray-400 font-normal">Seleccionar</option>
                                    <option value="Camas Africanas">Camas Africanas</option>
                                    <option value="Marquesina Parabólica">Marquesina / Parabólica</option>
                                    <option value="Silo Mecánico">Secadora Mecánica (Silo)</option>
                                    <option value="Patio al Sol">Patio de Cemento al Sol</option>
                                    <option value="Secado Mixto">Mixto (Sol y Máquina)</option>
                                </select>
                            </div>

                            {/* 4. Tiempo de secado */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiempo de Secado (Días/Horas)</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 15 días o 32 horas"
                                    value={formData.processData.duracion_secado || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, processData: { ...p.processData, duracion_secado: e.target.value } }))}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none text-brand-green-bright font-bold"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {formData.variety === 'Otro' && (
                            <div className="animate-in slide-in-from-top-2 duration-300 max-w-md">
                                <label className="text-xs font-bold text-brand-green uppercase tracking-widest">Nombre Variedad Especial</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Sidra Salvaje"
                                    required
                                    value={customVariety}
                                    onChange={(e) => setCustomVariety(e.target.value)}
                                    className="w-full bg-bg-main border border-brand-green/30 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none text-white placeholder:text-gray-700"
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}

                    </section>
                )}

            </fieldset>

            {/* Navigational Buttons */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-20">
                {currentStep > 1 ? (
                    <button type="button" onClick={prevStep} disabled={isSubmitting} className="px-6 py-3 border border-white/10 text-white rounded-industrial-sm font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors disabled:opacity-50">
                        &larr; Volver Atrás
                    </button>
                ) : <div></div>}

                {currentStep < 3 ? (
                    <button type="button" onClick={nextStep} className="px-10 py-4 bg-brand-green/10 text-brand-green-bright border border-brand-green/30 rounded-industrial-sm font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-brand-green hover:text-black transition-colors shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                        Siguiente Paso &rarr;
                    </button>
                ) : (
                    <div className="flex-1 ml-4 animate-in fade-in zoom-in-95 duration-500">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full font-bold py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl ${isAlreadyRegistered ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30' : 'bg-brand-green hover:bg-brand-green-bright text-black disabled:opacity-30'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        SINCRONIZANDO CON LA NUBE...
                                    </div>
                                </>
                            ) : isAlreadyRegistered ? (
                                <>
                                    ACTUALIZAR DATOS DEL LOTE
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-12 transition-transform">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </>
                            ) : (
                                <>
                                    REGISTRAR INGRESO Y PREPARAR PARA TRILLA
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-12 transition-transform">
                                        <path d="M4 12V4a2 2 0 0 1 2-2h10l4 4v5" />
                                        <path d="M10 12l2 2 4-4" />
                                        <path d="M4 18h16" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-loading-bar {
                    animation: loading-bar 2s infinite linear;
                }
            `}</style>
        </form >
    );
}
