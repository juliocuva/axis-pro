'use client';

import React, { useState } from 'react';
import RoastEntryForm from '@/components/roast/RoastEntryForm';
import GreenExportForm from '@/components/export/GreenExportForm';
import QualityDashboard from '@/components/roast/QualityDashboard';
import AuthScreen from '@/components/auth/AuthScreen';
import PurchaseForm from '@/components/inventory/PurchaseForm';
import RoastCurveAnalysis from '@/components/roast/RoastCurveAnalysis';

export default function Home() {
    const [user, setUser] = useState<string | null>(null);
    const [view, setView] = useState<'dashboard' | 'entry' | 'export_green' | 'quality' | 'purchase' | 'curves'>('dashboard');

    if (!user) {
        return <AuthScreen onLogin={(email) => setUser(email)} />;
    }

    return (
        <div className="min-h-screen bg-bg-main text-white p-8">
            <header className="mb-12 flex justify-between items-center flex-wrap gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight uppercase">AXIS COFFEE <span className="text-brand-green-bright text-lg ml-2 font-mono">PRO V2.0</span></h1>
                    </div>
                    <p className="text-sm text-gray-400">Sesión iniciada como: <span className="text-brand-green-bright font-mono">{user}</span></p>
                </div>

                <nav className="flex bg-bg-card p-1 rounded-xl border border-white/5 shadow-2xl overflow-x-auto max-w-full">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        RESUMEN
                    </button>
                    <button
                        onClick={() => setView('purchase')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'purchase' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        INGRESO
                    </button>
                    <button
                        onClick={() => setView('quality')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'quality' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        CALIDAD
                    </button>
                    <button
                        onClick={() => setView('curves')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'curves' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        CURVAS
                    </button>
                    <button
                        onClick={() => setView('entry')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'entry' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        TOSTADO
                    </button>
                    <button
                        onClick={() => setView('export_green')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${view === 'export_green' ? 'bg-brand-green text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        EXPORT
                    </button>
                    <button
                        onClick={() => setUser(null)}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-brand-red-bright hover:bg-brand-red/10 transition-all whitespace-nowrap"
                    >
                        SALIR
                    </button>
                </nav>
            </header>

            {view === 'dashboard' && (
                // ... (existing dashboard code)
                <div className="space-y-8 animate-in fade-in duration-700">
                    {/* Pipeline de Proceso */}
                    <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-bg-card border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50"></div>
                            <h3 className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mb-2">Comprado (Verde/Perg)</h3>
                            <p className="text-3xl font-bold">4,500 <span className="text-xs text-gray-500">kg</span></p>
                            <p className="text-[9px] text-orange-500 mt-2 font-bold uppercase tracking-widest">Pendiente por Trilla</p>
                        </div>

                        <div className="flex items-center justify-center text-gray-800">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </div>

                        <div className="bg-bg-card border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-green-bright"></div>
                            <h3 className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mb-2">Disponible (Excelso)</h3>
                            <p className="text-3xl font-bold">1,240 <span className="text-xs text-gray-500">kg</span></p>
                            <p className="text-[9px] text-brand-green-bright mt-2 font-bold uppercase tracking-widest">Listo para Tostión</p>
                        </div>

                        <div className="bg-bg-card border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-red"></div>
                            <h3 className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mb-2">Tostado Final</h3>
                            <p className="text-3xl font-bold">850 <span className="text-xs text-gray-500">kg</span></p>
                            <p className="text-[9px] text-brand-red-bright mt-2 font-bold uppercase tracking-widest">En Desgasificación</p>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Monitor de Riesgo Logístico */}
                        <div className="lg:col-span-2 bg-bg-card border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-green-bright"></span>
                                Radar de Exportación (Próximos Despachos)
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs">DXB</div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Lote: BOG-DXB-94</p>
                                            <p className="text-[10px] text-gray-500 uppercase">Dubai Express • 450kg</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-brand-green-bright">LISTO (10 d reposo)</p>
                                        <p className="text-[10px] text-gray-500">Sale en: 48h</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-white/5 opacity-60">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs">EUR</div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Lote: MAD-GEI-02</p>
                                            <p className="text-[10px] text-gray-500 uppercase">Madrid Specialty • 120kg</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-orange-500">ESTABILIZANDO (2d)</p>
                                        <p className="text-[10px] text-gray-500">Sale en: 6 días</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alertas Globales */}
                        <div className="bg-bg-card border border-white/5 rounded-3xl p-8">
                            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Centro de Alertas</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-brand-red/10 border border-brand-red/20 rounded-2xl text-xs">
                                    <p className="font-bold text-brand-red-bright mb-1">Mermas fuera de rango</p>
                                    <p className="text-gray-400">3 lotes en trilla superaron el 20% de merma. Revisar humedad inicial.</p>
                                </div>
                                <div className="p-4 bg-brand-green/10 border border-brand-green/20 rounded-2xl text-xs">
                                    <p className="font-bold text-brand-green-bright mb-1">Sincronización Cloud</p>
                                    <p className="text-gray-400">Todos los datos están respaldados en la nube de Supabase.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'entry' && <RoastEntryForm />}
            {view === 'export_green' && <GreenExportForm />}
            {view === 'quality' && <QualityDashboard />}
            {view === 'purchase' && <PurchaseForm />}
            {view === 'curves' && <RoastCurveAnalysis />}
        </div>
    );
}
