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
                            activeTab === 'purchase' ? 'ORIGIN / FARM LEVEL' :
                            activeTab === 'thrashing' ? 'DRY MILL / THRASHING' :
                            activeTab === 'analysis' ? 'PHYSICAL LAB' :
                            activeTab === 'cupping' ? 'CVA CUPPING' : 
                            activeTab === 'roast' ? 'ROAST INTELLIGENCE' : 'TEAM MANAGEMENT'
                        }
                        subtitle="AXISONE COFFEE GLOBAL • TRACEABILITY OPERATIONS"
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

                    {/* VISTA DESKTOP: Navegación horizontal de pestañas (High-Density Elegance) */}
                    <div className="hidden md:block">
                        <nav className="flex items-end justify-between bg-transparent mb-8 border-b border-brand-gray/30 gap-2">
                            {[
                                { id: 'purchase', label: 'Origin', num: '01' },
                                { id: 'thrashing', label: 'Dry Mill', num: '02' },
                                { id: 'analysis', label: 'Physical Lab', num: '03' },
                                { id: 'roast', label: 'Roast Intelligence', num: '04' },
                                { id: 'cupping', label: 'CVA Cupping', num: '05' }
                            ].map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`group relative flex flex-col items-center justify-center flex-1 pb-5 transition-all duration-500 ${isActive ? 'opacity-100 scale-105' : 'opacity-30 hover:opacity-70'}`}
                                    >
                                        <div className="relative flex items-center justify-center mb-2">
                                            <span className={`text-4xl font-light transition-colors ${isActive ? 'text-brand-green' : 'text-brand-navy'}`}>
                                                {tab.num}
                                            </span>
                                            {isActive && (
                                                <span className="absolute -top-1 -right-3.5 w-1.5 h-1.5 bg-brand-green rounded-full animate-in zoom-in duration-300"></span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy">
                                            {tab.label}
                                        </span>
                                        {/* Active Line Indicator */}
                                        {isActive && (
                                            <div className="absolute bottom-[-1px] w-full h-[2px] bg-brand-green"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="min-h-[200px] mt-4">
                            {!selectedLot && activeTab !== 'purchase' && activeTab !== 'archive' && activeTab !== 'transparency' && activeTab !== 'roast' ? (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 rounded-full bg-carbon/5 border border-gray-400 shadow-sm flex items-center justify-center text-gray-600">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M2 12h20M12 2l10 10-10 10M12 2L2 12l10 10"/></svg>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold text-brand-navy uppercase">Lot Selection Required</h3>
                                        <p className="text-xs text-gray-600 max-w-xs mx-auto uppercase leading-relaxed">
                                            Please, select a lot from the <span className="text-brand-navy font-black">Ecosystem Dashboard</span> to load technical data.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={onOpenSyncModal}
                                        className="px-6 py-3 bg-[#0C6056] text-white shadow-lg shadow-brand-green/20 rounded-full text-[11px] font-black uppercase transition-all hover:scale-105 active:scale-95"
                                    >
                                        Sync Lots
                                    </button>
                                </div>
                            ) : (
                                renderForm(activeTab)
                            )}
                        </div>
                    </div>

                    {/* VISTA MOBILE: Acordeón vertical elegante (High-Density Elegance) */}
                    <div className="md:hidden pb-20 animate-in fade-in duration-500">
                        {[
                            { id: 'purchase', label: 'ORIGIN', num: '01', status: selectedLot ? 'SAVED' : 'PENDING', locked: false },
                            { id: 'thrashing', label: 'DRY MILL', num: '02', status: !selectedLot ? 'LOCKED' : (selectedLot.thrashed_weight > 0 ? 'SAVED' : 'PENDING'), locked: !selectedLot },
                            { id: 'analysis', label: 'PHYSICAL LAB', num: '03', status: !selectedLot ? 'LOCKED' : (selectedLot.moisture > 0 || selectedLot.status === 'completed' ? 'SAVED' : 'PENDING'), locked: !selectedLot },
                            { id: 'roast', label: 'ROAST INTELL.', num: '04', status: !selectedLot ? 'LOCKED' : (selectedLot.roast_batches && selectedLot.roast_batches.length > 0 ? 'SAVED' : 'PENDING'), locked: !selectedLot },
                            { id: 'cupping', label: 'CVA CUPPING', num: '05', status: !selectedLot ? 'LOCKED' : (selectedLot.status === 'completed' ? 'SAVED' : 'PENDING'), locked: !selectedLot }
                        ].map((step) => {
                            const isOpen = activeTab === step.id;
                            const isSaved = step.status === 'SAVED';
                            return (
                                <div key={step.id} className="border-b border-brand-gray/30 overflow-hidden">
                                    <button
                                        type="button"
                                        disabled={step.locked}
                                        onClick={() => {
                                            setActiveTab(step.id as any);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`w-full flex items-center justify-between py-6 transition-all duration-500 ${step.locked ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'} ${isOpen ? 'opacity-100 pl-2' : 'opacity-50'}`}
                                    >
                                        <div className="flex items-center gap-4 relative">
                                            {isOpen && (
                                                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-brand-green rounded-full shadow-[0_0_4px_rgba(0,96,86,0.6)]"></span>
                                            )}
                                            <span className={`text-3xl font-light transition-colors ${isOpen ? 'text-brand-green' : 'text-brand-navy'}`}>{step.num}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy">{step.label}</span>
                                        </div>
                                        <span className={`text-[8px] font-bold px-2 py-1 uppercase tracking-[0.1em] ${isSaved ? 'text-brand-green' : 'text-brand-navy/40'}`}>
                                            {step.status}
                                        </span>
                                    </button>
                                    {isOpen && !step.locked && (
                                        <div className="pb-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                            {/* Renderizamos el form en un contenedor sutil */}
                                            <div className="bg-soft-white/50 rounded-[1.5rem] p-5">
                                                {renderForm(step.id as any)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
