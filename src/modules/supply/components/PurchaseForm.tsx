import React, { useState, useEffect } from 'react';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
import { CoffeeVariety, ProcessType } from '@/shared/types';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import { createCoffeePurchase, updateCoffeePurchase } from '../actions/purchase';
import { supabase } from '@/shared/lib/supabase';
import EUDRGeoreference from './EUDRGeoreference';
import EUDRComplianceBadge from './EUDRComplianceBadge';
import { useLanguage } from '@/shared/context/LanguageContext';
import * as XLSX from 'xlsx';
import { parseFichaDeLote } from '@/shared/lib/excelParser';


const COFFEE_VARIETIES_BASE: string[] = [
    'Bourbon', 'Bourbon Rosado', 'Castillo', 'Caturra', 'Cenicafe 1',
    'Chiroso', 'Colombia', 'Geisha', 'Java', 'Laurina',
    'Maragogype', 'Mundo Novo', 'Pacamara', 'Papayo', 'Sidra',
    'SL28', 'Tabi', 'Typica', 'Wush Wush'
];

const PROCESS_TYPES: ProcessType[] = ['lavado', 'semilavado', 'honey', 'natural', 'sumergido'];

const FERMENTATION_STYLES = [
    { id: 'estandar', label: 'STANDARD / TRADITIONAL' },
    { id: 'anaerobico', label: 'ANAEROBIC (GENERAL)' },
    { id: 'aerobic', label: 'AEROBIC (GENERAL)' },
    { id: 'carbonic_maceration', label: 'CARBONIC MACERATION' },
    { id: 'lactic', label: 'LACTIC FERMENTATION' },
    { id: 'double_fermentation', label: 'DOUBLE FERMENTATION' },
    { id: 'co_fermentation', label: 'CO-FERMENTATION (FRUITS/YEASTS)' },
    { id: 'thermal_shock', label: 'THERMAL SHOCK' },
    { id: 'koji', label: 'KOJI FERMENTATION' },
    { id: 'otro', label: '+ OTHER (SPECIFY)' }
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
    'Colombia', 'Ethiopia', 'Brazil', 'Vietnam', 'Panama', 'Costa Rica', 'Kenya', 'Indonesia', 'Guatemala', 'Honduras', 'El Salvador'
];

import { CoffeePurchaseInventory, PurchaseFormData, PurchaseProcessData } from '@/shared/types/database';
import { purchaseSchema } from '@/shared/schemas/formSchemas';
import { z } from 'zod';

interface PurchaseFormProps {
    onPurchaseComplete?: (lot: CoffeePurchaseInventory) => void;
    selectedLot?: Record<string, any>;
    user: { id?: string, email: string, name: string, companyId: string, role?: string } | null;
    isReadOnly?: boolean;
}

