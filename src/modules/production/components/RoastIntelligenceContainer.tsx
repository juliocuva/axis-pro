'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import LiveRoastMonitor from './LiveRoastMonitor';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';

interface RoastIntelligenceContainerProps {
    user: { email: string, name: string, companyId: string } | null;
}

import RoastEntryForm from './RoastEntryForm';

export default function RoastIntelligenceContainer({ user }: RoastIntelligenceContainerProps) {
    const [view, setView] = useState<'live' | 'archive' | 'entry'>('live');
    const [selectedLot, setSelectedLot] = useState<any>(null);

    // Listen to inter-component navigation
    useEffect(() => {
        const handleViewChange = (e: any) => {
            if (['live', 'archive', 'entry'].includes(e.detail)) {
                setView(e.detail);
            }
        };
        window.addEventListener('change-view', handleViewChange);
        return () => window.removeEventListener('change-view', handleViewChange);
    }, []);

    // ... rest of the existing state ...
    const [availableLots, setAvailableLots] = useState<any[]>([]);
    const [pastRoasts, setPastRoasts] = useState<any[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    // El "Copiloto": Perfil Maestro para calcar
    const [masterProfile, setMasterProfile] = useState<any>(null);

    useEffect(() => {
        if (demoMode) {
            setAvailableLots([
                { id: '1', farmer_name: 'Juan Valdez', variety: 'Geisha', status: 'completed', physical_analysis: [{ moisture_pct: 11.5 }], sca_cupping: [{ total_score: 87.5 }], thrashing_yield: 89.2 },
                { id: '2', farmer_name: 'Maria Lopez', variety: 'Castillo', status: 'thrashed', physical_analysis: [{ moisture_pct: 12.1 }], sca_cupping: [{ total_score: 84.0 }], thrashing_yield: 92.5 }
            ]);
            setPastRoasts([
                { id: '101', batch_id_label: 'AX-7721', roast_date: '2026-02-21', process: 'washed', sensor_notes: ['Chocolate', 'Frutos Rojos'], sca_score: 87.2 },
                { id: '102', batch_id_label: 'AX-8843', roast_date: '2026-02-20', process: 'natural', sensor_notes: ['Caramelo', 'Miel'], sca_score: 85.8 }
            ]);
        } else {
            fetchReadyToRoastLots();
            fetchPastRoasts();
        }
    }, [demoMode]);

    const loadMasterProfile = (roast: any) => {
        const simulatedMaster = {
            id: roast.id,
            label: roast.batch_id_label,
            notes: roast.sensor_notes || ['Chocolate', 'Cuerpo Denso'],
            score: roast.sca_score || 86.5,
            points: Array.from({ length: 720 }, (_, i) => ({
                t: i,
                temp: 50 + Math.pow(i, 0.78) * 0.9 + (i > 300 ? Math.sin(i / 60) * 1.5 : 0)
            })),
            events: {
                dryEnd: 310,
                firstCrack: 540
            }
        };
        setMasterProfile(simulatedMaster);
        setShowHistoryModal(false);
    };

    const fetchReadyToRoastLots = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .select('*, physical_analysis(*), sca_cupping(*)')
                .eq('company_id', user?.companyId)
                .in('status', ['completed', 'thrashed', 'purchased'])
                .order('created_at', { ascending: false });

            if (data) setAvailableLots(data);
        } catch (err) {
            console.error("AXIS Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPastRoasts = async () => {
        try {
            const { data } = await supabase
                .from('roast_batches')
                .select('*')
                .eq('company_id', user?.companyId)
                .order('roast_date', { ascending: false });
            if (data) setPastRoasts(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {view !== 'entry' && (
                <header className="flex justify-between items-center bg-bg-card p-6 rounded-industrial border border-white/5 shadow-xl">
                    <div>
                        <h2 className="text-2xl font-bold uppercase tracking-tighter text-white">AXIS Roast Intelligence</h2>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mt-1">Control de Consistencia Industrial TRL 7</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex bg-white/5 p-1 rounded-industrial-sm border border-white/5 mr-2">
                            <button
                                onClick={() => setView('live')}
                                className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${view === 'live' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
                            >
                                Inteligencia Vivo
                            </button>
                            <button
                                onClick={() => setView('archive')}
                                className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-2 ${view === 'archive' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                Archivo Cloud
                            </button>
                        </div>

                        <button
                            onClick={() => setDemoMode(!demoMode)}
                            className={`px-4 py-2 rounded-industrial-sm text-[10px] font-bold uppercase transition-all border ${demoMode ? 'bg-orange-500/20 border-orange-500/50 text-orange-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
                        >
                            {demoMode ? '✨ DEMO ON' : 'MODO REAL'}
                        </button>

                        {view === 'live' && (
                            <select
                                className="bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-2 text-xs font-bold text-gray-300 outline-none focus:border-brand-green min-w-[200px] appearance-none"
                                onChange={(e) => {
                                    const lot = availableLots.find(l => l.id === e.target.value);
                                    setSelectedLot(lot);
                                }}
                            >
                                <option value="">{isLoading ? 'CARGANDO...' : 'SELECCIONAR LOTE'}</option>
                                {availableLots.map(lot => (
                                    <option key={lot.id} value={lot.id}>{lot.farmer_name} - {lot.variety}</option>
                                ))}
                            </select>
                        )}

                        {view === 'live' && (
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-industrial-sm text-xs font-bold transition-all border border-white/5 flex items-center gap-2 uppercase"
                            >
                                Cargar Histórico
                            </button>
                        )}
                    </div>
                </header>
            )}

            {view === 'live' ? (
                <>
                    {/* Modal de Histórico */}
                    {showHistoryModal && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                            <div className="bg-bg-card border border-white/10 w-full max-w-2xl rounded-industrial overflow-hidden shadow-2xl animate-in zoom-in-95">
                                <header className="p-10 border-b border-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold uppercase tracking-tight text-white">Archivo de Perfiles Maestro</h3>
                                        <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">Sincronización con Copiloto Industrial</p>
                                    </div>
                                    <button onClick={() => setShowHistoryModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                    </button>
                                </header>

                                <div className="p-10 max-h-[60vh] overflow-y-auto space-y-4">
                                    {pastRoasts.length > 0 ? pastRoasts.map(roast => (
                                        <div key={roast.id} className="p-6 bg-white/2 border border-white/5 rounded-industrial-sm flex justify-between items-center hover:border-brand-green/40 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white/5 rounded-industrial-sm flex items-center justify-center font-bold text-brand-green-bright text-sm border border-white/5">
                                                    {roast.batch_id_label.split('-')[1]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-white mb-0.5">{roast.batch_id_label}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono uppercase">{new Date(roast.roast_date).toLocaleDateString()} • {roast.process.toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">SCA Score</p>
                                                    <p className="text-lg font-bold text-brand-green-bright">{roast.sca_score || '86.5'}</p>
                                                </div>
                                                <button
                                                    onClick={() => loadMasterProfile(roast)}
                                                    className="bg-brand-green text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-brand-green/20 hover:bg-brand-green-bright transition-all"
                                                >
                                                    Seleccionar para Calco
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-30 uppercase font-bold tracking-widest text-xs">Sin registros de tueste</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedLot ? (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                            {/* PANEL IZQUIERDO: AUDITORÍA DE LOTE */}
                            <aside className="xl:col-span-4 space-y-6">
                                <div className="bg-bg-card border border-white/10 p-8 rounded-industrial relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl pointer-events-none group-hover:bg-brand-green/10 transition-colors"></div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        DNA de Lote Físico
                                    </h4>

                                    <div className="space-y-8">
                                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Origen / Variedad</p>
                                                <p className="font-bold text-lg text-white uppercase tracking-tight">{selectedLot.variety || 'Caturra'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Puntaje SCA</p>
                                                <p className="text-2xl font-black text-brand-green-bright">{(selectedLot.sca_cupping?.[0]?.total_score || 86.5).toFixed(1)}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-4 bg-white/2 rounded-xl border border-white/5">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold mb-1 italic">Humedad</p>
                                                <p className="text-xl font-bold text-white tracking-tighter">{selectedLot.physical_analysis?.[0]?.moisture_pct || '11.2'}%</p>
                                            </div>
                                            <div className="p-4 bg-white/2 rounded-xl border border-white/5">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold mb-1 italic">Densidad</p>
                                                <p className="text-xl font-bold text-white tracking-tighter">{selectedLot.physical_analysis?.[0]?.density_gl || '710'} <span className="text-[10px] text-gray-500">g/L</span></p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[9px] text-gray-500 uppercase font-bold italic">Notas de Catación Destacadas</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const rawNotes = selectedLot.sca_cupping?.[0]?.notes;
                                                    const notesArray = Array.isArray(rawNotes)
                                                        ? rawNotes
                                                        : (typeof rawNotes === 'string' ? rawNotes.split(',').map(n => n.trim()) : ['Chocolate', 'Caramelo', 'Cuerpo Medio']);

                                                    return notesArray.map((note: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-300 uppercase">{note}</span>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-industrial relative overflow-hidden group">
                                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full"></div>
                                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                        Protocolo de Rendimiento
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-400">Objetivo Merma Tostión:</span>
                                            <span className="font-bold text-white">14.5% - 15.5%</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                            Basado en la densidad de <span className="text-white font-bold">{selectedLot.physical_analysis?.[0]?.density_gl || '710'} g/L</span>, el grano tiene una estructura celular densa que requiere una transferencia de energía conductiva moderada al inicio.
                                        </p>
                                    </div>
                                </div>
                            </aside>

                            {/* PANEL CENTRAL: PROPUESTA ESTRATÉGICA */}
                            <main className="xl:col-span-8 space-y-8">
                                <section className="bg-bg-card border border-white/10 p-10 rounded-industrial relative overflow-hidden min-h-[400px]">
                                    <header className="flex justify-between items-start mb-12">
                                        <div>
                                            <h3 className="text-3xl font-bold uppercase tracking-tighter text-white mb-1">Estrategia de Tostión AXIS</h3>
                                            <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.4em]">Propuesta Algorítmica de Perfil Térmico</p>
                                        </div>
                                        <button
                                            onClick={() => setView('entry')}
                                            className="bg-white text-black px-10 py-5 rounded-industrial-sm text-[11px] font-bold uppercase tracking-widest shadow-2xl hover:bg-brand-green-bright hover:text-white transition-all transform hover:-translate-y-1"
                                        >
                                            Iniciar Registro de Tostión
                                        </button>
                                    </header>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                        <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-industrial space-y-4">
                                            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Fase 1: Secado (Dry)</p>
                                            <p className="text-xl font-bold text-white">Carga Moderada</p>
                                            <p className="text-[10px] text-gray-500 leading-relaxed">Inicia a <span className="text-blue-400 font-bold">195°C</span>. Extender fase de secado a 5:30 min para estabilizar humedad interna del {selectedLot.physical_analysis?.[0]?.moisture_pct || '11.2'}%.</p>
                                        </div>
                                        <div className="p-8 bg-orange-500/5 border border-orange-500/10 rounded-industrial space-y-4">
                                            <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">Fase 2: Maillard</p>
                                            <p className="text-xl font-bold text-white">Desarrollo Dulzor</p>
                                            <p className="text-[10px] text-gray-500 leading-relaxed">Mantener RoR constante entre <span className="text-orange-400 font-bold">12-14°C/min</span>. Crucial para potenciar notas de {(() => {
                                                const rawNotes = selectedLot.sca_cupping?.[0]?.notes;
                                                if (Array.isArray(rawNotes)) return rawNotes[0] || 'Caramelo';
                                                if (typeof rawNotes === 'string') return rawNotes.split(',')[0].trim() || 'Caramelo';
                                                return 'Caramelo';
                                            })()}.</p>
                                        </div>
                                        <div className="p-8 bg-brand-red/5 border border-brand-red/10 rounded-industrial space-y-4">
                                            <p className="text-[9px] text-brand-red font-bold uppercase tracking-widest">Fase 3: Finalización</p>
                                            <p className="text-xl font-bold text-white">Acento de Acidez</p>
                                            <p className="text-[10px] text-gray-500 leading-relaxed">Finalizar a <span className="text-brand-red font-bold">204°C</span> con un desarrollo del 16%. Evitar Segundo Crack para no perder notas florales.</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-white/2 border border-white/5 rounded-industrial-sm flex items-center gap-8 group hover:border-brand-green/30 transition-all">
                                        <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center border border-brand-green/20 group-hover:scale-110 transition-transform">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-brand-green-bright uppercase tracking-[0.2em] mb-2">Objetivo de Desgasificación</p>
                                            <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                                                Dada la estrategia de tueste medio-claro, el pico de sabor se alcanzará a los <span className="text-white font-bold">7 días</span>. Tiempo de reposo mínimo recomendado: 48 horas tras tueste.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* GHOST PROFILE PREVIEW (Si hay histórico cargado) */}
                                {masterProfile && (
                                    <div className="border border-blue-500/20 bg-blue-500/5 p-10 rounded-industrial animate-in slide-in-from-bottom-8 duration-700">
                                        <div className="flex justify-between items-center mb-10">
                                            <div>
                                                <h4 className="text-xl font-bold text-white uppercase tracking-tighter italic">Referencia de Perfil Ghost</h4>
                                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Sincronizado con Lote {masterProfile.label}</p>
                                            </div>
                                            <div className="px-6 py-2 bg-blue-500/20 rounded-full border border-blue-500/40">
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Consistencia Objetivo: 98%</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold italic">Tiempo de Tueste</p>
                                                <p className="text-2xl font-bold text-white">09:12 <span className="text-xs text-gray-500">min</span></p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold italic">Temperatura Carga</p>
                                                <p className="text-2xl font-bold text-white">202 <span className="text-xs text-gray-500">°C</span></p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold italic">Punto de Giro</p>
                                                <p className="text-2xl font-bold text-white">01:05 <span className="text-xs text-gray-500">min</span></p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold italic">Desarrollo Final</p>
                                                <p className="text-2xl font-bold text-white">18.2 <span className="text-xs text-gray-500">%</span></p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </main>
                        </div>
                    ) : (
                        <div className="min-h-[600px] border border-dashed border-white/5 rounded-industrial flex flex-col items-center justify-center text-center p-20 bg-white/[0.01]">
                            <div className="w-40 h-40 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 animate-pulse relative">
                                <div className="absolute inset-0 bg-brand-green/20 blur-3xl opacity-30"></div>
                                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-green"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            </div>
                            <h3 className="text-3xl font-bold uppercase tracking-tighter text-white">Generador de Estrategia de Tostión</h3>
                            <p className="text-gray-500 mt-4 max-w-lg font-medium uppercase text-[10px] tracking-[0.4em] leading-relaxed">
                                Selecciona un lote con análisis físico y sensorial completo para proyectar parámetros térmicos y curvas de desgasificación inteligentes.
                            </p>
                        </div>
                    )}
                </>
            ) : view === 'entry' ? (
                <RoastEntryForm user={user} />
            ) : (
                <GlobalHistoryArchive user={user} />
            )}
        </div>
    );
}
