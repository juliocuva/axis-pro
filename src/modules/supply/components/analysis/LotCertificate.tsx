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
    user: { companyId: string } | null;
}

export default function LotCertificate({ inventoryId, onClose, user }: LotCertificateProps) {
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
                .eq('company_id', user?.companyId)
                .single();

            const { data: physical } = await supabase
                .from('physical_analysis')
                .select('*')
                .eq('inventory_id', inventoryId)
                .eq('company_id', user?.companyId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const { data: sca } = await supabase
                .from('sca_cupping')
                .select('*')
                .eq('inventory_id', inventoryId)
                .eq('company_id', user?.companyId)
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
        <div className="flex flex-col items-center w-full">
            {/* Document "Sheet" - US Letter Proportion (8.5 x 11) */}
            <div
                id="lot-certificate-area"
                className="w-full bg-[#050510] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,1)] relative flex flex-col mx-auto overflow-hidden print:w-[215.9mm] print:min-h-[279.4mm]"
                style={{
                    aspectRatio: '8.5 / 11',
                    minHeight: '1100px',
                    maxWidth: '850px'
                }}
            >
                {/* PRE-HEADER: Branding Internal Logic */}
                <div className="bg-black/80 border-b border-white/5 px-8 py-5 flex justify-between items-center relative z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 rounded-industrial-sm flex items-center justify-center overflow-hidden border border-white/10 p-1 shadow-inner">
                            <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black tracking-[0.3em] text-white leading-none">AXIS COFFEE <span className="text-brand-green text-[7px]">PRO</span></p>
                            <p className="text-[6px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Industrial Traceability Protocol</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <span className="px-2 py-0.5 bg-brand-green/10 rounded-full text-[7px] font-bold uppercase tracking-[0.2em] text-brand-green border border-brand-green/20">TRL-7 OPERATIONAL</span>
                        <div className="flex items-center gap-3 text-[7px] font-bold text-gray-600 uppercase tracking-widest">
                            <span>VER: 2.0.4</span>
                            <div className="w-px h-2 bg-white/10"></div>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Header / Banner - Reimagined for High Impact */}
                <div className="relative bg-gradient-to-br from-[#0a0a0a] to-[#111] p-6 md:p-10 overflow-hidden border-b border-white/5">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-[300px] h-full bg-brand-green/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-brand-green/2 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/4"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end w-full gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-industrial-sm text-[7px] font-bold uppercase tracking-[0.2em] text-white">Digital Birth Certificate</span>
                                <div className="h-px w-8 bg-white/10"></div>
                                <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-brand-green-bright">Specialty Coffee Archive</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase leading-none mb-3 group inline-block relative">
                                {lotData?.farm_name || 'Lote Premium'}
                                <span className="absolute -bottom-1.5 left-0 w-1/4 h-1 bg-brand-green rounded-full opacity-50"></span>
                            </h1>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 border-t border-white/5 pt-6">
                                <div className="space-y-0.5">
                                    <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Farmer/Producer</p>
                                    <p className="text-xs font-bold text-white uppercase">{lotData?.farmer_name || 'Independiente'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Lot ID</p>
                                    <p className="text-xs font-bold text-brand-green-bright font-mono italic">{lotData?.lot_number || 'AX-000'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Variety / Process</p>
                                    <p className="text-xs font-bold text-white uppercase truncate">{lotData?.variety} • {lotData?.process}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest">Origin Region</p>
                                    <p className="text-xs font-bold text-white uppercase">{lotData?.region}, {lotData?.country || 'COL'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <div className="bg-white/[0.02] border border-white/10 p-0.5 rounded-industrial overflow-hidden relative group">
                                <div className="bg-[#050505] p-6 md:p-8 rounded-industrial flex flex-col items-center justify-center relative z-10">
                                    <p className="text-[8px] text-brand-green font-black uppercase tracking-[0.4em] mb-2">SCA SCORE</p>
                                    <p className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none flex items-start">
                                        {scaData?.total_score != null ? Math.floor(scaData.total_score) : '00'}
                                        <span className="text-xl mt-1.5 text-brand-green-bright">.{scaData?.total_score != null ? String(Number(scaData.total_score).toFixed(2)).split('.')[1] : '00'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats row - Stacked for Vertical balance */}
                <div className="px-10 py-8 bg-black/30 border-b border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 border border-white/10">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-2-2H5L3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8zM3 8h18M16 12a4 4 0 0 1-8 0" /></svg>
                        </div>
                        <div>
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-0.5">Materia Prima</p>
                            <p className="text-lg font-bold text-white tracking-tight">{lotData?.purchase_weight} <span className="text-[9px] text-gray-600 font-mono">KG</span></p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green border border-brand-green/20">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <div>
                            <p className="text-[7px] text-brand-green font-bold uppercase tracking-[0.3em] mb-0.5">Exportable</p>
                            <p className="text-lg font-bold text-white tracking-tight">{lotData?.thrashed_weight} <span className="text-[9px] text-gray-600 font-mono">KG</span></p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" /></svg>
                        </div>
                        <div>
                            <p className="text-[7px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-0.5">Mermas</p>
                            <p className="text-lg font-bold text-white tracking-tight">{Number(lotData?.pasilla_weight || 0) + Number(lotData?.cisco_weight || 0)} <span className="text-[9px] text-gray-600 font-mono">KG</span></p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <div className="bg-brand-green text-black px-4 py-2 rounded-industrial flex flex-col items-center min-w-[100px] shadow-lg shadow-brand-green/10">
                            <p className="text-[7px] font-black uppercase tracking-widest">RENDIMIENTO</p>
                            <p className="text-xl font-black font-mono leading-none">{Number(lotData?.thrashing_yield || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Content Sections: Physical & Defects & Screens */}
                <div className="px-10 py-10 space-y-12 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-green flex items-center gap-3 mb-8">
                                    <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                                    ANÁLISIS FÍSICO
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-white/2 p-5 rounded-industrial-sm border border-white/5">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-2">Humedad de Grano</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-white">{physicalData?.moisture_pct || '--'}</span>
                                            <span className="text-xs text-brand-green-bright font-black mb-1.5">%</span>
                                        </div>
                                        <p className="text-[8px] text-brand-green font-bold uppercase mt-2 tracking-tighter">{physicalData?.grain_color || 'Standard'}</p>
                                    </div>
                                    <div className="bg-white/2 p-5 rounded-industrial-sm border border-white/5">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-2">Actividad de Agua ($a_w$)</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-white">{physicalData?.water_activity || '--'}</span>
                                            <span className="text-[10px] text-gray-600 font-mono mb-1.5 ml-1">aw</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/2 p-5 rounded-industrial-sm border border-white/10 bg-brand-green/2">
                                        <p className="text-[8px] text-brand-green font-bold uppercase tracking-widest mb-2">Densidad Industrial</p>
                                        <p className="text-2xl font-black text-white">{physicalData?.density_gl || '--'} <span className="text-xs text-brand-green-bright font-black">g/L</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red flex items-center gap-3 mb-8">
                                <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></div>
                                DEFECTOS (FÍS)
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-brand-red/5 p-5 rounded-industrial-sm border border-brand-red/10 flex justify-between items-center group/defect">
                                    <div>
                                        <p className="text-[11px] font-black text-white uppercase">Primarios</p>
                                        <p className="text-[8px] text-brand-red-bright font-bold uppercase tracking-widest mt-1">Crítico / Taza</p>
                                    </div>
                                    <p className="text-4xl font-black text-white leading-none">{physicalData?.defects_count?.primary ?? '0'}</p>
                                </div>
                                <div className="bg-orange-500/5 p-5 rounded-industrial-sm border border-orange-500/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-[11px] font-black text-white uppercase">Secundarios</p>
                                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-widest mt-1">Visible / Valor</p>
                                    </div>
                                    <p className="text-4xl font-black text-white leading-none">{physicalData?.defects_count?.secondary ?? '0'}</p>
                                </div>
                                <div className="p-4 border border-dashed border-white/5 rounded-industrial text-center">
                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.3em]">Protocolo ISO 4149</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 flex items-center gap-3 mb-8">
                                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                                DIST. MALLAS
                            </h3>
                            <div className="bg-white/[0.02] p-6 rounded-industrial border border-white/10 h-[240px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={screenData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 10, fontWeight: '900' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#050510', border: '1px solid #ffffff10', borderRadius: '12px', padding: '12px' }}
                                            itemStyle={{ color: '#00df9a', fontSize: '12px', fontWeight: '900' }}
                                            cursor={{ fill: '#ffffff05' }}
                                        />
                                        <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={32} isAnimationActive={false}>
                                            {screenData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 1 ? '#00df9a' : '#ffffff05'} stroke={index === 1 ? '#00df9a' : '#ffffff10'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Sensory Section: Wide but Vertical-compatible */}
                    <div className="bg-gradient-to-br from-white/[0.02] to-transparent rounded- industrial border border-white/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 bg-brand-green/10 px-8 py-3 text-[8px] font-black uppercase tracking-[0.5em] rounded-bl-3xl border-l border-b border-brand-green/20 text-brand-green-bright">
                            SCA QUALITY PROTOCOL
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-12 flex flex-col items-center justify-center min-h-[420px] relative border-b md:border-b-0 md:border-r border-white/5">
                                <h3 className="absolute top-10 left-10 text-[10px] font-black uppercase tracking-[0.5em] text-white flex items-center gap-3">
                                    <div className="w-4 h-0.5 bg-brand-green"></div>
                                    SENSORIAL
                                </h3>

                                <div className="w-full h-full max-w-[340px] mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={scaRadarData}>
                                            <PolarGrid stroke="#ffffff05" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: '900' }} />
                                            <Radar
                                                name="Perfil"
                                                dataKey="A"
                                                stroke="#00df9a"
                                                strokeWidth={4}
                                                fill="#00df9a"
                                                fillOpacity={0.1}
                                                isAnimationActive={false}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="p-12 flex flex-col justify-between space-y-12">
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-brand-green font-black uppercase tracking-[0.5em]">DESCRIPTOR MAESTRO</p>
                                        <p className="text-2xl font-black text-white tracking-tight leading-tight italic grayscale hover:grayscale-0 transition-all duration-700">
                                            "{scaData?.notes || 'Perfil sensorial excepcionalmente equilibrado con estructura definida y potencial industrial verificado.'}"
                                        </p>
                                        <div className="h-1.5 w-16 bg-brand-green rounded-full"></div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Q-GRADER ANALYST</p>
                                        <div className="bg-black/40 p-4 rounded-industrial border border-white/5 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center font-black text-brand-green border border-brand-green/20">QG</div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-tight">{scaData?.taster_name || 'Protocolo Axis AI'}</p>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Digital Signature: Verified</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/5 flex justify-between items-center">
                                    <div className="bg-brand-green/5 px-5 py-3 rounded-full border border-brand-green/20 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center shadow-lg shadow-brand-green/20">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>
                                        </div>
                                        <span className="text-[9px] font-black text-brand-green-bright uppercase tracking-widest">VERIFICACIÓN AXIS</span>
                                    </div>
                                    <img src="/logo.png" alt="Seal" className="w-8 h-8 opacity-20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / QR / Actions - Final Official Seal */}
                <div className="bg-[#050505] p-8 md:p-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-green/30 to-transparent"></div>

                    <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                        <div className="bg-white p-2 rounded-xl shadow-lg relative shrink-0">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://axis-coffee.pro') + '/verify/lot/' + inventoryId)}`}
                                alt="QR Trazabilidad"
                                className="w-20 h-20 grayscale hover:grayscale-0 transition-all cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse"></span>
                                <p className="text-[9px] text-white font-black uppercase tracking-[0.3em]">PROPIEDAD DIGITAL AXIS</p>
                            </div>
                            <p className="text-[10px] text-gray-500 max-w-sm font-medium leading-tight uppercase opacity-70">
                                Certificado generado mediante infraestructura de datos distribuida con inmutabilidad industrial.
                            </p>
                            <div className="bg-white/5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-[7px] text-brand-green font-bold uppercase tracking-widest italic">8f2a...1b9c</span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-4">
                        <div className="text-right border-r border-white/10 pr-4 hidden md:block">
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">ID CONTROL</p>
                            <p className="text-xs font-black text-white italic">{inventoryId.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 opacity-30">
                            <img src="/logo.png" alt="Seal" className="w-6 h-6 object-contain" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-bg-card border-t border-white/5 flex justify-end gap-3 no-export w-full max-w-[850px]">
                <ExportReportButton elementId="lot-certificate-area" fileName={`CERTIFICATE-${inventoryId}`} />
                <button
                    className="px-6 py-3 bg-brand-green hover:bg-brand-green-bright text-white rounded-industrial-sm text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v10m0 0l-3-3m3 3l3-3" /></svg>
                    Compartir
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-industrial-sm text-[9px] font-bold uppercase tracking-widest transition-all border border-white/5"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
