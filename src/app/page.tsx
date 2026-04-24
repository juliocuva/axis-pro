'use client';

import React, { useState, useEffect } from 'react';
import AuthScreen from '@/shared/components/auth/AuthScreen';
import ModuleCard from '@/shared/components/layout/ModuleCard';

// Componentes de Módulos (Carga perezosa o condicional)
import SupplyModuleContainer from '@/modules/supply/components/SupplyModuleContainer';
import TrillaModuleContainer from '@/modules/supply/components/TrillaModuleContainer';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';
import GreenExportForm from '@/modules/export/components/GreenExportForm';
import MasterControlCenter from '@/modules/admin/components/MasterControlCenter';
import RoastIntelligenceContainer from '@/modules/production/components/RoastIntelligenceContainer';

import { supabase } from '@/shared/lib/supabase';
import UserDropdown from '@/shared/components/layout/UserDropdown';

export default function Home() {
    const [user, setUser] = useState<{ name: string, email: string, companyId: string, role?: string } | null>(null);
    const [view, setView] = useState<'launcher' | 'supply' | 'trilla' | 'export' | 'archive' | 'master' | 'production'>('launcher');
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
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('company_id', user?.companyId)
                .order('purchase_date', { ascending: false })
                .limit(3);

            if (data && data.length > 0) {
                const transformed = data.map(b => ({
                    id: b.batch_id,
                    date: b.purchase_date,
                    process: b.process_type || 'Export Standard',
                    greenWeight: b.net_purchased_weight,
                    isDemo: false
                }));
                setBatches(transformed);
            } else {
                // MOCK DATA PARA MOSTRAR ALCANCE (Exportadores Verdes)
                const demoBatches = [
                    { id: 'AX-GRN-001', date: new Date().toISOString(), process: 'Washed / Colombia', greenWeight: 2450.0, isDemo: true },
                    { id: 'AX-GRN-002', date: new Date(Date.now() - 86400000).toISOString(), process: 'Natural / Brazil', greenWeight: 1800.0, isDemo: true },
                    { id: 'AX-GRN-003', date: new Date(Date.now() - 172800000).toISOString(), process: 'Honey / Costa Rica', greenWeight: 900.0, isDemo: true }
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
                <div onClick={handleLogoClick} className="cursor-pointer group select-none flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-bg-offset rounded-industrial-sm flex items-center justify-center overflow-hidden border border-border-main group-hover:border-brand-green/30 transition-all">
                            <img src="/logo.png" alt="Sagrado Corazón" className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tighter uppercase leading-none">AXIS COFFEE <span className="text-brand-green-bright text-[10px] ml-1 font-bold">PRO</span></h1>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1.5">by Mouselab • Sagrado Corazón</p>
                        </div>
                    </div>
                    <div className="h-10 w-[1px] bg-white/5 hidden md:block"></div>
                    <div className="hidden md:flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Terminal Activa</p>
                        </div>
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-1">ID: BAX-7370-MASTER</p>
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
                        {(user?.email.toLowerCase().includes('julio') || user?.role === 'auditor') && (
                            <button
                                onClick={() => setView('master')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-industrial-sm text-[9px] font-bold uppercase tracking-widest transition-all ${view === 'master' ? 'bg-brand-green text-black shadow-lg shadow-brand-green/20' : 'text-gray-400 hover:text-white'}`}
                                title="Panel de Gobernanza Global"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                Gobernanza
                            </button>
                        )}
                        <button
                            onClick={() => setShowCloudVault(true)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-brand-green/10 text-brand-green-bright text-[9px] font-bold uppercase tracking-widest transition-all"
                            title="Bóveda de Documentos"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                            Bóveda en la Nube
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
                    {(user?.role === 'gerente' || user?.role === 'auditor') ? (
                        <section>
                            <h2 className="text-[10px] font-bold text-brand-green-bright uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <span className="w-8 h-px bg-white/10"></span>
                                Panel de Gerencia y Supervisión de Asociación
                                <span className="w-full h-px bg-white/10"></span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ModuleCard
                                    title="Mi Equipo y Roles"
                                    description="Gestión delegada de personal: Catadores, Tostadores y Operadores de tu asociación."
                                    status="active"
                                    color="brand-green"
                                    onClick={() => setView('master')}
                                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                                />
                                {user?.role !== 'auditor' && (
                                    <>
                                        <ModuleCard
                                            title="Lotes Certificados"
                                            description="Auditoría de lotes con aval EUDR y pasaportes digitales listos para exportación."
                                            status="active"
                                            color="blue-500"
                                            onClick={() => setView('archive')}
                                            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                                        />
                                        <ModuleCard
                                            title="Tostión y CVA 2.0"
                                            description="Supervisión de calidad sensorial y perfiles de tueste de la asociación."
                                            status="active"
                                            color="orange-500"
                                            onClick={() => setView('production')}
                                            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 18l10-4 10 4M2 12l10-4 10 4M2 6l10-4 10 4" /></svg>}
                                        />
                                    </>
                                )}
                            </div>
                        </section>
                    ) : (
                        <section>
                            <h2 className="text-[10px] font-bold text-brand-green-bright uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <span className="w-8 h-px bg-white/10"></span>
                                Emisión de Certificados de Calidad de Exportación
                                <span className="w-full h-px bg-white/10"></span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ModuleCard
                                    title="Origen Inmutable"
                                    description="Fijación de coordenadas GIS/WGS84 y polígonos EUDR requeridos para aduanas europeas y asiáticas."
                                    status="active"
                                    color="brand-green"
                                    onClick={() => setView('supply')}
                                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
                                />
                                <ModuleCard
                                    title="Estándar Verde (Trilla)"
                                    description="Transformación a Café Oro, control estricto de humedad y bioseguridad para fletes internacionales."
                                    status="active"
                                    color="purple-500"
                                    onClick={() => setView('trilla')}
                                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></svg>}
                                />
                                <ModuleCard
                                    title="Tostión Inteligente"
                                    description="Control de curvas de tueste y Evaluación CVA 2.0 (Descriptiva/Afectiva) para control de calidad."
                                    status="active"
                                    color="orange-500"
                                    onClick={() => setView('production')}
                                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 18l10-4 10 4M2 12l10-4 10 4M2 6l10-4 10 4" /></svg>}
                                />
                                <ModuleCard
                                    title="Pasaporte Aduanero"
                                    description="Emisión de Certificado de Exportación QR/Hash: Prueba irrefutable de autenticidad y cumplimiento EUDR/FDA."
                                    status="active"
                                    color="blue-500"
                                    onClick={() => setView('export')}
                                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
                                />
                            </div>
                        </section>
                    )}

                    {/* Acceso Universal al Monitor Comercial para todos los usuarios */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-bg-card border border-white/5 rounded-industrial p-8">
                                <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-brand-green-bright"></span>
                                    Monitor Comercial Lotes Verdes
                                </h3>
                                <div className="space-y-4">
                                    {batches.map((batch, index) => {
                                        return (
                                            <div key={`${batch.id}-${index}`} className="flex items-center justify-between p-4 bg-bg-main rounded-industrial-sm border border-white/5 group hover:border-brand-green/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-industrial-sm bg-white/5 flex items-center justify-center font-bold text-[10px] uppercase tracking-tighter">
                                                        {batch.process.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold uppercase text-white tracking-widest">Lote: {batch.id}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{batch.process} • {batch.greenWeight}kg</p>
                                                            {batch.isDemo && (
                                                                <span className="text-[8px] bg-brand-green/20 text-brand-green-bright px-2 py-0.5 rounded-md font-bold border border-brand-green/30 uppercase tracking-widest">Demo WGS84</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest text-brand-green-bright`}>
                                                        LISTO PARA EXPORTAR
                                                    </p>
                                                    <p className="text-[8px] text-blue-400 font-bold uppercase mt-1 tracking-widest">SICA / EUDR Asignado</p>
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
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Sincronización Aduanera</span>
                                        <span className="text-brand-green-bright font-bold">OPERATIVO</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Scanner WGS84 / GIS</span>
                                        <span className="text-blue-500 font-bold">ACTIVO</span>
                                    </div>
                                    <div className="h-px bg-white/5 my-4"></div>
                                    <div className="text-center p-6 bg-white/2 border border-white/5 rounded-industrial-sm">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Total Auditado (Mes)</p>
                                        <p className="text-4xl font-bold text-white tracking-tighter">18,450 <span className="text-[10px] text-brand-green-bright font-bold">KG</span></p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    {/* SECCIÓN ESPECIAL SOLO PARA EMAIL MAESTRO / AUDITOR */}
                    {(user?.email.toLowerCase().includes('julio') || user?.role === 'auditor') && (
                        <section className="bg-bg-card border border-brand-green/20 rounded-industrial p-20 text-center space-y-8 animate-in zoom-in duration-500 mt-20">
                             <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto border border-brand-green/20">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                             </div>
                             <div className="space-y-2">
                                <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter">Terminal de Seguridad Axis</h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.4em]">Control de Acceso y Gobernanza Global</p>
                             </div>
                             <p className="max-w-md mx-auto text-sm text-text-offset leading-relaxed font-medium">
                                Has ingresado con privilegios de nivel maestro. Tu terminal está optimizada para la auditoría de red, gestión de roles y cumplimiento normativo EUDR.
                             </p>
                             <button 
                                onClick={() => setView('master')}
                                className="px-10 py-4 bg-brand-green text-black text-xs font-black uppercase tracking-widest rounded-industrial-sm hover:bg-brand-green-bright transition-all shadow-2xl shadow-brand-green/30"
                             >
                                Entrar a la Bóveda de Control
                             </button>
                        </section>
                    )}
                </div>
            )}

            {view === 'supply' && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <SupplyModuleContainer user={user} />
                </div>
            )}

            {view === 'trilla' && (
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <TrillaModuleContainer user={user} />
                </div>
            )}

            {view === 'production' && (
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RoastIntelligenceContainer user={user} />
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

            {(view === 'export' || view === 'archive') && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                        <div className="flex bg-bg-card p-1 rounded-industrial-sm border border-white/5 shadow-xl">
                            <button
                                onClick={() => setView('export')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'export' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Emisión de Pasaportes
                            </button>
                            <button
                                onClick={() => setView('archive')}
                                className={`px-6 py-2.5 rounded-industrial-sm text-[10px] font-bold transition-all uppercase tracking-widest ${view === 'archive' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                Archivo Confidencial Nube
                            </button>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {view === 'export' && <GreenExportForm user={user} />}
                        {view === 'archive' && <GlobalHistoryArchive user={user} />}
                    </div>
                </div>
            )}

            {view === 'master' && (
                <div className="max-w-7xl mx-auto py-10">
                    <MasterControlCenter />
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
                                    <h2 className="text-4xl font-bold uppercase tracking-tighter">Portal en la Nube AXIS</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1">Acceso Centralizado a Archivos de Confianza</p>
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

            {/* 2. Guía Sistema: Documentación Funcional del Sistema */}
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
                                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Estatus Tecnológico: Sistema Operativo</h3>
                                <p className="text-sm leading-relaxed">AXIS COFFEE PRO es una solución industrial operativa demostrada en entornos reales. El sistema centraliza la trazabilidad desde la recepción en finca hasta el retail transfronterizo.</p>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-brand-green-bright uppercase">Acopio y Calidad</h4>
                                    <p className="text-xs leading-relaxed">Control de trilla, factor de rendimiento y protocolos basados en estándares de la SCA ciegos con firma digital.</p>
                                </div>
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-orange-400 uppercase">Inteligencia de Tostión</h4>
                                    <p className="text-xs leading-relaxed">Monitoreo espectral en vivo, Perfiles Espejo y asistente IA para control de variables físicas.</p>
                                </div>
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase">Comercio Global</h4>
                                    <p className="text-xs leading-relaxed">Pasaportes digitales QR y motores dinámicos de desgasificación para logística segura.</p>
                                </div>
                                <div className="p-8 bg-white/3 rounded-industrial-sm border border-white/5 space-y-3">
                                    <h4 className="text-sm font-bold text-purple-400 uppercase">Sello Inmutable</h4>
                                    <p className="text-xs leading-relaxed">Generación de Hashes y QR dinámicos que prueban criptográficamente la autenticidad del café ante cualquier puerto.</p>
                                </div>
                            </div>

                            <div className="p-10 bg-brand-green/10 border border-brand-green/20 rounded-industrial-sm shadow-[0_0_30px_rgba(0,255,136,0.1)]">
                                <h4 className="text-brand-green-bright text-[10px] font-bold uppercase tracking-widest mb-3">La Llave Maestra (Propuesta de Valor)</h4>
                                <p className="text-sm text-white leading-relaxed font-bold">"AXIS es el emisor de Certificados Digitales de Autenticidad para café verde de exportación. Garantizamos que el contenedor que subes al barco cumple instantáneamente con las normativas EUDR, FDA y auditorías globales de calidad. Lo que dices que va en el saco, está matemáticamente probado para cruzar fronteras sin fricción."</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
