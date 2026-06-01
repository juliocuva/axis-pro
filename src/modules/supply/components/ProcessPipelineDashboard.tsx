'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useLanguage } from '@/shared/context/LanguageContext';
import LotCertificate from './analysis/LotCertificate';

interface ProcessPipelineDashboardProps {
    user: { email: string, name: string, companyId: string, role?: string } | null;
    onSelectLotAndTab: (lot: any, tab: 'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast') => void;
    onOpenSyncModal: () => void;
}

export default function ProcessPipelineDashboard({ user, onSelectLotAndTab, onOpenSyncModal }: ProcessPipelineDashboardProps) {
    const { t } = useLanguage();
    const [lots, setLots] = useState<any[]>([]);
    const [cuppings, setCuppings] = useState<any[]>([]);
    const [roasts, setRoasts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CERTIFIED'>('ALL');
    const [selectedCertificateLotId, setSelectedCertificateLotId] = useState<string | null>(null);

    // Identificar rol del usuario
    const isGrower = user?.role === 'producer' || /^\d+$/.test(user?.email?.split('@')[0] || '');

    useEffect(() => {
        fetchDashboardData();
    }, [user?.companyId]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // 1. Obtener Lotes
            let query = supabase.from('coffee_purchase_inventory').select('*');
            
            // Si no es Julio ni cuenta central, filtrar por su compañía
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase()?.includes('julio') && !user?.email?.toLowerCase()?.includes('main')) {
                query = query.eq('company_id', user?.companyId);
            }

            const { data: lotsData, error: lotsError } = await query.order('created_at', { ascending: false });
            if (lotsError) throw lotsError;
            const fetchedLots = lotsData || [];

            // 2. Obtener Cataciones en Paralelo
            const { data: cuppingsData } = await supabase.from('sca_cupping').select('inventory_id, overall, overall_sensory_score, taster_name');
            const fetchedCuppings = cuppingsData || [];

            // 3. Obtener Tuestes en Paralelo
            const { data: roastsData } = await supabase.from('roast_batches').select('inventory_id, roast_date');
            const fetchedRoasts = roastsData || [];

            setLots(fetchedLots);
            setCuppings(fetchedCuppings);
            setRoasts(fetchedRoasts);
        } catch (err) {
            console.error("AXIS ERROR loading Process Pipeline Dashboard:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calcular métricas para el Banco Técnico
    const totalLotsCount = lots.length;
    const completedLotsCount = lots.filter(l => l.status === 'completed').length;
    const activeLotsCount = totalLotsCount - completedLotsCount;
    const certifiedLotsCount = completedLotsCount; // Lotes con sello definitivo en Step 5

    // Filtrar y Buscar Lotes
    const filteredLots = lots.filter(lot => {
        const matchesSearch = 
            (lot.farmer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lot.lot_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lot.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lot.variety || '').toLowerCase().includes(searchTerm.toLowerCase());

        const isCompleted = lot.status === 'completed';
        
        if (filterStatus === 'ACTIVE') return matchesSearch && !isCompleted;
        if (filterStatus === 'COMPLETED') return matchesSearch && isCompleted;
        if (filterStatus === 'CERTIFIED') return matchesSearch && isCompleted; // Completado implica certificado en Step 5

        return matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            {/* CERTIFICADO MODAL */}
            {selectedCertificateLotId && (
                <div 
                    className="fixed inset-0 z-[9999] w-full h-screen overflow-y-auto bg-black/95 backdrop-blur-2xl print:relative print:bg-transparent"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedCertificateLotId(null); }}
                >
                    <div className="w-full py-10 pb-[150px] print:py-0 print:pb-0">
                        <LotCertificate 
                            inventoryId={selectedCertificateLotId} 
                            user={user} 
                            onClose={() => setSelectedCertificateLotId(null)} 
                        />
                    </div>
                </div>
            )}

            {/* BANNER DE GOBERNANZA DEMOCRÁTICA (SOBERANÍA DE DATOS) */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-brand-green/20 bg-bg-card p-6 shadow-md shadow-brand-green/5">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-brand-green/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-14 h-14 bg-white/50 border border-brand-green/30 rounded-2xl flex items-center justify-center text-brand-green shadow-inner shrink-0">
                        {isGrower ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        )}
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-green">
                            {isGrower ? 'Tu Banco Técnico Soberano' : 'Ecosistema Democrático Axis'}
                        </h4>
                        <p className="text-xs font-bold text-brand-navy leading-relaxed uppercase">
                            {isGrower 
                                ? 'Este registro de calidad física, sensorial y de tostión te pertenece. Es tu pasaporte técnico independiente para respaldar tu trabajo y negociar tu café con el mundo.' 
                                : 'Estás patrocinando el Banco Técnico de tus caficultores en origen. Tienes acceso completo a los reportes de calidad, pasaportes digitales e historial de los lotes adquiridos.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* PANEL DE METRICAS DEL BANCO TÉCNICO */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-bg-card border border-gray-400/40 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow transition-all group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-zinc-200/20 blur-xl rounded-full"></div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Lotes Totales</span>
                    <span className="text-3xl font-black text-brand-navy mt-2 block">{totalLotsCount}</span>
                </div>
                <div className="bg-bg-card border border-gray-400/40 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow transition-all group">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">En Proceso</span>
                    <span className="text-3xl font-black text-amber-600 mt-2 block">{activeLotsCount}</span>
                </div>
                <div className="bg-bg-card border border-gray-400/40 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow transition-all group">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Lotes Completados</span>
                    <span className="text-3xl font-black text-emerald-600 mt-2 block">{completedLotsCount}</span>
                </div>
                <div className="bg-bg-card border border-gray-400/40 p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow transition-all group">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Certificados Activos</span>
                    <span className="text-3xl font-black text-teal-600 mt-2 block">{certifiedLotsCount}</span>
                </div>
            </div>

            {/* HERRAMIENTAS DE BUSQUEDA Y FILTRADO */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-transparent">
                {/* Buscador */}
                <div className="relative w-full md:flex-1 max-w-xl group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Buscar por Productor, Finca, Lote o Variedad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-400/60 shadow-sm rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-brand-navy uppercase outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all placeholder:text-zinc-400"
                    />
                </div>

                {/* Filtros */}
                <div className="flex bg-white border border-gray-400/60 p-1 rounded-2xl shadow-sm overflow-x-auto w-full md:w-auto shrink-0 scrollbar-none">
                    {[
                        { id: 'ALL', label: 'Todos' },
                        { id: 'ACTIVE', label: 'En Proceso' },
                        { id: 'COMPLETED', label: 'Completados' },
                        { id: 'CERTIFIED', label: 'Certificados' }
                    ].map((status) => (
                        <button
                            key={status.id}
                            onClick={() => setFilterStatus(status.id as any)}
                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all shrink-0 ${filterStatus === status.id ? 'bg-brand-green text-brand-navy shadow-sm' : 'text-zinc-600 hover:text-brand-navy bg-transparent'}`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTADO DE PIPELINES DE TRANSPARENCIA */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-bg-card border border-gray-300/40 p-20 rounded-3xl text-center space-y-4 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-black uppercase text-brand-navy/60">Sincronizando Banco Técnico de Café...</p>
                    </div>
                ) : filteredLots.length === 0 ? (
                    <div className="bg-bg-card border border-gray-300/40 p-16 rounded-3xl text-center flex flex-col items-center justify-center gap-3">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>
                        <p className="text-xs font-black uppercase text-zinc-500">No se encontraron lotes registrados bajo este filtro.</p>
                        <button 
                            onClick={onOpenSyncModal}
                            className="mt-2 px-5 py-2 bg-brand-green hover:bg-brand-green/90 text-brand-navy border border-black rounded-full text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                        >
                            Sincronizar Lotes
                        </button>
                    </div>
                ) : (
                    filteredLots.map((lot) => {
                        const isCompleted = lot.status === 'completed';
                        
                        // Validar estados de fases en el Banco Técnico
                        const hasStep1 = true;
                        const hasStep2 = lot.thrashed_weight > 0 || isCompleted || lot.status === 'thrashed';
                        const hasStep3 = lot.moisture > 0 || isCompleted || lot.status === 'physical_analyzed';
                        const hasStep4 = roasts.some(r => r.inventory_id === lot.id) || isCompleted;
                        const hasStep5 = isCompleted;

                        // Determinar fase activa (1 a 5)
                        let activeStep = 1;
                        if (hasStep2) activeStep = 2;
                        if (hasStep3) activeStep = 3;
                        if (hasStep4) activeStep = 4;
                        if (hasStep5) activeStep = 5;

                        const cupScore = cuppings.find(c => c.inventory_id === lot.id)?.overall;

                        return (
                            <div 
                                key={lot.id} 
                                className={`bg-white border-2 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-center justify-between gap-6 ${isCompleted ? 'border-emerald-500/25' : 'border-zinc-200'}`}
                            >
                                {/* Bloque 1: Identificación y Origen del Productor */}
                                <div className="flex items-center gap-4 min-w-[260px] w-full lg:w-auto">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-mono font-black text-brand-navy tracking-wider">{lot.lot_number}</span>
                                            {isCompleted ? (
                                                <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                    SCA: {cupScore ? `${Number(cupScore).toFixed(2)} PTS` : 'CVA'}
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                                    PROCESO: {activeStep}/5
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-brand-navy uppercase leading-tight">{lot.farmer_name || 'Productor Huila'}</p>
                                        <div className="flex items-center gap-2 text-[9px] text-zinc-500 uppercase font-bold flex-wrap">
                                            <span>{lot.farm_name || 'Sin Finca'}</span>
                                            <span>•</span>
                                            <span>{lot.region || 'Huila'}</span>
                                            {lot.latitude && lot.longitude && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-zinc-400 font-mono tracking-tighter">({Number(lot.latitude).toFixed(4)}, {Number(lot.longitude).toFixed(4)})</span>
                                                </>
                                            )}
                                        </div>
                                        {/* Insignia de Propiedad de Datos */}
                                        <div className="pt-1.5">
                                            <span className={`text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shadow-sm ${isGrower ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}>
                                                {isGrower ? 'BANCO TÉCNICO' : 'REPORTE DE CALIDAD'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bloque 2: Timeline de Transparencia de 5 Pasos */}
                                <div className="flex-1 flex items-center justify-between w-full max-w-[460px] relative px-2">
                                    {/* Línea de progreso de fondo */}
                                    <div className="absolute left-4 right-4 top-4 h-0.5 bg-zinc-200 z-0">
                                        <div 
                                            className="h-full bg-emerald-500 transition-all duration-700" 
                                            style={{ 
                                                width: hasStep5 ? '100%' : (hasStep4 ? '75%' : (hasStep3 ? '50%' : (hasStep2 ? '25%' : '0%'))) 
                                            }}
                                        ></div>
                                    </div>

                                    {/* Nodos de Pasos */}
                                    {[
                                        { id: 'purchase', label: 'Origen', done: hasStep1, active: activeStep === 1 && !isCompleted },
                                        { id: 'thrashing', label: 'Trilla', done: hasStep2, active: activeStep === 2 && !isCompleted },
                                        { id: 'analysis', label: 'Lab Físico', done: hasStep3, active: activeStep === 3 && !isCompleted },
                                        { id: 'roast', label: 'Tostión', done: hasStep4, active: activeStep === 4 && !isCompleted },
                                        { id: 'cupping', label: 'Catación', done: hasStep5, active: activeStep === 5 && !isCompleted }
                                    ].map((step, idx) => (
                                        <div key={idx} className="relative z-10 flex flex-col items-center gap-1">
                                            <div 
                                                onClick={() => {
                                                    if (!isGrower && step.done) {
                                                        onSelectLotAndTab(lot, step.id as any);
                                                    }
                                                }}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                                                    step.done 
                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow shadow-emerald-500/20 cursor-pointer hover:scale-105 active:scale-95' 
                                                        : 'bg-white border-zinc-300 text-zinc-400 pointer-events-none'
                                                } ${step.active ? 'ring-4 ring-brand-green/30 animate-pulse' : ''}`}
                                                title={step.done ? `Paso ${idx+1} completo - Click para ver` : `Paso ${idx+1} pendiente`}
                                            >
                                                {step.done ? '✓' : idx + 1}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-wider ${step.done ? 'text-brand-navy' : 'text-zinc-400'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Bloque 3: Acciones e Información Final */}
                                <div className="flex items-center gap-4 justify-between lg:justify-end w-full lg:w-auto border-t lg:border-t-0 border-zinc-100 pt-4 lg:pt-0">
                                    <div className="text-left lg:text-right shrink-0">
                                        <p className="text-[8px] text-zinc-500 font-bold uppercase leading-none">Volumen Recibido</p>
                                        <p className="text-xs font-black text-brand-navy mt-1">{(lot.purchase_weight || 0).toLocaleString()} KG</p>
                                        <p className="text-[8px] text-zinc-400 font-bold uppercase leading-none mt-0.5">{lot.variety || 'Catuaí'}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Botón de Ficha o Certificado */}
                                        {isCompleted ? (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCertificateLotId(lot.id)}
                                                className="px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                                            >
                                                Ver Pasaporte
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={isGrower}
                                                onClick={() => {
                                                    // Redirigir al paso activo del lote
                                                    let targetTab: 'purchase' | 'thrashing' | 'analysis' | 'roast' | 'cupping' = 'purchase';
                                                    if (!hasStep2) targetTab = 'thrashing';
                                                    else if (!hasStep3) targetTab = 'analysis';
                                                    else if (!hasStep4) targetTab = 'roast';
                                                    else if (!hasStep5) targetTab = 'cupping';

                                                    onSelectLotAndTab(lot, targetTab);
                                                }}
                                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 shadow-sm ${
                                                    isGrower 
                                                        ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-50' 
                                                        : 'bg-brand-green hover:bg-brand-green/90 text-brand-navy border-black'
                                                }`}
                                            >
                                                {isGrower ? 'En Proceso' : 'Cargar Datos'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
