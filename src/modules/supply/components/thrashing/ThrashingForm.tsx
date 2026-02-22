'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface ThrashingFormProps {
    inventoryId: string;
    parchmentWeight: number;
    onThrashingComplete: () => void;
}

export default function ThrashingForm({ inventoryId, parchmentWeight, onThrashingComplete }: ThrashingFormProps) {
    const [formData, setFormData] = useState({
        excelsoWeight: 0,
        ciscoWeight: 0,
        pasillaWeight: 0
    });

    const [yieldFactor, setYieldFactor] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (formData.excelsoWeight > 0) {
            // Fórmula de Factor de Rendimiento Colombiano:
            // (Peso Pergamino (70kg base) / Peso Excelso) * 70
            // O más simple: (Peso Pergamino Total / Peso Excelso Total) * 70
            const factor = (parchmentWeight / formData.excelsoWeight) * 70;
            setYieldFactor(factor);
        } else {
            setYieldFactor(null);
        }
    }, [formData.excelsoWeight, parchmentWeight]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('coffee_purchase_inventory')
                .update({
                    thrashed_weight: formData.excelsoWeight,
                    thrashing_yield: yieldFactor,
                    status: 'thrashed'
                    // Nota: Podríamos extender el esquema para guardar pasilla y cisco
                })
                .eq('id', inventoryId);

            if (error) throw error;
            onThrashingComplete();
        } catch (err) {
            console.error("Error en trilla:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-bg-card border border-white/5 p-8 rounded-3xl space-y-6">
            <header>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                    Proceso de Trilla Industrial
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase font-mono">Transformación: Pergamino → Verde (Excelso)</p>
            </header>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entrada Pergamino:</span>
                <span className="text-lg font-bold text-white font-mono">{parchmentWeight} KG</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Peso Excelso (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            required
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:border-brand-green outline-none font-bold text-xl"
                            onChange={(e) => setFormData({ ...formData, excelsoWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Pasilla (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:border-white/20 outline-none text-gray-400"
                            onChange={(e) => setFormData({ ...formData, pasillaWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Cisco / Merma (KG)</label>
                        <input
                            type="number"
                            step="0.1"
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 focus:border-white/20 outline-none text-gray-400"
                            onChange={(e) => setFormData({ ...formData, ciscoWeight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                {yieldFactor !== null && (
                    <div className={`p-6 rounded-2xl border flex flex-col items-center transition-all ${yieldFactor <= 94 ? 'bg-brand-green/10 border-brand-green/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Factor de Rendimiento</span>
                        <span className={`text-4xl font-bold font-mono ${yieldFactor <= 94 ? 'text-brand-green-bright' : 'text-orange-500 text-shadow-glow'}`}>
                            {yieldFactor.toFixed(2)}
                        </span>
                        <p className="text-[9px] mt-2 uppercase font-mono font-bold tracking-widest">
                            {yieldFactor <= 94 ? '✓ ALTA CALIDAD EXPORTABLE' : '⚠ REVISAR MERMA / PASILLA'}
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !formData.excelsoWeight}
                    className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-brand-green hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                >
                    {isSubmitting ? 'PROCESANDO...' : 'REGISTRAR SALIDA DE TRILLA'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
