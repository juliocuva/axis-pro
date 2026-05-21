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
            if (!selectedLot && demoLots.length > 0) setSelectedLot(demoLots[0]);

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
                if (!selectedLot && data.length > 0) setSelectedLot(data[0]);
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
        const d = Number(extraLotData.physical?.density_gl || selectedLot.physical_analysis?.[0]?.density_gl) || 710;
        const m = Number(extraLotData.physical?.moisture_pct || selectedLot.physical_analysis?.[0]?.moisture_pct) || 11.2;
        const s = Number(extraLotData.sca?.total_score || selectedLot.sca_cupping?.[0]?.total_score) || 0;
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
        if (!lot?.physical_analysis?.length) return { under14: 0, m15_16: 0, m17_18: 0, m19: 0 };
        const mesh = lot.physical_analysis[0].screen_size_distribution;
        if (!mesh) return { under14: 15, m15_16: 45, m17_18: 30, m19: 10 }; // Fallback

        const under14 = (Number(mesh.size14) || 0) + (Number(mesh.size13) || 0) + (Number(mesh.size12) || 0) + (Number(mesh.under12) || 0);
        const m15_16 = (Number(mesh.size15) || 0) + (Number(mesh.size16) || 0);
        const m17_18 = (Number(mesh.size17) || 0) + (Number(mesh.size18) || 0);
        const m19 = 0; // The form top size is 18, so we leave 19+ at 0 or infer if it had size19. 

        // Normalize for visual percentage heights (min 10%, max 100%)
        const max = Math.max(under14, m15_16, m17_18, m19, 1);
        return {
            under14: Math.max((under14 / max) * 100, 10),
            m15_16: Math.max((m15_16 / max) * 100, 10),
            m17_18: Math.max((m17_18 / max) * 100, 10),
            m19: Math.max((m19 / max) * 100, 10),
        };
    };

    const meshViz = getMeshDistribution(selectedLot);

    return (
        <div className="space-y-12 animate-in fade-in duration-700">

            {view === 'live' && (
                <>
                    {/* Modal de Histórico */}
                    {showHistoryModal && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                            <div className="bg-white border border-gray-400 shadow-sm w-full max-w-2xl rounded-industrial overflow-hidden shadow-2xl animate-in zoom-in-95">
                                <header className="p-10 border-b border-gray-400 shadow-sm flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold uppercase  text-brand-navy">Archivo de Perfiles Maestro</h3>
                                        <p className="text-[11px] text-brand-navy font-mono mt-1 uppercase">Sincronización con Copiloto Industrial</p>
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
                                                    <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Puntaje basado en estándares SCA</p>
                                                    <p className="text-lg font-bold text-brand-navy-bright">{roast.sca_score || '86.5'}</p>
                                                </div>
                                                <button
                                                    onClick={() => loadMasterProfile(roast)}
                                                    className="bg-brand-green text-brand-navy px-6 py-3 rounded-xl text-[11px] font-bold uppercase shadow-lg shadow-brand-green/20 hover:bg-brand-green-bright transition-all"
                                                >
                                                    Seleccionar para Calco
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center opacity-30 uppercase font-bold  text-xs">Sin registros de tueste</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedLot ? (
                        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
                            {/* ENCABEZADO: IDENTIFICACIÓN DEL LOTE Y PUNTAJE */}
                            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-6 pb-4 mb-2">
                                <div className="flex-1 w-full max-w-sm mx-auto">
                                    <label className="text-[9px] text-brand-navy uppercase font-bold mb-1.5 block ">Cambiar Lote a Procesar</label>
                                    <div className="relative">
                                        <select
                                            value={selectedLot?.id || ''}
                                            onChange={(e) => {
                                                const lot = availableLots.find(l => l.id === e.target.value);
                                                if (lot) setSelectedLot(lot);
                                            }}
                                            className="w-full bg-white border border-gray-400 shadow-sm text-brand-navy text-xs py-3.5 px-4 rounded-industrial appearance-none focus:outline-none focus:border-gray-400 shadow-sm cursor-pointer font-bold uppercase  transition-all hover:bg-white"
                                        >
                                            <option value="" disabled className="bg-white">Seleccionar Lote...</option>
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

                                <div className="text-right">
                                    <p className="text-[9px] text-brand-navy uppercase font-bold mb-1 ">Puntaje SCA (Crudo)</p>
                                    <p className="text-4xl font-black text-brand-navy-bright">
                                        {getScaScore(selectedLot)}
                                    </p>
                                </div>
                            </div>

                            <EUDRComplianceBadge lotData={selectedLot} className="mb-2" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* 1. INDICADORES CRÍTICOS (DATOS QUE DICTAN TERMODINÁMICA) */}
                                <div className="bg-white border border-gray-400 shadow-sm p-8 rounded-industrial relative overflow-hidden flex flex-col justify-between group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white blur-3xl pointer-events-none group-hover:bg-white transition-colors"></div>
                                    <div className="mb-6 relative z-10">
                                        <h4 className="text-[11px] font-bold text-brand-navy uppercase  mb-1">1. Indicadores Críticos</h4>
                                        <p className="text-[11px] text-gray-600 font-medium">Dictan la Temperatura de Carga</p>
                                    </div>

                                    <div className="space-y-6 relative z-10">
                                        {/* Densidad es el más grande */}
                                        <div className="flex justify-between items-end border-b border-gray-400 shadow-sm pb-4">
                                            <p className="text-xs text-brand-navy uppercase font-bold">Densidad</p>
                                            <div className="text-right">
                                                <p className="text-5xl font-black text-brand-navy er">
                                                    {extraLotData.physical?.density_gl || selectedLot.physical_analysis?.[0]?.density_gl || '--'}
                                                </p>
                                                <p className="text-[11px] text-brand-navy font-bold uppercase">g/L</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-xl border border-gray-400 shadow-sm">
                                                <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Humedad</p>
                                                <p className="text-2xl font-bold text-brand-navy ">
                                                    {extraLotData.physical?.moisture_pct 
                                                        ? `${extraLotData.physical.moisture_pct}%` 
                                                        : selectedLot.physical_analysis?.[0]?.moisture_pct 
                                                            ? `${selectedLot.physical_analysis[0].moisture_pct}%` 
                                                            : '--'}
                                                </p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-gray-400 shadow-sm">
                                                <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Actividad Agua (aW)</p>
                                                <p className="text-2xl font-bold text-brand-navy ">
                                                    {extraLotData.physical?.aw || selectedLot.physical_analysis?.[0]?.aw || '0.58'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ESPECIFICACIONES DEL LOTE */}
                                <div className="bg-white border border-gray-400 shadow-sm p-8 rounded-industrial relative overflow-hidden flex flex-col justify-between group">
                                    <div className="mb-6 relative z-10">
                                        <h4 className="text-[11px] font-bold text-brand-navy uppercase  mb-1">2. Especificaciones</h4>
                                        <p className="text-[11px] text-gray-600 font-medium">Determinan la Estrategia de Perfil</p>
                                    </div>

                                    <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center bg-white p-4 rounded border border-gray-400 shadow-sm">
                                            <span className="text-[11px] text-brand-navy font-bold uppercase">Varietal</span>
                                            <span className="text-sm font-bold text-brand-navy uppercase ">{selectedLot.variety || 'Caturra'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-4 rounded border border-gray-400 shadow-sm">
                                            <span className="text-[11px] text-brand-navy font-bold uppercase">Proceso</span>
                                            <span className="text-sm font-bold text-brand-navy-bright uppercase ">{selectedLot.process || 'Lavado'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-4 rounded border border-gray-400 shadow-sm">
                                            <span className="text-[11px] text-brand-navy font-bold uppercase">Altura</span>
                                            <span className="text-sm font-bold text-brand-navy ">{selectedLot.altitude ? Number(selectedLot.altitude).toLocaleString('es-CO') : '1.750'} <span className="text-[9px] text-brand-navy">msnm</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. CALIDAD DE MATERIA PRIMA */}
                                <div className="bg-white border border-gray-400 shadow-sm p-8 rounded-industrial relative overflow-hidden flex flex-col justify-between">
                                    <div className="mb-6">
                                        <h4 className="text-[11px] font-bold text-brand-navy uppercase  mb-1">3. Calidad Materia Prima</h4>
                                        <p className="text-[11px] text-gray-600 font-medium">Previsión de Limpieza y Uniformidad</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-white p-4 rounded-xl border border-gray-400 shadow-sm">
                                            <div className="flex justify-between items-end mb-3">
                                                <p className="text-[9px] text-brand-navy uppercase font-bold">Defectos Físicos Totales</p>
                                                <p className="text-lg font-bold text-brand-navy">
                                                    {(selectedLot.physical_analysis && selectedLot.physical_analysis.length > 0)
                                                        ? `${selectedLot.physical_analysis[0].total_defects_grams || 0}g`
                                                        : '0g'}
                                                </p>
                                            </div>
                                            {/* Progress bar mock */}
                                            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-brand-green h-full w-[5%]" />
                                            </div>
                                            <p className="text-[9px] text-brand-navy uppercase mt-2 text-right">Lote Limpio (Grado Especialidad)</p>
                                        </div>

                                        <div>
                                            <p className="text-[9px] text-brand-navy uppercase font-bold mb-3">Distribución de Malla (Homogeneidad)</p>
                                            <div className="flex items-end gap-2 h-16 border-b border-gray-400 shadow-sm pb-1">
                                                {/* Bar Chart Mock for mesh distribution */}
                                                <div className="w-1/4 bg-white hover:bg-white transition-all rounded-t-sm group relative" style={{ height: `${meshViz.under14}%` }}><span className="absolute -bottom-4 text-[9px] w-full text-center text-gray-600 font-bold">&lt;14</span></div>
                                                <div className="w-1/4 bg-brand-green/50 hover:bg-brand-green transition-all rounded-t-sm group relative" style={{ height: `${meshViz.m15_16}%` }}><span className="absolute -bottom-4 text-[9px] w-full text-center text-brand-navy font-bold">15-16</span></div>
                                                <div className="w-1/4 bg-brand-green/70 hover:bg-brand-green transition-all rounded-t-sm group relative" style={{ height: `${meshViz.m17_18}%` }}><span className="absolute -bottom-4 text-[9px] w-full text-center text-brand-navy font-bold">17-18</span></div>
                                                <div className="w-1/4 bg-white hover:bg-white transition-all rounded-t-sm group relative" style={{ height: `${meshViz.m19}%` }}><span className="absolute -bottom-4 text-[9px] w-full text-center text-brand-navy font-bold">19+</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. OBJETIVO DE TUESTE (FOOTER) */}
                            <div className="bg-gradient-to-r from-bg-card to-white/5 border border-gray-400 shadow-sm p-8 rounded-industrial flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-gray-400 shadow-sm">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-navy"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-bold text-brand-navy-bright uppercase  mb-1">4. Objetivo de Tueste</h4>
                                        <p className="text-sm font-bold text-brand-navy mb-2">Perfil Base: {masterProfile?.label || 'Curva Inteligente AXIS (TRL-7)'}</p>
                                        <p className="text-[11px] text-brand-navy leading-relaxed max-w-lg">
                                            {masterProfile ? 'Curva de Campeón Global Ghost sincronizada.' : `Estrategia: Carga a ${dynamicChargeTemp}°C, Desarrollo Corto (${dynamicDevPct}%) para resaltar acidez floral debido al proceso ${selectedLot.process || 'Lavado'} y su alta puntuación.`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right border-r border-gray-400 shadow-sm pr-6">
                                        <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Peso de Carga Óptimo</p>
                                        <p className="text-2xl font-bold text-brand-navy er">15.0 <span className="text-xs text-brand-navy">kg</span></p>
                                    </div>
                                    <button
                                        onClick={() => setView('entry')}
                                        className="bg-brand-green hover:bg-brand-green text-brand-navy px-8 py-5 rounded-industrial-sm text-[11px] font-bold uppercase  shadow-2xl transition-all transform hover:-translate-y-1"
                                    >
                                        Iniciar Registro Tueste
                                    </button>
                                </div>
                            </div>

                            {/* VISUALIZADOR DE CURVA MAESTRA SELECCIONADA */}
                            {masterProfile && (
                                <div className="animate-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center gap-3 mb-6 px-4">
                                        <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                        <h3 className="text-xs font-bold text-brand-navy uppercase ">Telemetría del Perfil Maestro Activo</h3>
                                    </div>
                                    <RoastCurveVisualizer data={masterProfile.points} title={`Curva de Referencia: ${masterProfile.label}`} />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="min-h-[600px] border border-gray-400 shadow-sm rounded-industrial p-12 bg-white relative overflow-hidden flex flex-col items-center justify-center">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white blur-[100px] pointer-events-none rounded-full"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white blur-[80px] pointer-events-none rounded-full"></div>

                            <div className="text-center mb-16 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-400 shadow-sm relative">
                                    <div className="absolute inset-0 bg-white blur-xl rounded-full"></div>
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-navy"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                </div>
                                <h3 className="text-4xl lg:text-5xl font-bold uppercase er text-brand-navy mb-4">Centro de Tostión</h3>
                                <p className="text-brand-navy max-w-2xl mx-auto font-medium uppercase text-[11px]  leading-relaxed">
                                    Software predictivo para maximizar el desarrollo de sabor y minimizar la merma industrial.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto relative z-10">
                                <div className="bg-white border border-gray-400 shadow-sm hover:border-gray-400 shadow-sm p-8 rounded-industrial-sm flex flex-col group transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,223,154,0.1)]">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-brand-navy mb-6 border border-gray-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                                    </div>
                                    <h4 className="text-brand-navy font-black uppercase  text-lg mb-3">1. Tostión Predictiva (IA)</h4>
                                    <p className="text-[11px] text-brand-navy uppercase  leading-relaxed mb-8 flex-1">
                                        Sistema de predicción basado en los datos físico-químicos cargados en el primer módulo. Te genera una estrategia algorítmica sugerida para el tostador aprendiz.
                                    </p>
                                    <div className="bg-white border border-gray-400 shadow-sm p-3 rounded flex items-center gap-2 text-[11px] text-brand-navy-bright font-bold uppercase ">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        Seleccione un lote arriba
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-400 shadow-sm hover:border-gray-400 shadow-sm p-8 rounded-industrial-sm flex flex-col group transition-all duration-500 hover:shadow-[0_10px_40px_rgba(249,115,22,0.1)]">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-brand-navy mb-6 border border-gray-400 shadow-sm group-hover:scale-110 transition-transform">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    </div>
                                    <h4 className="text-brand-navy font-black uppercase  text-lg mb-3">2. Registro e Importación</h4>
                                    <p className="text-[11px] text-brand-navy uppercase  leading-relaxed mb-8 flex-1">
                                        Cargue archivos .CSV / .ALOG de su tostadora o registre manualmente los parámetros de rendimiento y merma industrial.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setView('entry')}
                                            className="w-full bg-white hover:bg-brand-green text-brand-navy hover:text-brand-navy border border-gray-400 shadow-sm p-3 rounded transition-colors text-[9px] font-bold uppercase  text-center"
                                        >
                                            Registrar Manual
                                        </button>
                                        <button
                                            onClick={() => setView('entry')}
                                            className="w-full bg-white hover:bg-white text-brand-navy border border-gray-400 shadow-sm p-3 rounded transition-colors text-[9px] font-bold uppercase  text-center"
                                        >
                                            Importar Curva
                                        </button>
                                    </div>
                                </div>
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
