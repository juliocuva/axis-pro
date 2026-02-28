'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { processThrashingAction } from '../../actions/thrashing';
import { NumericInput } from '@/shared/components/ui/NumericInput';

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
        humidity: 11.0
    });

    const [yieldFactor, setYieldFactor] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlreadyThrashed, setIsAlreadyThrashed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<{ message: string; type: 'low' | 'high' } | null>(null);

    const [isLoading, setIsLoading] = useState(true);

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
                    // Map process from DB to our internal types
                    let processType = 'Lavado';
                    const dbProcess = (data.process || '').toUpperCase();
                    if (dbProcess.includes('HONEY YELLOW')) processType = 'Yellow Honey';
                    else if (dbProcess.includes('HONEY RED')) processType = 'Red Honey';
                    else if (dbProcess.includes('HONEY BLACK')) processType = 'Black Honey';
                    else if (dbProcess.includes('HONEY')) processType = 'Honey';
                    else if (dbProcess.includes('NATURAL')) processType = 'Natural';
                    else if (dbProcess.includes('SEMI LAVADO')) processType = 'Semi Lavado';
                    else if (dbProcess.includes('ANAEROBICO')) processType = 'Anaerobico';
                    else if (dbProcess.includes('DOBLE FERMENTACION')) processType = 'Doble Fermentacion';
                    else if (dbProcess.includes('CO FERMENTACION')) processType = 'Co Fermentacion';

                    const thrashedW = Number(data.thrashed_weight) || 0;
                    setFormData(prev => ({
                        ...prev,
                        excelsoWeight: thrashedW,
                        pasillaWeight: Number(data.pasilla_weight) || 0,
                        ciscoWeight: Number(data.cisco_weight) || 0,
                        processType: processType,
                        humidity: Number(data.humidity) || 11.0
                    }));

                    if (thrashedW > 0) {
                        setIsAlreadyThrashed(true);
                    }
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
        const almondWeight = formData.excelsoWeight + formData.pasillaWeight;
        const totalOut = almondWeight + formData.ciscoWeight;
        const loss = Math.max(0, parchmentWeight - totalOut);
        const lossPct = parchmentWeight > 0 ? ((parchmentWeight - almondWeight) / parchmentWeight) * 100 : 0;
        const yieldPct = parchmentWeight > 0 ? (formData.excelsoWeight / parchmentWeight) * 100 : 0;
        const factor = formData.excelsoWeight > 0 ? (parchmentWeight / formData.excelsoWeight) * 70 : 0;

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

        // Alerta de Desviación
        if (almondWeight > 0) {
            if (lossPct < params.shrinkageMin) {
                setWarning({
                    message: `ALERTA: Merma (${lossPct.toFixed(1)}%) menor al rango esperado. Posible error en pesaje de ingreso o humedad alta.`,
                    type: 'low'
                });
            } else if (lossPct > params.shrinkageMax) {
                setWarning({
                    message: `ALERTA: Merma (${lossPct.toFixed(1)}%) mayor al rango esperado. Posible pérdida de grano en cascarilla o exceso de pasilla/broca.`,
                    type: 'high'
                });
            } else {
                setWarning(null);
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
                formData.humidity
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
                            <option value="Lavado">LAVADO (Shrink: 18-20%)</option>
                            <option value="Semi Lavado">SEMI LAVADO (Shrink: 19-21%)</option>
                            <option value="Honey">HONEY (Shrink: 22-24%)</option>
                            <option value="Yellow Honey">YELLOW HONEY (Shrink: 20-22%)</option>
                            <option value="Red Honey">RED HONEY (Shrink: 22-24%)</option>
                            <option value="Black Honey">BLACK HONEY (Shrink: 24-26%)</option>
                            <option value="Natural">NATURAL (Shrink: 28-32%)</option>
                            <option value="Anaerobico">ANAERÓBICO (Shrink: 21-23%)</option>
                            <option value="Doble Fermentacion">DOBLE FERMENTACIÓN (Shrink: 20-22%)</option>
                            <option value="Co Fermentacion">CO FERMENTACIÓN (Shrink: 22-25%)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-[calc(50%-2px)] pointer-events-none text-gray-500 group-hover/select:text-brand-green transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Input 2: Peso Inicial (KG)</label>
                    <div className="w-full bg-white/5 border border-white/10 rounded-industrial-sm px-4 py-3 font-bold text-white flex justify-between items-center opacity-80 cursor-not-allowed">
                        <span>{parchmentWeight.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-400">P. SECO</span>
                    </div>
                </div>
                <NumericInput
                    label="Input 3: % Humedad Ingreso"
                    value={formData.humidity}
                    onChange={(val) => setFormData({ ...formData, humidity: val })}
                    step={0.1}
                    disabled={isSubmitting || isAlreadyThrashed}
                    variant={formData.humidity >= 10 && formData.humidity <= 11.5 ? 'industrial' : 'orange'}
                    inputClassName="text-base"
                />
            </div>

            {/* Output Automático: Proyección */}
            <div className="p-4 bg-brand-green/5 border border-brand-green/20 rounded-industrial-sm flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-brand-green-bright uppercase tracking-widest">Projection de Almendra Esperada:</span>
                    <span className="text-[8px] text-gray-500 uppercase">(Basado en coeficientes de conversión: {PROCESS_PARAMS[formData.processType]?.conversion})</span>
                </div>
                <span className="text-2xl font-bold text-brand-green-bright font-mono animate-pulse">
                    ≈ {stats.theoreticalAlmond.toFixed(1)} KG
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 border-t border-white/5 pt-6">
                {error && (
                    <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl text-brand-red-bright text-[10px] font-bold uppercase">
                        {error}
                    </div>
                )}

                {warning && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-500 text-[10px] font-bold uppercase animate-bounce-subtle">
                        ⚠️ {warning.message}
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
                    />
                </div>

                {stats.yieldFactor > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={`p-8 rounded-industrial border flex flex-col items-center justify-center transition-all animate-in zoom-in duration-500 ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-brand-green/10 border-brand-green shadow-[0_0_30px_rgba(0,223,154,0.15)]' : 'bg-orange-500/10 border-orange-500'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.4em] ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-green/70' : 'text-orange-500/70'}`}>Factor de Rendimiento ($FR$)</span>
                            </div>
                            <span className={`text-7xl font-bold font-mono tracking-tighter ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-brand-green-bright' : 'text-orange-500'}`}>
                                {stats.yieldFactor.toFixed(2)}
                            </span>
                            <div className="mt-4 flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'bg-brand-green-bright animate-pulse' : 'bg-orange-500'}`}></div>
                                <p className={`text-[11px] uppercase font-bold tracking-[0.2em] ${stats.yieldFactor >= (PROCESS_PARAMS[formData.processType]?.frMin || 88) && stats.yieldFactor <= (PROCESS_PARAMS[formData.processType]?.frMax || 94) ? 'text-white' : 'text-orange-200'}`}>
                                    Meta {formData.processType}: {PROCESS_PARAMS[formData.processType]?.frMin}-{PROCESS_PARAMS[formData.processType]?.frMax}
                                </p>
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
                                    <span className="text-white font-mono">{parchmentWeight.toFixed(1)} KG</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase">
                                    <span className="text-gray-400">Masa Obtenida (Verde):</span>
                                    <span className={`font-mono font-bold ${stats.almondWeight >= stats.theoreticalAlmond ? 'text-brand-green-bright' : 'text-orange-500'}`}>
                                        {stats.almondWeight.toFixed(1)} KG
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase border-t border-white/5 pt-2">
                                    <span className="text-gray-400">Merma Real:</span>
                                    <span className={`font-mono font-bold ${warning ? 'text-orange-500' : 'text-white'}`}>
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
                                            className={`h-full rounded-full transition-all duration-1000 ${warning ? 'bg-orange-500' : 'bg-brand-green shadow-[0_0_10px_rgba(0,223,154,0.5)]'}`}
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
                    className={`w-full font-bold py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl ${isAlreadyThrashed ? 'bg-brand-green/20 text-brand-green border border-brand-green/30 cursor-not-allowed opacity-100' : 'bg-white hover:bg-brand-green-bright text-black hover:text-white disabled:opacity-30'}`}
                >
                    {isSubmitting ? 'SINCRONIZANDO CON SERVIDOR AXIS...' : isAlreadyThrashed ? 'CERTIFICADO DE TRILLA SELLADO' : 'SELLAR Y EMITIR REPORTE DE TRILLA'}
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