export default function PurchaseForm({ onPurchaseComplete, selectedLot, user, isReadOnly }: PurchaseFormProps) {
    const { t } = useLanguage();
    const [dynamicVarieties, setDynamicVarieties] = useState<string[]>(COFFEE_VARIETIES_BASE);
    const [customVariety, setCustomVariety] = useState('');
    const [customRegion, setCustomRegion] = useState('');
    const [customMunicipality, setCustomMunicipality] = useState('');

    const initialFormState = {
        sicaId: '',
        farmerName: '',
        farmName: '',
        farmSizeHectares: undefined as number | undefined,
        altitude: undefined as number | undefined,
        country: 'Colombia',
        region: '',
        municipality: '',
        variety: '' as CoffeeVariety | string,
        process: '' as ProcessType,
        farmerPhone: '',
        purchaseWeight: 0,
        purchaseValue: 0,
        purchaseDate: '',
        harvestDate: '',
        lotNumber: '',
        destination: 'export_green' as 'export_green' | 'roasted_coffee',
        exportCertificate: '',
        isEuropeDestination: false as boolean,
        coffeeType: 'pergamino' as 'pergamino' | 'excelso',
        latitude: 0,
        longitude: 0,
        processData: {
            fermentation_style: 'estandar',
            ph_inicial: '',
            ph_final: '',
            brix_inicial: '',
            temperatura_masa_max: '',
            duracion_fermentacion_horas: '',
            actividad_agua_aw: '',
            recipiente_fermentacion: '',
            tipo_secado: '',
            duracion_secado: '',
            agente_infusion: '',
            fermentation_notes: ''
        }

    } as PurchaseFormData;

    const [formData, setFormData] = useState(initialFormState);
    const [displayValue, setDisplayValue] = useState('');
    const [displayWeight, setDisplayWeight] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [expectedYield, setExpectedYield] = useState<number>(0);
    const [smartLinkText, setSmartLinkText] = useState('');
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [availableLots, setAvailableLots] = useState<Record<string, any>[]>([]);
    const [selectedLotId, setSelectedLotId] = useState<string>('');
    const [recentFarmers, setRecentFarmers] = useState<Record<string, any>[]>([]);
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
            const isBase = COFFEE_VARIETIES_BASE.includes((selectedLot.variety || '') as string);
            const isRegionBase = COLOMBIAN_REGIONS.includes((selectedLot.region || '') as string);
            const isMunBase = COMMON_MUNICIPALITIES.includes((selectedLot.municipality || '') as string);

            setFormData({
                sicaId: selectedLot.process_data?.sica_id || '',
                farmerName: selectedLot.farmer_name || '',
                farmName: selectedLot.farm_name || '',
                farmSizeHectares: selectedLot.farm_size_hectares || undefined,
                altitude: selectedLot.altitude ? Number(selectedLot.altitude) : '',
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
                latitude: Number(selectedLot.latitude) || 0,
                longitude: Number(selectedLot.longitude) || 0,
                processData: (() => {
                    const pd = selectedLot.process_data;
                    const isSpecialty = ['anaerobico', 'doble_fermentacion', 'co_fermentacion'].includes((selectedLot.process as ProcessType) || 'lavado');
                    const hasData = pd && Object.keys(pd).length > 0;
                    const hasValues = hasData && Object.values(pd).some(v => v !== null && v !== '');

                    if (isSpecialty && hasData && !hasValues) {
                        return {
                            ph_inicial: '',
                            ph_final: '',
                            brix_inicial: '',
                            temperatura_masa_max: '',
                            duracion_fermentacion_horas: '',
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
                        ph_inicial: '',
                        ph_final: '',
                        brix_inicial: '',
                        temperatura_masa_max: '',
                        duracion_fermentacion_horas: '',
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
        setExpectedYield(Number(formData.purchaseWeight) * 0.81);
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
                const found = data.find((p: Record<string, unknown>) => p.codigo_sica === formData.sicaId || p.cedula_productor === formData.sicaId);

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

    const handleFarmerSelect = (farmer: Record<string, any>) => {
        setFormData(prev => ({
            ...prev,
            farmerName: farmer.farmer_name,
            farmName: farmer.farm_name,
            altitude: farmer.altitude ? Number(farmer.altitude) : undefined as any,
            country: farmer.country,
            region: farmer.region,
            municipality: farmer.municipality || '',
            latitude: Number(farmer.latitude),
            longitude: Number(farmer.longitude),
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
                altitude: Number(lot.altitud) || prev.altitude,
                latitude: Number(lot.lat) || prev.latitude,
                longitude: Number(lot.lon) || prev.longitude,
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

            const defaultDate = new Date().toISOString().split('T')[0];
            const defaultLotNumber = `FINCA-${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}-LOTE1`;
            
            // ZOD VALIDATION
            const zodResult = purchaseSchema.safeParse({
                ...formData,
                variety: finalVariety,
                region: finalRegion,
                municipality: finalMunicipality,
                purchaseDate: formData.purchaseDate || defaultDate,
                harvestDate: formData.harvestDate || defaultDate,
                lotNumber: formData.lotNumber || defaultLotNumber
            });

            if (!zodResult.success) {
                const errorMessage = zodResult.error.issues.map((err: any) => err.message).join(' | ');
                throw new Error(`VALIDATION ERROR: ${errorMessage}`);
            }

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
                    purchaseDate: formData.purchaseDate || defaultDate,
                    harvestDate: formData.harvestDate || defaultDate,
                    lotNumber: formData.lotNumber || defaultLotNumber,
                    processData: { ...formData.processData, sica_id: formData.sicaId, farmer_phone: formData.farmerPhone }
                }, user as any);
            } else {
                // Modo Creación
                result = await createCoffeePurchase({
                    ...formData,
                    variety: finalVariety,
                    region: finalRegion,
                    municipality: finalMunicipality,
                    purchaseDate: formData.purchaseDate || defaultDate,
                    harvestDate: formData.harvestDate || defaultDate,
                    lotNumber: formData.lotNumber || defaultLotNumber,
                    processData: { ...formData.processData, sica_id: formData.sicaId, farmer_phone: formData.farmerPhone },
                    companyId: (user as any)?.companyId || '99999999-9999-9999-9999-999999999999'
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
        } catch (err: unknown) {
            console.error("DEBUG SUBMISSION:", err);
            setStatus({
                type: 'error',
                message: (err as any).message || 'Error de Sincronización Industrial: Fallo crítico en el procesamiento.'
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
        <form autoComplete="off" onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-soft-white border border-gray-400 shadow-sm p-10 rounded-industrial max-w-md w-full text-center space-y-6 shadow-2xl shadow-brand-green/20">
                        <div className="w-20 h-20 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-400 shadow-sm">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3" className="animate-bounce">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-brand-navy uppercase er">{t('purchaseForm', 'draftSuccess')}</h3>
                        <p className="text-brand-navy leading-relaxed text-sm">
                            Identificador <span className="text-brand-navy font-mono font-bold">{formData.lotNumber}</span> has been successfully persisted in Axis Coffee Pro core..
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    handleNewLot();
                                }}
                                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold py-5 rounded-industrial-sm transition-all uppercase  text-sm shadow-lg shadow-brand-green/20"
                            >
                                {t('purchaseForm', 'buttonNewLot')}
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
                                {t('purchaseForm', 'keepProducer')} (Mantener a {formData.farmerName.split(' ')[0] || 'Elena'})
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

            

            {/* Tabs Header */}
            <div className="flex border-b-2 border-gray-300 mb-6 w-full relative gap-1">
                <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)} 
                    className={`flex-1 py-3 px-4 text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-2 rounded-t-xl -mb-[2px] border-b-2 ${currentStep === 1 ? 'bg-brand-navy text-white border-brand-navy shadow-[0_-4px_10px_rgba(0,0,0,0.05)]' : 'bg-transparent text-brand-navy border-transparent hover:bg-gray-100/50'}`}
                >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${currentStep === 1 ? 'bg-white/20 text-white' : 'bg-gray-300 text-brand-navy'}`}>1</span>
                    Origin Data
                </button>
                <button 
                    type="button" 
                    onClick={() => setCurrentStep(2)} 
                    className={`flex-1 py-3 px-4 text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-2 rounded-t-xl -mb-[2px] border-b-2 ${currentStep === 2 ? 'bg-brand-navy text-white border-brand-navy shadow-[0_-4px_10px_rgba(0,0,0,0.05)]' : 'bg-transparent text-brand-navy border-transparent hover:bg-gray-100/50'}`}
                >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${currentStep === 2 ? 'bg-white/20 text-white' : 'bg-gray-300 text-brand-navy'}`}>2</span>
                    Commercialization
                </button>
                <button 
                    type="button" 
                    onClick={() => setCurrentStep(3)} 
                    className={`flex-1 py-3 px-4 text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-2 rounded-t-xl -mb-[2px] border-b-2 ${currentStep === 3 ? 'bg-brand-navy text-white border-brand-navy shadow-[0_-4px_10px_rgba(0,0,0,0.05)]' : 'bg-transparent text-brand-navy border-transparent hover:bg-gray-100/50'}`}
                >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${currentStep === 3 ? 'bg-white/20 text-white' : 'bg-gray-300 text-brand-navy'}`}>3</span>
                    Processing (Farmer)
                </button>
            </div>

            <fieldset disabled={isSubmitting || isReadOnly} className="border-none p-0 m-0 min-h-[450px] relative transition-all">
                {currentStep === 1 && (
                    <section className="bg-transparent border-none p-0 space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-3 mb-0">
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    AUTO-COMPLETE SICA / ID
                                </label>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-12 pb-4">
                                    <div className="relative w-full sm:max-w-[50%] border-b border-brand-navy/30">
                                        <input
                                            type="text"
                                            placeholder="E.g. Farmer ID (1109417355)"
                                            value={formData.sicaId}
                                            onChange={(e) => setFormData({ ...formData, sicaId: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSicaSearch();
                                                }
                                            }}
                                            className="w-full bg-transparent outline-none font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light pb-2 pr-8"
                                            disabled={isSubmitting}
                                            onBlur={handleSicaSearch}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSicaSearch}
                                            disabled={isSearchingSica || !formData.sicaId}
                                            className="absolute right-0 top-0 h-full pb-2 flex items-center text-brand-green hover:text-brand-navy transition-colors disabled:opacity-50"
                                        >
                                            {isSearchingSica ? (
                                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"></path></svg>
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-16 shrink-0 pr-12">
                                        <label className="text-brand-navy hover:text-brand-green hover:underline underline-offset-4 font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer text-[10px] whitespace-nowrap">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                            LOAD EXCEL FILE
                                            <input 
                                                type="file" 
                                                accept=".xlsx,.xls" 
                                                className="hidden" 
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = async (evt) => {
                                                            try {
                                                                setIsSubmitting(true);
                                                                setStatus({ type: 'success', message: 'Procesando Ficha de Lote y generando borrador global...' });
                                                                const buffer = evt.target?.result as ArrayBuffer;
                                                                const excelData = parseFichaDeLote(buffer);
                                                                
                                                                // 1. Populate formData with inventory part
                                                                const inv = excelData.inventory;
                                                                const finalVariety = inv.variety || formData.variety;
                                                                const finalRegion = inv.region || formData.region;
                                                                const finalMunicipality = formData.municipality;

                                                                const newData = {
                                                                    ...formData,
                                                                    lotNumber: inv.lotNumber || formData.lotNumber,
                                                                    farmerName: inv.farmerName || formData.farmerName,
                                                                    farmName: inv.farmName || formData.farmName,
                                                                    altitude: inv.altitude || formData.altitude,
                                                                    region: finalRegion,
                                                                    variety: finalVariety,
                                                                    process: inv.process || formData.process,
                                                                    purchaseWeight: inv.purchaseWeight || formData.purchaseWeight,
                                                                    processData: {
                                                                        ...formData.processData,
                                                                        ...inv.processData,
                                                                        raw_excel_data: excelData // GUARDA EL EXCEL COMPLETO AQUI
                                                                    }
                                                                };
                                                                setFormData(newData);
                                                                
                                                                // 2. AUTO-SAVE to DB so other tabs can be unlocked and read from DB
                                                                const payload = {
                                                                    ...newData,
                                                                    variety: finalVariety,
                                                                    region: finalRegion,
                                                                    municipality: finalMunicipality,
                                                                    processData: newData.processData,
                                                                    companyId: user?.companyId || '99999999-9999-9999-9999-999999999999'
                                                                };
                                                                
                                                                let result;
                                                                if (selectedLot?.id) {
                                                                    result = await updateCoffeePurchase(selectedLot.id, payload, user as any);
                                                                } else {
                                                                    result = await createCoffeePurchase(payload);
                                                                }
                                                                
                                                                if (result.success) {
                                                                    setStatus({ type: 'success', message: 'Ficha precargada y borrador guardado. Ya puedes navegar a las demás pestañas.' });
                                                                    if (onPurchaseComplete) {
                                                                        onPurchaseComplete(result.data);
                                                                    }
                                                                } else {
                                                                    setStatus({ type: 'error', message: 'Error guardando borrador: ' + result.message });
                                                                }
                                                            } catch (error: any) {
                                                                setStatus({ type: 'error', message: 'Error procesando Excel: ' + error.message });
                                                            } finally {
                                                                setIsSubmitting(false);
                                                                e.target.value = '';
                                                            }
                                                        };
                                                        reader.readAsArrayBuffer(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                        <button type="button" onClick={() => setFormData({...formData, sicaId: '', farmerName: '', lotNumber: ''})} className="text-brand-navy hover:text-brand-green hover:underline underline-offset-4 font-bold uppercase transition-all flex items-center gap-1.5 text-[10px] whitespace-nowrap">
                                            + ENTER NEW LOT
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {availableLots.length > 0 && (
                                <div className="md:col-span-3 bg-white border border-gray-400 shadow-sm p-6 rounded-industrial animate-in zoom-in-95 duration-500 mb-6">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2 mb-3">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                        {t('purchaseForm', 'specificLot')}
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                                        {availableLots.map(lot => (
                                            <button
                                                key={lot.id}
                                                type="button"
                                                onClick={() => handleLotSelect(lot.id)}
                                                className={`p-3 rounded-industrial-sm border transition-all flex flex-col items-center gap-1 ${selectedLotId === lot.id ? 'bg-brand-green/10 border-brand-green/20 text-brand-green shadow-sm' : 'bg-transparent border-brand-navy/20 text-brand-navy hover:bg-brand-green/5 shadow-sm'}`}
                                            >
                                                <span className="text-[11px] font-bold uppercase ">{lot.id}</span>
                                                <span className="text-[9px] font-mono opacity-60">{lot.area_ha} HA</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-brand-navy uppercase  mt-2 font-bold">
                                        {t('purchaseForm', 'lotCrossTip')}
                                    </p>
                                </div>
                            )}

                            {recentFarmers.length > 0 && (
                                <div className="md:col-span-3 mt-2 border-t-2 border-brand-green shadow-sm pt-4 relative">
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-soft-white px-4 flex items-center gap-3">
                                        <span className="text-[11px] font-bold text-brand-navy uppercase ">{t('purchaseForm', 'directory')}</span>
                                    </div>
                                    
                                    <div className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar scroll-smooth mt-2">
                                        {recentFarmers.map((f, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleFarmerSelect(f)}
                                                className="flex-shrink-0 bg-transparent border border-brand-navy/20 shadow-sm hover:bg-brand-green/5 p-3 rounded-industrial-sm transition-all text-left min-w-[180px]"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[11px] font-bold text-brand-navy uppercase truncate">{f.farmer_name}</p>
                                                    <span className="text-[9px] bg-white text-brand-navy px-1.5 py-0.5 rounded font-mono font-bold">LOTE {f.lot_number?.split('-').pop() || '01'}</span>
                                                </div>
                                                <p className="text-[9px] text-brand-navy uppercase er mt-1 truncate">{f.farm_name} • {f.region}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="md:col-span-3 border-t-2 border-brand-green my-0"></div>

                            <div className="md:col-span-3 mt-0 relative py-0">
                                <span className="text-[11px] font-bold text-brand-green uppercase block mb-1">
                                    {t('purchaseForm', 'individualLotId')}
                                </span>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'sicaId')}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. 1081492345"
                                    value={formData.sicaId}
                                    onChange={(e) => setFormData({ ...formData, sicaId: e.target.value })}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'farmerName')}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Alejandra Pérez"
                                    required
                                    value={formData.farmerName}
                                    onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'farmerPhone')}
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Ej. +57 301 000 0000"
                                    value={formData.farmerPhone}
                                    onChange={(e) => setFormData({ ...formData, farmerPhone: e.target.value })}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'farmName')}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Alejandría"
                                    required
                                    value={formData.farmName}
                                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <NumericInput
                                    label={t('purchaseForm', 'altitude')}
                                    value={formData.altitude === undefined ? '' : formData.altitude}
                                    onChange={(val) => setFormData({ ...formData, altitude: val })}
                                    min={800}
                                    max={2500}
                                    step={1}
                                    variant={formData.altitude !== undefined && formData.altitude !== '' && (Number(formData.altitude) < 1000 || Number(formData.altitude) > 2500) ? 'red' : 'default'}
                                    inputClassName="font-bold"
                                    unit="M"
                                    placeholder="1600"
                                />
                            </div>
                        </div>

                        <div className="border-t-2 border-brand-green my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                            <div className="w-full flex flex-col justify-center">
                                <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-2 mb-1">

                                    {t('purchaseForm', 'gpsLink')}
                                </label>
                                <div className="flex gap-2 w-full mt-0.5">
                                    <input
                                        type="text"
                                        placeholder={t('purchaseForm', 'gpsPlaceholder')}
                                        className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
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
                                        className="bg-brand-navy text-white hover:bg-brand-navy/90 px-3 py-1.5 rounded-full text-[10px] tracking-widest font-bold uppercase transition-colors whitespace-nowrap disabled:cursor-not-allowed"
                                        title="{t('purchaseForm', 'gpsExtract')}"
                                    >
                                        {t('purchaseForm', 'gpsExtract')}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'latitude')}
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Ej. 4.570868"
                                    value={formData.latitude || ''}
                                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'longitude')}
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="Ej. -74.297333"
                                    value={formData.longitude || ''}
                                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            {/* País */}
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'country') || 'País'}
                                </label>
                                <select
                                    required
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Región / Departamento */}
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    {t('purchaseForm', 'region')}
                                </label>
                                {formData.country === 'Colombia' ? (
                                    <>
                                        <select
                                            required
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select</option>
                                            {COLOMBIAN_REGIONS.map(r => (
                                                <option key={r} value={r} className={r === 'Otro' ? 'text-brand-navy font-bold' : ''}>
                                                    {r === 'Otro' ? '+ OTRO (ESPECIFICAR)' : r}
                                                </option>
                                            ))}
                                        </select>
                                        {formData.region === 'Otro' && (
                                            <input
                                                type="text"
                                                placeholder="Especificar Región"
                                                value={customRegion}
                                                onChange={(e) => setCustomRegion(e.target.value)}
                                                className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Ej. Sidama o Dak Lak"
                                        required
                                        value={formData.region === 'Otro' ? customRegion : formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                        disabled={isSubmitting}
                                    />
                                )}
                            </div>

                            {/* Municipio */}
                            <div>
                                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
                                    
                                    {t('purchaseForm', 'municipality')}
                                </label>
                                {formData.country === 'Colombia' ? (
                                    <>
                                        <select
                                            required
                                            value={formData.municipality}
                                            onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                            className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Select</option>
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
                                                className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                                required
                                                disabled={isSubmitting}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Ej. Buon Ma Thuot o Choche"
                                        required
                                        value={formData.municipality === 'Otro' ? customMunicipality : formData.municipality}
                                        onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                                        className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                        disabled={isSubmitting}
                                    />
                                )}
                            </div>
                        </div>


                    </section>
                )}

                {currentStep === 2 && (
                    <section className="bg-transparent border-none p-0 space-y-6 animate-in slide-in-from-right-4 duration-500">
                        

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">
                                    
                                    {t('purchaseForm', 'lotNum')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lotNumber}
                                    placeholder={`Ej: FINCA-${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}-LOTE1`}
                                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value.toUpperCase() })}
                                    className="w-full uppercase border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase block">
                                        
                                        {t('purchaseForm', 'farmSize')}
                                    </label>
                                    { (formData.farmSizeHectares ?? 0) >= 4 && (
                                        <span className="text-[9px] font-bold text-brand-navy uppercase">{t('purchaseForm', 'farmSizeTip')}</span>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ej. 4.5"
                                    value={formData.farmSizeHectares || ''}
                                    onChange={(e) => setFormData({ ...formData, farmSizeHectares: parseFloat(e.target.value) || undefined })}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        { (formData.farmSizeHectares ?? 0) >= 4 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <p className="text-red-600 text-[11px] font-medium leading-tight">
                                    <strong>ALERTA REGULATORIA EUDR:</strong> Ha declarado una finca de 4 hectáreas o más. Es obligatorio anexar el polígono de georreferenciación si el café tiene como destino Europa antes de continuar.
                                </p>
                            </div>
                        )}


                           <div className="border-t-2 border-brand-green my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">
                                    
                                    Incoming Coffee State
                                </label>
                                <div className="grid grid-cols-2 gap-2 mt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, coffeeType: 'pergamino' })}
                                        className={`py-1.5 px-2 rounded-md flex flex-col items-center gap-0.5 transition-all border ${formData.coffeeType === 'pergamino' ? 'bg-brand-green/10 text-brand-navy border-brand-green/30 shadow-sm' : 'bg-transparent border-gray-300 shadow-sm text-brand-navy/60 hover:bg-gray-50'}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase ">PARCHMENT COFFEE</span>
                                        <span className={`text-[9px] opacity-60 font-bold uppercase`}>(Requires Thrashing)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, coffeeType: 'excelso' })}
                                        className={`py-1.5 px-2 rounded-md flex flex-col items-center gap-0.5 transition-all border ${formData.coffeeType === 'excelso' ? 'bg-brand-green/10 text-brand-navy border-brand-green/30 shadow-sm' : 'bg-transparent border-gray-300 shadow-sm text-brand-navy/60 hover:bg-gray-50'}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase ">GREEN COFFEE</span>
                                        <span className={`text-[9px] opacity-60 font-bold uppercase`}>(Skip to Quality)</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">
                                    
                                    EXCLUSIVE LOT DESTINATION
                                </label>
                                <div className="grid grid-cols-2 gap-2 mt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, destination: 'export_green' })}
                                        className={`py-1.5 px-2 rounded-md flex flex-col items-center gap-0.5 transition-all border ${formData.destination === 'export_green' ? 'bg-brand-green/10 text-brand-navy border-brand-green/30 shadow-sm' : 'bg-transparent border-gray-300 shadow-sm text-brand-navy/60 hover:bg-gray-50'}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase">GREEN COFFEE</span>
                                        <span className="text-[9px] opacity-60 font-bold uppercase">(Export Route)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, destination: 'roasted_coffee' })}
                                        className={`py-1.5 px-2 rounded-md flex flex-col items-center gap-0.5 transition-all border ${formData.destination === 'roasted_coffee' ? 'bg-brand-green/10 text-brand-navy border-brand-green/30 shadow-sm' : 'bg-transparent border-gray-300 shadow-sm text-brand-navy/60 hover:bg-gray-50'}`}
                                    >
                                        <span className="text-[11px] font-bold uppercase">ROASTED COFFEE</span>
                                        <span className="text-[9px] opacity-60 font-bold uppercase">(Finished Product)</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                            <div className="border-t-2 border-brand-green my-4"></div>
                            {/* INJECTED IDENTITY FIELDS (Moved from Step 3) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Fecha de Recolección */}
                                <div>
                                    <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">Harvest Date</label>
                                    <div className="relative group/date">
                                        <input
                                            type={formData.harvestDate ? "date" : "text"}
                                            onFocus={(e) => e.target.type = 'date'}
                                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                                            placeholder={new Date().toLocaleDateString('en-GB')}
                                            required
                                            value={formData.harvestDate}
                                            onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                                            className={`w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none text-brand-navy font-medium scheme-light pr-8 cursor-pointer text-xs placeholder-gray-400 placeholder:font-light
                                                [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                            disabled={isSubmitting}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-focus-within/date:opacity-100 opacity-60 transition-opacity">
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
                                <div>
                                    <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">Coffee Variety</label>
                                    <select
                                        required
                                        value={formData.variety}
                                        onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                        className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent font-medium text-brand-navy text-xs outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-no-repeat font-bold text-brand-navy text-xs uppercase"
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Select</option>
                                        {dynamicVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                                        <option value="Other" className="text-brand-navy font-bold">+ OTHER (ENTER NEW)</option>
                                    </select>
                                </div>

                                {/* Proceso */}
                                <div>
                                    <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">Base Process</label>
                                    <select
                                        required
                                        value={formData.process}
                                        onChange={(e) => setFormData(prev => ({ ...prev, process: e.target.value as ProcessType }))}
                                        className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent font-medium text-brand-navy text-xs outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-no-repeat font-bold text-brand-navy text-xs uppercase"
                                    >
                                        <option value="">Select</option>
                                        <option value="lavado">Washed</option>
                                        <option value="semilavado">Semi-Washed</option>
                                        <option value="sumergido">Submerged</option>
                                        <option value="honey">Honey</option>
                                        <option value="natural">Natural</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t-2 border-brand-green my-4"></div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* {t('purchaseForm', 'purchaseDate')} */}
                                <div>
                                    <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">{t('purchaseForm', 'purchaseDate')}</label>
                                    <div className="relative group/date">
                                        <input
                                            type={formData.purchaseDate ? "date" : "text"}
                                            onFocus={(e) => e.target.type = 'date'}
                                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                                            placeholder={new Date().toLocaleDateString('en-GB')}
                                            required
                                            value={formData.purchaseDate}
                                            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            className={`w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none text-brand-navy font-medium scheme-light pr-8 cursor-pointer text-xs placeholder-gray-400 placeholder:font-light
                                                [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                            disabled={isSubmitting}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-focus-within/date:opacity-100 opacity-60 transition-opacity">
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
                                <div>
                                    <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">Purchase Pack Quantity</label>
                                    <div className="relative group w-full">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            required
                                            value={displayWeight}
                                            onChange={handleWeightChange}
                                            placeholder="0"
                                            disabled={isSubmitting}
                                            className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                            <span className="text-brand-navy font-bold opacity-60 text-[9px] ">KG</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Valor */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[11px] font-bold text-brand-navy uppercase block">Total Paid Value</label>
                                        <span className="text-[7px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-bold uppercase border border-brand-green/20 shadow-sm">Fair Trade</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={displayValue}
                                            onChange={handleValueChange}
                                            className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                            placeholder="0"
                                            disabled={isSubmitting}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-brand-navy font-bold opacity-60">COP</span>
                                    </div>
                                </div>
                            </div>
                    </section>
                )}

                {currentStep === 3 && (
                    <section className="bg-transparent border-none p-0 space-y-6 animate-in slide-in-from-right-4 duration-500">
                        

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                             {/* 1. Variedad del Café (Heredada) */}
                             <div>
                                 <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">
                                     
                                     DETECTED VARIETY (ORIGIN)
                                 </label>
                                 <div className="w-full h-[30px] border-b border-brand-navy/30 px-2 flex items-center justify-between bg-transparent">
                                     <span className="text-xs font-bold text-brand-navy uppercase">{formData.variety || '---'}</span>
                                 </div>
                             </div>

                            {/* 2. Tipo de proceso (Heredado) */}
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">
                                    DETECTED BASE PROCESS
                                </label>
                                <div className="w-full h-[30px] border-b border-brand-navy/30 px-2 flex items-center justify-between bg-transparent">
                                    <span className="text-xs font-bold text-brand-navy uppercase break-words mr-2">{formData.process || '---'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">FERMENTATION STYLE / VARIATION</label>
                                <select
                                    value={formData.processData?.fermentation_style || 'estandar'}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, fermentation_style: e.target.value } 
                                    }))}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent font-medium text-brand-navy text-xs outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-no-repeat font-bold text-brand-navy text-xs uppercase"
                                >
                                    {FERMENTATION_STYLES.map(style => (
                                        <option key={style.id} value={style.id} className={style.id === 'otro' ? 'font-bold text-brand-navy' : ''}>
                                            {style.label}
                                        </option>
                                    ))}
                                </select>

                                {formData.processData?.fermentation_style === 'otro' && (
                                    <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">CUSTOM PROCESS DESCRIPTION</label>
                                        <textarea
                                            placeholder="Describe the fermentation protocol, microorganisms used, or specific variations..."
                                            value={formData.processData?.fermentation_notes || ''}
                                            onChange={(e) => setFormData(prev => ({ 
                                                ...prev, 
                                                processData: { ...prev.processData, fermentation_notes: e.target.value } 
                                            }))}
                                            className="w-full bg-white border border-gray-400 rounded-industrial-sm px-3 py-2 text-xs font-bold text-brand-navy outline-none focus:border-black h-20 resize-none shadow-inner"
                                        />
                                        <p className="text-[9px] text-brand-navy mt-1 uppercase opacity-60 font-bold">This technical detail will be included in the final export certificate.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECCIÓN DE ALQUIMIA (FISICOQUÍMICA) */}
                        <div className="pt-4 border-t-2 border-brand-green mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5">
                                    
                                    FERMENTATION ALCHEMY (PHYSICOCHEMISTRY)
                                </h4>
                                <span className="text-[9px] text-brand-navy font-mono uppercase font-bold opacity-60">CRITICAL VARIABLES CONTROL</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <NumericInput
                                    label="Initial pH"
                                    value={formData.processData?.ph_inicial || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, ph_inicial: val } 
                                    }))}
                                    step={0.1}
                                    placeholder="4.5"
                                />
                                <NumericInput
                                    label="Final pH"
                                    value={formData.processData?.ph_final || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, ph_final: val } 
                                    }))}
                                    step={0.1}
                                    placeholder="3.8"
                                />
                                <NumericInput
                                    label="Brix Degrees"
                                    value={formData.processData?.brix_inicial || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, brix_inicial: val } 
                                    }))}
                                    step={0.1}
                                    unit="°Bx"
                                    placeholder="18.5"
                                />
                                <NumericInput
                                    label="Water Activity (Aw)"
                                    value={formData.processData?.actividad_agua_aw || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, actividad_agua_aw: val } 
                                    }))}
                                    step={0.01}
                                    unit="Aw"
                                    placeholder="0.55"
                                />
                                <NumericInput
                                    label="Max Temp (°C)"
                                    value={formData.processData?.temperatura_masa_max || ''}
                                    onChange={(val) => setFormData(prev => ({ 
                                        ...prev, 
                                        processData: { ...prev.processData, temperatura_masa_max: val } 
                                    }))}
                                    step={0.5}
                                    unit="°C"
                                    placeholder="35"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                <div>
                                    <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">Container</label>
                                    <select
                                        value={formData.processData?.recipiente_fermentacion || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            processData: { ...prev.processData, recipiente_fermentacion: e.target.value } 
                                        }))}
                                        className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent font-medium text-brand-navy text-xs outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat uppercase"
                                    >
                                        <option value="">Select Container</option>
                                        {['Stainless Bioreactor', 'Plastic Tank', 'GrainPro Bag', 'Cement Tank'].map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <NumericInput
                                        label="Fermentation Hours"
                                        value={formData.processData?.duracion_fermentacion_horas || ''}
                                        onChange={(val) => setFormData(prev => ({ 
                                            ...prev, 
                                            processData: { ...prev.processData, duracion_fermentacion_horas: String(val) } 
                                        }))}
                                        unit="Hrs"
                                        placeholder="72"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">Infusion Agent</label>
                                    <input
                                        type="text"
                                        placeholder="Fruits, Yeasts, Cinnamon..."
                                        value={formData.processData?.agente_infusion || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            processData: { ...prev.processData, agente_infusion: e.target.value } 
                                        }))}
                                        className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t-2 border-brand-green mt-4">
                            <div>
                                <label className="text-[11px] font-bold text-brand-navy uppercase block mb-1">
                                    
                                    DRYING METHOD
                                </label>
                                <select
                                    value={formData.processData?.tipo_secado || ''}
                                    onChange={(e) => setFormData(p => ({ ...p, processData: { ...p.processData, tipo_secado: e.target.value } }))}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                >
                                    <option value="">SELECT METHOD</option>
                                    {[
                                        { id: 'African Beds', label: 'AFRICAN BEDS' },
                                        { id: 'Parabolic Canopy', label: 'PARABOLIC CANOPY' },
                                        { id: 'Mechanical Silo', label: 'MECHANICAL SILO' },
                                        { id: 'Sun Patio', label: 'SUN PATIO' },
                                        { id: 'Mixed Drying', label: 'MIXED DRYING (SUN/MACHINE)' }
                                    ].map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <NumericInput
                                    label="DRYING HOURS"
                                    value={formData.processData?.duracion_secado || ''}
                                    onChange={(val) => setFormData(p => ({ ...p, processData: { ...p.processData, duracion_secado: String(val) } }))}
                                    placeholder="360"
                                    unit="Hrs"
                                />
                            </div>
                        </div>

                        {formData.variety === 'Otro' && (
                            <div className="animate-in slide-in-from-top-2 duration-300 max-w-md pt-6 border-t-2 border-brand-green shadow-sm">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Nombre Variedad Especial</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Sidra Salvaje"
                                    required
                                    value={customVariety}
                                    onChange={(e) => setCustomVariety(e.target.value)}
                                    className="w-full border-b border-brand-navy/30 px-2 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light"
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}


                    </section>
                )}

            </fieldset>

            {/* Navigational Buttons */}
            <div className="grid grid-cols-3 items-center pt-4 border-t border-brand-green/30 relative z-20">
                <div className="flex justify-start">
                    {currentStep > 1 && (
                        <button type="button" onClick={prevStep} disabled={isSubmitting} className="px-6 py-3 border border-brand-navy text-brand-navy bg-transparent rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-brand-navy/5 hover:scale-105 transition-all disabled:opacity-50">
                            &larr; BACK
                        </button>
                    )}
                </div>

                <div className="flex justify-center w-full">
                    {currentStep === 3 && (
                        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
                            <button
                                type="submit"
                                disabled={isSubmitting || isReadOnly}
                                className={`w-full font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 group uppercase text-[10px] tracking-widest shadow-sm bg-brand-green text-white hover:bg-brand-green/90 hover:scale-[1.02] disabled:opacity-50 border border-transparent`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            SINCRONIZANDO...
                                        </div>
                                    </>
                                ) : (selectedLot?.status === 'completed' || selectedLot?.status === 'sealed') ? (
                                    <>
                                        PROCESO SELLADO
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </>
                                ) : selectedLot?.id ? (
                                    <>
                                        GUARDAR DATOS
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        REGISTRAR ORIGEN
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    {currentStep < 3 && (
                        <button type="button" onClick={nextStep} className="px-6 py-3 bg-brand-green text-white rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-brand-green/90 hover:scale-105 transition-all flex items-center gap-2 shadow-sm">
                            {currentStep === 1 ? 'NEXT: COMMERCIALIZATION' : 'NEXT: PROCESSING'} &rarr;
                        </button>
                    )}
                </div>
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
