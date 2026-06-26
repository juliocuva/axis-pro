'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { submitPhysicalAnalysis } from '../../actions/analysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import { SieveDistributionTable, SieveData } from '@/shared/components/ui/SieveDistributionTable';
import { usePhysicalAnalysisData } from '@/shared/hooks/usePhysicalAnalysisData';
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
        sieveAnalysis: {
            m18: 0,
            m17: 0,
            m16: 0,
            m15: 0,
            m14: 0,
            m13: 0,
            m12: 0,
            menores: 0
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

    const { 
        isLoading, 
        error: fetchError, 
        isAlreadyAnalyzed, 
        lotDetails, 
        initialFormData, 
        initialPhysicochemicalData,
        millSievesAnalyzed
    } = usePhysicalAnalysisData(inventoryId, user?.companyId);

    useEffect(() => {
        if (initialFormData) {
            setFormData(prev => ({ ...prev, ...initialFormData }));
        }
    }, [initialFormData]);

    useEffect(() => {
        if (initialPhysicochemicalData) {
            setPhysicochemicalData(prev => ({ ...prev, ...initialPhysicochemicalData }));
        }
    }, [initialPhysicochemicalData]);

    useEffect(() => {
        if (fetchError) {
            setError(fetchError);
        }
    }, [fetchError]);

    const screenSum = Object.values(formData.sieveAnalysis).reduce((a, b) => Number(a) + Number(b), 0);
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
        <div className="max-w-5xl mx-auto w-full bg-transparent p-0 animate-in fade-in duration-700 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            
            {isLoading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent pointer-events-none gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-green rounded-full animate-spin"></div>
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
                            disabled={isSubmitting || isReadOnly}
                            variant="industrial"
                            inputClassName="text-xs !h-[30px] font-bold uppercase"
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
                            disabled={isSubmitting || isReadOnly}
                            variant="industrial"
                            inputClassName="text-xs !h-[30px] font-bold uppercase"
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
                            disabled={isSubmitting || isReadOnly}
                            variant="industrial"
                            inputClassName="text-xs !h-[30px] font-bold uppercase"
                            unit="g/L"
                        />
                        <div className="mt-1 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-brand-navy ">Standard: {'>'} 680 g/L</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${formData.density > 680 ? 'bg-brand-green' : 'bg-yellow-500'}`}></div>
                        </div>
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
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-xs !h-[30px] font-bold uppercase"
                                unit="PTS"
                            />
                        </div>
                        <div>
                            <NumericInput
                                label={t('physicalAnalysisForm', 'secondaryDefects')}
                                value={formData.defects.secondary}
                                onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, secondary: val } })}
                                step={0.01}
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-xs !h-[30px] font-bold uppercase"
                                unit="PTS"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-brand-navy uppercase mb-1 block">{t('physicalAnalysisForm', 'colorDescriptor')}</label>
                            <select
                                value={formData.grainColor}
                                disabled={isSubmitting || isReadOnly}
                                className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat"
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
                            type={isReadOnly ? "button" : "submit"}
                            disabled={isSubmitting || !isScreenValid || isReadOnly}
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
                            ) : false ? (
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
