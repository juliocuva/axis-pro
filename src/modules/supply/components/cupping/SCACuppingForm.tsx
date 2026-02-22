'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface SCACuppingFormProps {
    inventoryId: string;
    onCuppingComplete: () => void;
}

const CATEGORIES = [
    { id: 'fragrance_aroma', label: 'Fragancia/Aroma' },
    { id: 'flavor', label: 'Sabor' },
    { id: 'aftertaste', label: 'Posh-gusto' },
    { id: 'acidity', label: 'Acidez' },
    { id: 'body', label: 'Cuerpo' },
    { id: 'balance', label: 'Balance' },
    { id: 'overall', label: 'Global' }
];

export default function SCACuppingForm({ inventoryId, onCuppingComplete }: SCACuppingFormProps) {
    const [scores, setScores] = useState<Record<string, number>>({
        fragrance_aroma: 7.5,
        flavor: 7.5,
        aftertaste: 7.5,
        acidity: 7.5,
        body: 7.5,
        balance: 7.5,
        uniformity: 10,
        clean_cup: 10,
        sweetness: 10,
        overall: 7.5,
        defects_score: 0
    });

    const [totalScore, setTotalScore] = useState(80);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const sum =
            scores.fragrance_aroma + scores.flavor + scores.aftertaste +
            scores.acidity + scores.body + scores.balance +
            scores.uniformity + scores.clean_cup + scores.sweetness +
            scores.overall - (scores.defects_score * 2);
        setTotalScore(sum);
    }, [scores]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('sca_cupping')
                .insert([{
                    inventory_id: inventoryId,
                    ...scores,
                    company_id: '99999999-9999-9999-9999-999999999999'
                }]);

            if (error) throw error;
            onCuppingComplete();
        } catch (err) {
            console.error("Error en catación:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-bg-card border border-white/5 p-8 rounded-3xl space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                        Reporte de Catación SCA
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase font-mono">Protocolo de Especialidad (Sample Roast)</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-mono mb-1">Puntaje Total</p>
                    <p className={`text-4xl font-bold font-mono ${totalScore >= 84 ? 'text-brand-green-bright' : totalScore >= 80 ? 'text-blue-400' : 'text-orange-500'}`}>
                        {totalScore.toFixed(2)}
                    </p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} className="bg-bg-main p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.label}</label>
                                <span className="text-brand-green-bright font-mono text-sm font-bold">{scores[cat.id]}</span>
                            </div>
                            <input
                                type="range" min="6" max="10" step="0.25" value={scores[cat.id]}
                                className="w-full accent-brand-green bg-white/5 h-1.5 rounded-full appearance-none outline-none"
                                onChange={(e) => setScores({ ...scores, [cat.id]: parseFloat(e.target.value) })}
                            />
                        </div>
                    ))}

                    <div className="bg-brand-red/5 p-4 rounded-2xl border border-brand-red/10 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-brand-red-bright uppercase tracking-widest">Defectos (Taza)</label>
                            <span className="text-brand-red-bright font-mono text-sm font-bold">-{scores.defects_score * 2}</span>
                        </div>
                        <input
                            type="number" min="0" max="5" value={scores.defects_score}
                            className="w-full bg-bg-card border border-brand-red/20 rounded-xl px-3 py-2 text-sm font-bold text-brand-red-bright outline-none"
                            onChange={(e) => setScores({ ...scores, defects_score: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-4 py-5 bg-brand-green hover:bg-brand-green-bright text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand-green/20"
                >
                    {isSubmitting ? 'GENERANDO ARCHIVO Q-GRADER...' : 'FINALIZAR HOJA DE VIDA DEL LOTE'}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 19l7-7-7-7M5 12h14" /></svg>
                </button>
            </form>
        </div>
    );
}
