'use client';

import React, { useState, useEffect } from 'react';
import { processThrashingAction } from '../../actions/thrashing';

interface ThrashingFormProps {
    inventoryId: string;
    parchmentWeight: number;
    onThrashingComplete: () => void;
}

export default function ThrashingForm({ inventoryId, parchmentWeight, onThrashingComplete }: ThrashingFormProps) {
    const [formData, setFormData] = useState({
        excelsoWeight: 0,
        pasillaWeight: 0,
        ciscoWeight: 0
    });

    const [yieldFactor, setYieldFactor] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estimación visual en el cliente (solo para UX, no se guarda)
    useEffect(() => {
        if (formData.excelsoWeight > 0) {
            const factor = (parchmentWeight / formData.excelsoWeight) * 70;
            setYieldFactor(factor);
        } else {
            setYieldFactor(null);
        }
    }, [formData.excelsoWeight, parchmentWeight]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await processThrashingAction(
                inventoryId,
                formData.excelsoWeight,
                formData.pasillaWeight,
                formData.ciscoWeight
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
        <div className="bg-bg-card border border-white/5 p-8 rounded-3xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>

            <header className="relative z-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                    Módulo de Trilla Industrial
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase font-mono tracking-widest">Procedimiento: Pergamino → Oro (Excelso)</p>
            </header>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center relative z-10">
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
                            disabled={isSubmitting}
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-4 focus:border-brand-green outline-none font-black text-2xl text-brand-green-bright transition-all"
                            onChange={(e) => setFormData({ ...formData, excelsoWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Pasilla (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            disabled={isSubmitting}
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-4 focus:border-white/20 outline-none text-gray-400 font-bold"
                            onChange={(e) => setFormData({ ...formData, pasillaWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Cisco (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            disabled={isSubmitting}
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-4 focus:border-white/20 outline-none text-gray-400 font-bold"
                            onChange={(e) => setFormData({ ...formData, ciscoWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                {yieldFactor !== null && (
                    <div className={`p-8 rounded-3xl border flex flex-col items-center transition-all animate-in zoom-in duration-500 ${yieldFactor <= 94 ? 'bg-brand-green/10 border-brand-green/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 mb-2">Factor de Rendimiento Est.</span>
                        <span className={`text-6xl font-black font-mono tracking-tighter ${yieldFactor <= 94 ? 'text-brand-green-bright' : 'text-orange-500'}`}>
                            {yieldFactor.toFixed(2)}
                        </span>
                        <div className="mt-4 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${yieldFactor <= 94 ? 'bg-brand-green-bright animate-pulse' : 'bg-orange-500'}`}></div>
                            <p className="text-[10px] uppercase font-bold tracking-[0.2em]">
                                {yieldFactor <= 94 ? 'Lote de Alta Calidad Para Exportación' : 'Rendimiento Fuera de Rango Estándar'}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !formData.excelsoWeight}
                    className="w-full bg-white hover:bg-brand-green-bright text-black hover:text-white font-black py-6 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl"
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
