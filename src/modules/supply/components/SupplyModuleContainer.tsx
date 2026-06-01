'use client';

import React, { useState, useEffect } from 'react';
import PurchaseForm from './PurchaseForm';
import ThrashingForm from './thrashing/ThrashingForm';
import PhysicalAnalysisForm from './analysis/PhysicalAnalysisForm';
import CVAAssessmentForm from '@/modules/production/components/CVAAssessmentForm';
import LotCertificate from './analysis/LotCertificate';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';
import TeamManagement from '@/shared/components/admin/TeamManagement';
import RoastIntelligenceContainer from '@/modules/production/components/RoastIntelligenceContainer';
import ProcessPipelineDashboard from './ProcessPipelineDashboard';
import { supabase } from '@/shared/lib/supabase';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
import { useLanguage } from '@/shared/context/LanguageContext';

interface SupplyModuleContainerProps {
    user: { email: string, name: string, companyId: string, role?: string } | null;
    selectedLot: any;
    setSelectedLot: (lot: any) => void;
    recentLots: any[];
    activeTab: 'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast' | 'team' | 'archive' | 'transparency';
    setActiveTab: (tab: 'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast' | 'team' | 'archive' | 'transparency') => void;
    fetchRecentLots: () => Promise<void>;
    onOpenSyncModal: () => void;
}

