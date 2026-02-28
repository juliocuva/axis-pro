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

    // Estados para el Archivo Inteligente (Sidebar)
    const [sidebarMode, setSidebarMode] = useState<'recent' | 'archive'>('recent');
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
    const [allHistory, setAllHistory] = useState<any[]>([]);

    useEffect(() => {
        if (user?.companyId) {
            fetchRecentLots();
        }
    }, [user?.companyId]);

    const fetchRecentLots = async () => {
        // Traemos los últimos 10 para la vista rápida
        const { data: recent } = await supabase
            .from('coffee_purchase_inventory')
            .select('*')
            .eq('company_id', user?.companyId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (recent) setRecentLots(recent);

        // Traemos más para el archivo (Demo: últimos 100)
        const { data: all } = await supabase
            .from('coffee_purchase_inventory')
            .select('*')
            .eq('company_id', user?.companyId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (all) setAllHistory(all);
    };

    // Helper para agrupar por mes y semana
    const getGroupedHistory = () => {
        const groups: Record<string, Record<string, any[]>> = {};

        allHistory.forEach(lot => {
            const date = new Date(lot.created_at);
            const month = date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
            const week = `SEMANA ${Math.ceil(date.getDate() / 7)}`;

            if (!groups[month]) groups[month] = {};
            if (!groups[month][week]) groups[month][week] = [];
            groups[month][week].push(lot);
        });

        return groups;
    };

    const groupedHistory = getGroupedHistory();

    const handleLotSelect = (lot: any) => {
        setSelectedLot(lot);

        // Navegación inteligente basada en estado y tipo de café
        if (lot.status === 'completed') {
            setActiveTab('cupping');
        } else if (lot.status === 'purchased') {
            setActiveTab('thrashing');
        } else if (lot.status === 'thrashed') {
            setActiveTab('analysis');
        } else {
            // Caso para café que ya viene trillado (excelso)
            if (lot.coffee_type === 'excelso') {
                setActiveTab('analysis');
            } else {
                setActiveTab('cupping');
            }
        }

        // Si es exportación directa, marcamos visualmente que Roast Intelligence es opcional
        if (lot.destination === 'export') {
            console.log("AXIS LOG: Lote de Exportación Detectado. Habilitando Flujo B.");
        }
    };

    return (
        <>
            {showCertificate && selectedLot && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-10 bg-black/80 backdrop-blur-xl overflow-y-auto">
                    <div className="py-10 w-full flex justify-center">
                        <LotCertificate
                            inventoryId={selectedLot.id}
                            user={user}
                            onClose={() => setShowCertificate(false)}
                        />
                    </div>
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
                                className={`flex-1 py-4 rounded-industrial-sm text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'purchase' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                01. Ingreso
                            </button>
                            <button
                                onClick={() => setActiveTab('thrashing')}
                                className={`flex-1 py-4 rounded-industrial-sm text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'thrashing' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                disabled={!selectedLot || selectedLot.coffee_type === 'excelso'}
                            >
                                02. Trilla
                            </button>
                            <button
                                onClick={() => setActiveTab('analysis')}
                                className={`flex-1 py-4 rounded-industrial-sm text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'analysis' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                disabled={!selectedLot}
                            >
                                03. Lab Físico
                            </button>
                            <button
                                onClick={() => setActiveTab('cupping')}
                                className={`flex-1 py-4 rounded-industrial-sm text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'cupping' ? 'bg-brand-green text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                disabled={!selectedLot}
                            >
                                04. Catación
                            </button>
                            <button
                                onClick={() => setActiveTab('archive')}
                                className={`flex-1 py-4 rounded-industrial-sm text-xs font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'archive' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
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
                                            <p className="text-xs text-brand-green-bright font-bold uppercase tracking-widest">Lote en Sincronización</p>
                                            <p className="text-base font-bold text-white">{selectedLot.farmer_name} | {selectedLot.variety} | {selectedLot.lot_number}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {selectedLot.destination === 'export' && (
                                            <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-industrial-sm flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                                <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">FLUJO B: EXPORTACIÓN</span>
                                            </div>
                                        )}
                                        {selectedLot.latitude && selectedLot.longitude && (
                                            <div className="bg-[#ea580c]/10 border border-[#ea580c]/20 px-3 py-1.5 rounded-industrial-sm flex items-center gap-2">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                <span className="text-[11px] text-[#ea580c] font-bold font-mono tracking-widest">{parseFloat(selectedLot.latitude).toFixed(4)}, {parseFloat(selectedLot.longitude).toFixed(4)}</span>
                                            </div>
                                        )}
                                        {selectedLot.status === 'completed' && (
                                            <button
                                                onClick={() => setShowCertificate(true)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-green text-black text-[11px] font-bold rounded-industrial-sm hover:bg-brand-green-bright transition-all"
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
                                        <button onClick={() => setActiveTab('purchase')} className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 hover:text-white transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
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
                                        <button onClick={() => setActiveTab('thrashing')} className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 hover:text-white transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
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
                                        <button onClick={() => setActiveTab('analysis')} className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 hover:text-white transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
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
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.3em]">Flujo Industrial: Ingreso → Trilla → Análisis → Catación</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA LATERAL (25%) */}
                    <aside className="xl:col-span-1 flex flex-col gap-8">
                        {/* BOTÓN CREAR LOTE - MISMO ANCHO QUE EL HISTORIAL */}
                        <button
                            onClick={() => { setSelectedLot(null); setActiveTab('purchase'); }}
                            className="w-full py-[1.25rem] bg-brand-green text-black font-bold uppercase text-xs tracking-[0.2em] rounded-industrial-sm hover:bg-brand-green-bright hover:scale-105 transition-all shadow-2xl shadow-brand-green/20 ring-1 ring-white/10 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                            Crear Nuevo Lote
                        </button>

                        {/* HISTORIAL - ALTURA SINCRONIZADA CON SECCIONES DEL FORMULARIO */}
                        <div className="bg-bg-card border border-white/10 p-8 rounded-industrial flex flex-col relative overflow-hidden group h-[710px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>

                            {/* Selector de Modo Sidebar */}
                            <div className="flex bg-white/5 p-1 rounded-industrial-sm mb-6 relative z-10 border border-white/5">
                                <button
                                    onClick={() => setSidebarMode('recent')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${sidebarMode === 'recent' ? 'bg-brand-green text-black shadow-lg shadow-brand-green/10' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Recientes
                                </button>
                                <button
                                    onClick={() => setSidebarMode('archive')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${sidebarMode === 'archive' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Archivo
                                </button>
                            </div>

                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-6 flex items-center justify-between relative z-10">
                                {sidebarMode === 'recent' ? 'Sincronización Viva' : 'Bóveda de Trazabilidad'}
                                <span className="bg-white/5 px-2 py-1 rounded-industrial-sm text-[10px]">{sidebarMode === 'recent' ? recentLots.length : allHistory.length} IDS</span>
                            </h4>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-3 custom-scrollbar relative z-10">
                                {sidebarMode === 'recent' ? (
                                    recentLots.map(lot => (
                                        <LotCard key={lot.id} lot={lot} isSelected={selectedLot?.id === lot.id} onClick={() => handleLotSelect(lot)} />
                                    ))
                                ) : (
                                    /* VISTA DE CARPETAS (ARCHIVO) */
                                    Object.entries(groupedHistory).map(([month, weeks]) => (
                                        <div key={month} className="space-y-2">
                                            <button
                                                onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}
                                                className={`w-full flex items-center justify-between p-3 rounded-industrial-sm border transition-all ${expandedMonth === month ? 'bg-white/10 border-white/20' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={expandedMonth === month ? 'text-blue-400' : 'text-gray-500'}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                                    <span className="text-xs font-bold text-white uppercase tracking-widest">{month}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-bold">{Object.values(weeks).flat().length}</span>
                                            </button>

                                            {expandedMonth === month && (
                                                <div className="pl-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                    {Object.entries(weeks).map(([week, lots]) => (
                                                        <div key={week} className="space-y-1">
                                                            <button
                                                                onClick={() => setExpandedWeek(expandedWeek === week ? null : week)}
                                                                className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${expandedWeek === week ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/2 border-white/5 hover:bg-white/5'}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={expandedWeek === week ? 'text-blue-400' : 'text-gray-500'}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg>
                                                                    <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wider">{week}</span>
                                                                </div>
                                                                <span className="text-[10px] text-gray-500">{lots.length}</span>
                                                            </button>

                                                            {expandedWeek === week && (
                                                                <div className="pl-4 py-2 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                                    {lots.map(lot => (
                                                                        <LotCard key={lot.id} lot={lot} isSelected={selectedLot?.id === lot.id} onClick={() => handleLotSelect(lot)} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}

                                {(sidebarMode === 'recent' ? recentLots.length : allHistory.length) === 0 && (
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

// Sub-componente para la tarjeta de lote (reutilizable)
const LotCard = ({ lot, isSelected, onClick }: { lot: any, isSelected: boolean, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`p-5 rounded-industrial-sm border transition-all cursor-pointer group/item relative overflow-hidden animate-in fade-in duration-300 ${isSelected ? 'bg-brand-green/10 border-brand-green/30 shadow-lg' : 'bg-bg-main border-white/5 hover:border-white/10'}`}
    >
        <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold uppercase truncate max-w-[140px] text-white/90 group-hover/item:text-white transition-colors">{lot.farmer_name}</p>
            <div className="flex gap-2 items-center">
                {lot.coffee_type === 'excelso' && (
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">VERD</span>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase border ${lot.status === 'thrashed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' :
                    lot.status === 'completed' ? 'bg-brand-green/10 text-brand-green-bright border-brand-green/10' :
                        'bg-orange-500/5 text-orange-400 border-orange-500/10'
                    }`}>
                    {lot.status === 'purchased' ? 'INGR' : lot.status === 'thrashed' ? 'TRIL' : 'CUPS'}
                </span>
            </div>
        </div>

        <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{lot.lot_number}</p>
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
                            className={`w-2 h-2 rounded-full transition-all duration-500 ${isDone ? 'bg-brand-green shadow-[0_0_4px_rgba(0,255,136,0.4)]' : 'bg-white/10'}`}
                            title={s === 1 ? 'Ingreso' : s === 2 ? 'Trilla' : s === 3 ? 'Laboratorio' : 'Catación'}
                        ></div>
                    );
                })}
            </div>
        </div>

        {lot.latitude && lot.longitude && (
            <div className="flex items-center gap-2 pt-3 border-t border-white/5 opacity-40 group-hover/item:opacity-80 transition-opacity">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <span className="text-[9px] font-mono text-gray-500 uppercase">GPS: {parseFloat(lot.latitude).toFixed(4)}, {parseFloat(lot.longitude).toFixed(4)}</span>
            </div>
        )}
    </div>
);
