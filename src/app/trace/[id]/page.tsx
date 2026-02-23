'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getBatchStory } from '@/modules/retail/actions/retailActions';

export default function TraceabilityStoryPage() {
    const params = useParams();
    const id = params.id as string;
    const [story, setStory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchStory();
    }, [id]);

    const fetchStory = async () => {
        try {
            const data = await getBatchStory(id);
            setStory(data);
        } catch (err) {
            console.error("Error fetching story:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-12 flex flex-col items-center justify-center">
            <header className="mb-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-widest uppercase">AXIS <span className="text-purple-400">CONNECT</span></h1>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em]">Transparencia Radical del Grano</p>
            </header>

            <div className="max-w-md w-full bg-bg-main border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-white/5 rounded-full flex items-center justify-center text-[8px] font-mono text-gray-500 uppercase z-20">Secure Token Verifier</div>

                <div className="h-64 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=3540&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Farm" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent blur-sm"></div>
                </div>

                <div className="p-8 -mt-12 bg-bg-main rounded-t-[3rem] relative space-y-8">
                    <header>
                        <div className="flex justify-between items-start">
                            <h3 className="text-3xl font-bold uppercase tracking-tighter leading-none">{story?.producer?.split(' ')[0] || 'Sagrado'}<br />{story?.producer?.split(' ')[1] || 'Corazón'}</h3>
                            <span className="bg-brand-green/20 text-brand-green text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-brand-green/20">Lote {story?.roast?.batch_id_label || id}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-6 leading-relaxed font-medium">
                            Este café fue cultivado en la finca <strong>{story?.farm || 'Alejandría'}</strong> a {story?.height || '1.850 msnm'}.
                        </p>
                    </header>

                    <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5">
                        <div className="text-center">
                            <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Proceso</p>
                            <p className="text-xs font-bold uppercase text-white">{story?.process || 'Natural'}</p>
                        </div>
                        <div className="text-center border-x border-white/10">
                            <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Puntaje</p>
                            <p className="text-xs font-bold text-brand-green-bright">{story?.sensoryScore || 87.5} SCA</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Tueste</p>
                            <p className="text-xs font-bold uppercase text-white">Perfil Oro</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">Notas Catadas</h4>
                        <div className="flex flex-wrap gap-2 text-[9px]">
                            {story?.notes?.map((note: string) => (
                                <span key={note} className="px-3 py-1 bg-white/5 rounded-full border border-white/10 font-bold uppercase">{note}</span>
                            )) || (
                                    <>
                                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 font-bold uppercase">Chocolate</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 font-bold uppercase">Frutos Rojos</span>
                                    </>
                                )}
                        </div>
                    </div>

                    <div className="p-6 bg-purple-600/10 border border-purple-500/20 text-white rounded-3xl space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Recomendación Sagrada</h4>
                        <p className="text-[10px] font-bold uppercase leading-relaxed">Muele fino para V60: Ratio 1:15 con agua a 92°C para resaltar la acidez dinámica de este lote.</p>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        Ver Más Productos
                    </button>
                </div>
            </div>

            <footer className="mt-12 text-center pb-8 opacity-50">
                <p className="text-[8px] text-gray-600 uppercase tracking-widest">© {new Date().getFullYear()} AXIS COFFEE PRO | Consumer Experience</p>
            </footer>
        </div>
    );
}
