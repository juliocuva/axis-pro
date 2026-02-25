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
import UserDropdown from '@/shared/components/layout/UserDropdown';

export default function Home() {
    const [user, setUser] = useState<{ name: string, email: string, companyId: string } | null>(null);
    const [view, setView] = useState<'launcher' | 'supply' | 'production' | 'export' | 'retail' | 'quality' | 'curves' | 'entry' | 'calibration' | 'degassing' | 'archive'>('launcher');
    const [batches, setBatches] = useState<any[]>([]);
    const [latestLotDestination, setLatestLotDestination] = useState<'internal' | 'export_green' | 'export_roasted' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('axis-theme', newTheme);
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('axis-theme') as 'dark' | 'light' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    // Estado para activación in-situ de módulos finales
    const [activatedModules, setActivatedModules] = useState<Set<string>>(new Set());
    const [pendingActivation, setPendingActivation] = useState<{ id: string, title: string } | null>(null);

    // Estado para el Portal Global de Documentos
    const [showCloudVault, setShowCloudVault] = useState(false);
    const [showFunctionalDocs, setShowFunctionalDocs] = useState(false);
    const [showUpdates, setShowUpdates] = useState(false);

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
            // Fetch latest lot destination - Robusto ante fallos de esquema
            try {
                const { data: latestLot, error: lotError } = await supabase
                    .from('coffee_purchase_inventory')
                    .select('*') // Prevenimos error 400 si falta columna 'destination'
                    .order('purchase_date', { ascending: false })
                    .limit(1)
                    .single();

                if (!lotError && latestLot) {
                    setLatestLotDestination(latestLot.destination || null);
                }
            } catch (lotErr) {
                console.warn("AXIS LOG: Fallo al recuperar destino.");
            }

            const { data } = await supabase
                .from('roast_batches')
                .select('*')
                .eq('company_id', user?.companyId)
                .order('roast_date', { ascending: false })
                .limit(3);

            if (data && data.length > 0) {
                const transformed = data.map(b => ({
                    id: b.batch_id_label,
                    roastDate: b.roast_date,
                    process: b.process,
                    greenWeight: b.green_weight,
                    roastedWeight: b.roasted_weight,
                    isDemo: false
                }));
                setBatches(transformed);
            } else {
                // MOCK DATA PARA MOSTRAR ALCANCE (Nuevos Usuarios)
                const demoBatches = [
                    { id: 'DEMO-001', roastDate: new Date().toISOString(), process: 'Washed / Colombia', greenWeight: 35.0, roastedWeight: 29.8, isDemo: true },
                    { id: 'DEMO-002', roastDate: new Date(Date.now() - 86400000).toISOString(), process: 'Natural / Ethiopia', greenWeight: 24.0, roastedWeight: 21.0, isDemo: true }
                ];
                setBatches(demoBatches);
            }
        } catch (err) {
            console.error("Error fetching batches:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <AuthScreen onLogin={(userData) => {
            setUser(userData);
        }} />;
    }

    return (
        <div className="min-h-screen bg-bg-main p-8 transition-colors duration-400">
            <header className="mb-12 flex justify-between items-center flex-wrap gap-6 border-b border-white/5 pb-8">
                <div onClick={handleLogoClick} className="cursor-pointer group select-none">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-bg-offset rounded-industrial-sm flex items-center justify-center overflow-hidden border border-border-main group-hover:border-brand-green/30 transition-all">
                            <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tighter uppercase">AXIS COFFEE <span className="text-brand-green-bright text-[10px] ml-2 font-bold">PRO V2.0</span></h1>
                        {isDemoUnlocked && <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-md animate-pulse">DEMO UNLOCKED</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Sincronización Cloud Activa</p>
                    </div>
                </div>

                <nav className="flex items-center gap-4">
                    {view !== 'launcher' && (
                        <button
                            onClick={() => setView('launcher')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-bg-offset hover:bg-white/10 rounded-industrial-sm text-[10px] font-bold transition-all border border-border-main uppercase tracking-widest text-gray-400 hover:text-white"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Volver al Panel
                        </button>
                    )}

                    <div className="flex bg-bg-offset p-1 rounded-industrial-sm border border-border-main overflow-hidden">
                        <button
                            onClick={() => setShowCloudVault(true)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-brand-green/10 text-brand-green-bright text-[9px] font-bold uppercase tracking-widest transition-all"
                            title="Bóveda de Documentos"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                            Cloud Vault
                        </button>
                    </div>

                    <div className="w-px h-6 bg-border-main mx-2"></div>

                    <button
                        onClick={toggleTheme}
                        className="w-11 h-11 rounded-industrial-sm bg-bg-offset border border-border-main flex items-center justify-center hover:bg-white/10 transition-all group"
                        title={theme === 'dark' ? 'Modo Luz' : 'Modo Oscuro'}
                    >
                        {theme === 'dark' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-orange-400 group-hover:rotate-12 transition-transform">
                                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green group-hover:-rotate-12 transition-transform">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    <UserDropdown
                        user={user}
                        onLogout={() => setUser(null)}
                        onOpenManual={() => setShowFunctionalDocs(true)}
                        onOpenUpdates={() => setShowUpdates(true)}
                    />
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
                                description="Dominio de Origen: Recepción de pergamino, balance de masa industrial, defectos SCA y catación profesional. Control total de la materia prima."
                                status="trl7"
                                color="brand-green"
                                onClick={() => setView('supply')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
                            />
                            <ModuleCard
                                title="Roast Intelligence"
                                description="Ingeniería de Tueste: IA predictiva de curvas, monitoreo de ROR en tiempo real y perfiles de referencia blindados. Solicitud de validación pendiente."
                                status={activatedModules.has('production') ? "trl7" : "locked"}
                                color="orange-500"
                                isOptional={latestLotDestination === 'export_green'}
                                isRecommended={latestLotDestination === 'export_roasted'}
                                onClick={() => requestActivation('production', 'Roast Intelligence')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>}
                            />
                            <ModuleCard
                                title="Global Trade"
                                description="Logística Internacional: Pasaporte digital del lote, manifiestos de exportación e inteligencia de mercado global. Módulo en fase beta restringida."
                                status={activatedModules.has('export') ? "trl7" : "locked"}
                                color="blue-500"
                                isRecommended={latestLotDestination?.startsWith('export')}
                                onClick={() => requestActivation('export', 'Global Trade')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                            />
                            <ModuleCard
                                title="Retail Connect"
                                description="Venta y Fidelización: Gestión de inventario terminado, e-commerce integrado y trazabilidad directo al consumidor. Próxima actualización corporativa."
                                status={activatedModules.has('retail') ? "active" : "locked"}
                                color="purple-500"
                                onClick={() => requestActivation('retail', 'Retail Connect')}
                                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></svg>}
                            />
                        </div>
                    </section>

                    {/* Ventana de Activación Pop-up con Precios */}
                    {pendingActivation && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-500">
                            <div className="bg-bg-card border border-white/10 w-full max-w-xl rounded-industrial p-12 shadow-3xl relative overflow-hidden">
                                {/* Decoración de fondo */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-green/10 blur-[100px] rounded-full"></div>

                                <div className="w-20 h-20 bg-white/5 rounded-industrial-sm flex items-center justify-center mx-auto mb-8 border border-white/10 ring-4 ring-white/5 relative z-10">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green-bright"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                </div>

                                <div className="text-center relative z-10">
                                    <h3 className="text-4xl font-bold uppercase tracking-tighter text-white mb-2">
                                        Activar {pendingActivation.title}
                                    </h3>
                                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em] mb-10">Software-as-a-Service Industrial</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
                                    {/* Plan Standard */}
                                    <div className="p-8 bg-white/2 border border-white/5 rounded-industrial-sm hover:border-white/10 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">Plan Base</p>
                                        </div>
                                        <p className="text-3xl font-bold text-white">$49<span className="text-xs text-gray-600 font-bold ml-1">/mes</span></p>
                                        <div className="mt-6 space-y-3">
                                            <p className="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                                Acceso 1 Usuario
                                            </p>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                                Trazabilidad Manual
                                            </p>
                                        </div>
                                    </div>

                                    {/* Plan Pro */}
                                    <div className="p-8 bg-brand-green/5 border border-brand-green/20 rounded-industrial-sm hover:border-brand-green/40 transition-all cursor-pointer group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-brand-green text-black px-3 py-1 text-[8px] font-bold uppercase rounded-bl-xl">Máximo Valor</div>
                                        <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-4">Enterprise</p>
                                        <p className="text-3xl font-bold text-white">$129<span className="text-xs text-gray-600 font-bold ml-1">/mes</span></p>
                                        <div className="mt-6 space-y-3">
                                            <p className="text-[9px] text-gray-100 font-bold uppercase flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                                Usuarios Ilimitados
                                            </p>
                                            <p className="text-[9px] text-gray-100 font-bold uppercase flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                                Sincronización Cloud
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 relative z-10">
                                    <button
                                        onClick={confirmActivation}
                                        className="w-full py-5 bg-brand-green text-black font-bold rounded-industrial-sm uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-brand-green/20 hover:bg-brand-green-bright hover:scale-[1.02] transition-all"
                                    >
                                        SUSCRIBIRSE Y ACTIVAR MÓDULO
                                    </button>
                                    <button
                                        onClick={() => setPendingActivation(null)}
                                        className="w-full py-4 text-gray-500 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-all"
                                    >
                                        REGRESAR AL DASHBOARD
                                    </button>
                                </div>

                                <p className="text-center text-[8px] text-gray-600 font-bold uppercase tracking-[0.3em] mt-10">
                                    Pagos Procesados por Stripe Secure Gateway
                                </p>
                            </div>
                        </div>
                    )}

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-bg-card border border-white/5 rounded-industrial p-8">
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
                                        <div key={batch.id} className="flex items-center justify-between p-4 bg-bg-main rounded-industrial-sm border border-white/5 group hover:border-brand-green/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-industrial-sm bg-white/5 flex items-center justify-center font-bold text-[10px] uppercase tracking-tighter">
                                                    {batch.process.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold uppercase">Lote: {batch.id}</p>
                                                        {batch.isDemo && (
                                                            <span className="text-[8px] bg-brand-green/20 text-brand-green-bright px-2 py-0.5 rounded-md font-bold border border-brand-green/30">DEMO INTELLIGENCE</span>
                                                        )}
                                                    </div>
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

                        <div className="bg-bg-card border border-white/5 rounded-industrial p-8 relative overflow-hidden group">
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
                                <div className="text-center p-6 bg-white/2 border border-white/5 rounded-industrial-sm">
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
                    <SupplyModuleContainer user={user} />
                </div>
            )}

            {(view === 'production' || view === 'entry' || view === 'quality' || view === 'curves') && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                        <div className="flex bg-bg-card p-1 rounded-industrial-sm border border-white/5 shadow-xl">
                            <button
                                onClick={() => setView('production')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'production' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Intelligence Vivo
                            </button>
                            <button
                                onClick={() => setView('entry')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'entry' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Nueva Tostión
                            </button>
                            <button
                                onClick={() => setView('quality')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'quality' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Control Calidad
                            </button>
                            <button
                                onClick={() => setView('curves')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'curves' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Análisis Curvas
                            </button>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {view === 'production' && <RoastIntelligenceContainer user={user} />}
                        {view === 'entry' && <RoastEntryForm user={user} />}
                        {view === 'quality' && <QualityDashboard />}
                        {view === 'curves' && <RoastCurveAnalysis />}
                    </div>
                </div>
            )}

            {/* BIENVENIDA ELIMINADA - SE ENVIARÁ POR CORREO ELECTRÓNICO */}

            {/* MODAL DE ACTUALIZACIONES / MENSAJES DEL SISTEMA */}
            {showUpdates && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="bg-bg-card border border-white/10 w-full max-w-xl rounded-industrial p-10 shadow-3xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Centro de Mensajes</h3>
                            <button onClick={() => setShowUpdates(false)} className="text-gray-500 hover:text-white transition-all">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-brand-green/5 border border-brand-green/20 rounded-industrial-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-brand-green text-black px-3 py-1 text-[8px] font-bold uppercase rounded-bl-xl">Nuevo</div>
                                <h4 className="text-[10px] font-bold text-brand-green-bright uppercase tracking-widest mb-2">Nueva Versión Core V2.0.4</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Hemos optimizado el motor de predicción de desgasificación para granos Honey y Natural. La precisión ha aumentado en un <span className="text-white">12.4%</span>.
                                </p>
                            </div>

                            <div className="p-6 bg-white/2 border border-white/5 rounded-industrial-sm opacity-60">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Mantenimiento Programado</h4>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    El próximo domingo a las 02:00 AM (COT) se realizará una actualización de los servidores AXIS. El sistema estará fuera de línea por 15 minutos.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowUpdates(false)}
                            className="w-full mt-10 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-[9px] border border-white/10"
                        >
                            ENTENDIDO, VOLVER Al CORE
                        </button>
                    </div>
                </div>
            )}

            {(view === 'export' || view === 'calibration' || view === 'degassing' || view === 'archive') && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                        <div className="flex bg-bg-card p-1 rounded-industrial-sm border border-white/5 shadow-xl">
                            <button
                                onClick={() => setView('export')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'export' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Manifiestos
                            </button>
                            <button
                                onClick={() => setView('archive')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'archive' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Historial Cloud
                            </button>
                            <button
                                onClick={() => setView('calibration')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'calibration' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Calibración Espectral
                            </button>
                            <button
                                onClick={() => setView('degassing')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'degassing' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Predictor CO₂
                            </button>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {view === 'calibration' && <ComparisonCalibrationDashboard />}
                        {view === 'export' && <GreenExportForm user={user} />}
                        {view === 'degassing' && <DegassingPredictor />}
                        {view === 'archive' && <GlobalHistoryArchive user={user} />}
                    </div>
                </div>
            )}

            {view === 'retail' && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <RetailModuleContainer user={user} />
                </div>
            )}

            {/* --- PORTAL GLOBAL DE DOCUMENTOS (MODALES) --- */}

            {/* 1. Cloud Vault: Acceso universal a activos generados */}
            {showCloudVault && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] p-12 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-industrial-sm flex items-center justify-center text-brand-green-bright">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold uppercase tracking-tighter">Portal Cloud AXIS</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1">Acceso Centralizado a Assets de Confianza</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCloudVault(false)}
                                className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-bg-card border border-white/5 rounded-industrial p-12">
                            <GlobalHistoryArchive user={user} />
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Guía TRL 7: Documentación Funcional del Sistema */}
            {showFunctionalDocs && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] p-12 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-industrial-sm flex items-center justify-center text-blue-400">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                </div>
                                <h2 className="text-4xl font-bold uppercase tracking-tighter text-white">Manual de Ingeniería Pro</h2>
                            </div>
                            <button
                                onClick={() => setShowFunctionalDocs(false)}
                                className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="bg-white/2 border border-white/5 rounded-industrial p-16 space-y-12 shadow-inner text-gray-300">
                            <section className="space-y-4">
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Estatus Tecnológico: TRL 7</h3>
                                <p className="text-sm leading-relaxed">AXIS COFFEE PRO es una solución industrial operativa demostrada en entornos reales. El sistema centraliza la trazabilidad desde la recepción en finca hasta el retail transfronterizo.</p>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-brand-green-bright uppercase">Supply & Quality</h4>
                                    <p className="text-xs leading-relaxed">Control de trilla, factor de rendimiento y protocolos SCA ciegos con firma digital.</p>
                                </div>
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-orange-400 uppercase">Roast Intelligence</h4>
                                    <p className="text-xs leading-relaxed">Monitoreo espectral en vivo, Ghost Profiles y asistente IA para control de variables físicas.</p>
                                </div>
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase">Global Trade</h4>
                                    <p className="text-xs leading-relaxed">Pasaportes digitales QR y motores dinámicos de desgasificación para logística segura.</p>
                                </div>
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-purple-400 uppercase">Retail Connect</h4>
                                    <p className="text-xs leading-relaxed">Gestión multi-procedencia para retailers y etiquetado inteligente para storytelling B2C.</p>
                                </div>
                            </div>

                            <div className="p-10 bg-brand-green/10 border border-brand-green/20 rounded-industrial-sm">
                                <h4 className="text-brand-green text-xs font-bold uppercase mb-2">Propuesta de Valor</h4>
                                <p className="text-sm text-gray-100 leading-relaxed font-medium">"Transformamos la opacidad del agro en transparencia industrial, eliminando riesgos de calidad y maximizando el valor percibido del grano colombiano en el mundo."</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
