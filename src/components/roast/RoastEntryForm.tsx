'use client';

import React, { useState, useEffect } from 'react';
import { ProcessType } from '@/types';

export default function RoastEntryForm() {
    const [formData, setFormData] = useState({
        batchId: 'AX-' + Math.floor(Math.random() * 9000 + 1000),
        process: 'washed' as ProcessType,
        greenWeight: 0,
        roastedWeight: 0,
        profileId: 'SUPREMO-DXB-01',
        developmentPct: 18.5
    });

    const [yieldLoss, setYieldLoss] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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
            // Importación dinámica para evitar errores si las env vars no están listas
            const { supabase } = await import('@/lib/supabase');

            const { error } = await supabase
                .from('roast_batches')
                .insert([
                    {
                        batch_id_label: formData.batchId,
                        process: formData.process,
                        green_weight: formData.greenWeight,
                        roasted_weight: formData.roastedWeight,
                        profile_id: '88888888-8888-8888-8888-888888888888', // ID Temporal
                        company_id: '99999999-9999-9999-9999-999999999999'  // ID Temporal
                    }
                ]);

            if (error) throw error;

            setStatus({ type: 'success', message: '¡Lote guardado exitosamente en la nube!' });
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', message: 'Error: Configura las credenciales de Supabase en .env.local' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {status && (
                <div className={`p-4 rounded-xl text-sm font-bold border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                    {status.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Info */}
                <section className="bg-bg-card border border-white/5 p-8 rounded-3xl">
                    <h3 className="text-brand-green-bright font-bold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                        Información del Batch
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID del Batch</label>
                            <input
                                type="text"
                                value={formData.batchId}
                                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Proceso</label>
                            <select
                                value={formData.process}
                                onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all"
                                disabled={isSubmitting}
                            >
                                <option value="washed">Lavado</option>
                                <option value="honey">Honey</option>
                                <option value="natural">Natural</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Weights & Yield */}
                <section className="bg-bg-card border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                    <h3 className="text-brand-green-bright font-bold mb-6">Control de Masa</h3>

                    <div className="space-y-6">
                        <div className="relative">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Peso Verde (Entrada)</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    onChange={(e) => setFormData({ ...formData, greenWeight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none pr-12"
                                    placeholder="0.0"
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-4 top-[38px] text-gray-600 font-mono text-xs">KG</span>
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Peso Tostado (Salida)</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    onChange={(e) => setFormData({ ...formData, roastedWeight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none pr-12"
                                    placeholder="0.0"
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-4 top-[38px] text-gray-600 font-mono text-xs">KG</span>
                            </div>
                        </div>

                        <div className={`mt-8 p-6 rounded-2xl border transition-all ${yieldLoss && yieldLoss > 16 ? 'bg-brand-red/10 border-brand-red/30' : 'bg-white/5 border-white/5'}`}>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-400">Merma Calculada (Yield Loss)</span>
                                <span className={`text-2xl font-bold font-mono ${yieldLoss && yieldLoss > 16 ? 'text-brand-red-bright' : 'text-brand-green-bright'}`}>
                                    {yieldLoss ? yieldLoss.toFixed(2) + '%' : '--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-3 group ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isSubmitting ? 'GUARDANDO EN NUBE...' : 'PROCESAR ANÁLISIS Y GUARDAR'}
                {!isSubmitting && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                )}
            </button>
        </form>
    );
}
