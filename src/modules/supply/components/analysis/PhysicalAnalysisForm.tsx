'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { submitPhysicalAnalysis } from '../../actions/analysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import EUDRComplianceBadge from '../EUDRComplianceBadge';
import { useLanguage } from '@/shared/context/LanguageContext';

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
    const { t } = useLanguage();
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
        <div className="bg-transparent p-0 animate-in fade-in duration-700 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/80 backdrop-blur-md rounded-[2rem]">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-400 shadow-sm rounded-full"></div>
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-[11px] font-bold uppercase  text-brand-navy-bright animate-pulse">Sincronizando Laboratorio AXIS...</p>
                    </div>
                </div>
            )}

            

            <div className="mb-4">
                <EUDRComplianceBadge lotData={lotDetails} />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-red-500 text-[11px] font-bold uppercase  flex items-center gap-4 animate-in slide-in-from-top-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>ERROR CRÍTICO: {error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative z-10">
                {/* 1. Métrica Base (High Impact) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <NumericInput
                            label={t('physicalAnalysisForm', 'moisture')}
                            value={formData.moisture}
                            onChange={(val) => setFormData({ ...formData, moisture: val })}
                            step={0.01}
                            disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                            variant="industrial"
                            inputClassName="h-[30px] px-3 py-1 text-xs font-bold text-brand-navy bg-white border border-gray-400 shadow-sm rounded-industrial-sm"
                            unit="%"
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-brand-navy ">{t('physicalAnalysisForm', 'moistureRange')}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${formData.moisture >= 10 && formData.moisture <= 12 ? 'bg-brand-green' : 'bg-black animate-pulse'}`}></div>
                        </div>
                    </div>

                    <div>
                        <NumericInput
                            label={t('physicalAnalysisForm', 'waterActivity')}
                            value={formData.waterActivity}
                            onChange={(val) => setFormData({ ...formData, waterActivity: val })}
                            step={0.001}
                            disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                            variant="industrial"
                            inputClassName="h-[30px] px-3 py-1 text-xs font-bold text-brand-navy bg-white border border-gray-400 shadow-sm rounded-industrial-sm"
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-brand-navy ">{t('physicalAnalysisForm', 'waterActivityRange')}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${formData.waterActivity <= 0.7 ? 'bg-brand-green' : 'bg-black animate-pulse'}`}></div>
                        </div>
                    </div>

                    <div>
                        <NumericInput
                            label={t('physicalAnalysisForm', 'density')}
                            value={formData.density}
                            onChange={(val) => setFormData({ ...formData, density: val })}
                            step={1}
                            disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                            variant="industrial"
                            inputClassName="h-[30px] px-3 py-1 text-xs font-bold text-brand-navy bg-white border border-gray-400 shadow-sm rounded-industrial-sm"
                            unit="g/L"
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-brand-navy ">Standard: {'>'} 680 g/L</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${formData.density > 680 ? 'bg-brand-green' : 'bg-yellow-500'}`}></div>
                        </div>
                    </div>
                </div>

                {/* 2. Granulometría (Sieve Instrument) */}
                <div className="mt-4 pt-4 border-t border-gray-400 shadow-sm space-y-4 relative z-10">
                    <div className="flex justify-between items-end border-b border-gray-400 shadow-sm pb-2">
                        <h4 className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                            {t('physicalAnalysisForm', 'sieveTitle')}
                        </h4>
                        <div className={`flex items-center gap-2 text-brand-navy`}>
                            <span className="text-[9px] font-bold uppercase opacity-60">{t('physicalAnalysisForm', 'massBalance')}:</span>
                            <span className="text-sm font-black er leading-none">{screenSum.toFixed(1)}%</span>
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
                                    className="px-2 py-1 bg-black text-white rounded-industrial-sm hover:bg-black/80 transition-all flex items-center gap-1 text-[8px] font-bold uppercase shadow-sm ml-1"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
                                    SYNC
                                </button>
                            )}
                            {!isScreenValid && <span className="text-[9px] font-bold uppercase text-red-500 ml-2">{t('physicalAnalysisForm', 'adjustRequired')} (Δ {Math.abs(100 - screenSum).toFixed(1)}%)</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                        {[18, 17, 16, 15, 14, 13, 12, 'under12'].map((size, idx) => (
                            <div key={idx} className="space-y-1">
                                <label className="text-[9px] font-bold text-brand-navy uppercase block text-center">
                                    {size === 'under12' ? 'Fondo' : `Malla ${size}`}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={(formData.screenSize as any)[size === 'under12' ? 'under12' : `size${size}`]}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            screenSize: { ...formData.screenSize, [size === 'under12' ? 'under12' : `size${size}`]: parseFloat(e.target.value) || 0 }
                                        })}
                                        disabled={isSubmitting || isAlreadyAnalyzed}
                                        className="w-full h-[30px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-2 py-1 text-xs font-bold text-brand-navy text-center outline-none focus:border-black transition-all appearance-none"
                                    />
                                    <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[8px] font-black text-gray-500 uppercase">%</span>
                                </div>
                                <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                                    <div 
                                        className="h-full bg-brand-green transition-all duration-700" 
                                        style={{ width: `${(formData.screenSize as any)[size === 'under12' ? 'under12' : `size${size}`]}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Defectos & Color (Visual Analysis) */}
                <div className="mt-4 pt-4 border-t border-gray-400 shadow-sm space-y-4 relative z-10">
                    <h4 className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                        Visual Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <NumericInput
                                label={t('physicalAnalysisForm', 'primaryDefects')}
                                value={formData.defects.primary}
                                onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, primary: val } })}
                                step={0.01}
                                disabled={isSubmitting || isAlreadyAnalyzed}
                                variant="industrial"
                                inputClassName="h-[30px] px-3 py-1 text-xs font-bold text-brand-navy bg-white border border-gray-400 shadow-sm rounded-industrial-sm"
                                unit="PTS"
                            />
                        </div>
                        <div>
                            <NumericInput
                                label={t('physicalAnalysisForm', 'secondaryDefects')}
                                value={formData.defects.secondary}
                                onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, secondary: val } })}
                                step={0.01}
                                disabled={isSubmitting || isAlreadyAnalyzed}
                                variant="industrial"
                                inputClassName="h-[30px] px-3 py-1 text-xs font-bold text-brand-navy bg-white border border-gray-400 shadow-sm rounded-industrial-sm"
                                unit="PTS"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">{t('physicalAnalysisForm', 'colorDescriptor')}</label>
                            <select
                                value={formData.grainColor}
                                disabled={isSubmitting || isAlreadyAnalyzed || isReadOnly}
                                className="w-full h-[30px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 py-1.5 text-xs font-bold text-brand-navy outline-none focus:border-black uppercase appearance-none transition-all shadow-inner bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.5rem_center] bg-no-repeat"
                                onChange={(e) => setFormData({ ...formData, grainColor: e.target.value })}
                            >
                                <option value="VERDE OLIVA">Verde Oliva (Optimum)</option>
                                <option value="VERDE AZULADO">Verde Azulado (High Fresh)</option>
                                <option value="VERDE PALIDO">Verde Pálido (Standard)</option>
                                <option value="AMARILLENTO">Amarillento (Aging)</option>
                                <option value="MARRON">Marrón (Damaged)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="grid grid-cols-3 items-center pt-6 border-t border-gray-400 relative z-20 mt-6">
                    <div></div>
                    <div className="flex justify-center w-full">
                        <button
                            type={isAlreadyAnalyzed || isReadOnly ? "button" : "submit"}
                            disabled={isSubmitting || isAlreadyAnalyzed || !isScreenValid || isReadOnly}
                            className={`w-full font-bold py-2.5 rounded-industrial-sm transition-all flex items-center justify-center gap-2 group uppercase text-[11px] shadow-sm ${
                                isAlreadyAnalyzed 
                                ? 'bg-white text-brand-navy border border-gray-400 shadow-sm cursor-default' 
                                : isReadOnly 
                                ? 'bg-white text-brand-navy border border-gray-400 shadow-sm cursor-not-allowed' 
                                : isScreenValid 
                                ? 'bg-brand-green hover:bg-opacity-90 text-white border border-brand-green shadow-sm' 
                                : 'bg-white text-brand-navy cursor-not-allowed border border-gray-400 shadow-sm opacity-50'
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>SINCRONIZANDO...</span>
                                </div>
                            ) : isAlreadyAnalyzed ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <span>{t('physicalAnalysisForm', 'analyzed')}</span>
                                </>
                            ) : !isScreenValid ? (
                                <>
                                    <span>{t('physicalAnalysisForm', 'correctSieve')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('physicalAnalysisForm', 'submit')}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                    <div></div>
                </div>
            </form>
        </div>

    );
}
