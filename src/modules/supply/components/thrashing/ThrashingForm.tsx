'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { processThrashingAction } from '../../actions/thrashing';

interface ThrashingFormProps {
    inventoryId: string;
    parchmentWeight: number;
    onThrashingComplete: () => void;
    user: { companyId: string } | null;
}

export default function ThrashingForm({ inventoryId, parchmentWeight, onThrashingComplete, user }: ThrashingFormProps) {
    const [formData, setFormData] = useState({
        excelsoWeight: 0,
        pasillaWeight: 0,
        ciscoWeight: 0
    });

    const [yieldFactor, setYieldFactor] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                    setFormData({
                        excelsoWeight: Number(data.thrashed_weight) || 0,
                        pasillaWeight: Number(data.pasilla_weight) || 0,
                        ciscoWeight: Number(data.cisco_weight) || 0
                    });
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
        loss: 0,
        lossPct: 0,
        yieldPct: 0,
        yieldFactor: 0
    });

    useEffect(() => {
        const totalOut = formData.excelsoWeight + formData.pasillaWeight + formData.ciscoWeight;
        const loss = Math.max(0, parchmentWeight - totalOut);
        const lossPct = parchmentWeight > 0 ? (loss / parchmentWeight) * 100 : 0;
        const yieldPct = parchmentWeight > 0 ? (formData.excelsoWeight / parchmentWeight) * 100 : 0;
        const factor = formData.excelsoWeight > 0 ? (parchmentWeight / formData.excelsoWeight) * 70 : 0;

        setStats({
            totalOut,
            loss,
            lossPct,
            yieldPct,
            yieldFactor: factor
        });
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
                user?.companyId || ''
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
                    Módulo de Trilla Industrial
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase font-mono tracking-widest">Procedimiento: Pergamino → Oro (Excelso)</p>
            </header>

            <div className="p-4 bg-white/5 border border-white/10 rounded-industrial-sm flex justify-between items-center relative z-10">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fuente de Verdad (Pergamino):</span>
                <span className="text-lg font-bold text-white font-mono">{parchmentWeight} KG</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {error && (
                    <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl text-brand-red-bright text-[10px] font-bold uppercase">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Peso Excelso (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            required
                            value={formData.excelsoWeight || ''}
                            disabled={isSubmitting}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-4 focus:border-brand-green outline-none font-bold text-2xl text-brand-green-bright transition-all"
                            onChange={(e) => setFormData({ ...formData, excelsoWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Pasilla (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.pasillaWeight || ''}
                            disabled={isSubmitting}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-4 focus:border-white/20 outline-none text-gray-400 font-bold"
                            onChange={(e) => setFormData({ ...formData, pasillaWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Cisco (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.ciscoWeight || ''}
                            disabled={isSubmitting}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-4 focus:border-white/20 outline-none text-gray-400 font-bold"
                            onChange={(e) => setFormData({ ...formData, ciscoWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                {stats.yieldFactor > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className={`p-8 rounded-industrial border flex flex-col items-center justify-center transition-all animate-in zoom-in duration-500 ${stats.yieldFactor <= 94 ? 'bg-brand-green/10 border-brand-green/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 mb-2">Factor de Rendimiento Est.</span>
                            <span className={`text-6xl font-bold font-mono tracking-tighter ${stats.yieldFactor <= 94 ? 'text-brand-green-bright' : 'text-orange-500'}`}>
                                {stats.yieldFactor.toFixed(2)}
                            </span>
                            <div className="mt-4 flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${stats.yieldFactor <= 94 ? 'bg-brand-green-bright animate-pulse' : 'bg-orange-500'}`}></div>
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em]">
                                    {stats.yieldFactor <= 94 ? 'Lote de Alta Calidad' : 'Rendimiento Fuera de Rango'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-bg-main/50 p-8 border border-white/5 rounded-industrial space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">Balance de Masa Industrial</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 uppercase font-bold tracking-tighter">Eficiencia de Trilla</span>
                                    <span className="text-white font-bold">{stats.yieldPct.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-brand-green h-full transition-all duration-1000" style={{ width: `${stats.yieldPct}%` }}></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <p className="text-[8px] text-gray-600 uppercase font-bold">Merma de Proceso</p>
                                        <p className="text-sm font-bold text-brand-red-bright">{stats.loss.toFixed(1)} kg <span className="text-[9px] opacity-50">({stats.lossPct.toFixed(1)}%)</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-gray-600 uppercase font-bold">Total Salida</p>
                                        <p className="text-sm font-bold text-white">{stats.totalOut.toFixed(1)} kg</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !formData.excelsoWeight}
                    className="w-full bg-white hover:bg-brand-green-bright text-black hover:text-white font-bold py-6 rounded-industrial-sm transition-all disabled:opacity-30 flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl"
                >
                    {isSubmitting ? 'SINCRONIZANDO CON SERVIDOR AXIS...' : 'SELLAR SALIDA DE TRILLA'}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14M12 5l7 7-7-7" />
                    </svg>
                </button>
                <p className="text-center text-[8px] text-gray-600 font-bold uppercase tracking-widest">
                    Nota: El factor oficial se calcula en el servidor para garantizar la trazabilidad.
                </p>
            </form>
        </div>
    );
}
