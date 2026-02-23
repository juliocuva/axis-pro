'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import LiveRoastMonitor from './LiveRoastMonitor';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';

export default function RoastIntelligenceContainer() {
    const [view, setView] = useState<'live' | 'archive'>('live');
    const [selectedLot, setSelectedLot] = useState<any>(null);
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
                .order('roast_date', { ascending: false });
            if (data) setPastRoasts(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-center bg-bg-card p-6 rounded-3xl border border-white/5 shadow-xl">
                <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter text-white">AXIS Roast Intelligence</h2>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mt-1">Control de Consistencia Industrial TRL 7</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mr-2">
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
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${demoMode ? 'bg-orange-500/20 border-orange-500/50 text-orange-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                        {demoMode ? '✨ DEMO ON' : 'MODO REAL'}
                    </button>

                    {view === 'live' && (
                        <select
                            className="bg-bg-main border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-gray-300 outline-none focus:border-brand-green min-w-[200px] appearance-none"
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
                            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all border border-white/5 flex items-center gap-2 uppercase"
                        >
                            Cargar Histórico
                        </button>
                    )}
                </div>
            </header>

            {view === 'live' ? (
                <>
                    {/* Modal de Histórico */}
                    {showHistoryModal && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                            <div className="bg-bg-card border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
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
                                        <div key={roast.id} className="p-6 bg-white/2 border border-white/5 rounded-[2rem] flex justify-between items-center hover:border-brand-green/40 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-brand-green-bright text-sm border border-white/5">
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
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                            <aside className="space-y-6">
                                <div className="bg-bg-card border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green opacity-5 blur-3xl pointer-events-none"></div>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-6">Ficha Técnica Lote</h4>

                                    <div className="space-y-8">
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Cosecha / Variedad</p>
                                            <p className="font-medium text-white uppercase">{selectedLot.variety}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Análisis Humedad</p>
                                            <p className="text-2xl font-bold text-white tracking-tighter">{selectedLot.physical_analysis?.[0]?.moisture_pct || '11.2'}%</p>
                                        </div>
                                        {masterProfile && (
                                            <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-[1.5rem] animate-in slide-in-from-left duration-500">
                                                <p className="text-[9px] font-bold uppercase text-blue-400 mb-2 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                                    Ghost Profile Activo
                                                </p>
                                                <p className="text-xs font-bold text-white leading-tight">Calcando: {masterProfile.label}</p>
                                                <p className="text-[9px] text-gray-500 mt-1 uppercase font-mono">Objetivo: {masterProfile.score} SCA</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-[2.5rem]">
                                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-3">Co-Piloto AI</p>
                                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                        {masterProfile
                                            ? "Sincronizando inercia térmica con el perfil maestro. Mantén el RoR estable para igualar notas de frutos rojos."
                                            : "Basado en la densidad detectada, inicia con un Charge de 205°C para evitar quemar los azúcares externos."
                                        }
                                    </p>
                                </div>
                            </aside>

                            <div className="xl:col-span-3">
                                <LiveRoastMonitor lotData={selectedLot} masterProfile={masterProfile} />
                            </div>
                        </div>
                    ) : (
                        <div className="min-h-[500px] border border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-center p-20 bg-white/[0.01]">
                            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5 animate-pulse">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-green"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            </div>
                            <h3 className="text-3xl font-bold uppercase tracking-tighter text-white">Preparando Estación de Tostión</h3>
                            <p className="text-gray-500 mt-4 max-w-sm font-medium uppercase text-[10px] tracking-widest">Selecciona un lote físico para sincronizar los parámetros térmicos y activar la telemetría industrial.</p>
                        </div>
                    )}
                </>
            ) : (
                <GlobalHistoryArchive />
            )}
        </div>
    );
}
