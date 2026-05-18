'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { submitPhysicalAnalysis } from '../../actions/analysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import EUDRComplianceBadge from '../EUDRComplianceBadge';

interface PhysicalAnalysisFormProps {
    inventoryId: string;
    lotDestination?: string;
    onAnalysisComplete: () => void;
    user: { 
        email?: string;
        name?: string;
        companyId: string;
        role?: string;
    } | null;
    isReadOnly?: boolean;
}

export default function PhysicalAnalysisForm({ inventoryId, lotDestination = 'internal', onAnalysisComplete, user, isReadOnly }: PhysicalAnalysisFormProps) {
    const [formData, setFormData] = useState({
        moisture: 11.5,
        waterActivity: 0.58,
        density: 720,
        screenSize: {
            size18: 0,
            size17: 0,
            size16: 0,
            size15: 0,
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
            console.log("AXIS DEBUG: fetchAnalysis starting for ID ->", inventoryId);
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
                    
                    // Pre-fill screen size from thrashing data if not already analyzed or if analyzed but empty (defaults)
                    if (pd?.sieve_analysis) {
                        const sa = pd.sieve_analysis;
                        setFormData(prev => {
                            const currentValues = Object.values(prev.screenSize);
                            const isCurrentlyEmpty = currentValues.length === 0 || currentValues.every(v => Number(v) === 0);
                            
                            // If we already have data in the form, don't overwrite it automatically
                            if (!isCurrentlyEmpty) {
                                console.log("AXIS SYNC: Form already has data, skipping automatic sync.");
                                return prev;
                            }

                            console.log("AXIS SYNC: Pulling sieve analysis from Trilla ->", sa);
                            return {
                                ...prev,
                                screenSize: {
                                    size18: Number(sa.m18) || 0,
                                    size17: Number(sa.m17) || 0,
                                    size16: Number(sa.m16) || 0,
                                    size15: Number(sa.m15) || 0,
                                    size14: Number(sa.caracol) || 0,
                                    size13: 0,
                                    size12: 0,
                                    under12: Number(sa.menores) || 0
                                }
                            };
                        });
                    } else {
                        console.log("AXIS SYNC: No sieve analysis found in Trilla data for this lot.");
                    }

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
        <div className="bg-transparent p-0 space-y-10 animate-in fade-in duration-700 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/80 backdrop-blur-md rounded-[2rem]">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-400 shadow-sm rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-[11px] font-bold uppercase  text-black-bright animate-pulse">Sincronizando Laboratorio AXIS...</p>
                    </div>
                </div>
            )}

            

            <EUDRComplianceBadge lotData={lotDetails} className="mb-6" />

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-red-500 text-[11px] font-bold uppercase  flex items-center gap-4 animate-in slide-in-from-top-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>ERROR CRÍTICO: {error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* 1. Métrica Base (High Impact) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white border border-gray-400 shadow-sm p-8 rounded-[2rem] group hover:border-gray-400 shadow-sm transition-all shadow-inner">
                        <NumericInput
                            label="Humedad (%)"
                            value={formData.moisture}
                            onChange={(val) => setFormData({ ...formData, moisture: val })}
                            step={0.01}
                            disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                            variant="industrial"
                            inputClassName="text-5xl font-black py-6 er"
                            unit="%"
                        />
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-gray-900 ">Rango Ideal: 10.0 - 12.0%</span>
                            <div className={`w-2 h-2 rounded-full ${formData.moisture >= 10 && formData.moisture <= 12 ? 'bg-brand-green shadow-[0_0_10px_rgba(0,223,154,0.5)]' : 'bg-black animate-pulse'}`}></div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-400 shadow-sm p-8 rounded-[2rem] group hover:border-gray-400 shadow-sm transition-all shadow-inner">
                        <NumericInput
                            label="Actividad de Agua (aw)"
                            value={formData.waterActivity}
                            onChange={(val) => setFormData({ ...formData, waterActivity: val })}
                            step={0.001}
                            disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                            variant="industrial"
                            inputClassName="text-5xl font-black py-6 er"
                        />
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-gray-900 ">Norma Export: ≤ 0.70</span>
                            <div className={`w-2 h-2 rounded-full ${formData.waterActivity <= 0.7 ? 'bg-brand-green shadow-[0_0_10px_rgba(0,223,154,0.5)]' : 'bg-black animate-pulse'}`}></div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-400 shadow-sm p-8 rounded-[2rem] group hover:border-gray-400 shadow-sm transition-all shadow-inner">
                        <NumericInput
                            label="Densidad (g/L)"
                            value={formData.density}
                            onChange={(val) => setFormData({ ...formData, density: val })}
                            step={1}
                            disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                            variant="industrial"
                            inputClassName="text-5xl font-black py-6 er"
                            unit="g/L"
                        />
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-gray-900 ">Standard: {'>'} 680 g/L</span>
                            <div className={`w-2 h-2 rounded-full ${formData.density > 680 ? 'bg-brand-green shadow-[0_0_10px_rgba(0,223,154,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`}></div>
                        </div>
                    </div>
                </div>

                {/* 2. Granulometría (Sieve Instrument) */}
                <section className="bg-black/20 border border-gray-400 shadow-sm p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-400 shadow-sm pb-6">
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-bold text-black-bright uppercase ">Instrumento: Granulometría</h4>
                            <p className="text-xl font-bold text-black ">Sieve Distribution Profile</p>
                        </div>
                        <div className={`flex flex-col items-end gap-1 text-black`}>
                            <span className="text-[9px] font-bold uppercase opacity-60">Balance de Masa</span>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-black er leading-none">{screenSum.toFixed(1)}%</span>
                                {!isReadOnly && !isAlreadyAnalyzed && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (lotDetails?.process_data?.sieve_analysis) {
                                                const sa = lotDetails.process_data.sieve_analysis;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    screenSize: {
                                                        size18: Number(sa.m18) || 0,
                                                        size17: Number(sa.m17) || 0,
                                                        size16: Number(sa.m16) || 0,
                                                        size15: Number(sa.m15) || 0,
                                                        size14: Number(sa.caracol) || 0,
                                                        size13: 0,
                                                        size12: 0,
                                                        under12: Number(sa.menores) || 0
                                                    }
                                                }));
                                            }
                                        }}
                                        className="p-2 bg-black text-white rounded-lg hover:bg-black/80 transition-all flex items-center gap-2 text-[8px] font-bold uppercase animate-pulse shadow-lg"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
                                        Sincronizar Trilla
                                    </button>
                                )}
                            </div>
                            {!isScreenValid && <span className="text-[9px] font-bold uppercase">Ajuste Requerido (Δ {Math.abs(100 - screenSum).toFixed(1)}%)</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {[18, 17, 16, 15, 14, 13, 12, 'under12'].map((size, idx) => (
                            <div key={idx} className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-900 uppercase  block text-center">
                                    {size === 'under12' ? 'Fondo' : `Malla ${size}`}
                                </label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={(formData.screenSize as any)[size === 'under12' ? 'under12' : `size${size}`]}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            screenSize: { ...formData.screenSize, [size === 'under12' ? 'under12' : `size${size}`]: parseFloat(e.target.value) || 0 }
                                        })}
                                        disabled={isSubmitting || isAlreadyAnalyzed}
                                        className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-xl px-2 py-4 text-lg font-black text-carbon text-center outline-none focus:border-black focus:bg-white transition-all appearance-none"
                                    />
                                    <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-600 uppercase">%</span>
                                </div>
                                <div className="h-1 bg-white rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-brand-green transition-all duration-700" 
                                        style={{ width: `${(formData.screenSize as any)[size === 'under12' ? 'under12' : `size${size}`]}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Defectos & Color (Visual Analysis) */}
                <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
                    <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-400 shadow-sm p-10 rounded-[2.5rem]">
                        <div className="space-y-4">
                            <NumericInput
                                label="Defectos Primarios"
                                value={formData.defects.primary}
                                onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, primary: val } })}
                                step={0.01}
                                disabled={isSubmitting || isAlreadyAnalyzed}
                                variant="industrial"
                                inputClassName="text-4xl font-black py-4 text-black"
                                unit="PTS"
                            />
                            <p className="text-[9px] text-gray-900 font-bold uppercase  leading-relaxed">Granos negros, agrios, materia extraña, hongos.</p>
                        </div>
                        <div className="space-y-4">
                            <NumericInput
                                label="Defectos Secundarios"
                                value={formData.defects.secondary}
                                onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, secondary: val } })}
                                step={0.01}
                                disabled={isSubmitting || isAlreadyAnalyzed}
                                variant="industrial"
                                inputClassName="text-4xl font-black py-4 text-black"
                                unit="PTS"
                            />
                            <p className="text-[9px] text-gray-900 font-bold uppercase  leading-relaxed">Quebrados, inmaduros, picados, pergaminos.</p>
                        </div>
                    </div>

                    <div className="md:col-span-4 bg-white border border-gray-400 shadow-sm p-10 rounded-[2.5rem] flex flex-col justify-center gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-black uppercase  block">Descriptor Visual: Color</label>
                            <div className="relative group">
                                <select
                                    value={formData.grainColor}
                                    disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                                    className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-2xl px-6 py-5 text-sm font-black text-carbon outline-none focus:border-black uppercase appearance-none transition-all shadow-inner"
                                    onChange={(e) => setFormData({ ...formData, grainColor: e.target.value })}
                                >
                                    <option value="VERDE OLIVA">Verde Oliva (Optimum)</option>
                                    <option value="VERDE AZULADO">Verde Azulado (High Fresh)</option>
                                    <option value="VERDE PALIDO">Verde Pálido (Standard)</option>
                                    <option value="AMARILLENTO">Amarillento (Aging)</option>
                                    <option value="MARRON">Marrón (Damaged)</option>
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-gray-400 shadow-sm">
                            <div className={`w-12 h-12 rounded-lg shadow-inner ${
                                formData.grainColor === 'VERDE OLIVA' ? 'bg-[#4B5320]' : 
                                formData.grainColor === 'VERDE AZULADO' ? 'bg-[#008080]' :
                                formData.grainColor === 'VERDE PALIDO' ? 'bg-[#8FBC8F]' :
                                formData.grainColor === 'AMARILLENTO' ? 'bg-[#F0E68C]' : 'bg-[#8B4513]'
                            }`}></div>
                            <div className="flex-1">
                                <p className="text-[9px] font-bold text-black uppercase ">Previsualización Cromática</p>
                                <p className="text-[9px] text-gray-900 uppercase mt-0.5">Basado en Patrones SCA Agtron</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-8 border-t border-gray-400 shadow-sm">
                    <button
                        type={isAlreadyAnalyzed || isReadOnly ? "button" : "submit"}
                        disabled={isSubmitting || isAlreadyAnalyzed || !isScreenValid || isReadOnly}
                        className={`w-full font-black py-8 rounded-[2rem] transition-all flex items-center justify-center gap-6 group uppercase  text-sm shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
                            isAlreadyAnalyzed 
                            ? 'bg-white text-black border border-gray-400 shadow-sm cursor-default' 
                            : isReadOnly 
                            ? 'bg-white text-gray-900 border border-gray-400 shadow-sm cursor-not-allowed' 
                            : isScreenValid 
                            ? 'bg-brand-green hover:bg-brand-green-bright text-black shadow-brand-green/20 hover:shadow-brand-green/40' 
                            : 'bg-white text-gray-900 cursor-not-allowed border border-gray-400 shadow-sm opacity-50'
                        }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-4">
                                <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                                <span>Firmando Digitalmente en AXIS Cloud...</span>
                            </div>
                        ) : isAlreadyAnalyzed ? (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <span>REGISTRO LAB INMUTABLE Y VERIFICADO</span>
                            </>
                        ) : !isScreenValid ? (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <span>CORREGIR BALANCE DE GRANULOMETRÍA</span>
                            </>
                        ) : (
                            <>
                                <span>SELLAR ANÁLISIS FÍSICO</span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-2 transition-transform">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </>
                        )}
                    </button>
                    <p className="text-center text-[9px] text-gray-900 uppercase font-black  mt-8 opacity-40">
                        AXISONE COFFEE • DATA SOVEREIGNTY • CERTIFIED HUB
                    </p>
                </div>
            </form>
        </div>

    );
}
