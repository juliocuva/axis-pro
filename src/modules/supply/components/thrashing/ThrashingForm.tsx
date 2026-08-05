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
    parchmentWeight: number | '';
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
        processType: '',
        varietal: '',
        customVarietal: '',
        millingDate: new Date().toISOString().split('T')[0],
        humidity: '' as unknown as number,
        preparationProtocol: '',
        sortingMethod: '',
        sieveAnalysis: {
            m18: 0,
            m17: 0,
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
        const pw = Number(parchmentWeight) || 0;
        const hw = Number(formData.excelsoWeight) || 0;
        const pw2 = Number(formData.pasillaWeight) || 0;
        const cw = Number(formData.ciscoWeight) || 0;

        const totalOut = hw + pw2 + cw;
        const almondWeight = hw + pw2;
        const loss = pw - totalOut;
        const lossPct = pw > 0 ? (loss / pw) * 100 : 0;
        const yieldPct = pw > 0 ? (hw / pw) * 100 : 0;
        const yF = hw > 0 ? (pw / hw) * 70 : 0;

        const params = PROCESS_PARAMS[formData.processType] || PROCESS_PARAMS['Lavado'];
        const theoreticalAlmond = pw * params.conversion;
        const theoreticalLossPct = ((params.shrinkageMin + params.shrinkageMax) / 2);

        setStats({
            totalOut,
            almondWeight,
            loss,
            lossPct,
            yieldPct,
            yieldFactor: yF,
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
                varietal: formData.varietal === 'Other' ? formData.customVarietal : formData.varietal,
                millingDate: formData.millingDate,
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
                    sieve_analysis: formData.sieveAnalysis,
                    varietal: formData.varietal === 'Other' ? formData.customVarietal : formData.varietal,
                    millingDate: formData.millingDate
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
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">VARIETAL</label>
                    <div className="flex flex-col gap-2">
                        <div className="relative group/select w-full">
                        <select
                                value={formData.varietal}
                                onChange={(e) => setFormData({ ...formData, varietal: e.target.value })}
                                disabled={isSubmitting || isReadOnly}
                                className={`w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold transition-all appearance-none pr-8 disabled:opacity-100 uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat ${!formData.varietal ? 'text-zinc-400' : 'text-brand-navy disabled:text-brand-navy'}`}
                            >
                                <option value="" disabled className="text-zinc-400">SELECT...</option>
                                <option value="Castillo" className="text-brand-navy">CASTILLO</option>
                                <option value="Caturra" className="text-brand-navy">CATURRA</option>
                                <option value="Colombia" className="text-brand-navy">COLOMBIA</option>
                                <option value="Bourbon" className="text-brand-navy">BOURBON</option>
                                <option value="Gesha" className="text-brand-navy">GESHA</option>
                                <option value="Pink Bourbon" className="text-brand-navy">PINK BOURBON</option>
                                <option value="Typica" className="text-brand-navy">TYPICA</option>
                                <option value="Blend" className="text-brand-navy">BLEND (MEZCLA)</option>
                                <option value="Other" className="text-brand-navy">OTRO</option>
                            </select>
                        </div>
                        {formData.varietal === 'Other' && (
                            <input
                                type="text"
                                placeholder="Escribe el varietal..."
                                value={formData.customVarietal}
                                onChange={(e) => setFormData({ ...formData, customVarietal: e.target.value })}
                                disabled={isSubmitting || isReadOnly}
                                className="w-full h-[30px] bg-transparent border-b-2 border-brand-green px-0 focus:border-brand-navy outline-none font-bold text-brand-navy transition-all uppercase text-xs"
                                autoFocus
                            />
                        )}
                    </div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'processType')}</label>
                    <div className="relative group/select">
                        <select
                            value={formData.processType}
                            onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
                            disabled={isSubmitting || isReadOnly}
                            className={`w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold transition-all appearance-none pr-8 disabled:opacity-100 uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat ${!formData.processType ? 'text-zinc-400' : 'text-brand-navy disabled:text-brand-navy'}`}
                        >
                            <option value="" disabled className="text-zinc-400">SELECT...</option>
                            <option value="Lavado" className="text-brand-navy">WASHED (18-20%)</option>
                            <option value="Semilavado" className="text-brand-navy">SEMI-WASHED (19-21%)</option>
                            <option value="Honey" className="text-brand-navy">HONEY (22-24%)</option>
                            <option value="Natural" className="text-brand-navy">NATURAL (28-32%)</option>
                            <option value="Sumergido" className="text-brand-navy">SUBMERGED (21-23%)</option>
                            <option value="Anaerobico" className="text-brand-navy">ANAEROBIC (21-23%)</option>
                        </select>
                    </div>
                    <div className="mt-1.5">
                         <span className="text-[9px] font-bold uppercase text-brand-navy/60">Input Material:</span>
                         <span className="text-[10px] ml-1 font-bold text-brand-navy">
                             {formData.processType === 'Natural' ? 'Dried Cherry' : 'Parchment Coffee'}
                         </span>
                    </div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">FECHA DE TRILLA</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={formData.millingDate}
                            onChange={(e) => setFormData({ ...formData, millingDate: e.target.value })}
                            disabled={isSubmitting || isReadOnly}
                            className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold text-brand-navy transition-all uppercase text-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10 mt-4">
                {isPublic ? (
                    <div className="md:col-span-1">
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
                    </div>
                ) : (
                    <div className="space-y-0.5 md:col-span-1">
                        <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'initialWeight')}</label>
                        <div className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 text-xs font-bold text-brand-navy flex justify-between items-center transition-all">
                            <span>{Number(parchmentWeight || 0).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                            <span className="text-[9px] opacity-60 uppercase font-black ">Parchment</span>
                        </div>
                    </div>
                )}
                <div className="md:col-span-1">
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
                <div className="space-y-0.5 md:col-span-2">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'preparationProtocol')}</label>
                    <div className="relative group/select">
                        <select
                            value={formData.preparationProtocol}
                            onChange={(e) => setFormData({ ...formData, preparationProtocol: e.target.value })}
                            disabled={isSubmitting || isReadOnly}
                            className={`w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold transition-all appearance-none pr-8 disabled:opacity-100 uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat ${!formData.preparationProtocol ? 'text-zinc-400' : 'text-brand-navy disabled:text-brand-navy'}`}
                        >
                            <option value="" disabled className="text-zinc-400">SELECT...</option>
                            <option value="EP" className="text-brand-navy">European Prep (EP) - Specialty</option>
                            <option value="American" className="text-brand-navy">American Prep - Commercial Plus</option>
                            <option value="Zero Defect" className="text-brand-navy">Zero Defect - Gold Microlot</option>
                            <option value="Supremo" className="text-brand-navy">Supremo - Screen 17/18</option>
                            <option value="UGQ" className="text-brand-navy">UGQ - FNC Standard</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-0.5 md:col-span-2">
                    <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">{t('thrashingForm', 'sortingMethod')}</label>
                    <div className="relative group/select">
                        <select
                            value={formData.sortingMethod}
                            onChange={(e) => setFormData({ ...formData, sortingMethod: e.target.value })}
                            disabled={isSubmitting || isReadOnly}
                            className={`w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold transition-all appearance-none pr-8 disabled:opacity-100 uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat ${!formData.sortingMethod ? 'text-zinc-400' : 'text-brand-navy disabled:text-brand-navy'}`}
                        >
                            <option value="" disabled className="text-zinc-400">SELECT...</option>
                            <option value="Máquina Selectora Óptica" className="text-brand-navy">Optical Sorter Machine</option>
                            <option value="Manual (Hand-Sorted)" className="text-brand-navy">Manual (Hand-Sorted)</option>
                            <option value="Mixto (Óptica + Repaso Manual)" className="text-brand-navy">Mixed (Optical + Manual Review)</option>
                            <option value="Solo Densimétrica" className="text-brand-navy">Densimetric Only</option>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumericInput
                        label="Excelso Weight (Almond)"
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
                        label="Pasilla (Low Grade)"
                        value={formData.pasillaWeight}
                        onChange={(val) => setFormData({ ...formData, pasillaWeight: val })}
                        step={0.1}
                        unit="KG"
                        disabled={isSubmitting}
                        variant="industrial"
                        inputClassName="text-xs !h-[30px] font-bold uppercase"
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
                            <div className="mt-6 text-[11px] text-center px-4">
                                {stats.yieldFactor < (PROCESS_PARAMS[formData.processType]?.frMin || 88) ? (
                                    <span className="text-emerald-600 font-bold">Excellent physical efficiency.<br/><span className="text-[9px] font-normal">The obtained yield exceeds the expected behavior for this process.</span></span>
                                ) : stats.yieldFactor > (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? (
                                    <span className="text-red-500 font-bold">Lower yield than expected.<br/><span className="text-[9px] font-normal">The lot shows losses higher than estimated. Review of processing, drying, or preparation is recommended.</span></span>
                                ) : (
                                    <span className="text-brand-navy font-bold">Yield within expected range.<br/><span className="text-[9px] font-normal">The lot shows normal behavior for the selected process.</span></span>
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
                                    <span className="text-brand-navy/80">ALMOND OUTPUT (GREEN)</span>
                                    <span className={`text-xs font-mono ${stats.almondWeight >= stats.theoreticalAlmond ? 'text-brand-green' : 'text-brand-navy'}`}>
                                        {stats.almondWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase border-b-2 border-zinc-100 py-3 bg-zinc-50 px-2 -mx-2 rounded-md">
                                    <span className="text-brand-navy/80">DIFFERENCE</span>
                                    <span className={`text-xs font-mono ${(stats.almondWeight - stats.theoreticalAlmond) >= 0 ? 'text-brand-green' : 'text-red-500'}`}>
                                        {(stats.almondWeight - stats.theoreticalAlmond) > 0 ? '+' : ''}{(stats.almondWeight - stats.theoreticalAlmond).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG 
                                        <span className="ml-1 opacity-70">({((stats.almondWeight - stats.theoreticalAlmond) / (stats.theoreticalAlmond || 1) * 100).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)</span>
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

                                <div className="pt-2 mb-4">
                                    <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${warning?.type === 'high' ? 'bg-red-500' : 'bg-emerald-400'}`}
                                            style={{ width: `${Math.min(100, (stats.lossPct / stats.theoreticalLossPct) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                { stats.yieldFactor > (PROCESS_PARAMS[formData.processType]?.frMax || 94) && (
                                    <div className="mt-4 p-3 bg-zinc-100 rounded-lg border border-zinc-200">
                                        <span className="text-[10px] font-bold text-brand-navy uppercase mb-1 block">POSSIBLE CAUSES (TECHNICAL OBSERVATIONS):</span>
                                        <ul className="text-[9px] text-brand-navy/80 list-disc pl-4 space-y-0.5">
                                            <li>Excessive drying or high percentage of dry pulp</li>
                                            <li>Poor cherry selection</li>
                                            <li>High physical losses during processing</li>
                                            <li>Variety characteristics</li>
                                            <li>Preparation protocol deviations</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="mt-8 p-4 bg-brand-navy/5 border-l-4 border-brand-green text-[10px] text-brand-navy/80 font-medium relative z-20">
                    <span className="font-bold uppercase block mb-1">Technical Note:</span>
                    The Yield Factor evaluates the physical efficiency of the milling process. It is not a measurement of sensory quality. Final coffee quality must be interpreted together with cupping, physical grading and laboratory analysis.
                </div>

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
                                    SYNCHRONIZING...
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
                                    GENERATE CERTIFIED REPORT
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                </>
                            ) : (
                                <>
                                    {t('thrashingForm', 'submit') || 'SAVE DATA'}
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
