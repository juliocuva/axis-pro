'use client';

import React, { useState, useEffect } from 'react';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
import { supabase } from '@/shared/lib/supabase';
import { processThrashingAction } from '../../actions/thrashing';
import { NumericInput } from '@/shared/components/ui/NumericInput';
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
            caracol: 0,
            menores: 0
        }
    });

    const [yieldFactor, setYieldFactor] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlreadyThrashed, setIsAlreadyThrashed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<{ message: string; type: 'low' | 'high' | 'optimal' } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [lotDetails, setLotDetails] = useState<any>(null);

    useEffect(() => {
        const fetchThrashingData = async () => {
            if (!inventoryId || !user?.companyId) return;
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('coffee_purchase_inventory')
                    .select('*')
                    .eq('id', inventoryId.trim())
                    .eq('company_id', user.companyId)
                    .maybeSingle();

                if (error) {
                    console.error("AXIS DB ERROR (Trilla):", error);
                } else if (data) {
                    let processKey = 'Lavado';
                    const dbProcess = (data.process || 'lavado').toLowerCase();

                    if (dbProcess === 'natural') {
                        processKey = 'Natural';
                    } else if (dbProcess === 'honey') {
                        processKey = 'Honey';
                    } else if (dbProcess === 'sumergido') {
                        processKey = 'Sumergido';
                    } else if (dbProcess === 'semilavado') {
                        processKey = 'Semilavado';
                    } else { 
                        processKey = 'Lavado';
                    }

                    const thrashedW = Number(data.thrashed_weight) || 0;
                    setFormData(prev => ({
                        ...prev,
                        excelsoWeight: thrashedW,
                        pasillaWeight: Number(data.pasilla_weight) || 0,
                        ciscoWeight: Number(data.cisco_weight) || 0,
                        processType: processKey,
                        humidity: Number(data.humidity) || 11.0,
                        preparationProtocol: data.process_data?.preparation_protocol || 'EP',
                        sortingMethod: data.process_data?.sorting_method || 'Máquina Selectora Óptica',
                        sieveAnalysis: data.process_data?.sieve_analysis || { m18: 50, m17: 50, m16: 0, m15: 0, caracol: 0, menores: 0 }
                    }));

                    if (thrashedW > 0) {
                        setIsAlreadyThrashed(true);
                    }
                    setLotDetails(data);
                }
            } catch (err) {
                console.error("AXIS CRITICAL ERROR (Trilla):", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchThrashingData();
    }, [inventoryId]);

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
        <div className="bg-soft-white border border-gray-400 shadow-sm p-8 rounded-industrial space-y-6 relative overflow-hidden min-h-[300px]">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm rounded-industrial">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[11px] font-bold uppercase  text-brand-navy animate-pulse">Recuperando datos de trilla...</p>
                    </div>
                </div>
            )}
            
            <EUDRComplianceBadge lotData={lotDetails} className="mb-2" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-brand-navy uppercase  block">1. Tipo de Proceso</label>
                    <div className="relative group/select">
                        <select
                            value={formData.processType}
                            onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                            className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 focus:border-black outline-none font-bold text-brand-navy transition-all appearance-none pr-12 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
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
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-brand-navy uppercase  block">2. Peso Inicial (KG)</label>
                    <div className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 font-bold text-brand-navy flex justify-between items-center shadow-inner transition-all">
                        <span>{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                        <span className="text-[9px] opacity-60 uppercase font-black ">Parchment</span>
                    </div>
                </div>
                <NumericInput
                    label="3. % Humedad Ingreso"
                    value={formData.humidity}
                    onChange={(val) => setFormData({ ...formData, humidity: val })}
                    step={0.1}
                    disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                    variant={formData.humidity >= 10 && formData.humidity <= 11.5 ? 'industrial' : 'default'}
                    inputClassName="text-sm !h-[58px] font-bold"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 mt-2">
                <div className="space-y-2 col-span-3">
                    <label className="text-[11px] font-bold text-brand-navy uppercase  block">4. Protocolo de Preparación</label>
                    <div className="relative group/select">
                        <select
                            value={formData.preparationProtocol}
                            onChange={(e) => setFormData({ ...formData, preparationProtocol: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                            className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 focus:border-black outline-none font-bold text-brand-navy transition-all appearance-none pr-12 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                        >
                            <option value="EP">European Prep (EP) - Especialidad</option>
                            <option value="American">American Prep - Comercial Plus</option>
                            <option value="Zero Defect">Zero Defect - Microlote Oro</option>
                            <option value="Supremo">Supremo - Malla 17/18</option>
                            <option value="UGQ">UGQ - Estándar FNC</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-2 relative z-10 mt-4">
                <label className="text-[11px] font-bold text-brand-navy uppercase  block">5. Método de Selección</label>
                <div className="relative group/select">
                    <select
                        value={formData.sortingMethod}
                        onChange={(e) => setFormData({ ...formData, sortingMethod: e.target.value })}
                        disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                        className="w-full h-[58px] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-5 focus:border-black outline-none font-bold text-brand-navy transition-all appearance-none pr-12 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat shadow-sm"
                    >
                        <option value="Máquina Selectora Óptica">Máquina Selectora Óptica</option>
                        <option value="Manual (Hand-Sorted)">Manual (Hand-Sorted)</option>
                        <option value="Mixto (Óptica + Repaso Manual)">Mixto (Óptica + Repaso Manual)</option>
                        <option value="Solo Densimétrica">Solo Densimétrica</option>
                    </select>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-400 shadow-sm space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-brand-navy uppercase  flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-green rounded-full"></span>
                        Análisis de Granulometría (Mallas)
                    </h4>
                    <span className="text-[9px] text-gray-900 font-bold uppercase ">Distribución de Almendra (%)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {[
                        { id: 'm18', label: '18+' },
                        { id: 'm17', label: '17+' },
                        { id: 'm16', label: '16+' },
                        { id: 'm15', label: '15+' },
                        { id: 'caracol', label: 'Caracol' },
                        { id: 'menores', label: 'Menores' }
                    ].map(m => (
                        <div key={m.id} className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-900 uppercase block text-center ">{m.label}</label>
                            <NumericInput
                                label=""
                                value={formData.sieveAnalysis[m.id as keyof typeof formData.sieveAnalysis]}
                                onChange={(val) => setFormData(prev => ({
                                    ...prev,
                                    sieveAnalysis: { ...prev.sieveAnalysis, [m.id]: val }
                                }))}
                                step={1}
                                unit="%"
                                disabled={isSubmitting || isAlreadyThrashed || isReadOnly}
                                variant="industrial"
                                inputClassName="text-center text-xs !h-[48px] !px-2"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Output Automático: Proyección */}
            <div className="p-4 bg-white border border-gray-400 shadow-sm rounded-industrial-sm flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-brand-navy-bright uppercase ">Projection de Almendra Esperada:</span>
                    <span className="text-[9px] text-gray-900 uppercase">(Basado en coeficientes de conversión: {PROCESS_PARAMS[formData.processType]?.conversion})</span>
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
                        inputClassName="text-xl !h-[58px]"
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Pasilla (Consumo)"
                        value={formData.pasillaWeight}
                        onChange={(val) => setFormData({ ...formData, pasillaWeight: val })}
                        step={0.1}
                        unit="KG"
                        disabled={isSubmitting || isAlreadyThrashed}
                        variant="default"
                        inputClassName="text-xl !h-[58px]"
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Cisco/Cascarilla"
                        value={formData.ciscoWeight}
                        onChange={(val) => setFormData({ ...formData, ciscoWeight: val })}
                        step={0.1}
                        unit="KG"
                        disabled={isSubmitting || isAlreadyThrashed}
                        variant="default"
                        inputClassName="text-xl !h-[58px] opacity-60"
                        formatThousands={true}
                    />
                </div>

                {stats.yieldFactor > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={`p-8 rounded-industrial border flex flex-col items-center justify-center transition-all animate-in zoom-in duration-500 ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-white border-black shadow-[0_0_30px_rgba(0,223,154,0.15)]' : 'bg-white border-gray-400 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[11px] font-bold uppercase  ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-navy/70' : 'text-brand-navy'}`}>Factor de Rendimiento ($FR$)</span>
                            </div>
                            <span className={`text-7xl font-bold font-mono er ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-navy-bright' : 'text-brand-navy-bright'}`}>
                                {stats.yieldFactor.toFixed(2)}
                            </span>
                            <div className="mt-4 flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-brand-green-bright animate-pulse' : 'bg-brand-green/80'}`}></div>
                                <p className={`text-[11px] uppercase font-bold  ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-navy' : 'text-brand-navy'}`}>
                                    Meta {formData.processType}: {PROCESS_PARAMS[formData.processType]?.frMin}-{PROCESS_PARAMS[formData.processType]?.frMax}
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
                                Un factor menor indica que se requiere <strong className="text-brand-navy">menos</strong> materia prima para obtener 70kg de excelso, lo que representa mayor rentabilidad.
                            </div>
                        </div>

                        {/* Reporte de Eficiencia */}
                        <div className="bg-white border border-gray-400 shadow-sm p-6 rounded-industrial space-y-4 relative group overflow-hidden">
                            <h4 className="text-[11px] font-bold text-gray-900 uppercase  flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                                Reporte de Eficiencia de Trilla
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[11px] uppercase">
                                    <span className="text-brand-navy">Masa Ingresada:</span>
                                    <span className="text-brand-navy font-mono">{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] uppercase">
                                    <span className="text-brand-navy">Masa Obtenida (Verde):</span>
                                    <span className={`font-mono font-bold ${stats.almondWeight >= stats.theoreticalAlmond ? 'text-brand-navy-bright' : 'text-brand-navy-bright'}`}>
                                        {stats.almondWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] uppercase border-t border-gray-400 shadow-sm pt-2">
                                    <span className="text-brand-navy">Merma Real:</span>
                                    <span className={`font-mono font-bold ${warning ? 'text-brand-navy-bright' : 'text-brand-navy'}`}>
                                        {stats.lossPct.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] uppercase">
                                    <span className="text-brand-navy">Merma Teórica:</span>
                                    <span className="text-gray-900 font-mono">
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
                ) : (
                    <div className="h-48 border border-dashed border-gray-400 shadow-sm rounded-industrial flex flex-col items-center justify-center gap-3 opacity-30">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
                        <p className="text-[11px] uppercase font-bold  text-center">Esperando entrada de salida real<br />para generar Reporte de Eficiencia...</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !formData.excelsoWeight || isAlreadyThrashed || isReadOnly}
                    className="w-full font-bold py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase text-xs shadow-2xl bg-brand-green text-brand-navy hover:bg-opacity-90 disabled:opacity-100 disabled:text-brand-navy"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            SINCRONIZANDO CON LA NUBE...
                        </div>
                    ) : isAlreadyThrashed ? (
                        <>
                            PROCESO DE TRILLA SELLADO
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </>
                    ) : (
                        <>
                            VINCULAR RESULTADOS DE TRILLA
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
