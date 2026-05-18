'use client';

import React, { useState, useEffect } from 'react';
import AuthScreen from '@/shared/components/auth/AuthScreen';
import ModuleCard from '@/shared/components/layout/ModuleCard';

// Componentes de Módulos (Carga perezosa o condicional)
import SupplyModuleContainer from '@/modules/supply/components/SupplyModuleContainer';
import TrillaModuleContainer from '@/modules/supply/components/TrillaModuleContainer';
import MasterControlCenter from '@/modules/admin/components/MasterControlCenter';
import RoastIntelligenceContainer from '@/modules/production/components/RoastIntelligenceContainer';
import GratefulModule from '@/modules/supply/components/GratefulModule';
import RadarDashboard from '@/modules/supply/components/analysis/RadarDashboard';
import CloudVault from '@/modules/export/components/CloudVault';
import PurchaseForm from '@/modules/supply/components/PurchaseForm';

import { supabase } from '@/shared/lib/supabase';
import UserDropdown from '@/shared/components/layout/UserDropdown';

export default function Home() {
    const [user, setUser] = useState<{ name: string, email: string, companyId: string, role?: string } | null>(null);
    const [view, setView] = useState<'supply' | 'trilla' | 'master' | 'production' | 'grateful' | 'radar'>('supply');
    const [batches, setBatches] = useState<any[]>([]);
    const [latestLotDestination, setLatestLotDestination] = useState<'internal' | 'export_green' | 'export_roasted' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Lifted and Shared lot states
    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [recentLots, setRecentLots] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast' | 'team' | 'archive'>('purchase');
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [syncSearchQuery, setSyncSearchQuery] = useState('');
    const [syncCurrentPage, setSyncCurrentPage] = useState(1);

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
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);

    const handleLogoClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount === 5) {
            setIsDemoUnlocked(true);
            setClickCount(0);
        }
    };

    const fetchRecentLots = async (currentSelectedLot = selectedLot) => {
        if (!user) return;
        try {
            let query = supabase
                .from('coffee_purchase_inventory')
                .select('*, roast_batches(id)');
                
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase()?.includes('julio') && !user?.email?.toLowerCase()?.includes('main')) {
                query = query.eq('company_id', user?.companyId);
            }

            const { data: recent } = await query
                .order('created_at', { ascending: false });

            if (recent) setRecentLots(recent);

            // Refrescar el lote seleccionado actual para evitar datos stale
            if (currentSelectedLot) {
                const { data: freshLot } = await supabase
                    .from('coffee_purchase_inventory')
                    .select('*, roast_batches(id)')
                    .eq('id', currentSelectedLot.id)
                    .maybeSingle();
                
                if (freshLot) {
                    setSelectedLot(freshLot);
                }
            }
        } catch (err) {
            console.error("AXIS Error fetching lots:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRecentBatches();
            fetchRecentLots();
        }
    }, [user]);

    useEffect(() => {
        if (showSyncModal) {
            fetchRecentLots();
            setSyncSearchQuery('');
            setSyncCurrentPage(1);
        }
    }, [showSyncModal]);


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

            let batchesQuery = supabase.from('coffee_purchase_inventory').select('*');
            
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase().includes('julio') && !user?.email?.toLowerCase().includes('main')) {
                batchesQuery = batchesQuery.eq('company_id', user?.companyId);
            }

            const { data } = await batchesQuery
                .order('created_at', { ascending: false })
                .limit(10);

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

    const filteredLots = recentLots.filter(lot => {
        const query = syncSearchQuery.toLowerCase();
        return (
            (lot.farmer_name || '').toLowerCase().includes(query) ||
            (lot.lot_number || '').toLowerCase().includes(query) ||
            (lot.region || '').toLowerCase().includes(query) ||
            (lot.variety || '').toLowerCase().includes(query)
        );
    });

    const itemsPerPage = 8;
    const totalSyncPages = Math.ceil(filteredLots.length / itemsPerPage);
    const syncCurrentItems = filteredLots.slice(
        (syncCurrentPage - 1) * itemsPerPage,
        syncCurrentPage * itemsPerPage
    );

    if (!user) {
        return <AuthScreen onLogin={(userData) => {
            setUser(userData);
        }} />;
    }

    return (
        <div className="min-h-screen bg-bg-main p-8 transition-colors duration-400">
            <header className="mb-12 flex justify-between items-center flex-wrap gap-6 border-b border-gray-200 shadow-sm pb-8">
                <div onClick={handleLogoClick} className="cursor-pointer group select-none flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-36 h-36 bg-bg-offset rounded-industrial-sm flex items-center justify-center overflow-hidden border border-border-main group-hover:border-gray-200 shadow-sm transition-all">
                            <img src="/logo.png" alt="Sagrado Corazón" className="w-full h-full object-contain p-2" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-black uppercase tracking-widest">AXIS ONE <span className="text-brand-green">PRO</span></span>
                            <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mt-1">Industrial Supply Chain</span>
                        </div>
                    </div>
                </div>

                <nav className="flex items-center gap-4">
                    <div className="w-px h-8 bg-gray-200 mx-2"></div>

                    <button
                        onClick={() => setShowPurchaseForm(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-brand-green text-white rounded-industrial-sm text-[10px] font-black uppercase transition-all shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Nuevo Lote
                    </button>

                    <button
                        onClick={() => setShowSyncModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-bg-offset text-black border border-border-main rounded-industrial-sm text-[10px] font-black uppercase transition-all hover:bg-white hover:border-black active:scale-95 shadow-sm"
                        title="Buscar y Sincronizar Lotes"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        Sincronizar Lotes
                    </button>

                    {user?.email?.toLowerCase() === 'juliocuva@gmail.com' && (
                        <button
                            onClick={() => setView('radar')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-bg-offset text-black border border-border-main rounded-industrial-sm text-[10px] font-black uppercase transition-all hover:bg-white hover:border-black active:scale-95 shadow-sm"
                            title="Ver Radar de Trazabilidad"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20M12 12l5-5"/></svg>
                            Ver Radar
                        </button>
                    )}

                    <div className="w-px h-8 bg-gray-200 mx-2"></div>

                    <div className="flex bg-bg-offset p-1 rounded-industrial-sm border border-border-main overflow-hidden shadow-sm">
                        <button
                            onClick={() => { setView('supply'); setShowCloudVault(false); }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-industrial-sm text-[10px] font-black uppercase transition-all ${view !== 'master' && !showCloudVault ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-black/40 hover:text-black'}`}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/><path d="M12 22V12"/><path d="M21 7l-9 5-9-5"/></svg>
                            Operaciones
                        </button>

                        {(user?.email.toLowerCase().includes('julio') || user?.role === 'auditor' || user?.role === 'admin') && (
                            <button
                                onClick={() => { setView('master'); setShowCloudVault(false); }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-industrial-sm text-[10px] font-black uppercase transition-all ${view === 'master' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-black/40 hover:text-black'}`}
                                title="Panel de Gobernanza Global"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                Gobernanza
                            </button>
                        )}
                        
                        <button
                            onClick={() => setShowCloudVault(true)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-industrial-sm text-[10px] font-black uppercase transition-all ${showCloudVault ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-black/40 hover:text-black'}`}
                            title="Archivo Maestro de Procesos"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                            Archivo
                        </button>
                    </div>

                    <div className="w-px h-8 bg-gray-200 mx-2"></div>

                    <button
                        onClick={toggleTheme}
                        className="w-11 h-11 rounded-industrial-sm bg-bg-offset border border-border-main flex items-center justify-center hover:bg-white transition-all group shadow-sm"
                        title={theme === 'dark' ? 'Modo Luz' : 'Modo Oscuro'}
                    >
                        {theme === 'dark' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black group-hover:rotate-12 transition-transform">
                                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black group-hover:-rotate-12 transition-transform">
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


            {view === 'supply' && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <SupplyModuleContainer 
                        user={user} 
                        selectedLot={selectedLot}
                        setSelectedLot={setSelectedLot}
                        recentLots={recentLots}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        fetchRecentLots={fetchRecentLots}
                        onOpenSyncModal={() => setShowSyncModal(true)}
                    />
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

            {view === 'grateful' && (
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GratefulModule user={user} selectedLot={null} />
                </div>
            )}

            {view === 'radar' && (
                <div className="fixed inset-0 z-[500] bg-black animate-in fade-in duration-700">
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1001] no-print">
                         <button 
                            onClick={() => setView('supply')}
                            className="px-6 py-2 bg-white hover:bg-white backdrop-blur-md border border-gray-200 shadow-sm rounded-full text-[9px] font-black uppercase  text-black transition-all active:scale-95"
                         >
                            Cerrar Radar
                         </button>
                    </div>
                    <RadarDashboard user={user} />
                </div>
            )}

            {/* BIENVENIDA ELIMINADA - SE ENVIARÁ POR CORREO ELECTRÓNICO */}

            {/* MODAL DE ACTUALIZACIONES / MENSAJES DEL SISTEMA */}
            {showUpdates && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500">
                    <div className="bg-bg-card border border-gray-200 shadow-sm w-full max-w-xl rounded-industrial p-10 shadow-3xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-bold text-black uppercase er">Centro de Mensajes</h3>
                            <button onClick={() => setShowUpdates(false)} className="text-gray-900 hover:text-black transition-all">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-industrial-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-brand-green text-black px-3 py-1 text-[9px] font-bold uppercase rounded-bl-xl">Nuevo</div>
                                <h4 className="text-[11px] font-bold text-black-bright uppercase  mb-2">Nueva Versión Core V2.0.4</h4>
                                <p className="text-xs text-black leading-relaxed">
                                    Hemos optimizado el motor de predicción de desgasificación para granos Honey y Natural. La precisión ha aumentado en un <span className="text-black">12.4%</span>.
                                </p>
                            </div>

                            <div className="p-6 bg-white/2 border border-gray-200 shadow-sm rounded-industrial-sm opacity-60">
                                <h4 className="text-[11px] font-bold text-gray-900 uppercase  mb-2">Mantenimiento Programado</h4>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    El próximo domingo a las 02:00 AM (COT) se realizará una actualización de los servidores AXIS. El sistema estará fuera de línea por 15 minutos.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowUpdates(false)}
                            className="w-full mt-10 bg-white hover:bg-white text-black font-bold py-4 rounded-xl transition-all uppercase  text-[9px] border border-gray-200 shadow-sm"
                        >
                            ENTENDIDO, VOLVER Al CORE
                        </button>
                    </div>
                </div>
            )}

            {/* BLOQUE DE EXPORTACIÓN Y ARCHIVO ELIMINADO - INTEGRADO EN ARCHIVO MAESTRO (MODAL) */}

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
                                <div className="w-12 h-12 bg-white rounded-industrial-sm flex items-center justify-center text-black-bright">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold uppercase er">Portal en la Nube AXIS</h2>
                                    <p className="text-[11px] text-gray-900 font-bold uppercase  mt-1">Acceso Centralizado a Archivos de Confianza</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCloudVault(false)}
                                className="w-14 h-14 bg-white hover:bg-white rounded-full flex items-center justify-center text-black transition-all border border-gray-200 shadow-sm"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-bg-card border border-gray-200 shadow-sm rounded-industrial p-12">
                            <CloudVault user={user} />
                        </div>
                    </div>
                </div>
            )}


            {/* 3. Formulario de Nuevo Lote: Acceso Directo */}
            {showPurchaseForm && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[600] p-6 md:p-12 overflow-y-auto animate-in fade-in duration-500">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-green rounded-industrial-sm flex items-center justify-center text-black">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-bold uppercase er text-white">Registro de Nuevo Lote</h2>
                                    <p className="text-[11px] text-brand-green font-bold uppercase  mt-1">Iniciando Trazabilidad en Origen</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPurchaseForm(false)}
                                className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all border border-white/10 shadow-sm"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-white border border-gray-200 shadow-sm rounded-industrial p-2 md:p-10">
                            <PurchaseForm 
                                user={user} 
                                onPurchaseComplete={() => {
                                    setShowPurchaseForm(false);
                                    fetchRecentBatches();
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Portal de Sincronización y Búsqueda de Lotes: Acceso Pagina Completa y Paginado */}
            {showSyncModal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[600] p-6 md:p-12 overflow-y-auto animate-in fade-in duration-500">
                    <div className="max-w-4xl mx-auto flex flex-col min-h-[85vh] justify-between">
                        <div>
                            {/* Cabecera del Portal */}
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-bg-offset border border-border-main rounded-industrial-sm flex items-center justify-center text-black shadow-sm">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green animate-spin-slow"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold uppercase er text-white tracking-wider">Sincronizador de Lotes</h2>
                                        <p className="text-[11px] text-brand-green font-black uppercase mt-1">Historial de Flujo e Integridad en Tiempo Real</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSyncModal(false)}
                                    className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/10 shadow-sm hover:scale-105 active:scale-95"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Barra de Búsqueda Premium */}
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/40"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={syncSearchQuery}
                                    onChange={(e) => {
                                        setSyncSearchQuery(e.target.value);
                                        setSyncCurrentPage(1); // Reset page on type
                                    }}
                                    placeholder="Buscar por productor, número de lote, finca, región o variedad..."
                                    className="w-full bg-white/5 border border-white/10 rounded-industrial-sm py-4 pl-12 pr-6 text-white text-xs font-medium placeholder-white/30 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <span className="text-[10px] font-black text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1 rounded-full uppercase">
                                        {filteredLots.length} Lotes Criptográficos
                                    </span>
                                </div>
                            </div>

                            {/* Listado de Lotes */}
                            {syncCurrentItems.length === 0 ? (
                                <div className="bg-white/5 border border-white/5 rounded-industrial p-12 text-center my-8">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/30 mx-auto mb-4 border border-white/5">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                    </div>
                                    <p className="text-xs uppercase font-bold text-white/50 tracking-wider">No se encontraron lotes que coincidan con la búsqueda</p>
                                </div>
                            ) : (
                                <div className="space-y-3 my-4">
                                    {syncCurrentItems.map(lot => {
                                        let step = 1;
                                        if (lot.status === 'thrashed' || lot.status === 'completed' || lot.thrashed_weight > 0) step = 2;
                                        if (lot.status === 'completed' || lot.status === 'physical_analyzed') step = 3;
                                        if (lot.status === 'completed') step = 4;
                                        if (lot.roast_batches && lot.roast_batches.length > 0) step = 5;

                                        const isCurrent = selectedLot?.id === lot.id;

                                        return (
                                            <div
                                                key={lot.id}
                                                onClick={() => {
                                                    setSelectedLot(lot);
                                                    let tab: 'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast' | 'team' = 'purchase';
                                                    if (lot.status === 'completed') tab = 'cupping';
                                                    else if (lot.status === 'purchased') tab = 'thrashing';
                                                    else if (lot.status === 'thrashed') tab = 'analysis';
                                                    else if (lot.status === 'physical_analyzed') tab = 'roast';
                                                    else tab = 'roast';

                                                    setActiveTab(tab);
                                                    setView('supply');
                                                    setShowSyncModal(false);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className={`group flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                                                    isCurrent 
                                                        ? 'bg-brand-green/10 border-brand-green shadow-lg shadow-brand-green/5' 
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {/* Izquierda: Productor e Info */}
                                                <div className="flex items-center gap-4 min-w-[200px]">
                                                    <div className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-brand-green animate-pulse' : 'bg-white/20 group-hover:bg-brand-green/60 transition-colors'}`}></div>
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase group-hover:text-brand-green transition-colors">{lot.farmer_name || 'Independiente'}</p>
                                                        <p className="text-[10px] text-white/50 uppercase mt-0.5">{lot.farm_name || 'Sin Finca'} • {lot.region || 'Huila'}</p>
                                                    </div>
                                                </div>

                                                {/* Centro: ID de Lote y Detalles del Café */}
                                                <div className="flex flex-col min-w-[150px]">
                                                    <span className="text-xs font-mono font-black text-white tracking-widest uppercase">{lot.lot_number}</span>
                                                    <span className="text-[9px] text-white/40 uppercase mt-0.5">{lot.variety || 'Caturra'} • {lot.process_type || lot.process || 'Lavado'}</span>
                                                </div>

                                                {/* Derecha: Indicador de Fases e Info */}
                                                <div className="flex items-center gap-6">
                                                    {/* Fase Dots */}
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Fase {step}/5</span>
                                                        <div className="flex gap-1 bg-black/40 p-1.5 rounded-lg border border-white/5">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <div 
                                                                    key={i} 
                                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                                        i <= step 
                                                                            ? 'bg-brand-green shadow-[0_0_6px_rgba(0,255,136,0.6)]' 
                                                                            : 'bg-white/10'
                                                                    }`}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Flecha de Selección */}
                                                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-brand-green group-hover:text-black flex items-center justify-center text-white/60 transition-all">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-180"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Paginación en la Parte Inferior */}
                        {totalSyncPages > 1 && (
                            <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-8">
                                <button
                                    onClick={() => setSyncCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={syncCurrentPage === 1}
                                    className="px-6 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                    Anterior
                                </button>
                                <span className="text-[10px] font-black uppercase text-white/50 tracking-wider">
                                    Página {syncCurrentPage} de {totalSyncPages}
                                </span>
                                <button
                                    onClick={() => setSyncCurrentPage(p => Math.min(p + 1, totalSyncPages))}
                                    disabled={syncCurrentPage === totalSyncPages}
                                    className="px-6 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                                >
                                    Siguiente
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
