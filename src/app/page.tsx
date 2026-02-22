'use client';

import React, { useState, useEffect } from 'react';
import AuthScreen from '@/shared/components/auth/AuthScreen';
import ModuleCard from '@/shared/components/layout/ModuleCard';

// Componentes de Módulos (Carga perezosa o condicional)
import SupplyModuleContainer from '@/modules/supply/components/SupplyModuleContainer';
import RoastIntelligenceContainer from '@/modules/production/components/RoastIntelligenceContainer';
import RoastEntryForm from '@/modules/production/components/RoastEntryForm';
import QualityDashboard from '@/modules/production/components/QualityDashboard';
import RoastCurveAnalysis from '@/modules/production/components/RoastCurveAnalysis';
import GreenExportForm from '@/modules/export/components/GreenExportForm';
import ComparisonCalibrationDashboard from '@/modules/export/components/ComparisonCalibrationDashboard';
import DegassingPredictor from '@/modules/export/components/DegassingPredictor';
import RetailModuleContainer from '@/modules/retail/components/RetailModuleContainer';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';

import { supabase } from '@/shared/lib/supabase';
import { calculateAdvancedDegassing } from '@/shared/lib/engine/degassing';

export default function Home() {
    const [user, setUser] = useState<string | null>(null);
    const [view, setView] = useState<'launcher' | 'supply' | 'production' | 'export' | 'retail' | 'quality' | 'curves' | 'entry' | 'calibration' | 'degassing' | 'archive'>('launcher');
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    // Estado para activación in-situ de módulos finales
    const [activatedModules, setActivatedModules] = useState<Set<string>>(new Set());
    const [pendingActivation, setPendingActivation] = useState<{ id: string, title: string } | null>(null);

    const handleLogoClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount === 5) {
            setIsDemoUnlocked(true);
            setClickCount(0);
        }
    };

    const requestActivation = (id: string, title: string) => {
        if (activatedModules.has(id)) {
            setView(id as any);
            return;
        }
        setPendingActivation({ id, title });
    };

    const confirmActivation = () => {
        if (pendingActivation) {
            setActivatedModules(prev => new Set(prev).add(pendingActivation.id));
            setView(pendingActivation.id as any);
            setPendingActivation(null);
        }
    };

    useEffect(() => {
        if (user && view === 'launcher') {
            fetchRecentBatches();
        }
    }, [user, view]);

    const fetchRecentBatches = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('roast_batches')
                .select('*')
                .order('roast_date', { ascending: false })
                .limit(3);

            if (data) {
                const transformed = data.map(b => ({
                    id: b.batch_id_label,
                    roastDate: b.roast_date,
                    process: b.process,
                    greenWeight: b.green_weight,
                    roastedWeight: b.roasted_weight
                }));
                setBatches(transformed);
            }
        } catch (err) {
            console.error("Error fetching batches:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <AuthScreen onLogin={(email) => setUser(email)} />;
    }

    return (
        <div className="min-h-screen bg-bg-main text-white p-8">
            <header className="mb-12 flex justify-between items-center flex-wrap gap-6">
                <div onClick={handleLogoClick} className="cursor-pointer group select-none">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-brand-green/30 transition-all">
                            <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tighter uppercase">AXIS COFFEE <span className="text-brand-green-bright text-[10px] ml-2 font-bold font-bold">PRO V2.0</span></h1>
                        {isDemoUnlocked && <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-md animate-pulse">DEMO UNLOCKED</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sesión: <span className="text-brand-green-bright">{user}</span></p>
                </div>

                <nav className="flex items-center gap-4">
                    {view !== 'launcher' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setView('launcher')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold transition-all border border-white/5 uppercase tracking-widest text-gray-400 hover:text-white"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                Launcher
                            </button>
                            <span className="text-gray-700 font-mono">/</span>
                            <span className="text-brand-green-bright text-[10px] font-bold uppercase tracking-[0.2em]">
                                {view === 'supply' ? 'Supply & Quality' :
                                    ['production', 'entry', 'quality', 'curves'].includes(view) ? 'Roast Intelligence' :
                                        ['export', 'calibration', 'degassing'].includes(view) ? 'Global Trade' :
                                            view.toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                    <button
                        onClick={() => setUser(null)}
                        className="px-6 py-2.5 bg-brand-red/10 text-brand-red-bright hover:bg-brand-red/20 rounded-xl text-xs font-bold transition-all border border-brand-red/10"
                    >
                        SALIR
                    </button>
                </nav>
            </header>

            {view === 'launcher' && (
                <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
                    <section>
                        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                            <span className="w-8 h-px bg-white/10"></span>
                            Arquitectura Modular de Control
                            <span className="w-full h-px bg-white/10"></span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <ModuleCard
                                title="Supply & Quality"
                                description="Consolidado: Recepción, trilla automatizada y protocolos SCA blindados. Alta fidelidad operativa."
                                status="trl7"
                                color="brand-green"
                                onClick={() => setView('supply')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
                            />
                            <ModuleCard
                                title="Roast Intelligence"
                                description="Consolidado: IA de comparación de curvas (Ghost Profile) y asistente de perillas con lógica blindada en servidor."
                                status={activatedModules.has('production') ? "trl7" : "locked"}
                                color="orange-500"
                                onClick={() => requestActivation('production', 'Roast Intelligence')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>}
                            />
                            <ModuleCard
                                title="Global Trade"
                                description="Próximamente: Pasaporte digital del café, certificados de exportación y trazabilidad internacional."
                                status={activatedModules.has('export') ? "trl7" : "locked"}
                                color="blue-500"
                                onClick={() => requestActivation('export', 'Global Trade')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                            />
                            <ModuleCard
                                title="Retail Connect"
                                description="Concepto: Gestión de inventario terminado y storytelling interactivo con el consumidor final."
                                status={activatedModules.has('retail') ? "active" : "locked"}
                                color="purple-500"
                                onClick={() => requestActivation('retail', 'Retail Connect')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></svg>}
                            />
                        </div>
                    </section>

                    {/* Ventana de Activación Pop-up */}
                    {pendingActivation && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 sm:p-12">
                            <div className="bg-bg-card border border-white/10 w-full max-w-lg rounded-[3rem] p-12 text-center shadow-3xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                                {/* Decoración de fondo */}
                                <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-green/10 blur-[80px] rounded-full"></div>
                                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full"></div>

                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10 ring-4 ring-white/5">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green-bright animate-pulse"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>

                                <h3 className="text-3xl font-bold uppercase tracking-tighter text-white mb-4">
                                    Activar Módulo In-Situ
                                </h3>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8 leading-relaxed">
                                    ¿Deseas activar el módulo <span className="text-brand-green-bright">{pendingActivation.title}</span> para esta sesión operativa? Este proceso habilita las capacidades TRL 7 en tiempo real.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={confirmActivation}
                                        className="flex-1 py-5 bg-brand-green text-white font-bold rounded-2xl uppercase tracking-widest text-xs shadow-2xl shadow-brand-green/20 hover:bg-brand-green-bright hover:scale-[1.02] transition-all"
                                    >
                                        SÍ, ACTIVAR AHORA
                                    </button>
                                    <button
                                        onClick={() => setPendingActivation(null)}
                                        className="flex-1 py-5 bg-white/5 text-gray-400 font-bold rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/5"
                                    >
                                        CANCELAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-bg-card border border-white/5 rounded-3xl p-8">
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-brand-green-bright"></span>
                                Monitor Industrial de Reposo
                            </h3>
                            <div className="space-y-4">
                                {batches.map((batch) => {
                                    const analysis = calculateAdvancedDegassing(
                                        { id: batch.id, roastDate: batch.roastDate },
                                        { process: batch.process, roastDevelopment: 'medium', packagingType: 'valve', routeTemperature: 'temperate' }
                                    );
                                    const isBlocked = analysis.pressureCurve[0].pressure > 0.8; // Simplified for dashboard
                                    return (
                                        <div key={batch.id} className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-white/5 group hover:border-brand-green/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-[10px] uppercase tracking-tighter">
                                                    {batch.process.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase">Lote: {batch.id}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{batch.process} • {batch.roastedWeight}kg</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isBlocked ? 'text-orange-500' : 'text-brand-green-bright'}`}>
                                                    {isBlocked ? 'ESTABILIZANDO' : 'LISTO'}
                                                </p>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase mt-1">Envío: {analysis.recommendedShipDate}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {batches.length === 0 && <div className="p-8 text-center text-gray-600 font-mono text-xs border border-dashed border-white/5 rounded-2xl">SIN REGISTROS EN ESTE TURNO</div>}
                            </div>
                        </div>

                        <div className="bg-bg-card border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4">Estado del Sistema</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Conectividad Cloud</span>
                                    <span className="text-brand-green-bright font-bold">OPERATIVO</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Motor Predictivo</span>
                                    <span className="text-orange-500 font-bold">ACTIVO</span>
                                </div>
                                <div className="h-px bg-white/5 my-4"></div>
                                <div className="text-center p-6 bg-white/2 border border-white/5 rounded-2xl">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Total Procesado (Mes)</p>
                                    <p className="text-4xl font-bold text-white tracking-tighter">4,821 <span className="text-[10px] text-brand-green-bright font-bold">KG</span></p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {view === 'supply' && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <SupplyModuleContainer />
                </div>
            )}

            {(view === 'production' || view === 'entry' || view === 'quality' || view === 'curves') && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                        <div className="flex bg-bg-card p-1 rounded-2xl border border-white/5 shadow-xl">
                            <button
                                onClick={() => setView('production')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'production' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Intelligence Vivo
                            </button>
                            <button
                                onClick={() => setView('entry')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'entry' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Nueva Tostión
                            </button>
                            <button
                                onClick={() => setView('quality')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'quality' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Control Calidad
                            </button>
                            <button
                                onClick={() => setView('curves')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'curves' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Análisis Curvas
                            </button>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {view === 'production' && <RoastIntelligenceContainer />}
                        {view === 'entry' && <RoastEntryForm />}
                        {view === 'quality' && <QualityDashboard />}
                        {view === 'curves' && <RoastCurveAnalysis />}
                    </div>
                </div>
            )}

            {(view === 'export' || view === 'calibration' || view === 'degassing' || view === 'archive') && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                        <div className="flex bg-bg-card p-1 rounded-2xl border border-white/5 shadow-xl">
                            <button
                                onClick={() => setView('export')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'export' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Manifiestos
                            </button>
                            <button
                                onClick={() => setView('archive')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'archive' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Historial Cloud
                            </button>
                            <button
                                onClick={() => setView('calibration')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'calibration' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Calibración Espectral
                            </button>
                            <button
                                onClick={() => setView('degassing')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'degassing' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Predictor $CO_2$
                            </button>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {view === 'calibration' && <ComparisonCalibrationDashboard />}
                        {view === 'export' && <GreenExportForm />}
                        {view === 'degassing' && <DegassingPredictor />}
                        {view === 'archive' && <GlobalHistoryArchive />}
                    </div>
                </div>
            )}
            {view === 'retail' && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <RetailModuleContainer />
                </div>
            )}
        </div>
    );
}
