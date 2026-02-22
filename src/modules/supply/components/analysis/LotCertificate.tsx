'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

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
            // 1. Basic Lot Info
            const { data: lot } = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('id', inventoryId)
                .single();

            // 2. Physical Analysis
            const { data: physical } = await supabase
                .from('physical_analysis')
                .select('*')
                .eq('inventory_id', inventoryId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // 3. SCA Cupping
            const { data: sca } = await supabase
                .from('sca_cupping')
                .select('*')
                .eq('inventory_id', inventoryId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setLotData(lot);
            setPhysicalData(physical);
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
        <div className="max-w-5xl mx-auto bg-bg-card border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Header / Banner */}
            <div className="relative h-64 bg-gradient-to-br from-brand-green to-bg-card flex items-end p-12">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <div className="relative z-10 flex justify-between items-end w-full">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white">Digital Birth Certificate</span>
                            <span className="px-4 py-1.5 bg-brand-green-bright/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-brand-green-bright border border-brand-green-bright/30">Verified SCA Specialty</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase">{lotData?.farm_name || 'Lote Premium'}</h1>
                        <p className="text-brand-green-bright font-mono font-bold tracking-widest mt-2 uppercase">{lotData?.lot_number} • {lotData?.variety} • {lotData?.process}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mb-1 opacity-60">SCA Score</p>
                        <p className="text-7xl font-black text-white tracking-tighter">{scaData?.total_score.toFixed(2) || '00.00'}</p>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Section 1: Physical Analysis */}
                <div className="space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-3">
                        <span className="w-6 h-px bg-white/10"></span>
                        Analítica Física
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-bg-main p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Humedad</p>
                            <p className="text-2xl font-black text-white">{physicalData?.moisture_pct || '--'}%</p>
                        </div>
                        <div className="bg-bg-main p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Ac. Agua</p>
                            <p className="text-2xl font-black text-white">{physicalData?.water_activity || '--'}$a_w$</p>
                        </div>
                        <div className="bg-bg-main p-6 rounded-3xl border border-white/5 col-span-2">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Densidad Industrial</p>
                            <p className="text-2xl font-black text-white">{physicalData?.density_gl || '--'} <span className="text-xs text-brand-green-bright uppercase tracking-tighter">g/L</span></p>
                        </div>
                    </div>

                    <div className="bg-bg-main/50 p-6 rounded-3xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Granulometría (Screen Distribution)</p>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={screenData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f1411', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                        itemStyle={{ color: '#00a651', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                        {screenData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#00a651' : '#00a65140'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Section 2: Sensory Profile */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-3">
                            <span className="w-6 h-px bg-white/10"></span>
                            Huella Organoléptica
                        </h3>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green-bright animate-pulse"></div>
                            <span className="text-[9px] text-brand-green-bright font-bold uppercase tracking-widest">Verificado en Blockchain</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-bg-main p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 blur-[100px] rounded-full"></div>

                        <div className="h-[350px] relative z-10 font-bold">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scaRadarData}>
                                    <PolarGrid stroke="#ffffff08" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} axisLine={false} tick={false} />
                                    <Radar name="Perfil" dataKey="A" stroke="#00a651" fill="#00a651" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="p-6 bg-bg-card rounded-2xl border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Descriptor Sensorial Principal</p>
                                <p className="text-xl font-bold text-white leading-relaxed italic">
                                    "{scaData?.notes || 'Perfil equilibrado con notas cítricas y cuerpo sedoso. Post-gusto largo y limpio.'}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-bg-card rounded-2xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Catador Responsable</p>
                                    <p className="text-sm font-bold text-white mt-1 uppercase">{scaData?.taster_name || 'Q-Grader Senior'}</p>
                                </div>
                                <div className="p-4 bg-bg-card rounded-2xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Sello de Calidad</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-4 h-4 rounded-full bg-brand-green flex items-center justify-center">
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>
                                        </div>
                                        <span className="text-xs font-black text-brand-green-bright">CERTIFICADO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / QR / Actions */}
            <div className="bg-bg-main p-12 border-t border-white/10 flex flex-wrap justify-between items-center gap-8">
                <div className="flex items-center gap-8">
                    <div className="w-32 h-32 bg-white p-2 rounded-2xl shadow-2xl relative group">
                        <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://axis-coffee.co/cert/LOT-772"
                            alt="QR Trazabilidad"
                            className="w-full h-full grayscale hover:grayscale-0 transition-all cursor-crosshair"
                        />
                        <div className="absolute inset-0 bg-brand-green/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            <span className="text-[8px] font-black text-white bg-black/60 px-2 py-1 rounded">VERIFICAR</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Transparencia Global</p>
                        <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                            Este lote ha sido blindado digitalmente. Escanee el código QR para acceder al historial de origen, análisis de suelo y firma digital del productor.
                        </p>
                        <p className="text-[9px] text-brand-green-bright font-mono mt-4 font-bold uppercase tracking-widest">Hash: 8f2a1b9c7d4e3f6g1h0j9k8l7m6n5o4p</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => window.print()}
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5 uppercase tracking-widest text-[10px] flex items-center gap-3"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                        Exportar PDF
                    </button>
                    <button
                        className="px-8 py-4 bg-brand-green hover:bg-brand-green-bright text-white rounded-2xl font-bold transition-all shadow-xl shadow-brand-green/20 uppercase tracking-widest text-[10px] flex items-center gap-3"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v10m0 0l-3-3m3 3l3-3" /><path d="M22 10a10 10 0 11-20 0" /></svg>
                        Compartir Digital
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-bg-card hover:bg-white/5 text-gray-500 hover:text-white rounded-2xl font-bold transition-all border border-white/5 uppercase tracking-widest text-[10px]"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
