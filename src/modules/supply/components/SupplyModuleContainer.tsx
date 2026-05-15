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

interface SupplyModuleContainerProps {
    user: { email: string, name: string, companyId: string, role?: string } | null;
}

export default function SupplyModuleContainer({ user }: SupplyModuleContainerProps) {
    const [activeTab, setActiveTab] = useState<'purchase' | 'thrashing' | 'analysis' | 'cupping' | 'roast' | 'archive' | 'team'>('purchase');
    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [recentLots, setRecentLots] = useState<any[]>([]);
    const [showCertificate, setShowCertificate] = useState(false);
    const [sidebarMode, setSidebarMode] = useState<'recent' | 'archive'>('recent');

    useEffect(() => {
        if (user?.companyId) {
            fetchRecentLots();
        }
    }, [user?.companyId]);

    const fetchRecentLots = async () => {
        let query = supabase
            .from('coffee_purchase_inventory')
            .select('*, roast_batches(id)');
            
        if (user?.role !== 'auditor' && !user?.email?.toLowerCase()?.includes('julio') && !user?.email?.toLowerCase()?.includes('main')) {
            query = query.eq('company_id', user?.companyId);
        }

        const { data: recent } = await query
            .order('created_at', { ascending: false })
            .limit(10);

        if (recent) setRecentLots(recent);
    };

    const handleLotSelect = (lot: any) => {
        console.log("AXIS DEBUG: Seleccionando Lote ->", lot.lot_number, lot.id);
        setSelectedLot(lot);
        
        // Determinar pestaña automática según estado
        if (lot.status === 'completed') setActiveTab('cupping');
        else if (lot.status === 'purchased') setActiveTab('thrashing');
        else if (lot.status === 'thrashed') setActiveTab('analysis');
        else setActiveTab('cupping');
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
                            activeTab === 'purchase' ? 'Registro de Origen' :
                            activeTab === 'thrashing' ? 'Trilla Industrial' :
                            activeTab === 'analysis' ? 'Laboratorio Físico' :
                            activeTab === 'cupping' ? 'Catación' : 
                            activeTab === 'roast' ? 'Tostión Inteligente' : 'Archivo'
                        }
                        subtitle="AXISONE COFFEE COLOMBIA • SISTEMA DE TRAZABILIDAD INDUSTRIAL"
                    >
                        {selectedLot && activeTab !== 'archive' && (
                            <div className="flex items-center gap-4 bg-white border border-gray-400 shadow-sm px-6 py-3 rounded-industrial animate-in fade-in slide-in-from-right-4 duration-500">
                                <span className="text-[11px] font-black text-black uppercase">{selectedLot.farmer_name} | {selectedLot.lot_number}</span>
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
                            { id: 'purchase', label: '01. Origen' },
                            { id: 'thrashing', label: '02. Trilla' },
                            { id: 'analysis', label: '03. Lab' },
                            { id: 'cupping', label: '04. CATACIÓN' },
                            { id: 'roast', label: '05. Tostión' },
                            { id: 'archive', label: '06. Archivo' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 min-w-[80px] py-3 rounded-lg text-[11px] font-bold uppercase  transition-all ${activeTab === tab.id ? 'bg-brand-green border-transparent text-black' : 'bg-white border-gray-400 text-black hover:border-black'}`}
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
                                    <h3 className="text-lg font-bold text-carbon uppercase ">Requiere Selección de Lote</h3>
                                    <p className="text-xs text-gray-600 max-w-xs mx-auto uppercase  leading-relaxed">
                                        Por favor, selecciona un lote del <span className="text-black font-black">Historial de Flujo</span> en la parte inferior para cargar los datos técnicos.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                                    className="px-6 py-3 bg-white border border-gray-400 shadow-sm rounded-full text-[11px] font-black text-black uppercase  hover:bg-white border border-gray-400 shadow-sm transition-all"
                                >
                                    Ir a Sincronización Viva
                                </button>
                            </div>
                        )}

                        {(() => {
                            const isReadOnly = selectedLot && user?.companyId !== selectedLot.company_id && !user?.email?.toLowerCase().includes('julio');
                            
                            return (
                                <>
                                    {activeTab === 'purchase' && <PurchaseForm key={selectedLot?.id || 'new'} selectedLot={selectedLot} user={user} isReadOnly={isReadOnly} onPurchaseComplete={(lot) => { setSelectedLot(lot); fetchRecentLots(); }} />}
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
                
                {/* NUEVA SECCIÓN INFERIOR TÉCNICA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12 border-t border-gray-400 shadow-sm">
                    <div className="lg:col-span-1">
                         <button 
                            onClick={() => { setSelectedLot(null); setActiveTab('purchase'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            className="w-full py-8 bg-white text-black font-black uppercase text-xs  rounded-2xl hover:bg-brand-green transition-all shadow-[0_20px_50px_rgba(0,0,0,0.3)] group"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                INICIAR NUEVO LOTE
                            </span>
                        </button>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-soft-white border border-gray-400 shadow-sm p-8 rounded-industrial">
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-400 shadow-sm">
                                <h4 className="text-[11px] font-black text-gray-600 uppercase ">Sincronización Viva • Historial de Flujo</h4>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                                    <span className="text-[9px] font-bold text-black uppercase ">Conectado a AXIS Cloud</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentLots.map(lot => {
                                    let step = 1;
                                    if (lot.status === 'thrashed' || lot.status === 'completed' || lot.thrashed_weight > 0) step = 2;
                                    if (lot.status === 'completed' || lot.status === 'physical_analyzed') step = 3;
                                    if (lot.status === 'completed') step = 4;
                                    if (lot.roast_batches && lot.roast_batches.length > 0) step = 5;

                                    return (
                                        <div key={lot.id} onClick={() => { handleLotSelect(lot); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedLot?.id === lot.id ? 'bg-white border-gray-400 shadow-sm' : 'bg-white/2 border-gray-400 shadow-sm hover:border-gray-400 shadow-sm'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-black text-carbon uppercase truncate max-w-[120px]">{lot.farmer_name}</p>
                                                    <p className="text-[9px] font-mono text-gray-600">{lot.lot_number}</p>
                                                </div>
                                                <div className="flex gap-1 bg-black/20 p-1.5 rounded-lg">
                                                    {[1,2,3,4,5].map(i => (
                                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= step ? 'bg-brand-green' : 'bg-carbon/10'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-gray-400 shadow-sm flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-gray-600 uppercase ">Fase {step}/5</span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-700"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
