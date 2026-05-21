import React, { useState, useEffect } from 'react';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
import { CoffeeVariety, ProcessType } from '@/shared/types';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import { createCoffeePurchase, updateCoffeePurchase } from '../actions/purchase';
import { supabase } from '@/shared/lib/supabase';
import EUDRGeoreference from './EUDRGeoreference';
import EUDRComplianceBadge from './EUDRComplianceBadge';


const COFFEE_VARIETIES_BASE: string[] = [
    'Bourbon', 'Bourbon Rosado', 'Castillo', 'Caturra', 'Cenicafe 1',
    'Chiroso', 'Colombia', 'Geisha', 'Java', 'Laurina',
    'Maragogype', 'Mundo Novo', 'Pacamara', 'Papayo', 'Sidra',
    'SL28', 'Tabi', 'Typica', 'Wush Wush'
];

const PROCESS_TYPES: ProcessType[] = ['lavado', 'semilavado', 'honey', 'natural', 'sumergido'];

const FERMENTATION_STYLES = [
    { id: 'estandar', label: 'Estándar / Tradicional' },
    { id: 'anaerobico', label: 'Anaeróbico (General)' },
    { id: 'otro', label: '+ OTRO (ESPECIFICAR)' }
];

const COLOMBIAN_REGIONS = [
    'Huila', 'Antioquia', 'Tolima', 'Cauca', 'Caldas', 'Santander',
    'Valle del Cauca', 'Risaralda', 'Nariño', 'Quindío', 'Cundinamarca',
    'Sierra Nevada', 'Cesar', 'Boyacá', 'Casanare', 'Meta', 'Caquetá', 'Otro'
];

const COMMON_MUNICIPALITIES = [
    'Pereira', 'Apía', 'Balboa', 'Belén de Umbría', 'Dosquebradas', 
    'Guática', 'La Celia', 'La Virginia', 'Marsella', 'Mistrató', 
    'Pueblo Rico', 'Quinchía', 'Santa Rosa de Cabal', 'Santuario',
    'Pitalito', 'Acevedo', 'Garzón', 'Gigante', 'San Agustín', 'Andes', 
    'Fredonia', 'Salgar', 'Ciudad Bolívar', 'Planadas', 'Ibagué', 'Ataco', 'Chaparral',
    'Popayán', 'Inzá', 'Páez', 'Timbío', 'Manizales', 'Chinchiná', 'Palestina', 
    'Pasto', 'Buesaco', 'La Unión', 'Otro'
];

const COUNTRIES = [
    'Colombia', 'Etiopía', 'Brasil', 'Perú', 'Costa Rica', 'Panamá', 'Honduras', 'Guatemala'
];

interface PurchaseFormProps {
    onPurchaseComplete?: (lot: any) => void;
    selectedLot?: any;
    user: { email: string, name: string, companyId: string, role?: string } | null;
    isReadOnly?: boolean;
}

