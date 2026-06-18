'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import LiveRoastMonitor from './LiveRoastMonitor';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';
import RoastCurveVisualizer from './RoastCurveVisualizer';

import EUDRComplianceBadge from '@/modules/supply/components/EUDRComplianceBadge';

interface RoastIntelligenceContainerProps {
    user: { email: string, name: string, companyId: string, role?: string } | null;
}

import RoastEntryForm from './RoastEntryForm';

export default function RoastIntelligenceContainer({ user }: RoastIntelligenceContainerProps) {
    const [view, setView] = useState<'live' | 'archive' | 'entry'>('live');
    const [showQueue, setShowQueue] = useState(false);
    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [capturedSession, setCapturedSession] = useState<any>(null);
    const [extraLotData, setExtraLotData] = useState<{ physical: any, sca: any }>({ physical: null, sca: null });

    // Listen to inter-component navigation
    useEffect(() => {
        const handleViewChange = (e: any) => {
            if (['live', 'archive', 'entry'].includes(e.detail)) {
                setView(e.detail);
            }
        };
        
        const handleSessionData = (e: any) => {
            // Recibimos la curva capturada del monitor
            setCapturedSession(e.detail);
            setView('entry');
        };

        window.addEventListener('change-view', handleViewChange);
        window.addEventListener('roast-session-data', handleSessionData);
        return () => {
            window.removeEventListener('change-view', handleViewChange);
            window.removeEventListener('roast-session-data', handleSessionData);
        };
    }, []);

    // ... rest of the existing state ...
    const [availableLots, setAvailableLots] = useState<any[]>([]);
    const [pastRoasts, setPastRoasts] = useState<any[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    // El "Copiloto": Perfil Maestro para calcar
    const [masterProfile, setMasterProfile] = useState<any>(null);

    useEffect(() => {
        if (demoMode) {
            const demoLots = [
                { id: '1', farmer_name: 'Juan Valdez', variety: 'Geisha', status: 'completed', physical_analysis: [{ moisture_pct: 11.5 }], sca_cupping: [{ total_score: 87.5 }], thrashing_yield: 89.2 },
                { id: '2', farmer_name: 'Maria Lopez', variety: 'Castillo', status: 'thrashed', physical_analysis: [{ moisture_pct: 12.1 }], sca_cupping: [{ total_score: 84.0 }], thrashing_yield: 92.5 }
            ];
            setAvailableLots(demoLots);
            setAvailableLots(demoLots);

            setPastRoasts([
                { id: '101', batch_id_label: 'AX-7721', roast_date: '2026-02-21', process: 'washed', sensor_notes: ['Chocolate', 'Frutos Rojos'], sca_score: 87.2 },
                { id: '102', batch_id_label: 'AX-8843', roast_date: '2026-02-20', process: 'natural', sensor_notes: ['Caramelo', 'Miel'], sca_score: 85.8 }
            ]);
        } else {
            fetchReadyToRoastLots();
            fetchPastRoasts();
        }
    }, [demoMode]);

    const loadMasterProfile = (roast: any) => {
        // PRIORIDAD: Usar los puntos REALES de telemetría si existen
        const realPoints = roast.roast_curve || [];
        
        const simulatedMaster = {
            id: roast.id,
            label: roast.batch_id_label,
            notes: roast.sensor_notes || ['Chocolate', 'Cuerpo Denso'],
            score: roast.sca_score || 86.5,
            points: realPoints.length > 0 ? realPoints : Array.from({ length: 720 }, (_, i) => ({
                t: i,
                temp: 50 + Math.pow(i, 0.78) * 0.9 + (i > 300 ? Math.sin(i / 60) * 1.5 : 0)
            })),
            events: {
                dryEnd: realPoints.find((p: any) => p.bt >= 150)?.t || 310,
                firstCrack: realPoints.find((p: any) => p.bt >= 195)?.t || 540
            }
        };
        setMasterProfile(simulatedMaster);
        setShowHistoryModal(false);
    };

    const fetchReadyToRoastLots = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('coffee_purchase_inventory')
                .select('*, physical_analysis(*), sca_cupping(*)');
                
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase().includes('julio') && !user?.email?.toLowerCase().includes('main')) {
                query = query.eq('company_id', user?.companyId);
            }

            const { data, error } = await query
                .in('status', ['completed', 'thrashed', 'purchased'])
                .order('created_at', { ascending: false });

            if (data) {
                setAvailableLots(data);
            }
        } catch (err) {
            console.error("AXIS Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPastRoasts = async () => {
        try {
            let pastQuery = supabase.from('roast_batches').select('*');
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase().includes('julio') && !user?.email?.toLowerCase().includes('main')) {
                pastQuery = pastQuery.eq('company_id', user?.companyId);
            }
            const { data } = await pastQuery.order('roast_date', { ascending: false });
            if (data) setPastRoasts(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Sincronización en tiempo real de los datos físicos y sensoriales al seleccionar
    useEffect(() => {
        if (selectedLot?.id) {
            fetchLotSpecificDetails(selectedLot.id);
        }
    }, [selectedLot?.id]);

    const fetchLotSpecificDetails = async (id: string) => {
        try {
            // Buscamos el análisis físico más reciente
            const { data: physical } = await supabase
                .from('physical_analysis')
                .select('*')
                .eq('inventory_id', id)
                .order('created_at', { ascending: false })
                .limit(1);

            // Buscamos el análisis sensorial más reciente
            const { data: sca } = await supabase
                .from('sca_cupping')
                .select('*')
                .eq('inventory_id', id)
                .order('created_at', { ascending: false })
                .limit(1);

            setExtraLotData({
                physical: physical?.[0] || null,
                sca: sca?.[0] || null
            });
        } catch (err) {
            console.error("Error fetching specific lot details:", err);
        }
    };

    // DYNAMIC ROAST PREDICTION ENGINE (TRL-7)
    let dynamicChargeTemp = 195;
    let dynamicDryTime = "5:30";
    let dynamicRorRange = "12-14";
    let dynamicDropTemp = 204;
    let dynamicDevPct = 16;
    let dynamicTargetMerma = "14.5% - 15.5%";
    let dynamicRestDays = 7;

    if (selectedLot) {
        const draftPhysical = selectedLot.process_data?.raw_excel_data?.physicalAnalysis;
        const finalPhysical = extraLotData.physical || selectedLot.physical_analysis?.[0] || draftPhysical;
        
        const d = Number(finalPhysical?.density_gl || finalPhysical?.density) || 710;
        const m = Number(finalPhysical?.moisture_pct || finalPhysical?.moisturePct) || 11.2;
        const s = Number(extraLotData.sca?.total_score || selectedLot.sca_cupping?.[0]?.total_score || selectedLot.process_data?.raw_excel_data?.cvaCupping?.cvaFinalScore) || 0;
        const p = (selectedLot.process || 'washed').toLowerCase();

        // 1. Charge Temp & Dry Time (based on density & moisture)
        if (d >= 750) { dynamicChargeTemp = 202; dynamicDryTime = "6:00"; dynamicTargetMerma = "15.0% - 16.0%"; }
        else if (d <= 680) { dynamicChargeTemp = 188; dynamicDryTime = "4:45"; dynamicTargetMerma = "13.5% - 14.5%"; }

        if (m > 11.5) dynamicDryTime = (d >= 750) ? "6:30" : "5:45";

        // 2. RoR Range (based on process)
        if (p.includes('natural') || p.includes('honey') || p.includes('anaerobico') || p.includes('sumergido')) {
            dynamicRorRange = "10-12";
        } else if (d >= 750) {
            dynamicRorRange = "14-16";
        }

        // 3. Final Drop Temp & Dev % (based on SCA standards score)
        if (s >= 87) {
            dynamicDropTemp = 201;
            dynamicDevPct = 14;
            dynamicRestDays = 12;
        } else if (s < 83) {
            dynamicDropTemp = 208;
            dynamicDevPct = 20;
            dynamicRestDays = 4;
        }
    }

    // -- HELPERS --
    const getScaScore = (lot: any) => {
        const s = extraLotData.sca || (lot?.sca_cupping?.length ? lot.sca_cupping[0] : null);
        if (!s) return '--';

        if (s.total_score) return s.total_score.toFixed(2);

        if (s.is_cva_version && s.cva_affective) {
            const aff = s.cva_affective;
            const getVal = (v: any) => {
                const val = Number(v || 0);
                return val > 0 ? val : 8.0;
            };

            const totalAffectiveScore = (
                getVal(aff.fragranceQuality) + 
                getVal(aff.flavorQuality) + 
                getVal(aff.aftertasteQuality) + 
                getVal(aff.acidityQuality) + 
                getVal(aff.sweetnessQuality) + 
                getVal(aff.mouthfeelQuality) + 
                getVal(aff.overallImpression)
            );
            return (totalAffectiveScore + 25).toFixed(2);
        }

        const sum =
            (Number(s.fragrance_aroma) || 0) + (Number(s.flavor) || 0) + (Number(s.aftertaste) || 0) +
            (Number(s.acidity) || 0) + (Number(s.body) || 0) + (Number(s.balance) || 0) +
            (Number(s.uniformity) || 0) + (Number(s.clean_cup) || 0) + (Number(s.sweetness) || 0) +
            (Number(s.overall) || 0) - ((Number(s.defects_score) || 0) * 2);

        return sum > 0 ? sum.toFixed(2) : '--';
    };

    const getMeshDistribution = (lot: any) => {
        const draftPhysical = lot?.process_data?.raw_excel_data?.physicalAnalysis;
        const finalPhysical = extraLotData.physical || lot?.physical_analysis?.[0] || draftPhysical;
        
        if (!finalPhysical) return { items: [] };
        
        const mesh = finalPhysical.screen_size_distribution || finalPhysical.sieveAnalysis;
        if (!mesh) return { items: [] }; // Fallback

        const rawItems = [
            { label: '18', val: Number(mesh.m18) || Number(mesh.size18) || 0 },
            { label: '17', val: Number(mesh.m17) || Number(mesh.size17) || 0 },
            { label: '16', val: Number(mesh.m16) || Number(mesh.size16) || 0 },
            { label: '15', val: Number(mesh.m15) || Number(mesh.size15) || 0 },
            { label: '14', val: Number(mesh.m14) || Number(mesh.size14) || 0 },
            { label: '13', val: Number(mesh.m13) || Number(mesh.size13) || 0 },
            { label: '12', val: Number(mesh.m12) || Number(mesh.size12) || 0 },
            { label: '<12', val: Number(mesh.menores) || Number(mesh.under12) || 0 }
        ];

        // Filter out zero values to only show what comes from the previous window
        const validItems = rawItems.filter(item => item.val > 0).reverse(); // Reverse to show smaller meshes first if desired, or keep as is. Actually, standard is smaller to larger.
        
        const total = validItems.reduce((acc, curr) => acc + curr.val, 0);
        const max = Math.max(...validItems.map(i => i.val), 1);

        const items = validItems.map(item => {
            const visualPct = Math.max((item.val / max) * 100, 10);
            const realPct = total > 0 ? ((item.val / total) * 100).toFixed(0) : '0';
            return {
                label: item.label,
                visualPct,
                realPct
            };
        });

        return { items };
    };

    const meshViz = getMeshDistribution(selectedLot);

    return (
        <div className="max-w-5xl mx-auto w-full space-y-12 animate-in fade-in duration-700">

            {view === 'live' && (
                <>
                    {/* Modal de Histórico */}
                    {showHistoryModal && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                            <div className="bg-white border border-gray-400 shadow-sm w-full max-w-2xl rounded-industrial overflow-hidden shadow-2xl animate-in zoom-in-95">
                                <header className="p-10 border-b border-gray-400 shadow-sm flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold uppercase  text-brand-navy">MASTER PROFILES ARCHIVE</h3>
                                        <p className="text-[11px] text-brand-navy font-mono mt-1 uppercase">INDUSTRIAL COPILOT SYNCHRONIZATION</p>
                                    </div>
                                    <button onClick={() => setShowHistoryModal(false)} className="p-3 bg-white rounded-full hover:bg-white transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                    </button>
                                </header>
                                <div className="p-10 max-h-[60vh] overflow-y-auto space-y-4">
                                    {pastRoasts.length > 0 ? pastRoasts.map(roast => (
                                        <div key={roast.id} className="p-6 bg-white border border-gray-400 shadow-sm rounded-industrial-sm flex justify-between items-center hover:border-gray-400 shadow-sm transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white rounded-industrial-sm flex items-center justify-center font-bold text-brand-navy-bright text-sm border border-gray-400 shadow-sm">
                                                    {roast.batch_id_label.split('-')[1]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-brand-navy mb-0.5">{roast.batch_id_label}</p>
                                                    <p className="text-[11px] text-brand-navy font-mono uppercase">{new Date(roast.roast_date).toLocaleDateString()} • {roast.process.toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">SCA STANDARD SCORE</p>
                                                    <p className="text-lg font-bold text-brand-navy-bright">{roast.sca_score || '86.5'}</p>
                                                </div>
                                                <button
                                                    onClick={() => loadMasterProfile(roast)}
                                                    className="bg-brand-green text-brand-navy px-6 py-3 rounded-xl text-[11px] font-bold uppercase shadow-lg shadow-brand-green/20 hover:bg-brand-green-bright transition-all"
                                                >
                                                    SELECT FOR GHOST ROAST
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-30 uppercase font-bold  text-xs">NO ROAST RECORDS FOUND</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ENCABEZADO: IDENTIFICACIÓN DEL LOTE Y ACCIONES SIEMPRE VISIBLE */}
                    <div className="pb-2 flex flex-col md:flex-row md:items-end justify-between gap-6 w-full max-w-7xl mx-auto">
                        <div className="w-full max-w-2xl flex flex-col gap-1">
                            <label className="text-[9px] text-brand-navy uppercase font-bold whitespace-nowrap">CHANGE TARGET LOT</label>
                            <div className="relative w-full">
                                <select
                                    value={selectedLot?.id || ''}
                                    onChange={(e) => {
                                        const lot = availableLots.find(l => l.id === e.target.value);
                                        if (lot) setSelectedLot(lot);
                                    }}
                                    className="w-full h-[30px] bg-white border border-gray-400 shadow-sm text-brand-navy text-xs py-1 px-3 rounded-industrial-sm appearance-none focus:outline-none focus:border-gray-400 shadow-sm cursor-pointer font-bold uppercase transition-all hover:bg-white"
                                >
                                    <option value="" disabled className="bg-white">SELECT LOT...</option>
                                    {availableLots.map(lot => (
                                        <option key={lot.id} value={lot.id} className="bg-white text-brand-navy">
                                            {lot.batch_id_label || lot.variety} - {lot.farmer_name || 'Productor'}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-hover:text-brand-navy transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                        {selectedLot && (
                            <div className="flex items-center gap-6">
                                <div className="text-right border-r border-gray-400 pr-6">
                                    <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">OPTIMAL CHARGE WEIGHT</p>
                                    <p className="text-base font-bold text-brand-navy er">15.0 <span className="text-[10px] text-brand-navy">KG</span></p>
                                </div>
                                <button
                                    onClick={() => setView('entry')}
                                    className="bg-brand-green hover:bg-brand-green-bright text-brand-navy px-6 py-2.5 rounded-industrial-sm text-[11px] font-bold uppercase shadow-sm transition-all transform hover:-translate-y-1"
                                >
                                    LOG ROAST RESULTS
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedLot ? (
                        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
                            <EUDRComplianceBadge lotData={selectedLot} className="mb-2" />

                            <div className="flex flex-col gap-4">
                                {/* 1. ESPECIFICACIONES DEL LOTE */}
                                <div>
                                    <div className="flex items-baseline gap-2 mb-2 pl-1">
                                        <h4 className="text-[11px] font-bold text-brand-navy uppercase underline decoration-brand-navy/30 underline-offset-4">1. LOT SPECIFICATIONS</h4>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">DETERMINES PROFILE STRATEGY</p>
                                    </div>
                                    <div className="w-full flex flex-col md:flex-row items-stretch gap-4 relative z-10">
                                        <div className="flex flex-col gap-1 w-full md:w-1/4">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">VARIETY</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm">
                                                <span className="text-xs font-bold text-brand-navy uppercase">{selectedLot.variety || 'Caturra'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 w-full md:w-1/4">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">BASE PROCESS</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm">
                                                <span className="text-xs font-bold text-brand-navy-bright uppercase truncate">{selectedLot.process || 'Lavado'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 w-full md:w-1/4">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">FERMENTATION</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm">
                                                <span className="text-xs font-bold text-brand-navy-bright uppercase truncate">{selectedLot.process_data?.fermentation_style || selectedLot.process_data?.raw_excel_data?.general?.fermentation_type || 'Estandar'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 w-full md:w-1/4">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">ALTITUDE</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm">
                                                <span className="text-xs font-bold text-brand-navy uppercase">{selectedLot.altitude ? Number(selectedLot.altitude).toLocaleString('es-CO') : '1.750'} MASL</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* FILA 2: PROPIEDADES FÍSICAS (CRITICAL & RAW) */}
                                <div>
                                    <div className="flex items-baseline gap-2 mb-2 pl-1 mt-4">
                                        <h4 className="text-[11px] font-bold text-brand-navy uppercase underline decoration-brand-navy/30 underline-offset-4">2. PHYSICAL PROPERTIES (CRITICAL & RAW)</h4>
                                        <p className="text-[10px] text-gray-500 font-medium uppercase">DICTATES CHARGE TEMP & CLEANNESS</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10">
                                        {/* Densidad */}
                                        <div className="flex flex-col gap-1 w-full">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">DENSITY</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm">
                                                <span className="text-xs font-bold text-brand-navy uppercase">
                                                    {extraLotData.physical?.density_gl || selectedLot.physical_analysis?.[0]?.density_gl || selectedLot.process_data?.raw_excel_data?.physicalAnalysis?.densityGl || selectedLot.process_data?.raw_excel_data?.physicalAnalysis?.density || '--'} g/L
                                                </span>
                                            </div>
                                        </div>

                                        {/* Humedad */}
                                        <div className="flex flex-col gap-1 w-full">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">MOISTURE</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm">
                                                <span className="text-xs font-bold text-brand-navy uppercase">
                                                    {extraLotData.physical?.moisture_pct 
                                                        ? `${extraLotData.physical.moisture_pct}%` 
                                                        : selectedLot.physical_analysis?.[0]?.moisture_pct 
                                                            ? `${selectedLot.physical_analysis[0].moisture_pct}%` 
                                                            : selectedLot.process_data?.raw_excel_data?.physicalAnalysis?.moisturePct
                                                                ? `${selectedLot.process_data.raw_excel_data.physicalAnalysis.moisturePct}%`
                                                                : '--'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* aW */}
                                        <div className="flex flex-col gap-1 w-full">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">WATER ACTIVITY (AW)</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm">
                                                <span className="text-xs font-bold text-brand-navy uppercase">
                                                    {extraLotData.physical?.water_activity || selectedLot.physical_analysis?.[0]?.water_activity || selectedLot.process_data?.raw_excel_data?.physicalAnalysis?.waterActivity || '--'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Defectos */}
                                        <div className="flex flex-col gap-1 w-full">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">PHYSICAL DEFECTS</span>
                                            <div className="w-full h-[30px] flex items-center bg-white px-3 py-1 rounded-industrial-sm border border-gray-400 shadow-sm relative group">
                                                <span className="text-xs font-bold text-brand-navy uppercase">
                                                    {(() => {
                                                        const rawDefects = extraLotData.physical?.total_defects_grams || selectedLot.physical_analysis?.[0]?.total_defects_grams || selectedLot.process_data?.raw_excel_data?.physicalAnalysis?.defects;
                                                        return typeof rawDefects === 'object' && rawDefects !== null 
                                                            ? (Number(rawDefects.primary || 0) + Number(rawDefects.secondary || 0)) 
                                                            : (Number(rawDefects) || 0);
                                                    })()}
                                                </span>
                                                <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2" style={{ right: '12px' }}>
                                                    <span className="text-brand-navy font-semibold text-[11px] w-4 text-center">G</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mallas */}
                                        <div className="flex flex-col gap-1 w-full md:col-span-2">
                                            <span className="text-[9px] text-brand-navy font-bold uppercase">MESH DISTRIBUTION</span>
                                            <div className="w-full h-[30px] bg-white px-2 py-0.5 rounded-industrial-sm border border-gray-400 shadow-sm flex flex-col justify-end">
                                                {meshViz.items && meshViz.items.length > 0 ? (
                                                    <>
                                                        <div className="w-full h-[12px] flex items-end gap-0.5">
                                                            {meshViz.items.map((item, idx) => (
                                                                <div key={idx} className="flex-1 bg-brand-green/70 hover:bg-brand-green transition-all rounded-t-sm" style={{ height: `max(2px, ${item.visualPct}%)` }} title={item.label} />
                                                            ))}
                                                        </div>
                                                        <div className="flex w-full justify-between gap-0.5 text-[7px] md:text-[8px] font-mono leading-none mt-0.5 text-center">
                                                            {meshViz.items.map((item, idx) => (
                                                                <div key={idx} className="flex-1 text-brand-navy font-bold tracking-tight">
                                                                    {item.label.startsWith('<') ? item.label : `M${item.label}`} ({item.realPct}%)
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">NO MESH DATA</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Removed Roasting Objective and Master Profile Visualizer */}
                        </div>
                    ) : !showQueue ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500 bg-white rounded-industrial border border-gray-400 shadow-sm p-6">
                            <div className="w-20 h-20 rounded-full bg-carbon/5 border border-gray-400 shadow-sm flex items-center justify-center text-gray-600">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M2 12h20M12 2l10 10-10 10M12 2L2 12l10 10"/></svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-brand-navy uppercase">Lot Selection Required</h3>
                                <p className="text-xs text-gray-600 max-w-xs mx-auto uppercase leading-relaxed">
                                    Please, select a lot from the <span className="text-brand-navy font-black">Production Queue</span> to load technical data.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowQueue(true)}
                                className="px-6 py-3 bg-[#0C6056] text-white shadow-lg shadow-brand-green/20 rounded-full text-[11px] font-black uppercase transition-all hover:scale-105 active:scale-95"
                            >
                                VIEW PRODUCTION QUEUE
                            </button>
                        </div>
                    ) : (
                        <div className="min-h-[400px] border border-gray-400 shadow-sm rounded-industrial p-8 bg-white relative overflow-hidden flex flex-col items-center animate-in fade-in duration-500">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white blur-[100px] pointer-events-none rounded-full"></div>
                            
                            <div className="text-center mb-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h3 className="text-2xl lg:text-3xl font-bold uppercase er text-brand-navy mb-2">PRODUCTION QUEUE</h3>
                                <p className="text-brand-navy max-w-2xl mx-auto font-medium uppercase text-[11px] leading-relaxed">
                                    SELECT A LOT FROM THE QUEUE TO VIEW SPECIFICATIONS AND ROAST
                                </p>
                            </div>

                            <div className="w-full max-w-4xl mx-auto relative z-10 flex flex-col gap-3">
                                {availableLots.length > 0 ? availableLots.map(lot => (
                                    <button 
                                        key={lot.id}
                                        onClick={() => setSelectedLot(lot)}
                                        className="w-full text-left bg-white border border-gray-400 shadow-sm hover:border-brand-green py-2.5 px-4 rounded-industrial flex items-center justify-between group transition-all duration-300 hover:shadow-[0_4px_15px_rgba(12,96,86,0.1)]"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center gap-2 truncate">
                                                    <h4 className="font-black text-[13px] text-brand-navy tracking-wide uppercase group-hover:text-brand-green transition-colors truncate">
                                                        {lot.batch_id_label || lot.variety}
                                                    </h4>
                                                    <span className="text-gray-300 text-xs">•</span>
                                                    <span className="text-[11px] text-gray-500 font-bold uppercase truncate">
                                                        {lot.farmer_name || 'Productor'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-brand-navy/70 font-bold uppercase truncate mt-0.5">
                                                    {lot.process || 'WASHED'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pl-3 shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <div className="bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full border border-brand-green/20">
                                                    <p className="text-[8px] font-black uppercase tracking-wide">READY TO ROAST</p>
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center group-hover:bg-brand-green group-hover:border-brand-green transition-all duration-300 shadow-sm">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="py-12 text-center opacity-50 font-bold uppercase text-xs text-brand-navy">
                                        NO LOTS IN QUEUE
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {view === 'entry' && (
                <RoastEntryForm 
                    user={user} 
                    lotData={selectedLot} 
                    initialTelemetry={capturedSession?.telemetry}
                />
            )}


        </div>
    );
}
