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
import { supabase } from '@/shared/lib/supabase';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
import { useLanguage } from '@/shared/context/LanguageContext';

interface SupplyModuleContainerProps {
    user: { email: string, name: string, companyId: string, role?: string } | null;
    selectedLot: any;
    setSelectedLot: (lot: any) => void;
    recentLots: any[];
    activeTab: 'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast' | 'team' | 'archive';
    setActiveTab: (tab: 'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast' | 'team' | 'archive') => void;
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

    return (
        <>
            {showCertificate && selectedLot && (
                <div className="fixed inset-0 z-[100] w-full h-screen overflow-y-auto bg-black/90 backdrop-blur-sm" onClick={() => setShowCertificate(false)}>
                    <div className="w-full py-10 pb-[150px]">
                        <LotCertificate inventoryId={selectedLot.id} user={user} onClose={() => setShowCertificate(false)} />
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-8 animate-in fade-in duration-700">
                {/* COLUMNA PRINCIPAL */}
                <div className="flex-1 space-y-8">
                    <ModuleHeader 
                        title={
                            activeTab === 'purchase' ? t('moduleHeaders', 'purchase') :
                            activeTab === 'thrashing' ? t('moduleHeaders', 'thrashing') :
                            activeTab === 'analysis' ? t('moduleHeaders', 'analysis') :
                            activeTab === 'cupping' ? t('moduleHeaders', 'cupping') : 
                            activeTab === 'roast' ? t('moduleHeaders', 'roast') : t('moduleHeaders', 'team')
                        }
                        subtitle="AXISONE COFFEE COLOMBIA • SISTEMA DE TRAZABILIDAD INDUSTRIAL"
                    >
                        {selectedLot && activeTab !== 'archive' && (
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

                    <nav className="flex flex-wrap bg-transparent p-0 mb-8">
                        {[
                            { id: 'purchase', label: t('tabs', 'origin') },
                            { id: 'thrashing', label: t('tabs', 'thrashing') },
                            { id: 'analysis', label: t('tabs', 'lab') },
                            { id: 'roast', label: t('tabs', 'roast') },
                            { id: 'cupping', label: t('tabs', 'cupping') }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 min-w-[80px] py-3 rounded-lg text-[11px] font-bold uppercase  transition-all ${activeTab === tab.id ? 'bg-brand-green border-transparent text-brand-navy' : 'bg-white border-gray-400 text-brand-navy hover:border-black'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="bg-soft-white/50 rounded-industrial border border-gray-400 shadow-sm p-4 lg:p-8 min-h-[500px]">

                        {!selectedLot && activeTab !== 'purchase' && activeTab !== 'archive' && (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 rounded-full bg-carbon/5 border border-gray-400 shadow-sm flex items-center justify-center text-gray-600">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M2 12h20M12 2l10 10-10 10M12 2L2 12l10 10"/></svg>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-brand-navy uppercase ">Requiere Selección de Lote</h3>
                                    <p className="text-xs text-gray-600 max-w-xs mx-auto uppercase  leading-relaxed">
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
                        )}

                        {(() => {
                            const isReadOnly = selectedLot && user?.companyId !== selectedLot.company_id && !user?.email?.toLowerCase().includes('julio');
                            
                            return (
                                <>
                                    {activeTab === 'purchase' && <PurchaseForm key={selectedLot?.id || 'new'} selectedLot={selectedLot} user={user} isReadOnly={isReadOnly} onPurchaseComplete={(lot) => { handleLotSelect(lot); fetchRecentLots(); }} />}
                                    {activeTab === 'thrashing' && selectedLot && <ThrashingForm key={selectedLot.id} inventoryId={selectedLot.id} parchmentWeight={selectedLot.purchase_weight} user={user} isReadOnly={isReadOnly} onThrashingComplete={fetchRecentLots} />}
                                    {activeTab === 'analysis' && selectedLot && <PhysicalAnalysisForm key={selectedLot.id} inventoryId={selectedLot.id} user={user} isReadOnly={isReadOnly} onAnalysisComplete={fetchRecentLots} />}
                                    {activeTab === 'cupping' && selectedLot && <CVAAssessmentForm key={selectedLot.id} inventoryId={selectedLot.id} user={user} isReadOnly={isReadOnly} onCuppingComplete={fetchRecentLots} />}
                                    {activeTab === 'roast' && <RoastIntelligenceContainer user={user} />}
                                    {activeTab === 'archive' && <GlobalHistoryArchive user={user} />}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </>
    );
}
