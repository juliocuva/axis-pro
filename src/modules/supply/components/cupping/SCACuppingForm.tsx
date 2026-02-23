'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { submitCuppingProtocol } from '../../actions/quality';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface SCACuppingFormProps {
    inventoryId: string;
    onCuppingComplete: () => void;
}

const CATEGORIES = [
    { id: 'fragrance_aroma', label: 'Fragancia' },
    { id: 'flavor', label: 'Sabor' },
    { id: 'aftertaste', label: 'Post-gusto' },
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

    const [tasterName, setTasterName] = useState('Q-Grader Senior');
    const [notes, setNotes] = useState('');
    const [chartData, setChartData] = useState<any[]>([]);
    const [totalScore, setTotalScore] = useState(80);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCupping = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('sca_cupping')
                    .select('*')
                    .eq('inventory_id', inventoryId.trim())
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (data && data.length > 0 && !error) {
                    const record = data[0];
                    console.log("AXIS DB SUCCESS (Catación):", record);
                    setScores({
                        fragrance_aroma: Number(record.fragrance_aroma) || 0.001,
                        flavor: Number(record.flavor) || 0.001,
                        aftertaste: Number(record.aftertaste) || 0.001,
                        acidity: Number(record.acidity) || 0.001,
                        body: Number(record.body) || 0.001,
                        balance: Number(record.balance) || 0.001,
                        uniformity: Number(record.uniformity) || 0.001,
                        clean_cup: Number(record.clean_cup) || 0.001,
                        sweetness: Number(record.sweetness) || 0.001,
                        overall: Number(record.overall) || 0.001,
                        defects_score: Number(record.defects_score) || 0
                    });
                    setTasterName(record.taster_name || 'Q-Grader Senior');
                    setNotes(record.notes || '');
                }
            } catch (err) {
                console.error("AXIS CRITICAL ERROR (Catación):", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (inventoryId) fetchCupping();
    }, [inventoryId]);

    useEffect(() => {
        const sum =
            (Number(scores.fragrance_aroma) || 0) + (Number(scores.flavor) || 0) + (Number(scores.aftertaste) || 0) +
            (Number(scores.acidity) || 0) + (Number(scores.body) || 0) + (Number(scores.balance) || 0) +
            (Number(scores.uniformity) || 0) + (Number(scores.clean_cup) || 0) + (Number(scores.sweetness) || 0) +
            (Number(scores.overall) || 0) - ((Number(scores.defects_score) || 0) * 2);
        setTotalScore(sum);

        const chartDataArray = CATEGORIES.map(cat => ({
            subject: cat.label,
            A: Number(scores[cat.id]) || 0,
            fullMark: 10,
        }));
        setChartData(chartDataArray);
    }, [scores]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Sanetización final de datos para asegurar números limpios
        const cleanScores = Object.keys(scores).reduce((acc, key) => ({
            ...acc,
            [key]: Number(scores[key]) || 0
        }), {});

        console.log("AXIS ACTION (Catación Save):", { cleanScores, tasterName, notes });

        try {
            const result = await submitCuppingProtocol(
                inventoryId,
                cleanScores,
                tasterName,
                notes
            );

            if (!result.success) {
                throw new Error(result.message);
            }

            console.log("AXIS SUCCESS (Catación): Guardado exitosamente");
            onCuppingComplete();
        } catch (err: any) {
            setError(err.message);
            console.error("AXIS ERROR (Catación):", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500 relative">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-3xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-green-bright animate-pulse">Sincronizando con AXIS Cloud...</p>
                    </div>
                </div>
            )}
            <div className="lg:col-span-2 bg-bg-card border border-white/5 p-8 rounded-3xl space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-3xl rounded-full"></div>

                <header className="flex justify-between items-end border-b border-white/5 pb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-brand-green-bright rounded-full"></span>
                            Protocolo SCA V2.0
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            Certificación de Especialidad Q-Grader
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Cali. Final</p>
                        <p className={`text-6xl font-bold tracking-tighter ${totalScore >= 84 ? 'text-brand-green-bright' : totalScore >= 80 ? 'text-blue-400' : 'text-orange-500'}`}>
                            {totalScore.toFixed(2)}
                        </p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    {error && (
                        <div className="p-4 bg-brand-red/10 border border-brand-red/30 rounded-xl text-brand-red-bright text-[10px] font-bold uppercase">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {CATEGORIES.map(cat => (
                            <div key={cat.id} className="bg-bg-main/50 p-5 rounded-2xl border border-white/5 flex flex-col gap-4 group hover:border-brand-green/30 transition-all">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.label}</label>
                                    <span className="text-brand-green-bright font-mono text-lg font-bold">{(scores[cat.id] || 0).toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min="6" max="10" step="0.25" value={scores[cat.id] || 7.5}
                                    disabled={isSubmitting}
                                    className="w-full accent-brand-green-bright bg-white/5 h-1.5 rounded-full appearance-none outline-none cursor-pointer"
                                    onChange={(e) => setScores({ ...scores, [cat.id]: parseFloat(e.target.value) })}
                                />
                            </div>
                        ))}

                        <div className="bg-brand-red/5 p-5 rounded-2xl border border-brand-red/10 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-brand-red-bright uppercase tracking-widest">Tazas con Defectos</label>
                                <span className="text-brand-red-bright font-mono text-lg font-bold">-{(scores.defects_score || 0) * 2} pts</span>
                            </div>
                            <div className="flex gap-2">
                                {[0, 1, 2, 3, 4, 5].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setScores({ ...scores, defects_score: num })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${scores.defects_score === num ? 'bg-brand-red border-brand-red text-white' : 'border-brand-red/20 text-brand-red/50 hover:bg-brand-red/10'}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Catador / Q-Grader</label>
                                <input
                                    type="text"
                                    value={tasterName}
                                    disabled={isSubmitting}
                                    onChange={(e) => setTasterName(e.target.value)}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Notas de Cata</label>
                                <input
                                    type="text"
                                    value={notes}
                                    disabled={isSubmitting}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Descriptores, cuerpo, post-gusto..."
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-4 py-6 bg-white text-black hover:bg-brand-green-bright hover:text-white font-bold rounded-2xl transition-all shadow-2xl group uppercase tracking-[0.2em] text-xs"
                    >
                        {isSubmitting ? 'SELLANDO PROTOCOLO EN AXIS CLOUD...' : 'SELLAR LOTE Y FIRMAR CERTIFICADO'}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7-7 7 7" />
                        </svg>
                    </button>
                </form>
            </div>

            <div className="space-y-6">
                <div className="bg-bg-card border border-white/5 p-8 rounded-3xl h-full flex flex-col items-center justify-center relative overflow-hidden shadow-2xl min-h-[500px]">
                    <div className="absolute inset-0 bg-brand-green/5 blur-3xl opacity-50"></div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-8 relative z-10">Huella Organoléptica Industrial</h4>
                    <div className="w-full h-[300px] min-h-[300px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                <PolarGrid stroke="#ffffff10" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[6, 10]} axisLine={false} tick={false} />
                                <Radar
                                    name="Perfil"
                                    dataKey="A"
                                    stroke="#00a651"
                                    fill="#00a651"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 text-center space-y-3 relative z-10">
                        <span className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border shadow-xl ${totalScore >= 85 ? 'bg-brand-green/20 text-brand-green-bright border-brand-green/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                            {totalScore >= 85 ? '✓ SPECIALTY COFFEE' : '✓ PREMIUM GRADE'}
                        </span>
                        <div className="pt-4 border-t border-white/5 w-full">
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green-bright animate-pulse"></span>
                                Secure IP: Algorithm Protected
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
