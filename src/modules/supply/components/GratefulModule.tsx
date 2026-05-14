'use client';

import React, { useState, useEffect } from 'react';

interface GratefulModuleProps {
    user: any;
    selectedLot: any;
}

export default function GratefulModule({ user, selectedLot }: GratefulModuleProps) {
    const [recognitions, setRecognitions] = useState<any[]>([
        { id: 1, author: 'Markus (The Barn)', location: 'Berlín, DE', message: 'Extraordinaria dulzura en este lote. ¡Gracias!', type: 'recognition', date: 'Hace 2h' },
        { id: 2, author: 'Elena (Coffee Collective)', location: 'Copenhague, DK', message: 'Un proceso natural impecable. Saludos al productor.', type: 'tip', amount: '0.05 SOL', date: 'Ayer' },
        { id: 3, author: 'Jin (Blue Bottle)', location: 'Tokio, JP', message: 'Trazabilidad perfecta. El mapa EUDR nos da mucha confianza.', type: 'recognition', date: 'Hace 3 días' }
    ]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-12">
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">RECONOCIMIENTO</h2>
                <p className="text-[10px] font-bold text-brand-green uppercase tracking-[0.5em]">Axis Foundation • Cross-Border Gratitude Protocol</p>
            </div>
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center mb-4">
                        <span className="text-brand-green font-black">★</span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Alchemy Score</p>
                    <p className="text-3xl font-black text-white">4.92</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center mb-4">
                        <span className="text-brand-green font-black">❤</span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Gratitud Global</p>
                    <p className="text-3xl font-black text-white">128</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center mb-4">
                        <span className="text-brand-green font-black">$</span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Bonos (USD)</p>
                    <p className="text-3xl font-black text-brand-green">+$450.00</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recognition Feed */}
                <section className="bg-bg-card border border-white/10 rounded-[32px] p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-brand-green-bright text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-4 bg-brand-green rounded-full"></span>
                            Historial de Bonificaciones por Excelencia
                        </h3>
                        <span className="text-[9px] font-black text-white/40 uppercase">Total: 15 Bonos</span>
                    </div>
                    
                    {/* Bonus Selector (Importer Simulation View) */}
                    <div className="mb-8 p-6 bg-black/40 border border-brand-green/30 rounded-2xl">
                        <p className="text-[9px] text-brand-green font-black uppercase tracking-widest mb-4 text-center">Ejecutar Bonificación de Calidad (Vista Importador)</p>
                        <div className="flex gap-3">
                            {[1, 2, 3].map(val => (
                                <button key={val} className="flex-1 py-4 bg-brand-green/10 border border-brand-green/40 rounded-xl hover:bg-brand-green hover:text-black transition-all flex flex-col items-center group">
                                    <span className="text-lg font-black group-hover:scale-110 transition-transform">+{val}$</span>
                                    <span className="text-[7px] font-bold uppercase opacity-60">USD / Saco</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {recognitions.map(rec => (
                            <div key={rec.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                                        <p className="text-[14px] font-bold text-gray-800 italic leading-relaxed mb-3">
                                            "El perfil sensorial de este lote es extraordinario. Gracias por cuidar cada etapa de la fermentación. Un saludo desde Berlín."
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">— Barista Senior, The Barn (Berlin)</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                                                <span className="text-[8px] font-bold text-brand-green uppercase">Bono de 3$ Verificado · Custodia Axis Foundation</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[8px] text-gray-600 font-bold uppercase">{rec.date}</span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed italic">"{rec.message}"</p>
                                {rec.type === 'tip' && (
                                    <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-brand-green/10 border border-brand-green/20">
                                        <span className="text-[8px] font-black text-brand-green uppercase tracking-widest">Reconocimiento Económico: {rec.amount}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* World Impact Map */}
                <section className="bg-bg-card border border-white/10 rounded-[32px] p-8 flex flex-col">
                    <h3 className="text-brand-green-bright text-[10px] font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                        <span className="w-1 h-4 bg-brand-green rounded-full"></span>
                        Kit de Etiquetado para Importadores
                    </h3>
                    
                    <div className="flex-1 bg-black/40 rounded-2xl p-8 border border-brand-green/20 flex flex-col items-center text-center justify-center space-y-6">
                        <div className="w-24 h-24 bg-white p-2 rounded-xl shadow-2xl">
                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/verify/lot/' + (selectedLot?.id || 'DEMO'))}`} alt="Axis Portal QR" className="w-full h-full" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-lg font-black text-white uppercase leading-tight tracking-tighter">Portal de Educación AXIS</h4>
                            <p className="text-[9px] text-gray-500 uppercase font-bold leading-relaxed max-w-[220px]">
                                Este código lleva al consumidor a la data técnica completa. Al final del recorrido, podrá activar su bono de excelencia.
                            </p>
                        </div>
                        <button className="w-full py-3 bg-brand-green text-black font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-brand-green-bright transition-all">
                            Descargar Etiquetas de Retail (A4)
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                        <p className="text-[9px] text-brand-green font-black uppercase leading-tight">
                            Status: Tu café está dignificando la mesa de miles de personas en Europa. La trazabilidad EUDR es tu carta de presentación global.
                        </p>
                    </div>
                </section>
            </div>

            {/* Axis Foundation & Profit Sharing Logic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-brand-green p-10 rounded-[40px] text-black relative overflow-hidden">
                    <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">Axis Foundation</h4>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 leading-tight">
                        Garantizamos la entrega local del 100% de los bonos globales sin comisiones bancarias.
                    </p>
                    <div className="mt-6 inline-block bg-black text-white px-4 py-2 rounded-xl font-black text-[9px] tracking-widest uppercase">
                        CLEARING HOUSE ACTIVE
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] text-white relative overflow-hidden">
                    <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2 text-brand-green-bright">Profit Sharing</h4>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 leading-tight">
                        El consumidor no paga extra. Su activación redistribuye la utilidad de AxisOne hacia el productor.
                    </p>
                    <div className="mt-6 flex gap-2">
                        {[1,2,3].map(v => (
                            <div key={v} className="px-3 py-1 bg-brand-green/10 border border-brand-green/30 rounded text-[10px] font-black text-brand-green">+{v}$</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
