'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { submitPhysicalAnalysis } from '../../actions/analysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import EUDRComplianceBadge from '../EUDRComplianceBadge';

interface PhysicalAnalysisFormProps {
    inventoryId: string;
    lotDestination?: 'internal' | 'export_green' | 'export_roasted';
    onAnalysisComplete: () => void;
    user: { companyId: string } | null;
}

export default function PhysicalAnalysisForm({ inventoryId, lotDestination = 'internal', onAnalysisComplete, user }: PhysicalAnalysisFormProps) {
    const [formData, setFormData] = useState({
        moisture: 11.5,
        waterActivity: 0.58,
        density: 720,
        screenSize: {
            size18: 20,
            size17: 45,
            size16: 25,
            size15: 10,
            size14: 0,
            size13: 0,
            size12: 0,
            under12: 0
        },
        defects: {
            primary: 0.0,
            secondary: 0.0
        },
        grainColor: 'VERDE OLIVA'
    });

    const [physicochemicalData, setPhysicochemicalData] = useState({
        ph_inicial: '4.5',
        ph_final: '3.8',
        brix_inicial: '18.5',
        temperatura_masa_max: '35',
        duracion_fermentacion_horas: '72',
        actividad_agua_aw: '',
        recipiente_fermentacion: '',
        agente_infusion: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isAlreadyAnalyzed, setIsAlreadyAnalyzed] = useState(false);
    const [lotDetails, setLotDetails] = useState<any>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!inventoryId) return;
            setIsLoading(true);
            try {
                // Fetch physical analysis
                const { data: physicalData, error: physicalError } = await supabase
                    .from('physical_analysis')
                    .select('*')
                    .eq('inventory_id', inventoryId.trim())
                    .eq('company_id', user?.companyId)
                    .order('created_at', { ascending: false })
                    .limit(1);

                // Fetch lot details for EUDR and physicochemical analysis
                const { data: lotData, error: lotError } = await supabase
                    .from('coffee_purchase_inventory')
                    .select('*')
                    .eq('id', inventoryId.trim())
                    .single();

                if (physicalError) {
                    console.error("AXIS DB ERROR (Physical):", physicalError);
                    setError("Error al cargar datos de laboratorio físico.");
                } else if (physicalData && physicalData.length > 0) {
                    const record = physicalData[0];
                    setFormData({
                        moisture: Number(record.moisture_pct) || 0,
                        waterActivity: Number(record.water_activity) || 0,
                        density: Number(record.density_gl) || 0,
                        screenSize: record.screen_size_distribution || {
                            size18: 0,
                            size17: 0,
                            size16: 0,
                            size15: 0,
                            size14: 0,
                            size13: 0,
                            size12: 0,
                            under12: 0
                        },
                        defects: record.defects_count || {
                            primary: 0.0,
                            secondary: 0.0
                        },
                        grainColor: record.grain_color || 'VERDE OLIVA'
                    });
                    setIsAlreadyAnalyzed(true);
                }

                if (!lotError && lotData) {
                    setLotDetails(lotData);
                    const pd = lotData.process_data;
                    if (pd) {
                        setPhysicochemicalData({
                            ph_inicial: pd.ph_inicial || '4.5',
                            ph_final: pd.ph_final || '3.8',
                            brix_inicial: pd.brix_inicial || '18.5',
                            temperatura_masa_max: pd.temperatura_masa_max || '35',
                            duracion_fermentacion_horas: pd.duracion_fermentacion_horas || '72',
                            actividad_agua_aw: pd.actividad_agua_aw || '',
                            recipiente_fermentacion: pd.recipiente_fermentacion || '',
                            agente_infusion: pd.agente_infusion || ''
                        });
                    }
                }
            } catch (err) {
                console.error("AXIS CRITICAL ERROR (Physical):", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [inventoryId]);

    const screenSum = Object.values(formData.screenSize).reduce((a, b) => Number(a) + Number(b), 0);
    const isScreenValid = Math.abs(screenSum - 100) < 0.1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isScreenValid) {
            setError("La suma de granulometría debe ser exactamente 100%.");
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitPhysicalAnalysis(
                inventoryId, 
                formData, 
                user?.companyId || '',
                physicochemicalData
            );

            if (!result.success) {
                throw new Error(result.message);
            }

            onAnalysisComplete();
        } catch (err: any) {
            console.error("Error en análisis de laboratorio:", err);
            setError(err.message || "Fallo en la conexión con AXIS Cloud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-8 animate-in fade-in duration-500 relative min-h-[400px]">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-industrial">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-green-bright animate-pulse">Consultando AXIS Laboratorio...</p>
                    </div>
                </div>
            )}
            <header className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Análisis Físico de Laboratorio</h3>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Evaluación de Muestra de Oro</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
            </header>

            <EUDRComplianceBadge lotData={lotDetails} className="mb-4" />

            {error && (
                <div className="bg-brand-red/10 border border-brand-red/20 p-4 rounded-industrial-sm text-brand-red-bright text-[10px] font-bold uppercase tracking-widest">
                    ⚠️ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
                    <div className="md:col-span-2">
                        <NumericInput
                            label={`Humedad (%) ${lotDestination.startsWith('export') ? '[NORMA]' : ''}`}
                            value={formData.moisture}
                            onChange={(val) => setFormData({ ...formData, moisture: val })}
                            step={0.01}
                            disabled={isSubmitting || isAlreadyAnalyzed}
                            variant="industrial"
                            inputClassName="text-xl py-4"
                            unit="%"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <NumericInput
                            label="Agua ($a_w$)"
                            value={formData.waterActivity}
                            onChange={(val) => setFormData({ ...formData, waterActivity: val })}
                            step={0.001}
                            disabled={isSubmitting || isAlreadyAnalyzed}
                            variant="industrial"
                            inputClassName="text-xl py-4"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <NumericInput
                            label="Densidad (g/L)"
                            value={formData.density}
                            onChange={(val) => setFormData({ ...formData, density: val })}
                            step={1}
                            disabled={isSubmitting || isAlreadyAnalyzed}
                            variant="industrial"
                            inputClassName="text-xl py-4"
                            unit="g/L"
                        />
                    </div>

                    <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Color del Grano</label>
                        <div className="relative group/select">
                            <select
                                value={formData.grainColor}
                                disabled={isSubmitting || isAlreadyAnalyzed}
                                className={`w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 pr-14 py-4 text-sm font-bold text-white outline-none focus:border-brand-green uppercase appearance-none transition-all ${isAlreadyAnalyzed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onChange={(e) => setFormData({ ...formData, grainColor: e.target.value })}
                            >
                                <option value="VERDE OLIVA">Verde Oliva (Estándar)</option>
                                <option value="VERDE AZULADO">Verde Azulado (Fresco)</option>
                                <option value="VERDE PALIDO">Verde Pálido / Blanqueado</option>
                                <option value="AMARILLENTO">Amarillento (Envejecido)</option>
                                <option value="MARRON">Marrón (Sobresecado / Dañado)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-brand-green transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase font-medium opacity-70">Descriptor Visual basado en estándares SCA</p>
                    </div>
                </div>

                <section className="py-4 px-4 md:px-12 rounded-industrial space-y-4 border-y border-white/5 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em]">GRANULOMETRÍA (SIEVE ANALYSIS)</h4>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest ${isScreenValid ? 'bg-brand-green/20 text-brand-green-bright border border-brand-green/30' : 'bg-brand-red/20 text-brand-red-bright border border-brand-red/30 animate-pulse'}`}>
                            {isScreenValid ? '✓ SUMA 100%' : `⚠ DESCUADRE: ${screenSum.toFixed(1)}%`}
                        </div>
                    </div>
                    <div className="space-y-4 md:w-4/5 mx-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[18, 17, 16, 15].map(size => (
                                <NumericInput
                                    key={size}
                                    label={`Malla ${size}`}
                                    value={(formData.screenSize as any)[`size${size}`]}
                                    onChange={(val) => setFormData({
                                        ...formData,
                                        screenSize: { ...formData.screenSize, [`size${size}`]: val }
                                    })}
                                    step={0.1}
                                    disabled={isSubmitting || isAlreadyAnalyzed}
                                    variant="industrial"
                                    inputClassName="text-base py-2"
                                    unit="%"
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[14, 13, 12].map(size => (
                                <NumericInput
                                    key={size}
                                    label={`Malla ${size}`}
                                    value={(formData.screenSize as any)[`size${size}`]}
                                    onChange={(val) => setFormData({
                                        ...formData,
                                        screenSize: { ...formData.screenSize, [`size${size}`]: val }
                                    })}
                                    step={0.1}
                                    disabled={isSubmitting || isAlreadyAnalyzed}
                                    variant="industrial"
                                    inputClassName="text-base py-2"
                                    unit="%"
                                />
                            ))}
                            <NumericInput
                                label="Fondo (-12)"
                                value={formData.screenSize.under12}
                                onChange={(val) => setFormData({
                                    ...formData,
                                    screenSize: { ...formData.screenSize, under12: val }
                                })}
                                step={0.1}
                                disabled={isSubmitting || isAlreadyAnalyzed}
                                variant="industrial"
                                inputClassName="text-base py-2"
                                unit="%"
                            />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <NumericInput
                            label="Defectos Primarios (%)"
                            value={formData.defects.primary}
                            onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, primary: val } })}
                            step={0.01}
                            disabled={isSubmitting || isAlreadyAnalyzed}
                            variant="industrial"
                            inputClassName="text-3xl font-bold py-4"
                            unit="%"
                            className="bg-brand-green/5 p-6 rounded-industrial border border-brand-green/10"
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-medium leading-relaxed px-2">
                            Granos negros, agrios, cereza seca, materia extraña (piedras/palos), daños por hongos.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <NumericInput
                            label="Defectos Secundarios (%)"
                            value={formData.defects.secondary}
                            onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, secondary: val } })}
                            step={0.01}
                            disabled={isSubmitting || isAlreadyAnalyzed}
                            variant="industrial"
                            inputClassName="text-3xl font-bold py-4"
                            unit="%"
                            className="bg-brand-green/5 p-6 rounded-industrial border border-brand-green/10"
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-medium leading-relaxed px-2">
                            Granos picados, quebrados, inmaduros, aplastados, conchas, flotadores, pergamino.
                        </p>
                    </div>
                </section>

                {/* SECCIÓN FISICOQUÍMICA OMITIDA: Los datos de pH, Brix y Fermentación ya fueron capturados en la fase de Ingreso */}

                <button
                    type={isAlreadyAnalyzed ? "button" : "submit"}
                    disabled={isSubmitting || isAlreadyAnalyzed || !isScreenValid}
                    className={`w-full font-bold py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl ${isAlreadyAnalyzed ? 'bg-brand-green/20 text-brand-green border border-brand-green/30 cursor-not-allowed opacity-100' : isScreenValid ? 'bg-brand-green hover:bg-brand-green-bright text-black disabled:opacity-30' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'}`}
                >
                    {isAlreadyAnalyzed ? (
                        <>
                            PROCESO SELLADO Y VERIFICADO
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </>
                    ) : isSubmitting ? (
                        'SINCRONIZANDO LABORATORIO...'
                    ) : (
                        <>
                            GUARDAR ANÁLISIS INTEGRAL Y CONTINUAR
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-1 transition-transform">
                                <path d="M5 12h14M12 5l7 7-7-7" />
                            </svg>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
