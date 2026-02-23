'use client';

import React, { useState, useEffect } from 'react';
import PurchaseForm from './PurchaseForm';
import ThrashingForm from './thrashing/ThrashingForm';
import PhysicalAnalysisForm from './analysis/PhysicalAnalysisForm';
import SCACuppingForm from './cupping/SCACuppingForm';
import LotCertificate from './analysis/LotCertificate';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';
import { supabase } from '@/shared/lib/supabase';

export default function SupplyModuleContainer() {
    const [activeTab, setActiveTab] = useState<'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'archive'>('purchase');
    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [recentLots, setRecentLots] = useState<any[]>([]);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        fetchRecentLots();
    }, []);

    const fetchRecentLots = async () => {
        const { data } = await supabase
            .from('coffee_purchase_inventory')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setRecentLots(data);
    };

    const handleLotSelect = (lot: any) => {
        setSelectedLot(lot);
        // Sugerimos la pestaña según el estado, pero permitimos navegar
        if (lot.status === 'completed') {
            setActiveTab('cupping');
        } else if (lot.status === 'purchased') {
            setActiveTab('thrashing');
        } else if (lot.status === 'thrashed') {
            setActiveTab('analysis');
        } else {
            setActiveTab('cupping');
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* HUB DE GESTIÓN DE LOTES (NUEVO) */}
            <section className="bg-bg-card border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-[120px] rounded-full group-hover:bg-brand-green/10 transition-all"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold uppercase tracking-tighter text-white">Hub de Originación</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1">Control Maestro de Materia Prima</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={() => { setSelectedLot(null); setActiveTab('purchase'); }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-brand-green text-black font-bold uppercase text-[10px] tracking-widest rounded-2xl hover:bg-brand-green-bright hover:scale-105 transition-all shadow-xl shadow-brand-green/10"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                            Crear Nuevo Lote
                        </button>
                        {selectedLot?.status === 'completed' && (
                            <button
                                onClick={() => setShowCertificate(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-white/5 text-white font-bold uppercase text-[10px] tracking-widest rounded-2xl border border-brand-green-bright/30 hover:bg-white/10 transition-all shadow-lg shadow-brand-green/10"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v10m0 0l-3-3m3 3l3-3" /><path d="M22 10a10 10 0 11-20 0" /></svg>
                                Ver Certificado
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <nav className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex bg-bg-card p-1 rounded-2xl border border-white/5 shadow-xl">
                    <button
                        onClick={() => setActiveTab('purchase')}
                        className={`px-8 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'purchase' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        01. Ingreso
                    </button>
                    <button
                        onClick={() => setActiveTab('thrashing')}
                        className={`px-8 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'thrashing' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        disabled={!selectedLot}
                    >
                        02. Trilla
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-8 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'analysis' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        disabled={!selectedLot}
                    >
                        03. Lab Físico
                    </button>
                    <button
                        onClick={() => setActiveTab('cupping')}
                        className={`px-8 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'cupping' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        disabled={!selectedLot}
                    >
                        04. Catación
                    </button>
                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`px-8 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex items-center gap-2 ${activeTab === 'archive' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                        05. Archivo Cloud
                    </button>
                </div>

                {selectedLot && (
                    <div className="bg-brand-green/10 border border-brand-green/30 px-6 py-2.5 rounded-2xl flex items-center gap-4">
                        <span className="text-[10px] text-brand-green-bright font-mono font-bold uppercase tracking-widest">Lote en Proceso:</span>
                        <span className="text-sm font-bold text-white">{selectedLot.farmer_name} | {selectedLot.variety}</span>
                        <button onClick={() => setSelectedLot(null)} className="text-brand-green hover:text-white transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </nav>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-8">
                    {activeTab === 'purchase' && (
                        <PurchaseForm
                            selectedLot={selectedLot}
                            onPurchaseComplete={(lot) => {
                                fetchRecentLots();
                                setSelectedLot(lot);
                                setActiveTab('thrashing');
                            }}
                        />
                    )}
                    {activeTab === 'thrashing' && selectedLot && (
                        <div className="space-y-6">
                            <ThrashingForm
                                inventoryId={selectedLot.id}
                                parchmentWeight={selectedLot.purchase_weight}
                                onThrashingComplete={async () => {
                                    await fetchRecentLots();
                                    const { data } = await supabase.from('coffee_purchase_inventory').select('*').eq('id', selectedLot.id).single();
                                    if (data) setSelectedLot(data);
                                    setActiveTab('analysis');
                                }}
                            />
                            <div className="flex justify-start">
                                <button onClick={() => setActiveTab('purchase')} className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-all">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                    Volver a Ingreso
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'analysis' && selectedLot && (
                        <div className="space-y-6">
                            <PhysicalAnalysisForm
                                inventoryId={selectedLot.id}
                                onAnalysisComplete={async () => {
                                    await fetchRecentLots();
                                    // Refrescamos el lote seleccionado para que la UI sepa que ya tiene análisis
                                    const { data } = await supabase.from('coffee_purchase_inventory').select('*').eq('id', selectedLot.id).single();
                                    if (data) setSelectedLot(data);
                                    setActiveTab('cupping');
                                }}
                            />
                            <div className="flex justify-start">
                                <button onClick={() => setActiveTab('thrashing')} className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-all">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                    Volver a Trilla
                                </button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'cupping' && selectedLot && (
                        <div className="space-y-6">
                            <SCACuppingForm
                                inventoryId={selectedLot.id}
                                onCuppingComplete={async () => {
                                    await fetchRecentLots();
                                    const { data } = await supabase.from('coffee_purchase_inventory').select('*').eq('id', selectedLot.id).single();
                                    if (data) setSelectedLot(data);
                                    setShowCertificate(true); // Mostrar certificado al terminar
                                }}
                            />
                            <div className="flex justify-start">
                                <button onClick={() => setActiveTab('analysis')} className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-all">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                    Volver a Lab Físico
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'archive' && <GlobalHistoryArchive />}

                    {showCertificate && selectedLot && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm overflow-y-auto font-bold uppercase tracking-widest text-[10px]">
                            <LotCertificate
                                inventoryId={selectedLot.id}
                                onClose={() => {
                                    setShowCertificate(false);
                                    // NO reseteamos el lote para permitir seguir viéndolo
                                }}
                            />
                        </div>
                    )}
                    {!selectedLot && activeTab !== 'purchase' && (
                        <div className="bg-bg-card border border-dashed border-white/10 rounded-3xl p-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 15l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2M12 2a10 10 0 110 20 10 10 0 010-20z" /></svg>
                            </div>
                            <h4 className="text-xl font-bold text-gray-400">Selecciona un lote del historial para continuar</h4>
                            <p className="text-sm text-gray-600">Debes seguir el flujo de transformación: Ingreso → Trilla → Análisis → Catación</p>
                        </div>
                    )}
                </div>

                <aside className="space-y-6">
                    <div className="bg-bg-card border border-white/5 p-6 rounded-3xl">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Historial de Transformación</h4>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {recentLots.map(lot => (
                                <div
                                    key={lot.id}
                                    onClick={() => handleLotSelect(lot)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedLot?.id === lot.id ? 'bg-brand-green/10 border-brand-green/30' : 'bg-bg-main border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs font-bold uppercase truncate max-w-[120px]">{lot.farmer_name}</p>
                                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${lot.status === 'thrashed' ? 'bg-blue-500/20 text-blue-400' :
                                            lot.status === 'completed' ? 'bg-brand-green/20 text-brand-green-bright' :
                                                'bg-orange-500/20 text-orange-400'
                                            }`}>
                                            {lot.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-gray-600 font-mono">{new Date(lot.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{lot.purchase_weight}kg</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-brand-green/10 to-transparent p-6 rounded-3xl border border-brand-green/5">
                        <p className="text-[10px] text-brand-green-bright font-bold uppercase tracking-widest mb-2">Tip Industrial</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase text-[9px] opacity-70">"Un factor de rendimiento inferior a 90 indica una calidad excepcional para mercados de alta especialidad."</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