export default function SupplyModuleContainer({ 
    user,
    selectedLot,
    setSelectedLot,
    recentLots,
    activeTab,
    setActiveTab,
    fetchRecentLots,
    onOpenSyncModal
}: SupplyModuleContainerProps) {
    const { t } = useLanguage();
    const [showCertificate, setShowCertificate] = useState(false);
    const [sidebarMode, setSidebarMode] = useState<'recent' | 'archive'>('recent');

    useEffect(() => {
        if (user?.companyId) {
            fetchRecentLots();
        }
    }, [user?.companyId]);

    const handleLotSelect = (lot: any) => {
        console.log("AXIS DEBUG: Seleccionando Lote ->", lot.lot_number, lot.id);
        setSelectedLot(lot);
        
        // Determinar pestaña automática según estado
        if (lot.status === 'completed') setActiveTab('cupping');
        else if (lot.status === 'purchased') setActiveTab('thrashing');
        else if (lot.status === 'thrashed') setActiveTab('analysis');
        else if (lot.status === 'physical_analyzed') setActiveTab('roast');
        else setActiveTab('roast');
    };

    const isReadOnly = selectedLot && user?.companyId !== selectedLot.company_id && !user?.email?.toLowerCase().includes('julio');

    const renderForm = (tab: typeof activeTab) => {
        if (tab === 'transparency') {
            return (
                <ProcessPipelineDashboard 
                    user={user}
                    onSelectLotAndTab={(lot, targetTab) => {
                        setSelectedLot(lot);
                        setActiveTab(targetTab);
                    }}
                    onOpenSyncModal={onOpenSyncModal}
                />
            );
        }
        if (tab === 'purchase') {
            return <PurchaseForm key={selectedLot?.id || 'new'} selectedLot={selectedLot} user={user} isReadOnly={isReadOnly} onPurchaseComplete={(lot) => { handleLotSelect(lot); fetchRecentLots(); }} />;
        }
        if (tab === 'thrashing' && selectedLot) {
            return <ThrashingForm key={selectedLot.id} inventoryId={selectedLot.id} parchmentWeight={selectedLot.purchase_weight} user={user} isReadOnly={isReadOnly} onThrashingComplete={fetchRecentLots} />;
        }
        if (tab === 'analysis' && selectedLot) {
            return <PhysicalAnalysisForm key={selectedLot.id} inventoryId={selectedLot.id} user={user} isReadOnly={isReadOnly} onAnalysisComplete={fetchRecentLots} />;
        }
        if (tab === 'cupping' && selectedLot) {
            return <CVAAssessmentForm key={selectedLot.id} inventoryId={selectedLot.id} user={user} isReadOnly={isReadOnly} onCuppingComplete={fetchRecentLots} />;
        }
        if (tab === 'roast') {
            return <RoastIntelligenceContainer user={user} />;
        }
        if (tab === 'archive') {
            return <GlobalHistoryArchive user={user} />;
        }
        return null;
    };

    return (
        <>
            {showCertificate && selectedLot && (
                <div className="fixed inset-0 z-[100] w-full h-screen overflow-y-auto bg-black/90 backdrop-blur-sm print:relative print:h-auto print:overflow-visible print:bg-transparent" onClick={(e) => { if (e.target === e.currentTarget) setShowCertificate(false); }}>
                    <div className="w-full py-10 pb-[150px] print:py-0 print:pb-0">
                        <LotCertificate inventoryId={selectedLot.id} user={user} onClose={() => setShowCertificate(false)} />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 animate-in fade-in duration-700 print:hidden">
                {/* COLUMNA PRINCIPAL */}
                <div className="flex-1 space-y-4">
                    <ModuleHeader 
                        title={
                            activeTab === 'transparency' ? '📊 MONITOREO Y TRANSPARENCIA 360°' :
                            activeTab === 'purchase' ? t('moduleHeaders', 'purchase') :
                            activeTab === 'thrashing' ? t('moduleHeaders', 'thrashing') :
                            activeTab === 'analysis' ? t('moduleHeaders', 'analysis') :
                            activeTab === 'cupping' ? t('moduleHeaders', 'cupping') : 
                            activeTab === 'roast' ? t('moduleHeaders', 'roast') : t('moduleHeaders', 'team')
                        }
                        subtitle="AXISONE COFFEE GLOBAL • ORIGIN QUALITY SYSTEM"
                    >
                        {selectedLot && activeTab !== 'archive' && activeTab !== 'transparency' && (
                            <div className="flex items-center gap-4 bg-white border border-gray-400 shadow-sm px-6 py-3 rounded-industrial animate-in fade-in slide-in-from-right-4 duration-500">
                                <span className="text-[11px] font-black text-brand-navy uppercase">{selectedLot.farmer_name} | {selectedLot.lot_number}</span>
                                <button 
                                    onClick={() => setShowCertificate(true)} 
                                    className="text-[11px] font-bold text-white bg-black px-4 py-1.5 rounded-full hover:bg-gray-900 transition-all shadow-sm"
                                >
                                    CERTIFICADO
                                </button>
                            </div>
                        )}
                    </ModuleHeader>

                    {/* VISTA DESKTOP: Navegación horizontal de pestañas */}
                    <div className="hidden md:block">
                        <nav className="flex flex-wrap bg-transparent p-0 mb-4 gap-2">
                            {[
                                { id: 'transparency', label: 'Monitoreo 360°' },
                                { id: 'purchase', label: t('tabs', 'origin') },
                                { id: 'thrashing', label: t('tabs', 'thrashing') },
                                { id: 'analysis', label: t('tabs', 'lab') },
                                { id: 'roast', label: t('tabs', 'roast') },
                                { id: 'cupping', label: t('tabs', 'cupping') }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 min-w-[80px] py-3 rounded-lg text-[11px] font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-brand-green border-transparent text-brand-navy font-black shadow-md' : 'bg-white border border-gray-400 text-brand-navy hover:border-black'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="bg-soft-white/50 rounded-industrial border border-gray-400 shadow-sm p-6 min-h-[500px]">
                            {!selectedLot && activeTab !== 'purchase' && activeTab !== 'archive' && activeTab !== 'transparency' ? (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 rounded-full bg-carbon/5 border border-gray-400 shadow-sm flex items-center justify-center text-gray-600">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M2 12h20M12 2l10 10-10 10M12 2L2 12l10 10"/></svg>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-brand-navy uppercase">Requiere Selección de Lote</h3>
                                        <p className="text-xs text-gray-600 max-w-xs mx-auto uppercase leading-relaxed">
                                            Por favor, selecciona un lote del <span className="text-brand-navy font-black">Historial de Flujo</span> en la parte inferior para cargar los datos técnicos.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={onOpenSyncModal}
                                        className="px-6 py-3 bg-[#0C6056] text-white shadow-lg shadow-brand-green/20 rounded-full text-[11px] font-black uppercase transition-all hover:scale-105 active:scale-95"
                                    >
                                        Sincronizar Lotes
                                    </button>
                                </div>
                            ) : (
                                renderForm(activeTab)
                            )}
                        </div>
                    </div>

                    {/* VISTA MOBILE: Acordeón vertical ultra digerible */}
                    <div className="md:hidden space-y-3 pb-20 animate-in fade-in duration-500">
                        {/* ITEM 0: Panel de Monitoreo 360° en Móvil */}
                        <div className={`border-2 rounded-2xl overflow-hidden shadow-sm transition-all ${activeTab === 'transparency' ? 'border-brand-green bg-white shadow-md' : 'border-zinc-200 bg-zinc-50/30'}`}>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('transparency');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full flex items-center justify-between p-4 text-xs font-black uppercase text-left transition-all hover:bg-zinc-50"
                            >
                                <span className="text-brand-navy tracking-wide">Monitoreo y Procesos 360°</span>
                                <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800 uppercase">
                                    Ecosistema
                                </span>
                            </button>
                            {activeTab === 'transparency' && (
                                <div className="p-4 bg-white border-t border-zinc-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {renderForm('transparency')}
                                </div>
                            )}
                        </div>

                        {[
                            { id: 'purchase', label: '1. Origen y Compra', status: selectedLot ? '✓ Guardado' : 'Pendiente', color: selectedLot ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200', locked: false },
                            { id: 'thrashing', label: '2. Trilla y Rendimiento', status: !selectedLot ? '🔒' : (selectedLot.thrashed_weight > 0 ? '✓ Trillado' : 'Pendiente'), color: !selectedLot ? 'text-zinc-400 bg-zinc-50 border-zinc-200' : (selectedLot.thrashed_weight > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'), locked: !selectedLot },
                            { id: 'analysis', label: '3. Laboratorio Físico', status: !selectedLot ? '🔒' : (selectedLot.moisture > 0 || selectedLot.status === 'completed' ? '✓ Analizado' : 'Pendiente'), color: !selectedLot ? 'text-zinc-400 bg-zinc-50 border-zinc-200' : (selectedLot.moisture > 0 || selectedLot.status === 'completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'), locked: !selectedLot },
                            { id: 'roast', label: '4. Tostión de Café', status: !selectedLot ? '🔒' : (selectedLot.roast_batches && selectedLot.roast_batches.length > 0 ? '✓ Tostado' : 'Pendiente'), color: !selectedLot ? 'text-zinc-400 bg-zinc-50 border-zinc-200' : (selectedLot.roast_batches && selectedLot.roast_batches.length > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'), locked: !selectedLot },
                            { id: 'cupping', label: '5. Catación (SCA CVA)', status: !selectedLot ? '🔒' : (selectedLot.status === 'completed' ? '✓ Sellado' : 'Pendiente'), color: !selectedLot ? 'text-zinc-400 bg-zinc-50 border-zinc-200' : (selectedLot.status === 'completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'), locked: !selectedLot }
                        ].map((step) => {
                            const isOpen = activeTab === step.id;
                            return (
                                <div key={step.id} className={`border-2 rounded-2xl overflow-hidden shadow-sm transition-all ${isOpen ? 'border-brand-green bg-white shadow-md' : 'border-zinc-200 bg-zinc-50/30'}`}>
                                    <button
                                        type="button"
                                        disabled={step.locked}
                                        onClick={() => {
                                            setActiveTab(step.id as any);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`w-full flex items-center justify-between p-4 text-xs font-black uppercase text-left transition-all ${step.locked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-50'}`}
                                    >
                                        <span className="text-brand-navy tracking-wide">{step.label}</span>
                                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${step.color}`}>
                                            {step.status}
                                        </span>
                                    </button>
                                    {isOpen && !step.locked && (
                                        <div className="p-4 bg-white border-t border-zinc-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                            {renderForm(step.id as any)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* HISTORIAL ARCHIVO MÓVIL DIRECTO */}
                        <div className="border border-dashed border-zinc-300 rounded-2xl p-4 text-center mt-6">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3">¿Deseas buscar o ver el archivo histórico?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={onOpenSyncModal}
                                    className="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow"
                                >
                                    🔍 Buscar Lote
                                </button>
                                <button
                                    onClick={() => { setActiveTab('archive'); }}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${activeTab === 'archive' ? 'bg-brand-green text-brand-navy border-brand-green' : 'bg-white border-zinc-300 text-zinc-700'}`}
                                >
                                    📁 Ver Archivo
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
