'use client';

import React, { useState, useEffect } from 'react';
import { ProcessType } from '@/types';
import RoastCurveAnalysis from './RoastCurveAnalysis';

export default function RoastEntryForm() {
    const [formData, setFormData] = useState({
        batchId: 'AX-' + Math.floor(Math.random() * 9000 + 1000),
        process: 'washed' as ProcessType,
        greenWeight: 0,
        roastedWeight: 0,
        profileId: 'SUPREMO-DXB-01',
        developmentPct: 18.5,
        roastDate: new Date().toISOString().split('T')[0]
    });

    const [yieldLoss, setYieldLoss] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (formData.greenWeight > 0 && formData.roastedWeight > 0) {
            const loss = ((formData.greenWeight - formData.roastedWeight) / formData.greenWeight) * 100;
            setYieldLoss(loss);
        } else {
            setYieldLoss(null);
        }
    }, [formData.greenWeight, formData.roastedWeight]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const { supabase } = await import('@/lib/supabase');
            const { error } = await supabase
                .from('roast_batches')
                .insert([
                    {
                        batch_id_label: formData.batchId,
                        process: formData.process,
                        roast_date: formData.roastDate,
                        green_weight: formData.greenWeight,
                        roasted_weight: formData.roastedWeight,
                        profile_id: '88888888-8888-8888-8888-888888888888',
                        company_id: '99999999-9999-9999-9999-999999999999'
                    }
                ]);

            if (error) throw error;

            setStatus({ type: 'success', message: '¡Lote guardado exitosamente!' });
            setShowResult(true); // Cambiamos a vista de resultado
        } catch (err: any) {
            console.error("DEBUG ROAST:", err);
            setStatus({
                type: 'error',
                message: `Error de Conexión: ${err.message || 'No se pudo contactar con Supabase'}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showResult) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-in zoom-in duration-500">
                <div className="bg-brand-green/10 border border-brand-green/30 p-6 rounded-3xl text-center">
                    <h2 className="text-2xl font-bold text-brand-green-bright mb-2">¡Tostión Finalizada Exitosamente!</h2>
                    <p className="text-gray-400 text-sm">El lote <span className="text-white font-mono">{formData.batchId}</span> ha sido registrado y analizado.</p>
                </div>

                <RoastCurveAnalysis batchId={formData.batchId} />

                <div className="flex justify-center">
                    <button
                        onClick={() => {
                            setShowResult(false);
                            setFormData({
                                ...formData,
                                batchId: 'AX-' + Math.floor(Math.random() * 9000 + 1000),
                                greenWeight: 0,
                                roastedWeight: 0
                            });
                            setStatus(null);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold transition-all border border-white/10"
                    >
                        REGISTRAR OTRO LOTE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Registro de Salida de Tostión</h2>
                <p className="text-gray-500 text-sm">Ingresa los pesos finales para generar el reporte de curva y rendimiento.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {status && (
                    <div className={`p-4 rounded-xl text-sm font-bold border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                        {status.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="bg-bg-card border border-white/5 p-8 rounded-3xl">
                        <h3 className="text-brand-green-bright font-bold mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Identificación
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Batch Serial ID</label>
                                <input
                                    type="text"
                                    value={formData.batchId}
                                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:border-brand-green outline-none transition-all font-mono text-brand-green-bright"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Fecha de Tostión</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.roastDate}
                                    onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:border-brand-green outline-none transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Tipo de Proceso</label>
                                <select
                                    value={formData.process}
                                    onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:border-brand-green outline-none transition-all uppercase text-xs font-bold"
                                    disabled={isSubmitting}
                                >
                                    <option value="washed">Lavado</option>
                                    <option value="honey">Honey</option>
                                    <option value="natural">Natural</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="bg-bg-card border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                        <h3 className="text-brand-green-bright font-bold mb-6 text-sm uppercase tracking-widest">Control Masivo</h3>

                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Peso Verde (Kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    onChange={(e) => setFormData({ ...formData, greenWeight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-4 focus:border-brand-green outline-none text-xl font-bold"
                                    placeholder="0.0"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="relative">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Peso Tostado (Kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    onChange={(e) => setFormData({ ...formData, roastedWeight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-4 focus:border-brand-green outline-none text-xl font-bold"
                                    placeholder="0.0"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {yieldLoss !== null && (
                                <div className={`mt-4 p-4 rounded-xl border flex justify-between items-center ${yieldLoss > 16 ? 'bg-brand-red/10 border-brand-red/30' : 'bg-brand-green/10 border-brand-green/30'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Merma:</span>
                                    <span className={`text-lg font-bold font-mono ${yieldLoss > 16 ? 'text-brand-red-bright' : 'text-brand-green-bright'}`}>
                                        {yieldLoss.toFixed(2)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-3 group ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? 'SINCRONIZANDO...' : 'FINALIZAR TOSTIÓN Y GENERAR REPORTE'}
                    {!isSubmitting && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
