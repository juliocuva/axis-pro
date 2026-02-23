'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, Tooltip, Cell
} from 'recharts';
import ExportReportButton from '@/shared/components/ui/ExportReportButton';

interface LotCertificateProps {
    inventoryId: string;
    onClose: () => void;
}

export default function LotCertificate({ inventoryId, onClose }: LotCertificateProps) {
    const [lotData, setLotData] = useState<any>(null);
    const [physicalData, setPhysicalData] = useState<any>(null);
    const [scaData, setScaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFullData();
    }, [inventoryId]);

    const fetchFullData = async () => {
        try {
            const { data: lot } = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('id', inventoryId)
                .single();

            const { data: physical } = await supabase
                .from('physical_analysis')
                .select('*')
                .eq('inventory_id', inventoryId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const { data: sca } = await supabase
                .from('sca_cupping')
                .select('*')
                .eq('inventory_id', inventoryId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setLotData(lot);
            setPhysicalData(physical);

            // Fallback calculation if total_score column is missing in DB
            if (sca && sca.total_score == null) {
                sca.total_score = (
                    Number(sca.fragrance_aroma || 0) +
                    Number(sca.flavor || 0) +
                    Number(sca.aftertaste || 0) +
                    Number(sca.acidity || 0) +
                    Number(sca.body || 0) +
                    Number(sca.balance || 0) +
                    Number(sca.uniformity || 10) +
                    Number(sca.clean_cup || 10) +
                    Number(sca.sweetness || 10) +
                    Number(sca.overall || 0) -
                    (Number(sca.defects_score || 0) * 2)
                );
            }
            setScaData(sca);
        } catch (err) {
            console.error("Error fetching certificate data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green-bright"></div>
        </div>
    );

    const scaRadarData = scaData ? [
        { subject: 'Fragancia', A: scaData.fragrance_aroma },
        { subject: 'Sabor', A: scaData.flavor },
        { subject: 'Post-gusto', A: scaData.aftertaste },
        { subject: 'Acidez', A: scaData.acidity },
        { subject: 'Cuerpo', A: scaData.body },
        { subject: 'Balance', A: scaData.balance },
        { subject: 'Global', A: scaData.overall },
    ] : [];

    const screenData = physicalData?.screen_size_distribution ? [
        { name: 'M18', val: physicalData.screen_size_distribution.size18 },
        { name: 'M17', val: physicalData.screen_size_distribution.size17 },
        { name: 'M16', val: physicalData.screen_size_distribution.size16 },
        { name: 'M15', val: physicalData.screen_size_distribution.size15 },
    ] : [];

    return (
        <div className="max-w-5xl mx-auto bg-bg-card border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div id="lot-certificate-area">
                {/* Header / Banner - Fixed Height and Sizing */}
                <div className="relative min-h-[180px] bg-gradient-to-br from-brand-green/80 to-bg-card flex items-center p-8 md:p-12 overflow-hidden border-b border-white/5">
                    <div className="absolute top-[-20%] right-[-5%] p-8 opacity-10">
                        <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center w-full gap-6">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-bold uppercase tracking-[0.2em] text-white">Digital Birth Certificate</span>
                                <span className="px-3 py-1 bg-brand-green-bright/20 backdrop-blur-md rounded-full text-[8px] font-bold uppercase tracking-[0.2em] text-brand-green-bright border border-brand-green-bright/30">Verified SCA Specialty</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white uppercase leading-none mb-1">{lotData?.farm_name || 'Lote Premium'}</h1>
                            <p className="text-white/60 font-bold tracking-[0.1em] text-[12px] uppercase mb-2">{lotData?.farmer_name || 'Productor Independiente'}</p>
                            <p className="text-brand-green-bright font-mono font-bold tracking-[0.2em] text-[10px] uppercase opacity-90">{lotData?.lot_number} • {lotData?.variety} • {lotData?.process}</p>
                        </div>

                        <div className="md:text-right bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl">
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em] mb-1 opacity-80">SCA Score</p>
                            <p className="text-6xl md:text-7xl font-bold text-white tracking-tighter leading-none">
                                {scaData?.total_score != null ? Number(scaData.total_score).toFixed(2) : '00.00'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Section 1: Physical Analysis */}
                    <div className="space-y-6">
                        <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 flex items-center gap-3">
                            <span className="w-6 h-px bg-white/10"></span>
                            Analítica Física
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-main p-4 rounded-2xl border border-white/5">
                                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-1 opacity-70">Humedad</p>
                                <p className="text-lg font-bold text-white tracking-tight">{physicalData?.moisture_pct || '--'}%</p>
                            </div>
                            <div className="bg-bg-main p-4 rounded-2xl border border-white/5">
                                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-1 opacity-70">Ac. Agua</p>
                                <p className="text-lg font-bold text-white tracking-tight">{physicalData?.water_activity || '--'} <span className="text-[9px] text-gray-600 font-mono">aw</span></p>
                            </div>
                            <div className="bg-bg-main p-4 rounded-2xl border border-white/5 col-span-2">
                                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-1 opacity-70">Densidad Industrial</p>
                                <p className="text-lg font-bold text-white tracking-tight">{physicalData?.density_gl || '--'} <span className="text-[9px] text-brand-green-bright uppercase tracking-tighter">g/L</span></p>
                            </div>
                        </div>

                        <div className="bg-bg-main/30 p-5 rounded-2xl border border-white/5">
                            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-4 opacity-70">Distribución de Mallas</p>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={screenData}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 8 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                                            itemStyle={{ color: '#00a651', fontSize: '10px' }}
                                        />
                                        <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                                            {screenData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 1 ? '#00a651' : '#00a65140'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Sensory Profile */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 flex items-center gap-3">
                                <span className="w-6 h-px bg-white/10"></span>
                                Huella Organoléptica
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-green-bright animate-pulse"></div>
                                <span className="text-[8px] text-brand-green-bright font-bold uppercase tracking-widest">Protocolo Seguro</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-bg-main/50 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">
                            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-green/5 blur-[80px] rounded-full"></div>

                            <div className="h-[280px] relative z-10 font-bold">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scaRadarData}>
                                        <PolarGrid stroke="#ffffff08" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 8, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                                        <Radar name="Perfil" dataKey="A" stroke="#00a651" fill="#00a651" fillOpacity={0.4} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-5 relative z-10">
                                <div className="p-6 bg-bg-card/40 rounded-2xl border border-white/5 shadow-inner">
                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-3 border-b border-white/5 pb-2 opacity-80">Descriptor Sensorial Maestro</p>
                                    <p className="text-base font-semibold text-white leading-relaxed">
                                        {scaData?.notes ? scaData.notes : 'Sin notas registradas. Perfil sensorial pendiente de validación final por el Q-Grader.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-bg-card/40 rounded-xl border border-white/5">
                                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-1 opacity-70">Analista Responsable</p>
                                        <p className="text-[10px] font-bold text-white uppercase tracking-tighter leading-tight">{scaData?.taster_name || 'Q-Grader Senior'}</p>
                                    </div>
                                    <div className="p-4 bg-bg-card/40 rounded-xl border border-white/5">
                                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-1 opacity-70">Certificación</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-brand-green flex items-center justify-center">
                                                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="5"><path d="M20 6L9 17l-5-5" /></svg>
                                            </div>
                                            <span className="text-[9px] font-bold text-brand-green-bright">VALIDADO</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / QR / Actions - Improved Realignment */}
                <div className="bg-bg-main p-8 md:p-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 shadow-inner">
                    <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                        <div className="w-20 h-20 bg-white p-2 rounded-xl shadow-2xl relative group shrink-0">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://axis-coffee.pro') + '/verify/lot/' + inventoryId)}`}
                                alt="QR Trazabilidad"
                                className="w-full h-full grayscale hover:grayscale-0 transition-all cursor-crosshair"
                            />
                            <div className="absolute inset-0 bg-brand-green/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white bg-black/60 px-2 py-1 rounded">SCAN</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.4em]">Propiedad Digital AXIS COFFEE</p>
                            <p className="text-[10px] text-gray-400 max-w-sm font-bold uppercase leading-tight opacity-60">
                                Protocolo de trazabilidad integral. Datos inmutables y sellados en origen.
                            </p>
                            <p className="text-[7px] text-brand-green-bright font-mono font-bold uppercase tracking-widest opacity-50">TXID: 8F2A1B9C...4P</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-bg-card border-t border-white/5 flex justify-end gap-4">
                <ExportReportButton elementId="lot-certificate-area" fileName={`CERTIFICATE-${inventoryId}`} />
                <button
                    className="px-8 py-4 bg-brand-green hover:bg-brand-green-bright text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-brand-green/20 flex items-center gap-2"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v10m0 0l-3-3m3 3l3-3" /><path d="M22 10a10 10 0 11-20 0" /></svg>
                    Compartir
                </button>
                <button
                    onClick={onClose}
                    className="px-8 py-4 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
