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
        const { data: recent } = await supabase
            .from('coffee_purchase_inventory')
            .select('*, roast_batches(id)')
            .eq('company_id', user?.companyId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (recent) setRecentLots(recent);
    };

    const handleLotSelect = (lot: any) => {
        setSelectedLot(lot);
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

            <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700">
                {/* COLUMNA PRINCIPAL */}
                <div className="flex-1 space-y-8">
                    <header className="space-y-2">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            {activeTab === 'purchase' ? 'Registro de Ingreso' :
                             activeTab === 'thrashing' ? 'Trilla Industrial' :
                             activeTab === 'analysis' ? 'Laboratorio Físico' :
                             activeTab === 'cupping' ? 'Evaluación CVA' : 
                             activeTab === 'roast' ? 'Tostión Inteligente' : 'Archivo'}
                        </h2>
                        <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.3em]">
                            AXISONE COFFEE • Sistema de Trazabilidad Industrial

                        </p>
                    </header>

                    <nav className="flex flex-wrap bg-bg-card p-1 rounded-industrial border border-white/5 shadow-xl">
                        {[
                            { id: 'purchase', label: '01. Ingreso' },
                            { id: 'thrashing', label: '02. Trilla' },
                            { id: 'analysis', label: '03. Lab' },
                            { id: 'cupping', label: '04. CATACIÓN' },
                            { id: 'roast', label: '05. Tostión' },
                            { id: 'archive', label: '06. Archivo' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 min-w-[80px] py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-green text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="bg-bg-card/50 rounded-industrial border border-white/5 p-4 lg:p-8 min-h-[500px]">
                        {selectedLot && activeTab !== 'archive' && (
                             <div className="mb-8 p-4 bg-brand-green/5 border border-brand-green/20 rounded-xl flex justify-between items-center">
                                <span className="text-xs font-bold text-white uppercase">{selectedLot.farmer_name} | {selectedLot.lot_number}</span>
                                <button onClick={() => setShowCertificate(true)} className="text-[10px] font-bold text-brand-green border border-brand-green/30 px-3 py-1 rounded-full hover:bg-brand-green/10">CERTIFICADO</button>
                             </div>
                        )}

                        {activeTab === 'purchase' && <PurchaseForm selectedLot={selectedLot} user={user} onPurchaseComplete={(lot) => { setSelectedLot(lot); fetchRecentLots(); }} />}
                        {activeTab === 'thrashing' && selectedLot && <ThrashingForm inventoryId={selectedLot.id} parchmentWeight={selectedLot.purchase_weight} user={user} onThrashingComplete={fetchRecentLots} />}
                        {activeTab === 'analysis' && selectedLot && <PhysicalAnalysisForm inventoryId={selectedLot.id} user={user} onAnalysisComplete={fetchRecentLots} />}
                        {activeTab === 'cupping' && selectedLot && <CVAAssessmentForm inventoryId={selectedLot.id} user={user} onCuppingComplete={fetchRecentLots} />}
                        {activeTab === 'roast' && <RoastIntelligenceContainer user={user} />}
                        {activeTab === 'archive' && <GlobalHistoryArchive user={user} />}
                    </div>
                </div>

                {/* SIDEBAR */}
                <aside className="w-full lg:w-80 space-y-6">
                    <button onClick={() => { setSelectedLot(null); setActiveTab('purchase'); }} className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-brand-green transition-all shadow-xl">
                        NUEVO LOTE
                    </button>
                    <div className="bg-bg-card border border-white/5 p-6 rounded-industrial h-[600px] flex flex-col">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 pb-4 border-b border-white/5">Sincronización Viva</h4>

                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                            {recentLots.map(lot => {
                                // Cálculo de fase para los 5 puntos
                                let step = 1;
                                if (lot.status === 'thrashed' || lot.status === 'completed' || lot.thrashed_weight > 0) step = 2;
                                if (lot.status === 'completed' || lot.status === 'physical_analyzed') step = 3;
                                if (lot.status === 'completed') step = 4;
                                if (lot.roast_batches && lot.roast_batches.length > 0) step = 5;

                                return (
                                    <div key={lot.id} onClick={() => handleLotSelect(lot)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedLot?.id === lot.id ? 'bg-brand-green/10 border-brand-green/30' : 'bg-white/2 border-white/5 hover:border-white/10'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-bold text-white uppercase truncate">{lot.farmer_name}</p>
                                            <div className="flex gap-1">
                                                {[1,2,3,4,5].map(i => (
                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= step ? 'bg-brand-green' : 'bg-white/10'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-mono text-gray-500">{lot.lot_number}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}
