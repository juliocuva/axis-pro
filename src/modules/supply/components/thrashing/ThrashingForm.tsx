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
    inventoryId?: string;
    parchmentWeight: number;
    onThrashingComplete: () => void;
    user: { 
        email?: string;
        name?: string;
        companyId: string;
        role?: string;
    } | null;
    isReadOnly?: boolean;
    isPublic?: boolean;
    onPublicSubmit?: (data: any) => void;
    onChangeParchmentWeight?: (val: number) => void;
}

export default function ThrashingForm({ 
    inventoryId, 
    parchmentWeight, 
    onThrashingComplete, 
    user, 
    isReadOnly,
    isPublic,
    onPublicSubmit,
    onChangeParchmentWeight
}: ThrashingFormProps) {
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
                    message: `RENDIMIENTO ATÍPICO (POSIBLE ERROR)`,
                    type: 'low'
                });
            } else if (lossPct > params.shrinkageMax) {
                setWarning({
                    message: `ALERTA: EXCESO DE MERMA`,
                    type: 'high'
                });
            } else {
                setWarning({
                    message: `RENDIMIENTO ÓPTIMO (EN PARÁMETROS)`,
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
        
        if (isPublic && onPublicSubmit) {
            onPublicSubmit({
                excelsoWeight: formData.excelsoWeight,
                pasillaWeight: formData.pasillaWeight,
                ciscoWeight: formData.ciscoWeight,
                processType: formData.processType,
                humidity: formData.humidity,
                preparationProtocol: formData.preparationProtocol,
                sortingMethod: formData.sortingMethod,
                sieveAnalysis: formData.sieveAnalysis,
                stats
            });
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (!inventoryId) throw new Error("No inventory ID provided");
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
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent pointer-events-none gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-green rounded-full animate-spin"></div>
                    <p className="text-[11px] font-bold uppercase text-brand-navy animate-pulse">{t('thrashingForm', 'recuperando') || 'Loading milling data...'}</p>
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
                            disabled={isSubmitting || isReadOnly}
                            className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat"
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
                {isPublic ? (
                    <NumericInput
                        label={t('thrashingForm', 'initialWeight')}
                        value={parchmentWeight}
                        onChange={(val) => onChangeParchmentWeight?.(val)}
                        step={0.1}
                        unit="KG"
                        disabled={isSubmitting || isReadOnly}
                        inputClassName="text-xs !h-[30px] font-bold uppercase"
                        formatThousands={true}
                    />
                ) : (
                    <div className="space-y-0.5">
                        <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'initialWeight')}</label>
                        <div className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 text-xs font-bold text-brand-navy flex justify-between items-center transition-all">
                            <span>{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                            <span className="text-[9px] opacity-60 uppercase font-black ">Parchment</span>
                        </div>
                    </div>
                )}
                <NumericInput
                    label={t('thrashingForm', 'humidity')}
                    value={formData.humidity}
                    onChange={(val) => setFormData({ ...formData, humidity: val })}
                    step={0.1}
                    disabled={isSubmitting || isReadOnly}
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
                            disabled={isSubmitting || isReadOnly}
                            className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat"
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
                            disabled={isSubmitting || isReadOnly}
                            className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat"
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
                isReadOnly={isReadOnly}
                isSubmitting={isSubmitting}
                showSyncButton={false}
            />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 border-t border-gray-400 shadow-sm pt-6 mt-6">
                {error && (
                    <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl text-brand-red-bright text-[11px] font-bold uppercase">
                        {error}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
                        variant="industrial"
                        inputClassName="text-xs !h-[30px] opacity-60 font-bold uppercase"
                        formatThousands={true}
                    />
                </div>



                {stats.yieldFactor > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:divide-x lg:divide-zinc-200 pt-8 mt-8 border-t-2 border-brand-green/30">
                        <div className="py-4 flex flex-col items-center justify-center transition-all animate-in zoom-in duration-500 bg-transparent">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[11px] font-bold uppercase text-brand-navy/80`}>{t('thrashingForm', 'yieldFactor')}</span>
                            </div>
                            <span className={`text-2xl font-bold font-mono text-brand-navy-bright`}>
                                {stats.yieldFactor.toFixed(2)}
                            </span>
                            <div className="mt-4 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-emerald-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
                                <p className={`text-[11px] uppercase font-bold text-brand-navy/80`}>
                                    {t('thrashingForm', 'target')} {formData.processType}: {PROCESS_PARAMS[formData.processType]?.frMin}-{PROCESS_PARAMS[formData.processType]?.frMax}
                                </p>
                            </div>
                            <div className="mt-6 text-[11px] text-center">
                                {stats.yieldFactor < (PROCESS_PARAMS[formData.processType]?.frMin || 88) ? (
                                    <span className="text-emerald-600 font-bold">¡ALTA CALIDAD (Bonificable)!</span>
                                ) : stats.yieldFactor > (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? (
                                    <span className="text-red-500 font-bold">BAJA CALIDAD (Posible Descuento)</span>
                                ) : (
                                    <span className="text-brand-navy font-bold">CALIDAD ESTÁNDAR DENTRO DE META</span>
                                )}
                            </div>
                        </div>

                        {/* Reporte de Eficiencia */}
                        <div className="pl-0 lg:pl-8 py-4 space-y-2 relative group overflow-hidden bg-transparent">
                            <div className="space-y-0">
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase border-b-2 border-brand-green/20 py-3">
                                    <span className="text-brand-navy/80">EXPECTED MASS</span>
                                    <span className="text-xs text-brand-navy-bright font-mono">
                                        ≈ {stats.theoreticalAlmond.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase border-b-2 border-zinc-100 py-3">
                                    <span className="text-brand-navy/80">{t('thrashingForm', 'inputMass')}</span>
                                    <span className="text-xs text-brand-navy font-mono">{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase border-b-2 border-zinc-100 py-3">
                                    <span className="text-brand-navy/80">{t('thrashingForm', 'outputMass')}</span>
                                    <span className={`text-xs font-mono ${stats.almondWeight >= stats.theoreticalAlmond ? 'text-brand-green' : 'text-brand-navy'}`}>
                                        {stats.almondWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase border-b-2 border-zinc-100 py-3">
                                    <span className="text-brand-navy/80">{t('thrashingForm', 'realLoss')}</span>
                                    <span className={`text-xs font-mono ${warning?.type === 'high' ? 'text-red-500' : warning?.type === 'low' ? 'text-emerald-600' : 'text-brand-navy'}`}>
                                        {stats.lossPct.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase py-3">
                                    <span className="text-brand-navy/80">{t('thrashingForm', 'theoreticalLoss')}</span>
                                    <span className="text-xs text-brand-navy font-mono">
                                        {PROCESS_PARAMS[formData.processType]?.shrinkageMin}-{PROCESS_PARAMS[formData.processType]?.shrinkageMax}%
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${warning?.type === 'high' ? 'bg-red-500' : 'bg-emerald-400'}`}
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
                            disabled={isSubmitting || !formData.excelsoWeight || isReadOnly}
                            className="w-full font-bold py-2.5 rounded-industrial-sm transition-all flex items-center justify-center gap-2 group uppercase text-[11px] shadow-sm bg-brand-green text-white hover:bg-opacity-90 disabled:opacity-50 border border-brand-green"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    SINCRONIZANDO...
                                </div>
                            ) : false ? (
                                <>
                                    {t('thrashingForm', 'sealing')}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </>
                            ) : isPublic ? (
                                <>
                                    GENERAR REPORTE CERTIFICADO
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
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
