'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { processThrashingAction } from '../../actions/thrashing';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import EUDRComplianceBadge from '../EUDRComplianceBadge';

interface ThrashingFormProps {
    inventoryId: string;
    parchmentWeight: number;
    onThrashingComplete: () => void;
    user: { companyId: string } | null;
}

export default function ThrashingForm({ inventoryId, parchmentWeight, onThrashingComplete, user }: ThrashingFormProps) {
    const PROCESS_PARAMS: Record<string, { shrinkageMin: number; shrinkageMax: number; conversion: number; frMin: number; frMax: number }> = {
        'Lavado': { shrinkageMin: 18.0, shrinkageMax: 20.0, conversion: 0.81, frMin: 88, frMax: 94 },
        'Semi Lavado': { shrinkageMin: 19.0, shrinkageMax: 21.0, conversion: 0.80, frMin: 90, frMax: 96 },
        'Honey': { shrinkageMin: 22.0, shrinkageMax: 24.0, conversion: 0.78, frMin: 95, frMax: 102 },
        'Yellow Honey': { shrinkageMin: 20.0, shrinkageMax: 22.0, conversion: 0.80, frMin: 92, frMax: 98 },
        'Red Honey': { shrinkageMin: 22.0, shrinkageMax: 24.0, conversion: 0.78, frMin: 95, frMax: 102 },
        'Black Honey': { shrinkageMin: 24.0, shrinkageMax: 26.0, conversion: 0.75, frMin: 100, frMax: 108 },
        'Natural': { shrinkageMin: 28.0, shrinkageMax: 32.0, conversion: 0.70, frMin: 115, frMax: 130 },
        'Anaerobico': { shrinkageMin: 21.0, shrinkageMax: 23.0, conversion: 0.79, frMin: 93, frMax: 100 },
        'Doble Fermentacion': { shrinkageMin: 20.0, shrinkageMax: 22.0, conversion: 0.80, frMin: 92, frMax: 98 },
        'Co Fermentacion': { shrinkageMin: 22.0, shrinkageMax: 25.0, conversion: 0.77, frMin: 96, frMax: 104 }
    };

    const [formData, setFormData] = useState({
        excelsoWeight: 0,
        pasillaWeight: 0,
        ciscoWeight: 0,
        processType: 'Lavado',
        humidity: 11.0,
        preparationProtocol: 'EP',
        sortingMethod: 'Máquina Selectora Óptica'
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
                    console.log("AXIS DB SUCCESS (Trilla):", data);
                    // Map process and fermentation style from DB to our internal parameters
                    let processKey = 'Lavado';
                    const dbProcess = (data.process || 'lavado').toLowerCase();
                    const fs = (data.process_data?.fermentation_style || 'estandar').toLowerCase();

                    if (dbProcess === 'natural') {
                        processKey = 'Natural';
                    } else if (dbProcess === 'honey') {
                        if (fs === 'honey_yellow') processKey = 'Yellow Honey';
                        else if (fs === 'honey_red') processKey = 'Red Honey';
                        else if (fs === 'honey_black') processKey = 'Black Honey';
                        else processKey = 'Honey';
                    } else { // Default to Lavado base
                        if (fs === 'anaerobico') processKey = 'Anaerobico';
                        else if (fs === 'doble_fermentacion') processKey = 'Doble Fermentacion';
                        else if (fs === 'co_fermentacion') processKey = 'Co Fermentacion';
                        else if (fs === 'semi_lavado') processKey = 'Semi Lavado';
                        else processKey = 'Lavado';
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
                        sortingMethod: data.process_data?.sorting_method || 'Máquina Selectora Óptica'
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

    // Estimación visual en el cliente (solo para UX, no se guarda)
    const [stats, setStats] = useState({
        totalOut: 0,
        almondWeight: 0, // Excelso + Pasilla
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

        // Alerta de Desviación (solo mostrar si han ingresado pesajes para evitar alertas prematuras)
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
                    type: 'optimal' // changed from high to positive type visually later if we want
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
                formData.sortingMethod
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
        <div className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6 relative overflow-hidden min-h-[300px]">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-industrial">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-green-bright animate-pulse">Recuperando datos de trilla...</p>
                    </div>
                </div>
            )}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>

            <header className="relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                    Módulo de Gestión de Trilla
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase font-mono tracking-widest">Validación de Eficiencia Industrial</p>
            </header>

            <EUDRComplianceBadge lotData={lotDetails} className="mb-2" />

            {/* Configuración Inicial de Parámetros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Input 1: Tipo de Proceso</label>
                    <div className="relative group/select">
                        <select
                            value={formData.processType}
                            onChange={(e) => setFormData({ ...formData, processType: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none font-bold text-white transition-all appearance-none pr-12 disabled:opacity-50"
                        >
                            <option value="Lavado">LAVADO (Merma Teórica: 18-20%)</option>
                            <option value="Semi Lavado">SEMI LAVADO (Merma Teórica: 19-21%)</option>
                            <option value="Honey">HONEY (Merma Teórica: 22-24%)</option>
                            <option value="Yellow Honey">YELLOW HONEY (Merma Teórica: 20-22%)</option>
                            <option value="Red Honey">RED HONEY (Merma Teórica: 22-24%)</option>
                            <option value="Black Honey">BLACK HONEY (Merma Teórica: 24-26%)</option>
                            <option value="Natural">NATURAL (Merma Teórica: 28-32%)</option>
                            <option value="Anaerobico">ANAERÓBICO (Merma Teórica: 21-23%)</option>
                            <option value="Doble Fermentacion">DOBLE FERMENTACIÓN (Merma Teórica: 20-22%)</option>
                            <option value="Co Fermentacion">CO FERMENTACIÓN (Merma Teórica: 22-25%)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-[calc(50%-2px)] pointer-events-none text-gray-500 group-hover/select:text-brand-green transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Input 2: Peso Inicial (KG)</label>
                    <div className="w-full bg-white/5 border border-white/10 rounded-industrial-sm px-4 py-3 font-bold text-white flex justify-between items-center opacity-80 cursor-not-allowed">
                        <span>{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                        <span className="text-[10px] text-gray-400">P. SECO</span>
                    </div>
                </div>
                <NumericInput
                    label="Input 3: % Humedad Ingreso"
                    value={formData.humidity}
                    onChange={(val) => setFormData({ ...formData, humidity: val })}
                    step={0.1}
                    disabled={isSubmitting || isAlreadyThrashed}
                    variant={formData.humidity >= 10 && formData.humidity <= 11.5 ? 'industrial' : 'default'}
                    inputClassName="text-base"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-4 mb-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Input 4: Protocolo de Preparación</label>
                    <div className="relative group/select">
                        <select
                            value={formData.preparationProtocol}
                            onChange={(e) => setFormData({ ...formData, preparationProtocol: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none font-bold text-brand-green-bright transition-all appearance-none pr-12 disabled:opacity-50"
                        >
                            <option value="EP">European Prep (EP) - Especialidad</option>
                            <option value="American">American Prep - Comercial Plus</option>
                            <option value="Zero Defect">Zero Defect - Microlote Oro</option>
                            <option value="Supremo">Supremo - Malla 17/18</option>
                            <option value="UGQ">UGQ - Estándar FNC</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-[calc(50%-2px)] pointer-events-none text-gray-500 group-hover/select:text-brand-green transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Input 5: Método de Selección</label>
                    <div className="relative group/select">
                        <select
                            value={formData.sortingMethod}
                            onChange={(e) => setFormData({ ...formData, sortingMethod: e.target.value })}
                            disabled={isSubmitting || isAlreadyThrashed}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none font-bold text-white transition-all appearance-none pr-12 disabled:opacity-50"
                        >
                            <option value="Máquina Selectora Óptica">Selectora Óptica (Electrónica)</option>
                            <option value="Manual (Hand-Sorted)">Manual en Banda (Hand-Sorted)</option>
                            <option value="Mixto (Óptica + Repaso Manual)">Mixto (Óptica + Repaso Manual)</option>
                            <option value="Solo Densimétrica">Solo Densimétrica (Sin Óptica)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-[calc(50%-2px)] pointer-events-none text-gray-500 group-hover/select:text-brand-green transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Output Automático: Proyección */}
            <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-industrial-sm flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-brand-green-bright uppercase tracking-widest">Projection de Almendra Esperada:</span>
                    <span className="text-[8px] text-gray-500 uppercase">(Basado en coeficientes de conversión: {PROCESS_PARAMS[formData.processType]?.conversion})</span>
                </div>
                <span className="text-2xl font-bold text-brand-green-bright font-mono animate-pulse">
                    ≈ {stats.theoreticalAlmond.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 border-t border-white/5 pt-6">
                {error && (
                    <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl text-brand-red-bright text-[10px] font-bold uppercase">
                        {error}
                    </div>
                )}

                {warning && (
                    <div className={`p-4 border rounded-xl text-[10px] font-bold uppercase animate-bounce-subtle ${warning.type === 'optimal'
                        ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright'
                        : 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright'
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
                        inputClassName="text-2xl py-4"
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
                        inputClassName="text-2xl py-4"
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
                        inputClassName="text-2xl py-4 opacity-60"
                        formatThousands={true}
                    />
                </div>

                {stats.yieldFactor > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={`p-8 rounded-industrial border flex flex-col items-center justify-center transition-all animate-in zoom-in duration-500 ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-brand-green/10 border-brand-green shadow-[0_0_30px_rgba(0,223,154,0.15)]' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.4em] ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-green/70' : 'text-gray-400'}`}>Factor de Rendimiento ($FR$)</span>
                            </div>
                            <span className={`text-7xl font-bold font-mono tracking-tighter ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-green-bright' : 'text-brand-green-bright'}`}>
                                {stats.yieldFactor.toFixed(2)}
                            </span>
                            <div className="mt-4 flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-brand-green-bright animate-pulse' : 'bg-brand-green/80'}`}></div>
                                <p className={`text-[11px] uppercase font-bold tracking-[0.2em] ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-white' : 'text-gray-400'}`}>
                                    Meta {formData.processType}: {PROCESS_PARAMS[formData.processType]?.frMin}-{PROCESS_PARAMS[formData.processType]?.frMax}
                                </p>
                            </div>
                            <div className="mt-6 text-[10px] text-gray-400 leading-relaxed text-center px-4">
                                {stats.yieldFactor < (PROCESS_PARAMS[formData.processType]?.frMin || 88) ? (
                                    <span className="text-brand-green-bright font-bold tracking-widest block mb-1">¡ALTA CALIDAD (Bonificable)!</span>
                                ) : stats.yieldFactor > (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? (
                                    <span className="text-red-400 font-bold tracking-widest block mb-1">BAJA CALIDAD (Posible Descuento)</span>
                                ) : (
                                    <span className="text-brand-green font-bold tracking-widest block mb-1">CALIDAD ESTÁNDAR DENTRO DE META</span>
                                )}
                                Un factor menor indica que se requiere <strong className="text-white">menos</strong> materia prima para obtener 70kg de excelso, lo que representa mayor rentabilidad.
                            </div>
                        </div>

                        {/* Reporte de Eficiencia */}
                        <div className="bg-bg-main border border-white/5 p-6 rounded-industrial space-y-4 relative group overflow-hidden">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                                Reporte de Eficiencia de Trilla
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] uppercase">
                                    <span className="text-gray-400">Masa Ingresada:</span>
                                    <span className="text-white font-mono">{parchmentWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase">
                                    <span className="text-gray-400">Masa Obtenida (Verde):</span>
                                    <span className={`font-mono font-bold ${stats.almondWeight >= stats.theoreticalAlmond ? 'text-brand-green-bright' : 'text-brand-green-bright'}`}>
                                        {stats.almondWeight.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KG
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase border-t border-white/5 pt-2">
                                    <span className="text-gray-400">Merma Real:</span>
                                    <span className={`font-mono font-bold ${warning ? 'text-brand-green-bright' : 'text-white'}`}>
                                        {stats.lossPct.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase">
                                    <span className="text-gray-400">Merma Teórica:</span>
                                    <span className="text-gray-500 font-mono">
                                        {PROCESS_PARAMS[formData.processType]?.shrinkageMin}-{PROCESS_PARAMS[formData.processType]?.shrinkageMax}%
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
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
                    <div className="h-48 border border-dashed border-white/5 rounded-industrial flex flex-col items-center justify-center gap-3 opacity-30">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-center">Esperando entrada de salida real<br />para generar Reporte de Eficiencia...</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !formData.excelsoWeight || isAlreadyThrashed}
                    className={`w-full font-bold py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl ${isAlreadyThrashed ? 'bg-brand-green/20 text-brand-green border border-brand-green/30 cursor-not-allowed opacity-100' : 'bg-brand-green hover:bg-brand-green-bright text-black disabled:opacity-30'}`}
                >
                    {isSubmitting ? 'SINCRONIZANDO CON SERVIDOR AXIS...' : isAlreadyThrashed ? 'PROCESO SELLADO Y VERIFICADO' : 'SELLAR Y EMITIR REPORTE DE TRILLA'}
                    {!isAlreadyThrashed && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7-7" />
                        </svg>
                    )}
                    {isAlreadyThrashed && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
