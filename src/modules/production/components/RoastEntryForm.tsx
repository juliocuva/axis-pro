'use client';

import React, { useState, useEffect } from 'react';
import { ProcessType } from '@/shared/types';
import RoastCurveAnalysis from './RoastCurveAnalysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';

export default function RoastEntryForm({ user }: { user: { companyId: string } | null }) {
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
            const { supabase } = await import('@/shared/lib/supabase');
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
                        company_id: user?.companyId
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
                <div className="bg-brand-green/10 border border-brand-green/30 p-6 rounded-industrial text-center">
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
                        className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-industrial-sm font-bold transition-all border border-white/10"
                    >
                        REGISTRAR OTRO LOTE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'production' }))}
                className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-all mb-4"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Volver a Monitor
            </button>
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Registro de Salida de Tostión</h2>
                <p className="text-gray-500 text-sm">Ingresa los pesos finales para generar el reporte de curva y rendimiento.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {status && (
                    <div className={`p-4 rounded-industrial-sm text-sm font-bold border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                        {status.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial">
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
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none transition-all font-mono text-brand-green-bright"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Fecha de Tostión</label>
                                <div className="relative group/date">
                                    <input
                                        type="date"
                                        required
                                        value={formData.roastDate}
                                        onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                                        className={`w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none transition-all text-brand-green-bright font-bold scheme-dark pr-12 cursor-pointer
                                                [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                        disabled={isSubmitting}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-green-bright opacity-60 group-focus-within/date:opacity-100 transition-opacity">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Tipo de Proceso</label>
                                <div className="relative group/select">
                                    <select
                                        value={formData.process}
                                        onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 focus:border-brand-green outline-none transition-all uppercase text-xs font-bold appearance-none pr-12"
                                        disabled={isSubmitting}
                                    >
                                        <option value="washed">Lavado</option>
                                        <option value="honey">Honey</option>
                                        <option value="natural">Natural</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover/select:text-brand-green transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-bg-card border border-white/5 p-8 rounded-industrial relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                        <h3 className="text-brand-green-bright font-bold mb-6 text-sm uppercase tracking-widest">Control Masivo</h3>

                        <div className="space-y-6">
                            <NumericInput
                                label="Peso Verde (Kg)"
                                value={formData.greenWeight}
                                onChange={(val) => setFormData({ ...formData, greenWeight: val })}
                                step={0.1}
                                unit="KG"
                                required
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-xl font-bold py-4"
                            />

                            <NumericInput
                                label="Peso Tostado (Kg)"
                                value={formData.roastedWeight}
                                onChange={(val) => setFormData({ ...formData, roastedWeight: val })}
                                step={0.1}
                                unit="KG"
                                required
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-xl font-bold py-4"
                            />

                            {yieldLoss !== null && (
                                <div className={`mt-4 p-4 rounded-industrial-sm border flex justify-between items-center ${yieldLoss > 16 ? 'bg-brand-red/10 border-brand-red/30' : 'bg-brand-green/10 border-brand-green/30'}`}>
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
                    className={`w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-industrial-sm transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-3 group ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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

