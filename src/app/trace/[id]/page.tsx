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
            const data = await getBatchStory(id, undefined);
            setStory(data);
        } catch (err) {
            console.error("Error fetching story:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-black"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-12 flex flex-col items-center justify-center">
            <header className="mb-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 mb-6 flex items-center justify-center p-2">
                    <img src="/tatama.png" alt="Asociación Tatama" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-brand-navy">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-brand-navy  uppercase">AXISONE <span className="text-brand-navy-bright">VERIFY</span></h1>
                </div>
                <p className="text-[11px] text-brand-navy uppercase  font-bold">Archivo generado para la Asociación Tatama</p>
            </header>

            <div className="max-w-md w-full bg-bg-main border border-gray-200 shadow-sm rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-white rounded-full flex items-center justify-center text-[9px] font-mono text-gray-900 uppercase z-20">Secure Token Verifier</div>

                <div className="h-64 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=3540&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Farm" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent blur-sm"></div>
                </div>

                <div className="p-8 -mt-12 bg-bg-main rounded-t-[3rem] relative space-y-8">
                    <header>
                        <div className="flex justify-between items-start">
                            <h3 className="text-3xl font-bold uppercase er leading-none">{story?.producer?.split(' ')[0] || 'Asociación'}<br />{story?.producer?.split(' ')[1] || 'Tatama'}</h3>
                            <span className="bg-white border border-gray-200 shadow-sm text-brand-navy text-[11px] font-bold px-3 py-1 rounded-full uppercase border border-gray-200 shadow-sm">Lote {story?.roast?.batch_id_label || id}</span>
                        </div>
                        <p className="text-xs text-brand-navy mt-6 leading-relaxed font-medium">
                            Este café fue cultivado en la finca <strong>{story?.farm || 'Alejandría'}</strong> a {story?.height || '1.850 msnm'}.
                        </p>
                    </header>

                    <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-200 shadow-sm">
                        <div className="text-center">
                            <p className="text-[9px] text-gray-900 uppercase font-bold mb-1">Proceso</p>
                            <p className="text-xs font-bold uppercase text-brand-navy">{story?.process || 'Natural'}</p>
                        </div>
                        <div className="text-center border-x border-gray-200 shadow-sm">
                            <p className="text-[9px] text-gray-900 uppercase font-bold mb-1">Puntaje</p>
                            <p className="text-xs font-bold text-brand-navy-bright">{story?.sensoryScore || 87.5} pts (Basado en estándares SCA)</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-gray-900 uppercase font-bold mb-1">Tueste</p>
                            <p className="text-xs font-bold uppercase text-brand-navy">Perfil Oro</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-bold uppercase  text-brand-navy-bright">Notas Catadas</h4>
                        <div className="flex flex-wrap gap-2 text-[9px]">
                            {story?.notes?.map((note: string) => (
                                <span key={note} className="px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm font-bold uppercase">{note}</span>
                            )) || (
                                    <>
                                        <span className="px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm font-bold uppercase">Chocolate</span>
                                        <span className="px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm font-bold uppercase">Frutos Rojos</span>
                                    </>
                                )}
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-gray-200 shadow-sm text-brand-navy rounded-3xl space-y-2">
                        <h4 className="text-[11px] font-bold uppercase  text-brand-navy-bright">Recomendación Tatama</h4>
                        <p className="text-[11px] font-bold uppercase leading-relaxed">Muele fino para V60: Ratio 1:15 con agua a 92°C para resaltar la acidez dinámica de este lote.</p>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-4 bg-white hover:bg-white text-brand-navy hover:text-brand-navy border border-gray-200 shadow-sm rounded-2xl text-[11px] font-bold uppercase  transition-all"
                    >
                        Ver Más Productos
                    </button>
                </div>
            </div>

            <footer className="mt-12 text-center pb-8 opacity-50">
                <p className="text-[9px] text-gray-600 uppercase ">© {new Date().getFullYear()} AXISONE COFFEE | Consumer Experience</p>
            </footer>
        </div>
    );
}