export default function PurchaseForm({ onPurchaseComplete, selectedLot, user, isReadOnly }: PurchaseFormProps) {
    const [dynamicVarieties, setDynamicVarieties] = useState<string[]>(COFFEE_VARIETIES_BASE);
    const [customVariety, setCustomVariety] = useState('');
    const [customRegion, setCustomRegion] = useState('');
    const [customMunicipality, setCustomMunicipality] = useState('');

    const initialFormState = {
        sicaId: '',
        farmerName: '',
        farmName: '',
        farmSizeHectares: undefined as number | undefined,
        altitude: 1600,
        country: 'Colombia',
        region: '',
        municipality: '',
        variety: '' as CoffeeVariety | string,
        process: 'lavado' as ProcessType,
        farmerPhone: '',
        purchaseWeight: 0,
        purchaseValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        harvestDate: new Date().toISOString().split('T')[0],
        lotNumber: `FINCA-${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}-LOTE1`,
        destination: 'export_green' as 'export_green',
        exportCertificate: '',
        isEuropeDestination: false as boolean,
        coffeeType: 'pergamino' as 'pergamino' | 'excelso',
        latitude: 0,
        longitude: 0,
        processData: {
            fermentation_style: 'estandar',
            ph_inicial: '4.5',
            ph_final: '3.8',
            brix_inicial: '18.5',
            temperatura_masa_max: '35',
            duracion_fermentacion_horas: '72',
            actividad_agua_aw: '',
            recipiente_fermentacion: '',
            tipo_secado: '',
            duracion_secado: '',
            agente_infusion: '',
            fermentation_notes: ''
        } as any

    };

    const [formData, setFormData] = useState(initialFormState);
    const [displayValue, setDisplayValue] = useState('');
    const [displayWeight, setDisplayWeight] = useState('');
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

    const [isDirty, setIsDirty] = useState(false);

    // Bloqueo de salida accidental del navegador (Botón atrás / Cerrar pestaña)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Standard para mostrar el diálogo del navegador
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Track dirty state
    useEffect(() => {
        if (formData.farmerName !== '' || formData.sicaId !== '') {
            setIsDirty(true);
        }
    }, [formData]);

    // Recuperación de borrador desactivada por requerimiento de usuario

    useEffect(() => {
        if (selectedLot) {
            const isBase = COFFEE_VARIETIES_BASE.includes(selectedLot.variety);
            const isRegionBase = COLOMBIAN_REGIONS.includes(selectedLot.region);
            const isMunBase = COMMON_MUNICIPALITIES.includes(selectedLot.municipality);

            setFormData({
                sicaId: selectedLot.process_data?.sica_id || '',
                farmerName: selectedLot.farmer_name || '',
                farmName: selectedLot.farm_name || '',
                farmSizeHectares: selectedLot.farm_size_hectares || undefined,
                altitude: selectedLot.altitude || 1600,
                country: selectedLot.country || 'Colombia',
                region: isRegionBase ? selectedLot.region : 'Otro',
                municipality: isMunBase ? selectedLot.municipality : 'Otro',
                variety: isBase ? selectedLot.variety : 'Otro',
                process: (selectedLot.process as ProcessType) || 'lavado',
                farmerPhone: selectedLot.process_data?.farmer_phone || '',
                purchaseWeight: Number(selectedLot.purchase_weight) || 0,
                purchaseValue: Number(selectedLot.purchase_value) || 0,
                purchaseDate: selectedLot.purchase_date || new Date().toISOString().split('T')[0],
                harvestDate: selectedLot.harvest_date || selectedLot.purchase_date || new Date().toISOString().split('T')[0],
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
                    return hasData ? {
                        ...pd,
                        fermentation_style: pd.fermentation_style || 'estandar'
                    } : {
                        fermentation_style: 'estandar',
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
            if (!isRegionBase) setCustomRegion(selectedLot.region);
            if (!isMunBase) setCustomMunicipality(selectedLot.municipality);

            setDisplayValue(formatCOP(String(selectedLot.purchase_value || 0)));
            setDisplayWeight(formatWeight(String(selectedLot.purchase_weight || 0).replace('.', ',')));
            setIsDirty(false); // Reset dirty on explicit load
        }
        
        // SEGURIDAD: Resetear directamente si no hay lote seleccionado
        if (!selectedLot) {
            setFormData(initialFormState);
            setCustomVariety('');
            setCustomRegion('');
            setCustomMunicipality('');
            setDisplayValue('');
            setDisplayWeight('');
            setSmartLinkText('');
            setStatus(null);
            setShowSuccessModal(false);
            setCurrentStep(1);
            setIsDirty(false);
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

    const formatWeight = (val: string) => {
        let clean = val.replace(/[^0-9,]/g, '');
        const parts = clean.split(',');
        if (parts.length > 2) clean = parts[0] + ',' + parts.slice(1).join('');
        const finalParts = clean.split(',');
        finalParts[0] = finalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return finalParts.join(',');
    };

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let rawValue = e.target.value.replace(/[^0-9,]/g, '');
        const parts = rawValue.split(',');
        if (parts.length > 2) rawValue = parts[0] + ',' + parts.slice(1).join('');
        
        const finalParts = rawValue.split(',');
        finalParts[0] = finalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const formatted = finalParts.join(',');
        
        setDisplayWeight(formatted);
        const numericStr = formatted.replace(/\./g, '').replace(',', '.');
        setFormData({ ...formData, purchaseWeight: parseFloat(numericStr) || 0 });
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
                        region: found.departamento || prev.region,
                        municipality: found.municipio || prev.municipality,
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
            municipality: farmer.municipality || '',
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

            const finalRegion = formData.region === 'Otro' ? customRegion : formData.region;
            const finalMunicipality = formData.municipality === 'Otro' ? customMunicipality : formData.municipality;

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
                    region: finalRegion,
                    municipality: finalMunicipality,
                    processData: { ...formData.processData, sica_id: formData.sicaId, farmer_phone: formData.farmerPhone }
                }, user);
            } else {
                // Modo Creación
                result = await createCoffeePurchase({
                    ...formData,
                    variety: finalVariety,
                    region: finalRegion,
                    municipality: finalMunicipality,
                    processData: { ...formData.processData, sica_id: formData.sicaId, farmer_phone: formData.farmerPhone },
                    companyId: user?.companyId || '99999999-9999-9999-9999-999999999999'
                });
            }

            if (!result.success) {
                setStatus({ type: 'error', message: result.message });
            } else {
                setStatus({ type: 'success', message: result.message });
                setShowSuccessModal(true);
                
                // LIMPIEZA DE BORRADOR: El lote ya está en la nube seguro
                localStorage.removeItem('axis_purchase_draft');
                setIsDirty(false);

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
        // LIMPIEZA TOTAL: Borramos el rastro del navegador para evitar mensajes fantasma
        localStorage.removeItem('axis_purchase_draft');
        setIsDirty(false);
        
        setShowSuccessModal(false);
        setFormData({
            ...initialFormState,
            lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}`
        });
        setCustomVariety('');
        setCustomRegion('');
        setCustomMunicipality('');
        setDisplayValue('');
        setStatus(null);
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Removed AIPatternBox as per MVP requirement


    const isAlreadyRegistered = !!selectedLot;

    return (
        <form autoComplete="off" onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-soft-white border border-gray-400 shadow-sm p-10 rounded-industrial max-w-md w-full text-center space-y-6 shadow-2xl shadow-brand-green/20">
                        <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-400 shadow-sm">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3" className="animate-bounce">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-brand-navy uppercase er">Lote Registrado</h3>
                        <p className="text-brand-navy leading-relaxed text-sm">
                            Identificador <span className="text-brand-navy font-mono font-bold">{formData.lotNumber}</span> ha sido persistido exitosamente en el Core de <span className="text-brand-navy font-bold">Axis Coffee Pro</span>.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    handleNewLot();
                                }}
                                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold py-5 rounded-industrial-sm transition-all uppercase  text-sm shadow-lg shadow-brand-green/20"
                            >
                                Nuevo Lote (Limpiar Todo)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    // CONSERVAR ÚLTIMO DATO (Elena)
                                    // Limpiamos la memoria pero mantenemos el estado local para fluidez
                                    localStorage.removeItem('axis_purchase_draft');
                                    setIsDirty(true); 
                                    
                                    setShowSuccessModal(false);
                                    setFormData(prev => ({
                                        ...prev,
                                        lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
                                        purchaseWeight: 0,
                                        purchaseValue: 0,
                                        processData: {
                                            ...prev.processData,
                                            // Limpiar datos de análisis físico si existen para que no se hereden
                                            brix_inicial: '18.5',
                                            duracion_fermentacion_horas: '72'
                                        }
                                    }));
                                    setCurrentStep(1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full bg-white hover:bg-carbon/10 text-brand-navy font-bold py-4 rounded-industrial-sm transition-all border border-gray-400 shadow-sm uppercase  text-[11px]"
                            >
                                Conservar Productor (Mantener a {formData.farmerName.split(' ')[0] || 'Elena'})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {status && (
                <div className={`p-4 rounded-industrial-sm text-sm font-bold border ${status.type === 'success' ? 'bg-white border-gray-400 shadow-sm text-brand-navy' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                    {status.message}
                </div>
            )}

            

            {/* Stepper Wizard Header */}
            <div className="flex justify-between items-center mb-8 relative px-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-0.5 bg-white z-0 mx-4">
                    <div className="h-full bg-brand-green transition-all duration-500" style={{ width: `${(currentStep - 1) * 50}%` }}></div>
                </div>

                <button type="button" onClick={() => setCurrentStep(1)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-white border-2 transition-all duration-500 ${currentStep >= 1 ? 'border-brand-green shadow-lg text-brand-navy' : 'border-gray-400 shadow-sm text-brand-navy'}`}>1</div>
                    <span className={`text-[11px] font-bold uppercase  bg-white px-3 transition-colors ${currentStep === 1 ? 'text-brand-navy' : (currentStep > 1 ? 'text-brand-navy' : 'text-brand-navy')}`}>Origen y Productor</span>
                </button>
                <button type="button" onClick={() => setCurrentStep(2)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-white border-2 transition-all duration-500 ${currentStep >= 2 ? 'border-brand-green shadow-lg text-brand-navy' : 'border-gray-400 shadow-sm text-brand-navy'}`}>2</div>
                    <span className={`text-[11px] font-bold uppercase  bg-white px-3 transition-colors ${currentStep === 2 ? 'text-brand-navy' : (currentStep > 2 ? 'text-brand-navy' : 'text-brand-navy')}`}>Comercialización</span>
                </button>
                <button type="button" onClick={() => setCurrentStep(3)} className="relative z-10 flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-white border-2 transition-all duration-500 ${currentStep >= 3 ? 'border-brand-green shadow-lg text-brand-navy' : 'border-gray-400 shadow-sm text-brand-navy'}`}>3</div>
                    <span className={`text-[11px] font-bold uppercase  bg-white px-3 transition-colors ${currentStep === 3 ? 'text-brand-navy' : 'text-brand-navy'}`}>Beneficio (Productor)</span>
                </button>
            </div>

            <fieldset disabled={isSubmitting || isReadOnly} className="border-none p-0 m-0 min-h-[450px] relative transition-all">
                {currentStep === 1 && (
                    <section className="bg-soft-white border border-gray-400 shadow-sm p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-navy font-bold flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-6 bg-black rounded-full"></span>
                            Datos Principales de Origen
                        </h3>



                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3 bg-white border border-gray-400 shadow-sm p-6 rounded-industrial relative overflow-hidden group mb-6">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl group-hover:bg-black/20 transition-all pointer-events-none"></div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2 mb-3">
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
                                        className="flex-1 bg-white border border-gray-400 shadow-sm rounded-full px-6 py-4 focus:border-black outline-none font-mono text-brand-navy text-lg shadow-inner"
                                        disabled={isSubmitting}
                                        onBlur={handleSicaSearch}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSicaSearch}
                                        disabled={isSearchingSica || !formData.sicaId}
                                        className="bg-brand-green hover:bg-brand-green/90 disabled:opacity-50 text-white px-8 py-4 rounded-full font-bold uppercase  transition-all shadow-lg hover:shadow-[0_0_30px_rgba(0,223,154,0.5)] flex items-center justify-center gap-2 group/btn"
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
                                <p className="text-[11px] text-brand-navy uppercase  mt-2 font-mono">
                                    Demo: Digita "1081492345" (Luisa Fernanda) para ver extracción de lotes del mapa georreferenciado.
                                </p>
                            </div>

                            {availableLots.length > 0 && (
                                <div className="md:col-span-3 bg-white border border-gray-400 shadow-sm p-6 rounded-industrial animate-in zoom-in-95 duration-500 mb-6">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2 mb-3">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        Selección de Lote Específico (Cruce de Mapa)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                        {availableLots.map(lot => (
                                            <button
                                                key={lot.id}
                                                type="button"
                                                onClick={() => handleLotSelect(lot.id)}
                                                className={`p-3 rounded-industrial-sm border transition-all flex flex-col items-center gap-1 ${selectedLotId === lot.id ? 'bg-brand-green border-brand-green text-brand-navy shadow-lg shadow-brand-green/20' : 'bg-white border-gray-400 shadow-sm text-brand-navy hover:border-gray-400 shadow-sm'}`}
                                            >
                                                <span className="text-[11px] font-bold uppercase ">{lot.id}</span>
                                                <span className="text-[9px] font-mono opacity-60">{lot.area_ha} HA</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-brand-navy uppercase  mt-4 font-bold">
                                        * Al seleccionar un lote, se cruzarán los datos con Global Forest Watch para validación EUDR.
                                    </p>
                                </div>
                            )}

                            <div className="md:col-span-3 my-2 border-t border-gray-400 shadow-sm pt-6 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-bg-main px-4 flex items-center gap-3">
                                    <span className="text-[11px] font-bold text-brand-navy uppercase ">Directorio de Confianza (Modo Concierge)</span>
                                </div>
                                
                                <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
                                    {recentFarmers.length > 0 ? recentFarmers.map((f, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleFarmerSelect(f)}
                                            className="flex-shrink-0 bg-white border border-gray-400 shadow-sm hover:border-gray-400 shadow-sm hover:bg-white p-4 rounded-industrial-sm transition-all text-left min-w-[200px]"
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="text-[11px] font-bold text-brand-navy uppercase truncate">{f.farmer_name}</p>
                                                <span className="text-[9px] bg-white text-brand-navy px-1.5 py-0.5 rounded font-mono font-bold">LOTE {f.lot_number?.split('-').pop() || '01'}</span>
                                            </div>
                                            <p className="text-[9px] text-brand-navy uppercase er mt-1 truncate">{f.farm_name} • {f.region}</p>
                                        </button>
                                    )) : (
                                        <div className="w-full text-center py-4 text-[9px] text-brand-navy uppercase ">Inicia tu primer registro para construir tu directorio</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="md:col-span-3 mt-2 relative py-2">
                                <span className="text-[11px] font-bold text-brand-green uppercase ">
                                    Identificación Individual de Lote
                                </span>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Cédula SICA
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. 1081492345"
                                    value={formData.sicaId}
                                    onChange={(e) => setFormData({ ...formData, sicaId: e.target.value })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none font-bold text-brand-navy font-mono"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Caficultor (Productor)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Alejandra Pérez"
                                    required
                                    value={formData.farmerName}
                                    onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none font-bold text-brand-navy"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Celular del Productor
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Ej. +57 301 000 0000"
                                    value={formData.farmerPhone}
                                    onChange={(e) => setFormData({ ...formData, farmerPhone: e.target.value })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none text-brand-navy font-bold"
                                    disabled={isSubmitting}
                                />
                                <p className="text-[9px] font-bold text-brand-navy mt-2 uppercase ">Esencial para el programa Grateful Ledger.</p>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Nombre de la Finca
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Alejandría"
                                    required
                                    value={formData.farmName}
                                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none font-bold text-brand-navy"
                                    disabled={isSubmitting}
                                />
                            </div>
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
                                <p className="text-[9px] font-bold text-brand-navy mt-2 uppercase">Rango: 800 - 2500 msnm</p>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    # Lote
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. LOTE-001"
                                    required
                                    value={formData.lotNumber}
                                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value.toUpperCase() })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none text-brand-navy font-bold uppercase"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="bg-white border border-gray-400 shadow-sm p-4 rounded-industrial-sm h-full flex flex-col justify-center">
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5 mb-2">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Tamaño de la Finca (Hectáreas) *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ej. 4.5"
                                    value={formData.farmSizeHectares || ''}
                                    onChange={(e) => setFormData({ ...formData, farmSizeHectares: parseFloat(e.target.value) || undefined })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 focus:border-black outline-none text-brand-navy font-bold text-lg"
                                    disabled={isSubmitting}
                                />
                                <p className="text-[9px] font-bold text-brand-navy mt-2 uppercase ">Utilizado para requerimiento EUDR (≥ 4 He).</p>
                            </div>

                            <div className="bg-white border border-gray-400 shadow-sm p-4 rounded-industrial-sm h-full flex flex-col justify-center">
                                <label className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2 mb-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    Vínculo de Ubicación Smart (Maps)
                                </label>
                                <div className="flex gap-2 w-full mt-1">
                                    <input
                                        type="text"
                                        placeholder="Pegue aquí el enlace..."
                                        className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 focus:border-black outline-none text-xs text-brand-navy"
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
                                        className="bg-brand-green hover:bg-brand-green/90 text-white border border-brand-green shadow-sm transition-colors px-4 py-3 rounded-industrial-sm text-[11px] font-bold uppercase  whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Extraer GPS"
                                    >
                                        Extraer GPS
                                    </button>
                                </div>
                            </div>
                        </div>

                        {(formData.farmSizeHectares ?? 0) >= 4 && (
                            <div className="bg-white border border-gray-400 shadow-sm rounded-industrial-sm p-4 mb-6 flex items-start gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0c6056" strokeWidth="2" className="mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                <div>
                                    <h4 className="text-sm font-bold text-brand-navy uppercase ">Requisito EUDR Detectado</h4>
                                    <p className="text-[11px] text-brand-navy mt-1 uppercase">Debido al tamaño de la finca (≥ 4 hectáreas), este lote requerirá georreferenciación EUDR para su exportación. El polígono se asignará directamente en el Aduanero.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Latitud
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Ej. 4.570868"
                                    value={formData.latitude || ''}
                                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none font-mono text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Longitud
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Ej. -74.297333"
                                    value={formData.longitude || ''}
                                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none font-mono text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Departamento
                                </label>
                                <select
                                    required
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-3 mt-1 focus:border-black outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat font-bold text-brand-navy"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Seleccionar</option>
                                    {COLOMBIAN_REGIONS.map(r => (
                                        <option key={r} value={r} className={r === 'Otro' ? 'text-brand-navy font-bold' : ''}>
                                            {r === 'Otro' ? '+ OTRO (ESPECIFICAR)' : r}
                                        </option>
                                    ))}
                                </select>
                                {formData.region === 'Otro' && (
                                    <input
                                        type="text"
                                        placeholder="Especificar Departamento"
                                        value={customRegion}
                                        onChange={(e) => setCustomRegion(e.target.value)}
                                        className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-2 focus:border-black outline-none font-bold text-brand-navy animate-in fade-in slide-in-from-top-2 duration-300"
                                        required
                                        disabled={isSubmitting}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Municipio
                                </label>
                                <select
                                    required
                                    value={formData.municipality}
                                    onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-3 mt-1 focus:border-black outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat font-bold text-brand-navy"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Seleccionar</option>
                                    {COMMON_MUNICIPALITIES.map((m, idx) => (
                                        <option key={`${m}-${idx}`} value={m} className={m === 'Otro' ? 'text-brand-navy font-bold' : ''}>
                                            {m === 'Otro' ? '+ OTRO (ESPECIFICAR)' : m}
                                        </option>
                                    ))}
                                </select>
                                {formData.municipality === 'Otro' && (
                                    <input
                                        type="text"
                                        placeholder="Especificar Municipio"
                                        value={customMunicipality}
                                        onChange={(e) => setCustomMunicipality(e.target.value)}
                                        className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-2 focus:border-black outline-none font-bold text-brand-navy animate-in fade-in slide-in-from-top-2 duration-300"
                                        required
                                        disabled={isSubmitting}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end mt-10">
                            <button
                                type="button"
                                onClick={nextStep}
                                className="bg-white hover:bg-black/20 text-brand-navy border border-gray-400 shadow-sm px-10 py-5 rounded-2xl text-[11px] font-bold uppercase  flex items-center gap-4 transition-all group"
                            >
                                Siguiente: Comercialización
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </section>
                )}

                {currentStep === 2 && (
                    <section className="bg-soft-white border border-gray-400 shadow-sm p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <h3 className="text-brand-navy font-bold flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-6 bg-black rounded-full"></span>
                            Negocio, Destino y Tipo de Grano
                        </h3>




                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5 mb-3">
                                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
                                    Estado del Café al Ingreso
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, coffeeType: 'pergamino' })}
                                        className={`py-4 px-4 rounded-industrial-sm flex flex-col items-center gap-2 transition-all border ${formData.coffeeType === 'pergamino' ? 'bg-brand-green border-brand-green text-brand-navy shadow-lg shadow-brand-green/20' : 'bg-white border-gray-400 shadow-sm text-brand-navy hover:border-gray-400 shadow-sm'}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase ">CAFÉ PERGAMINO</span>
                                        <span className={`text-[9px] opacity-60 font-bold uppercase ${formData.coffeeType === 'pergamino' ? 'text-brand-navy' : 'text-brand-navy'}`}>(Requiere Trilla)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, coffeeType: 'excelso' })}
                                        className={`py-4 px-4 rounded-industrial-sm flex flex-col items-center gap-2 transition-all border ${formData.coffeeType === 'excelso' ? 'bg-brand-green border-brand-green text-brand-navy shadow-lg shadow-brand-green/20' : 'bg-white border-gray-400 shadow-sm text-brand-navy hover:border-gray-400 shadow-sm'}`}
                                    >
                                        <span className="text-xs font-bold uppercase ">CAFÉ VERDE / ORO</span>
                                        <span className={`text-[11px] opacity-60 font-bold uppercase ${formData.coffeeType === 'excelso' ? 'text-brand-navy' : 'text-brand-navy'}`}>(Salto a Calidad)</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase  block mb-2">Destino Exclusivo del Lote</label>
                                <div className="w-full py-4 px-4 rounded-industrial-sm flex items-center justify-between border bg-white border-gray-400 shadow-sm text-brand-navy shadow-inner">
                                    <span className="text-sm font-bold uppercase  flex items-center gap-2">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                        EXPORTACIÓN VERDE
                                    </span>
                                    <span className="text-[11px] text-brand-navy uppercase font-bold">(Ruta Única)</span>
                                </div>
                            </div>

                            {/* INJECTED IDENTITY FIELDS (Moved from Step 3) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-400 shadow-sm">
                                {/* Fecha de Recolección */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase ">Fecha de Recolección</label>
                                    <div className="relative group/date">
                                        <input
                                            type="date"
                                            required
                                            value={formData.harvestDate}
                                            onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                                            className={`w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-4 focus:border-black outline-none text-brand-navy font-bold scheme-light pr-12 cursor-pointer text-xs shadow-lg shadow-brand-green/5
                                                [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                            disabled={isSubmitting}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-focus-within/date:opacity-100 opacity-60 transition-opacity">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Variedad */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase ">Variedad del Café</label>
                                    <select
                                        required
                                        value={formData.variety}
                                        onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                        className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-4 focus:border-black outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat font-bold text-brand-navy shadow-lg shadow-brand-green/5"
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Seleccionar</option>
                                        {dynamicVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                                        <option value="Otro" className="text-brand-navy font-bold">+ OTRO (INGRESAR NUEVO)</option>
                                    </select>
                                </div>

                                {/* Proceso */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase ">Proceso Base</label>
                                    <select
                                        value={formData.process}
                                        onChange={(e) => setFormData(prev => ({ ...prev, process: e.target.value as ProcessType }))}
                                        className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-4 focus:border-black outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat font-bold text-brand-navy transition-all"
                                    >
                                        <option value="lavado">Lavado</option>
                                        <option value="semilavado">Semilavado</option>
                                        <option value="sumergido">Sumergido</option>
                                        <option value="honey">Honey</option>
                                        <option value="natural">Natural</option>
                                    </select>
                                </div>
                            </div>


                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-400 shadow-sm">
                            {/* Fecha de Compra */}
                            <div className="bg-white border border-gray-400 shadow-sm p-4 rounded-industrial flex flex-col justify-center">
                                <label className="text-[11px] font-bold text-brand-navy uppercase  mb-2 block">Fecha de Compra</label>
                                <div className="relative group/date">
                                    <input
                                        type="date"
                                        required
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className={`w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 focus:border-black outline-none text-brand-navy font-bold scheme-light pr-12 cursor-pointer text-xs
                                            [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                        disabled={isSubmitting}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-focus-within/date:opacity-100 opacity-60 transition-opacity">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Cantidad */}
                            <div className="bg-white border border-gray-400 shadow-sm p-4 rounded-industrial flex flex-col justify-center">
                                <label className="text-[11px] font-bold text-brand-navy uppercase  block mb-2">Cantidad Pack de Compra</label>
                                <div className="relative group w-full">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        required
                                        value={displayWeight}
                                        onChange={handleWeightChange}
                                        placeholder="0"
                                        disabled={isSubmitting}
                                        className="block w-full bg-white border rounded-industrial-sm px-4 py-3 text-xl outline-none font-bold transition-all pr-12 border-gray-400 shadow-sm text-brand-navy focus:border-black placeholder:text-brand-navy placeholder:font-bold"
                                    />
                                    <div className="absolute top-1/2 -translate-y-1/2 right-4">
                                        <span className="text-brand-navy font-bold opacity-60 text-[9px] ">KG</span>
                                    </div>
                                </div>
                            </div>

                            {/* Valor */}
                            <div className="bg-white border border-gray-400 shadow-sm p-4 rounded-industrial flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase  block">Valor Total Pagado</label>
                                    <span className="text-[7px] bg-black/20 text-brand-navy px-1.5 py-0.5 rounded font-bold uppercase border border-gray-400 shadow-sm">Fair Trade</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={displayValue}
                                        onChange={handleValueChange}
                                        className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 text-xl font-bold er outline-none transition-all pr-12 text-brand-navy focus:border-black"
                                        placeholder="0"
                                        disabled={isSubmitting}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-brand-navy font-bold  opacity-60">COP</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[9px] text-brand-navy mt-2 uppercase text-right ">Auditoría Financiera Industrial • Manejando COP</p>

                        <div className="flex justify-between items-center mt-10">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="text-brand-navy hover:text-brand-navy text-[11px] font-bold uppercase  flex items-center gap-2 transition-all"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                Volver a Origen
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                className="bg-white hover:bg-black/20 text-brand-navy border border-gray-400 shadow-sm px-10 py-5 rounded-2xl text-[11px] font-bold uppercase  flex items-center gap-4 transition-all group"
                            >
                                Siguiente: Datos del Beneficio
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </section>
                )}

                {currentStep === 3 && (
                    <section className="bg-soft-white border border-gray-400 shadow-sm p-8 rounded-industrial space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-brand-navy font-bold flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-black rounded-full"></span>
                                Beneficio: Datos Básicos del Productor
                            </h3>
                            <span className="px-3 py-1 bg-white text-brand-navy text-[11px] font-bold uppercase  rounded-full border border-gray-400 shadow-sm">Campo Mínimo</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {/* 1. Variedad del Café (Heredada) */}
                             <div>
                                 <label className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2 mb-1">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                     Variedad Detectada (Origen)
                                 </label>
                                 <div className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-3 text-sm font-bold text-brand-navy flex items-center justify-between shadow-inner">
                                     <span>{formData.variety || '---'}</span>
                                     <span className="text-[9px] opacity-60 uppercase font-black">Identidad Confirmada</span>
                                 </div>
                             </div>

                             {/* 2. Tipo de proceso (Heredado) */}
                             <div>
                                 <label className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2 mb-1">
                                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                     Proceso Base Detectado
                                 </label>
                                 <div className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-3 text-sm font-bold text-brand-navy flex items-center justify-between shadow-inner">
                                     <span className="uppercase">{formData.process || '---'}</span>
                                     <span className="text-[9px] opacity-60 uppercase font-black">Flujo Standard</span>
                                 </div>
                             </div>

                            <div className="flex flex-col gap-2 md:col-span-3">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Estilo de Fermentación / Variación</label>
                                <select
                                    value={formData.processData?.fermentation_style || 'estandar'}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, fermentation_style: e.target.value } 
                                    }))}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-4 focus:border-black outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat font-bold text-brand-navy shadow-lg shadow-brand-green/5"
                                >
                                    {FERMENTATION_STYLES.map(style => (
                                        <option key={style.id} value={style.id} className={style.id === 'otro' ? 'font-bold text-brand-navy' : ''}>
                                            {style.label}
                                        </option>
                                    ))}
                                </select>

                                {formData.processData?.fermentation_style === 'otro' && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[11px] font-bold text-brand-navy uppercase  block mb-2">Descripción del Proceso Personalizado</label>
                                        <textarea
                                            placeholder="Describa aquí el protocolo de fermentación, microorganismos utilizados o variaciones específicas del caficultor..."
                                            value={formData.processData?.fermentation_notes || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                processData: { ...prev.processData, fermentation_notes: e.target.value } 
                                            }))}
                                            className="w-full bg-white border border-black border-dashed rounded-industrial-sm px-5 py-4 text-sm font-bold text-brand-navy outline-none focus:border-black h-32 resize-none shadow-inner"
                                        />
                                        <p className="text-[9px] text-brand-navy mt-2 uppercase ">Este detalle técnico será incluido en el certificado final de exportación.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECCIÓN DE ALQUIMIA (FISICOQUÍMICA) */}
                        <div className="pt-8 border-t border-gray-400 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2">
                                    <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                                    Alquimia de Fermentación (Fisicoquímica)
                                </h4>
                                <span className="text-[9px] text-brand-navy font-mono uppercase">Control de Variables Críticas</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <NumericInput
                                    label="pH Inicial"
                                    value={formData.processData?.ph_inicial || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, ph_inicial: val } 
                                    }))}
                                    step={0.1}
                                    variant="blue"
                                    inputClassName="text-sm !text-brand-navy !font-bold !h-[58px]"
                                />
                                <NumericInput
                                    label="pH Final"
                                    value={formData.processData?.ph_final || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, ph_final: val } 
                                    }))}
                                    step={0.1}
                                    variant="blue"
                                    inputClassName="text-sm !text-brand-navy !font-bold !h-[58px]"
                                />
                                <NumericInput
                                    label="Grados Brix"
                                    value={formData.processData?.brix_inicial || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, brix_inicial: val } 
                                    }))}
                                    step={0.1}
                                    unit="°Bx"
                                    variant="blue"
                                    inputClassName="text-sm !text-brand-navy !font-bold !h-[58px]"
                                />
                                <NumericInput
                                    label="Actividad Agua (Aw)"
                                    value={formData.processData?.actividad_agua_aw || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, actividad_agua_aw: val } 
                                    }))}
                                    step={0.01}
                                    unit="Aw"
                                    placeholder="0.55"
                                    variant="industrial"
                                    inputClassName="text-sm !text-brand-navy !font-bold !h-[58px]"
                                />
                                <NumericInput
                                    label="Temp. Máx (°C)"
                                    value={formData.processData?.temperatura_masa_max || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, temperatura_masa_max: val } 
                                    }))}
                                    step={0.5}
                                    unit="°C"
                                    variant="industrial"
                                    inputClassName="text-sm !text-brand-navy !font-bold !h-[58px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase  block">Recipiente</label>
                                    <select
                                        value={formData.processData?.recipiente_fermentacion || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            processData: { ...prev.processData, recipiente_fermentacion: e.target.value } 
                                        }))}
                                        className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 text-xs font-bold text-brand-navy outline-none focus:border-black appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.1rem_1.1rem] bg-[position:right_1rem_center] bg-no-repeat transition-all"
                                    >
                                        <option value="">Seleccionar Recipiente</option>
                                        {['Bioreactor Inoxidable', 'Tanque Plástico', 'Bolsa GrainPro', 'Tanque Cemento'].map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                <NumericInput
                                    label="Horas Fermentación"
                                    value={formData.processData?.duracion_fermentacion_horas || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, duracion_fermentacion_horas: val } 
                                    }))}
                                    unit="Hrs"
                                    variant="industrial"
                                    inputClassName="text-sm !text-brand-navy !font-bold !h-[58px]"
                                />
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase  block">Agente de Infusión</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Frutas, Levaduras, Canela..."
                                        value={formData.processData?.agente_infusion || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            processData: { ...prev.processData, agente_infusion: e.target.value } 
                                        }))}
                                        className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 text-xs font-bold text-brand-navy outline-none focus:border-black uppercase transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-gray-400 shadow-sm">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Método de Secado</label>
                                <select
                                    value={formData.processData?.tipo_secado || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, processData: { ...p.processData, tipo_secado: e.target.value } }))}
                                    className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 text-xs font-bold text-brand-navy outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat transition-all"
                                >
                                    <option value="">Seleccionar Método</option>
                                    {[
                                        { id: 'Camas Africanas', label: 'Camas Africanas' },
                                        { id: 'Marquesina Parabólica', label: 'Marquesina Parabólica' },
                                        { id: 'Silo Mecánico', label: 'Silo Mecánico' },
                                        { id: 'Patio al Sol', label: 'Patio al Sol' },
                                        { id: 'Secado Mixto', label: 'Secado Mixto (Sol/Máquina)' }
                                    ].map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Tiempo de Secado (Días/Horas)</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 15 días o 32 horas"
                                    value={formData.processData?.duracion_secado || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, processData: { ...p.processData, duracion_secado: e.target.value } }))}
                                    className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 text-sm font-bold text-brand-navy outline-none focus:border-black placeholder:text-brand-navy placeholder:font-bold"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {formData.variety === 'Otro' && (
                            <div className="animate-in slide-in-from-top-2 duration-300 max-w-md pt-6 border-t border-gray-400 shadow-sm">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Nombre Variedad Especial</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Sidra Salvaje"
                                    required
                                    value={customVariety}
                                    onChange={(e) => setCustomVariety(e.target.value)}
                                    className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 mt-1 focus:border-black outline-none text-brand-navy placeholder:text-brand-navy"
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}


                    </section>
                )}

            </fieldset>

            {/* Navigational Buttons */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-400 shadow-sm relative z-20">
                {currentStep > 1 ? (
                    <button type="button" onClick={prevStep} disabled={isSubmitting} className="px-6 py-3 border border-gray-400 shadow-sm text-brand-navy rounded-industrial-sm font-bold uppercase  text-[11px] hover:bg-white transition-colors disabled:opacity-50">
                        &larr; Volver Atrás
                    </button>
                ) : <div></div>}

                {currentStep < 3 ? (
                    <button type="button" onClick={nextStep} className="px-10 py-4 bg-white text-brand-navy border border-gray-400 shadow-sm rounded-industrial-sm font-bold uppercase  text-[11px] hover:bg-brand-green hover:text-white transition-colors shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                        Siguiente Paso &rarr;
                    </button>
                ) : (
                    <div className="flex-1 ml-4 animate-in fade-in zoom-in-95 duration-500">
                        <button
                            type="submit"
                            disabled={isSubmitting || isReadOnly}
                            className={`w-full font-bold py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase  text-xs shadow-2xl bg-brand-green text-white hover:bg-opacity-90 disabled:opacity-50`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        SINCRONIZANDO CON LA NUBE...
                                    </div>
                                </>
                            ) : (selectedLot?.status === 'completed' || selectedLot?.status === 'sealed') ? (
                                <>
                                    PROCESO SELLADO Y VERIFICADO
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </>
                            ) : selectedLot?.id ? (
                                <>
                                    GUARDAR DATOS
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                </>
                            ) : (
                                <>
                                    REGISTRAR ORIGEN AL SISTEMA AXIS
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
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
