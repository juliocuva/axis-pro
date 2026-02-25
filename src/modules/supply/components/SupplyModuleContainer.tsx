'use client';

import React, { useState, useEffect } from 'react';
import PurchaseForm from './PurchaseForm';
import ThrashingForm from './thrashing/ThrashingForm';
import PhysicalAnalysisForm from './analysis/PhysicalAnalysisForm';
import SCACuppingForm from './cupping/SCACuppingForm';
import LotCertificate from './analysis/LotCertificate';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';
import { supabase } from '@/shared/lib/supabase';

interface SupplyModuleContainerProps {
    user: { email: string, name: string, companyId: string } | null;
}

export default function SupplyModuleContainer({ user }: SupplyModuleContainerProps) {
    const [activeTab, setActiveTab] = useState<'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'archive'>('purchase');
    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [recentLots, setRecentLots] = useState<any[]>([]);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        if (user?.companyId) {
            fetchRecentLots();
        }
    }, [user?.companyId]);

    const fetchRecentLots = async () => {
        const { data } = await supabase
            .from('coffee_purchase_inventory')
            .select('*')
            .eq('company_id', user?.companyId)
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

        // Si es exportación directa, marcamos visualmente que Roast Intelligence es opcional
        if (lot.destination === 'export') {
            console.log("AXIS LOG: Lote de Exportación Detectado. Habilitando Flujo B.");
        }
    };

    return (
        <>
            {showCertificate && selectedLot && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-black/80 backdrop-blur-xl">
                    <LotCertificate
                        inventoryId={selectedLot.id}
                        user={user}
                        onClose={() => setShowCertificate(false)}
                    />
                </div>
            )}

            <div className="space-y-12 animate-in fade-in duration-700">
                <header className="flex justify-between items-end animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">
                            {activeTab === 'purchase' ? 'Registro de Compra y Origen' :
                                activeTab === 'thrashing' ? 'Trilla y Transformación' :
                                    activeTab === 'analysis' ? 'Laboratorio Físico' :
                                        activeTab === 'cupping' ? 'Catación y Perfil de Taza' : 'Archivo Global Cloud'}
                        </h2>
                        <p className="text-xs text-brand-green font-bold uppercase tracking-[0.4em] mt-2">
                            {activeTab === 'purchase' ? 'Fase 01: Ingreso de Café Pergamino' :
                                activeTab === 'thrashing' ? 'Fase 02: Proceso de Trillado Industrial' :
                                    activeTab === 'analysis' ? 'Fase 03: Control de Calidad Física' :
                                        activeTab === 'cupping' ? 'Fase 04: Evaluación Sensorial SCA' : 'Historial Maestro de Trazabilidad'}
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* COLUMNA PRINCIPAL (75%) */}
                    <div className="xl:col-span-3 flex flex-col gap-8">
                        {/* TABS DE NAVEGACIÓN - IGUAL AL ANCHO DEL FORMULARIO */}
                        <nav className="flex bg-bg-card p-1.5 rounded-industrial border border-white/5 shadow-2xl w-full">
                            <button
                                onClick={() => setActiveTab('purchase')}
                                className={`flex-1 py-4 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === 'purchase' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                01. Ingreso
                            </button>
                            <button
                                onClick={() => setActiveTab('thrashing')}
                                className={`flex-1 py-4 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === 'thrashing' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                disabled={!selectedLot}
                            >
                                02. Trilla
                            </button>
                            <button
                                onClick={() => setActiveTab('analysis')}
                                className={`flex-1 py-4 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === 'analysis' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                disabled={!selectedLot}
                            >
                                03. Lab Físico
                            </button>
                            <button
                                onClick={() => setActiveTab('cupping')}
                                className={`flex-1 py-4 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === 'cupping' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                disabled={!selectedLot}
                            >
                                04. Catación
                            </button>
                            <button
                                onClick={() => setActiveTab('archive')}
                                className={`flex-1 py-4 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'archive' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                05. Archivo
                            </button>
                        </nav>

                        {/* CONTENIDO DEL TEMA ACTIVO */}
                        <div className="flex-1 space-y-8 min-h-[600px]">
                            {selectedLot && activeTab !== 'archive' && (
                                <div className="bg-brand-green/10 border border-brand-green/30 px-6 py-4 rounded-industrial-sm flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center border border-brand-green/30">
                                            <span className="text-brand-green font-bold text-xs">ID</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-brand-green-bright font-bold uppercase tracking-widest">Lote en Sincronización</p>
                                            <p className="text-sm font-bold text-white">{selectedLot.farmer_name} | {selectedLot.variety} | {selectedLot.lot_number}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {selectedLot.destination === 'export' && (
                                            <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-industrial-sm flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">FLUJO B: EXPORTACIÓN</span>
                                            </div>
                                        )}
                                        {selectedLot.status === 'completed' && (
                                            <button
                                                onClick={() => setShowCertificate(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-black text-[9px] font-bold rounded-industrial-sm hover:bg-brand-green-bright transition-all"
                                            >
                                                VER CERTIFICADO
                                            </button>
                                        )}
                                        <button onClick={() => setSelectedLot(null)} className="p-2 text-brand-green hover:text-white transition-colors bg-white/5 rounded-industrial-sm">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'purchase' && (
                                <PurchaseForm
                                    selectedLot={selectedLot}
                                    user={user}
                                    onPurchaseComplete={(lot) => {
                                        setSelectedLot(lot);
                                        fetchRecentLots();
                                    }}
                                />
                            )}
                            {activeTab === 'thrashing' && selectedLot && (
                                <div className="space-y-6">
                                    <ThrashingForm
                                        inventoryId={selectedLot.id}
                                        parchmentWeight={selectedLot.purchase_weight}
                                        user={user}
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
                                        lotDestination={selectedLot.destination}
                                        user={user}
                                        onAnalysisComplete={async () => {
                                            await fetchRecentLots();
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
                                        user={user}
                                        onCuppingComplete={async () => {
                                            await fetchRecentLots();
                                            const { data } = await supabase.from('coffee_purchase_inventory').select('*').eq('id', selectedLot.id).single();
                                            if (data) setSelectedLot(data);
                                            setShowCertificate(true);
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

                            {activeTab === 'archive' && <GlobalHistoryArchive user={user} />}

                            {!selectedLot && activeTab !== 'purchase' && (
                                <div className="bg-bg-card border border-dashed border-white/10 rounded-industrial p-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600 border border-white/5">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 15l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2M12 2a10 10 0 110 20 10 10 0 010-20z" /></svg>
                                    </div>
                                    <h4 className="text-2xl font-bold text-gray-400 uppercase tracking-tighter">Selecciona un lote para continuar</h4>
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">Flujo Industrial: Ingreso → Trilla → Análisis → Catación</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA LATERAL (25%) */}
                    <aside className="xl:col-span-1 flex flex-col gap-8">
                        {/* BOTÓN CREAR LOTE - MISMO ANCHO QUE EL HISTORIAL */}
                        <button
                            onClick={() => { setSelectedLot(null); setActiveTab('purchase'); }}
                            className="w-full py-[1.125rem] bg-brand-green text-black font-bold uppercase text-[10px] tracking-[0.2em] rounded-industrial-sm hover:bg-brand-green-bright hover:scale-105 transition-all shadow-2xl shadow-brand-green/20 ring-1 ring-white/10 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                            Crear Nuevo Lote
                        </button>

                        {/* HISTORIAL - ALTURA SINCRONIZADA CON SECCIONES DEL FORMULARIO */}
                        <div className="bg-bg-card border border-white/10 p-8 rounded-industrial flex flex-col relative overflow-hidden group h-[710px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-6 flex items-center justify-between">
                                Transformación
                                <span className="bg-white/5 px-2 py-1 rounded-industrial-sm text-[8px]">{recentLots.length} ACTIVOS</span>
                            </h4>
                            <div className="flex-1 space-y-3 overflow-y-auto pr-3 custom-scrollbar">
                                {recentLots.map(lot => (
                                    <div
                                        key={lot.id}
                                        onClick={() => handleLotSelect(lot)}
                                        className={`p-4 rounded-industrial-sm border transition-all cursor-pointer group/item relative overflow-hidden ${selectedLot?.id === lot.id ? 'bg-brand-green/10 border-brand-green/30 shadow-lg' : 'bg-bg-main border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-bold uppercase truncate max-w-[120px] text-white/80">{lot.farmer_name}</p>
                                            <div className="flex gap-2 items-center">
                                                {lot.destination === 'export' && (
                                                    <span className="text-[6px] font-black bg-blue-500 text-white px-1 py-0.5 rounded">EXP</span>
                                                )}
                                                <span className={`text-[6px] font-bold px-1.5 py-0.5 rounded-md uppercase border ${lot.status === 'thrashed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' :
                                                    lot.status === 'completed' ? 'bg-brand-green/10 text-brand-green-bright border-brand-green/10' :
                                                        'bg-orange-500/5 text-orange-400 border-orange-500/10'
                                                    }`}>
                                                    {lot.status === 'purchased' ? 'INGR' : lot.status === 'thrashed' ? 'TRIL' : 'CUPS'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[8px] text-gray-600 font-mono tracking-tighter">{lot.lot_number}</p>
                                            <div className="flex gap-1.5 items-center">
                                                {[1, 2, 3, 4].map(s => {
                                                    let isDone = false;
                                                    if (s === 1) isDone = true;
                                                    if (s === 2 && (lot.status === 'thrashed' || lot.status === 'completed')) isDone = true;
                                                    if (s === 3 && (lot.status === 'completed' || lot.thrashed_weight > 0)) isDone = true;
                                                    if (s === 4 && lot.status === 'completed') isDone = true;
                                                    return (
                                                        <div
                                                            key={s}
                                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isDone ? 'bg-brand-green shadow-[0_0_4px_rgba(0,255,136,0.4)]' : 'bg-white/10'}`}
                                                            title={s === 1 ? 'Ingreso' : s === 2 ? 'Trilla' : s === 3 ? 'Laboratorio' : 'Catación'}
                                                        ></div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recentLots.length === 0 && (
                                    <div className="py-20 text-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
                                        Sin Registros
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}
