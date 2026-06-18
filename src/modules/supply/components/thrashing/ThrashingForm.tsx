'use client';

import React, { useState, useEffect } from 'react';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
import { useLanguage } from '@/shared/context/LanguageContext';
import { supabase } from '@/shared/lib/supabase';
import { processThrashingAction } from '../../actions/thrashing';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import { SieveDistributionTable, SieveData } from '@/shared/components/ui/SieveDistributionTable';
import { useThrashingData } from '@/shared/hooks/useThrashingData';
import EUDRComplianceBadge from '../EUDRComplianceBadge';

interface ThrashingFormProps {
    inventoryId: string;
    parchmentWeight: number;
    onThrashingComplete: () => void;
    user: { 
        email?: string;
        name?: string;
        companyId: string;
        role?: string;
    } | null;
    isReadOnly?: boolean;
}

export default function ThrashingForm({ inventoryId, parchmentWeight, onThrashingComplete, user, isReadOnly }: ThrashingFormProps) {
    const { t } = useLanguage();
    const PROCESS_PARAMS: Record<string, { shrinkageMin: number; shrinkageMax: number; conversion: number; frMin: number; frMax: number }> = {
        'Lavado': { shrinkageMin: 18.0, shrinkageMax: 20.0, conversion: 0.81, frMin: 88, frMax: 94 },
        'Semilavado': { shrinkageMin: 19.0, shrinkageMax: 21.0, conversion: 0.80, frMin: 90, frMax: 96 },
        'Honey': { shrinkageMin: 22.0, shrinkageMax: 24.0, conversion: 0.78, frMin: 95, frMax: 102 },
        'Natural': { shrinkageMin: 28.0, shrinkageMax: 32.0, conversion: 0.70, frMin: 115, frMax: 130 },
        'Sumergido': { shrinkageMin: 21.0, shrinkageMax: 23.0, conversion: 0.79, frMin: 93, frMax: 100 },
        'Anaerobico': { shrinkageMin: 21.0, shrinkageMax: 23.0, conversion: 0.79, frMin: 93, frMax: 100 }
    };

    const [formData, setFormData] = useState({
        excelsoWeight: 0,
        pasillaWeight: 0,
        ciscoWeight: 0,
        processType: 'Lavado',
        humidity: 11.0,
        preparationProtocol: 'EP',
        sortingMethod: 'Máquina Selectora Óptica',
        sieveAnalysis: {
            m18: 50,
            m17: 50,
            m16: 0,
            m15: 0,
            m14: 0,
            m13: 0,
            m12: 0,
            menores: 0
        }
    });

    const [yieldFactor, setYieldFactor] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<{ message: string; type: 'low' | 'high' | 'optimal' } | null>(null);

    const { 
        isLoading, 
        error: fetchError, 
        isAlreadyThrashed, 
        lotDetails, 
        initialFormData 
    } = useThrashingData(inventoryId, user?.companyId);

    useEffect(() => {
        if (initialFormData) {
            setFormData(prev => ({ ...prev, ...initialFormData }));
        }
    }, [initialFormData]);

    useEffect(() => {
        if (fetchError) {
            setError(fetchError);
        }
    }, [fetchError]);

    const [stats, setStats] = useState({
        totalOut: 0,
        almondWeight: 0,
        loss: 0,
        lossPct: 0,
        yieldPct: 0,
        yieldFactor: 0,
        theoreticalAlmond: 0,
        theoreticalLossPct: 0
    });

    useEffect(() => {
        const excelso = Number(formData.excelsoWeight) || 0;
        const pasilla = Number(formData.pasillaWeight) || 0;
        const cisco = Number(formData.ciscoWeight) || 0;

        const almondWeight = excelso + pasilla;
        const totalOut = almondWeight + cisco;
        const loss = Math.max(0, parchmentWeight - totalOut);
        const lossPct = parchmentWeight > 0 ? ((parchmentWeight - almondWeight) / parchmentWeight) * 100 : 0;
        const yieldPct = parchmentWeight > 0 ? (excelso / parchmentWeight) * 100 : 0;
        const factor = excelso > 0 ? (parchmentWeight / excelso) * 70 : 0;

        const params = PROCESS_PARAMS[formData.processType] || PROCESS_PARAMS['Lavado'];
        const theoreticalAlmond = parchmentWeight * params.conversion;
        const theoreticalLossPct = ((params.shrinkageMin + params.shrinkageMax) / 2);

        setStats({
            totalOut,
            almondWeight,
            loss,
            lossPct,
            yieldPct,
            yieldFactor: factor,
            theoreticalAlmond,
            theoreticalLossPct
        });

        if (almondWeight > 10) {
            if (lossPct < params.shrinkageMin) {
                setWarning({
                    message: `ANÁLISIS DE MERMA: Rendimiento Atípico (${lossPct.toFixed(1)}%). Menor al rango histórico esperado. (Posible alta humedad o error de báscula).`,
                    type: 'low'
                });
            } else if (lossPct > params.shrinkageMax) {
                setWarning({
                    message: `ALERTA DE PÉRDIDA: Merma (${lossPct.toFixed(1)}%) superior al rango teórico de control. Verificar pérdida por cascarilla.`,
                    type: 'high'
                });
            } else {
                setWarning({
                    message: `VALIDACIÓN DE CONTROL: Merma (${lossPct.toFixed(1)}%) dentro de los parámetros de estándar ideal para proceso ${formData.processType}.`,
                    type: 'optimal'
                });
            }
        } else {
            setWarning(null);
        }
    }, [formData, parchmentWeight]);

    // Wait! screenSum and isScreenValid are computed inside the SieveDistributionTable but ThrashingForm also uses them?
    // ThrashingForm does not use screenSum for its internal stats! It only used them for the UI block we're deleting.
    // However, wait... does handleSubmit use isScreenValid?
    // Let me check handleSubmit. No, it doesn't block on isScreenValid! Let me just delete screenSum and isScreenValid if they are not used elsewhere.
    // I'll keep them just in case I am wrong, but wait, I can just compute it.
    const screenSum = Object.values(formData.sieveAnalysis).reduce((a, b) => Number(a) + Number(b), 0);
    const isScreenValid = Math.abs(screenSum - 100) < 0.1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await processThrashingAction(
                inventoryId,
                formData.excelsoWeight,
                formData.pasillaWeight,
                formData.ciscoWeight,
                user?.companyId || '',
                formData.processType,
                formData.humidity,
                formData.preparationProtocol,
                formData.sortingMethod,
                {
                    ...lotDetails?.process_data,
                    sieve_analysis: formData.sieveAnalysis
                } as any
            );

            if (!result.success) {
                throw new Error(result.message);
            }

            onThrashingComplete();
        } catch (err: any) {
            setError(err.message);
            console.error("Error en trilla:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto w-full space-y-6 relative overflow-hidden min-h-[300px]">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-md rounded-industrial">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                        <p className="text-[11px] font-bold uppercase text-brand-navy animate-pulse">{t('thrashingForm', 'recuperando') || 'Loading milling data...'}</p>
                    </div>
                </div>
            )}
            
            <EUDRComplianceBadge lotData={lotDetails} className="mb-2" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="space-y-0.5">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'processType')}</label>
                    <div className="relative group/select">
                        <select
                            value={formData.processType}
                            onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                            className="w-full h-[30px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 focus:border-black outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.5rem_center] bg-no-repeat"
                        >
                            <option value="Lavado">LAVADO (18-20%)</option>
                            <option value="Semilavado">SEMILAVADO (19-21%)</option>
                            <option value="Honey">HONEY (22-24%)</option>
                            <option value="Natural">NATURAL (28-32%)</option>
                            <option value="Sumergido">SUMERGIDO (21-23%)</option>
                            <option value="Anaerobico">ANAERÓBICO (21-23%)</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'initialWeight')}</label>
                    <div className="w-full h-[30px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 text-xs font-bold text-brand-navy flex justify-between items-center shadow-inner transition-all">
                        <span>{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                        <span className="text-[9px] opacity-60 uppercase font-black ">Parchment</span>
                    </div>
                </div>
                <NumericInput
                    label={t('thrashingForm', 'humidity')}
                    value={formData.humidity}
                    onChange={(val) => setFormData({ ...formData, humidity: val })}
                    step={0.1}
                    disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                    variant={formData.humidity >= 10 && formData.humidity <= 11.5 ? 'industrial' : 'default'}
                    inputClassName="text-xs !h-[30px] font-bold uppercase"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-2">
                <div className="space-y-0.5">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'preparationProtocol')}</label>
                    <div className="relative group/select">
                        <select
                            value={formData.preparationProtocol}
                            onChange={(e) => setFormData({ ...formData, preparationProtocol: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                            className="w-full h-[30px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 focus:border-black outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.5rem_center] bg-no-repeat"
                        >
                            <option value="EP">European Prep (EP) - Especialidad</option>
                            <option value="American">American Prep - Comercial Plus</option>
                            <option value="Zero Defect">Zero Defect - Microlote Oro</option>
                            <option value="Supremo">Supremo - Malla 17/18</option>
                            <option value="UGQ">UGQ - Estándar FNC</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-0.5">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'sortingMethod')}</label>
                    <div className="relative group/select">
                        <select
                            value={formData.sortingMethod}
                            onChange={(e) => setFormData({ ...formData, sortingMethod: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                            className="w-full h-[30px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 focus:border-black outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.5rem_center] bg-no-repeat shadow-sm"
                        >
                            <option value="Máquina Selectora Óptica">Máquina Selectora Óptica</option>
                            <option value="Manual (Hand-Sorted)">Manual (Hand-Sorted)</option>
                            <option value="Mixto (Óptica + Repaso Manual)">Mixto (Óptica + Repaso Manual)</option>
                            <option value="Solo Densimétrica">Solo Densimétrica</option>
                        </select>
                    </div>
                </div>
            </div>

            <SieveDistributionTable 
                data={formData.sieveAnalysis}
                onChange={(newData: SieveData) => setFormData({ ...formData, sieveAnalysis: newData })}
                isReadOnly={isReadOnly || isAlreadyThrashed}
                isSubmitting={isSubmitting}
                showSyncButton={false}
            />

            {/* Output Automático: Proyección */}
            <div className="p-4 bg-white border border-gray-400 shadow-sm rounded-industrial-sm flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-brand-navy-bright uppercase ">{t('thrashingForm', 'expectedAlmond')}</span>
                    <span className="text-[9px] text-brand-navy uppercase">({t('thrashingForm', 'conversionTip')} {PROCESS_PARAMS[formData.processType]?.conversion})</span>
                </div>
                <span className="text-2xl font-bold text-brand-navy-bright font-mono animate-pulse">
                    ≈ {stats.theoreticalAlmond.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 border-t border-gray-400 shadow-sm pt-6">
                {error && (
                    <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl text-brand-red-bright text-[11px] font-bold uppercase">
                        {error}
                    </div>
                )}

                {warning && (
                    <div className={`p-4 border rounded-xl text-[11px] font-bold uppercase animate-bounce-subtle ${warning.type === 'optimal'
                        ? 'bg-white border-gray-400 shadow-sm text-brand-navy-bright'
                        : 'bg-white border-gray-400 shadow-sm text-brand-navy-bright'
                        }`}>
                        {warning.type !== 'optimal' ? 'ℹ️' : '✅'} {warning.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumericInput
                        label="Peso Excelso (Almendra)"
                        value={formData.excelsoWeight}
                        onChange={(val) => setFormData({ ...formData, excelsoWeight: val })}
                        step={0.1}
                        unit="KG"
                        required
                        disabled={isSubmitting || isAlreadyThrashed}
                        variant="industrial"
                        inputClassName="text-xs !h-[30px] font-bold uppercase"
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Pasilla (Consumo)"
                        value={formData.pasillaWeight}
                        onChange={(val) => setFormData({ ...formData, pasillaWeight: val })}
                        step={0.1}
                        unit="KG"
                        disabled={isSubmitting || isAlreadyThrashed}
                        variant="industrial"
                        inputClassName="text-xs !h-[30px] font-bold uppercase"
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Cisco/Cascarilla"
                        value={formData.ciscoWeight}
                        onChange={(val) => setFormData({ ...formData, ciscoWeight: val })}
                        step={0.1}
                        unit="KG"
                        disabled={isSubmitting || isAlreadyThrashed}
                        variant="industrial"
                        inputClassName="text-xs !h-[30px] opacity-60 font-bold uppercase"
                        formatThousands={true}
                    />
                </div>

                {stats.yieldFactor > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={`p-8 rounded-industrial border flex flex-col items-center justify-center transition-all animate-in zoom-in duration-500 ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-white border-black shadow-[0_0_30px_rgba(0,223,154,0.15)]' : 'bg-white border-gray-400 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[11px] font-bold uppercase  ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-navy/70' : 'text-brand-navy'}`}>{t('thrashingForm', 'yieldFactor')}</span>
                            </div>
                            <span className={`text-7xl font-bold font-mono er ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-navy-bright' : 'text-brand-navy-bright'}`}>
                                {stats.yieldFactor.toFixed(2)}
                            </span>
                            <div className="mt-4 flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-brand-green-bright animate-pulse' : 'bg-brand-green/80'}`}></div>
                                <p className={`text-[11px] uppercase font-bold  ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-navy' : 'text-brand-navy'}`}>
                                    {t('thrashingForm', 'target')} {formData.processType}: {PROCESS_PARAMS[formData.processType]?.frMin}-{PROCESS_PARAMS[formData.processType]?.frMax}
                                </p>
                            </div>
                            <div className="mt-6 text-[11px] text-brand-navy leading-relaxed text-center px-4">
                                {stats.yieldFactor < (PROCESS_PARAMS[formData.processType]?.frMin || 88) ? (
                                    <span className="text-brand-navy-bright font-bold  block mb-1">¡ALTA CALIDAD (Bonificable)!</span>
                                ) : stats.yieldFactor > (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? (
                                    <span className="text-red-400 font-bold  block mb-1">BAJA CALIDAD (Posible Descuento)</span>
                                ) : (
                                    <span className="text-brand-navy font-bold  block mb-1">CALIDAD ESTÁNDAR DENTRO DE META</span>
                                )}
                                {t('thrashingForm', 'yieldTip')}<strong className="text-brand-navy">menos</strong> materia prima para obtener 70kg de excelso, lo que representa mayor rentabilidad.
                            </div>
                        </div>

                        {/* Reporte de Eficiencia */}
                        <div className="bg-white border border-gray-400 shadow-sm p-6 rounded-industrial space-y-4 relative group overflow-hidden">
                            <h4 className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                                {t('thrashingForm', 'efficiencyReport')}
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[11px] uppercase">
                                    <span className="text-brand-navy">{t('thrashingForm', 'inputMass')}</span>
                                    <span className="text-brand-navy font-mono">{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] uppercase">
                                    <span className="text-brand-navy">{t('thrashingForm', 'outputMass')}</span>
                                    <span className={`font-mono font-bold ${stats.almondWeight >= stats.theoreticalAlmond ? 'text-brand-navy-bright' : 'text-brand-navy-bright'}`}>
                                        {stats.almondWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] uppercase border-t border-gray-400 shadow-sm pt-2">
                                    <span className="text-brand-navy">{t('thrashingForm', 'realLoss')}</span>
                                    <span className={`font-mono font-bold ${warning ? 'text-brand-navy-bright' : 'text-brand-navy'}`}>
                                        {stats.lossPct.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] uppercase">
                                    <span className="text-brand-navy">{t('thrashingForm', 'theoreticalLoss')}</span>
                                    <span className="text-brand-navy font-mono">
                                        {PROCESS_PARAMS[formData.processType]?.shrinkageMin}-{PROCESS_PARAMS[formData.processType]?.shrinkageMax}%
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-gray-400 shadow-sm">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${warning ? 'bg-brand-green/80' : 'bg-brand-green shadow-[0_0_10px_rgba(0,223,154,0.5)]'}`}
                                            style={{ width: `${Math.min(100, (stats.lossPct / stats.theoreticalLossPct) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="grid grid-cols-3 items-center pt-6 border-t border-gray-400 relative z-20 mt-6">
                    <div></div>
                    <div className="flex justify-center w-full">
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.excelsoWeight || isAlreadyThrashed || isReadOnly}
                            className="w-full font-bold py-2.5 rounded-industrial-sm transition-all flex items-center justify-center gap-2 group uppercase text-[11px] shadow-sm bg-brand-green text-white hover:bg-opacity-90 disabled:opacity-50 border border-brand-green"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    SINCRONIZANDO...
                                </div>
                            ) : isAlreadyThrashed ? (
                                <>
                                    {t('thrashingForm', 'sealing')}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </>
                            ) : (
                                <>
                                    {t('thrashingForm', 'submit') || 'GUARDAR DATOS'}
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
