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

            if (sca && sca.total_score == null) {
                sca.total_score = (
                    (Number(sca.fragrance_aroma || 0) +
                        Number(sca.flavor || 0) +
                        Number(sca.aftertaste || 0) +
                        Number(sca.acidity || 0) +
                        Number(sca.body || 0) +
                        Number(sca.balance || 0) +
                        Number(sca.uniformity || 10) +
                        Number(sca.clean_cup || 10) +
                        Number(sca.sweetness || 10) +
                        Number(sca.overall || 0) -
                        (Number(sca.defects_score || 0) * 2))
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
        { name: 'M14', val: physicalData.screen_size_distribution.size14 },
        { name: 'M13', val: physicalData.screen_size_distribution.size13 },
        { name: 'M12', val: physicalData.screen_size_distribution.size12 },
        { name: 'Fondo', val: physicalData.screen_size_distribution.under12 },
    ] : [];

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-10">
            {/* Contenedor Maestro para Exportación (2 Hojas Carta) */}
            <div id="lot-certificate-area" className="w-full space-y-4 print:space-y-0">

                {/* HOJA 1: IDENTIDAD, PRODUCCIÓN Y GRANULOMETRÍA */}
                <div className="w-full bg-[#08080c] border border-white/5 shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:border-none"
                    style={{ minHeight: '1056px', height: '1056px' }}>

                    {/* Header Minimalista */}
                    <div className="bg-black/40 px-10 py-6 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <img src="/logo.png" alt="AXIS" className="w-8 h-8 opacity-80" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-white">AXIS COFFEE ANALYTICS</p>
                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Industrial Quality Protocol | Page 01</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">Expedición Digital</p>
                            <p className="text-[9px] font-mono text-brand-green-bright uppercase">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Identidad del Lote */}
                    <div className="p-12 pb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                            <div className="space-y-4 max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest ">Identity Verified • Cloud-Stored Profile</span>
                                </div>
                                <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-[0.85]">
                                    {lotData?.farm_name || 'Lote Premium'}
                                </h1>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Productor</p>
                                        <p className="text-sm font-bold text-gray-200 uppercase leading-none">{lotData?.farmer_name || 'Independiente'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Lote ID</p>
                                        <p className="text-sm font-bold text-brand-green-bright font-mono leading-none">{lotData?.lot_number || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Variedad</p>
                                        <p className="text-sm font-bold text-gray-200 uppercase leading-none">{lotData?.variety || 'Caturra'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Región</p>
                                        <p className="text-sm font-bold text-gray-200 uppercase leading-none">{lotData?.region || 'Huila'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Score Destacado Sutil */}
                            <div className="bg-white/[0.03] border border-white/10 p-1.5 rounded-xl shrink-0 self-center">
                                <div className="bg-black/60 px-8 py-5 rounded-lg flex flex-col items-center border border-white/5 shadow-2xl">
                                    <p className="text-[9px] font-bold text-brand-green uppercase tracking-[0.3em] mb-1">SCA Score</p>
                                    <p className="text-5xl font-bold text-white tracking-tighter leading-none">
                                        {scaData?.total_score != null ? Number(scaData.total_score).toFixed(2) : '00.00'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats de Producción (Fila compacta) */}
                    <div className="px-12">
                        <div className="grid grid-cols-4 gap-4 bg-white/[0.015] p-6 rounded-xl border border-white/5">
                            {[
                                { label: 'Materia Primera', val: lotData?.purchase_weight, unit: 'Kg', sub: 'Ingreso' },
                                { label: 'Materia Exportable', val: lotData?.thrashed_weight, unit: 'Kg', sub: 'Excelso' },
                                { label: 'Rendimiento', val: Number(lotData?.thrashing_yield || 0).toFixed(2), unit: 'Fr', sub: 'Factor' },
                                { label: 'Beneficio', val: lotData?.process, unit: '', sub: 'Método' }
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-lg font-bold text-white tracking-tight leading-none">{stat.val} <span className="text-[9px] text-gray-700 font-mono ml-0.5">{stat.unit}</span></p>
                                    <p className="text-[6px] text-brand-green font-bold uppercase tracking-[0.2em] mt-1.5 opacity-50">{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Granulometría (Movida a Hoja 1, diseño más sutil) */}
                    <div className="mt-8 px-12">
                        <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.5em] flex items-center gap-4 mb-6">
                            <div className="w-6 h-0.5 bg-cyan-400"></div>
                            Granulometría (Screen Size Distribution)
                        </h3>
                        <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl h-[240px] relative overflow-hidden">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={screenData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#444', fontSize: 10, fontWeight: '700' }}
                                    />
                                    <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={30}>
                                        {screenData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={Number(entry.val) > 10 ? '#00df9a' : '#ffffff05'}
                                                stroke={Number(entry.val) > 10 ? '#00df9a' : '#ffffff05'}
                                                fillOpacity={Number(entry.val) > 10 ? 0.6 : 0.3}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-8 gap-1 mt-4 border-t border-white/5 pt-4">
                            {screenData.map((d, i) => (
                                <div key={i} className="text-center group">
                                    <p className="text-[6px] text-gray-600 font-bold uppercase tracking-widest mb-1">{d.name}</p>
                                    <p className="text-[10px] font-mono font-bold text-gray-400">{Number(d.val).toFixed(1)}%</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calidad Física y Defectos (Compactos en la base de la H1) */}
                    <div className="mt-10 px-12 grid grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-brand-green uppercase tracking-[0.5em] flex items-center gap-4">
                                <div className="w-6 h-0.5 bg-brand-green"></div>
                                Physical Quality
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5">
                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-2">Humedad</p>
                                    <p className="text-3xl font-bold text-white leading-none">{physicalData?.moisture_pct || '--'}<span className="text-xs text-brand-green-bright ml-1.5 opacity-40">%</span></p>
                                    <p className="text-[8px] text-brand-green font-bold uppercase mt-3 tracking-widest  opacity-60">{physicalData?.grain_color || 'Estándar'}</p>
                                </div>
                                <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5">
                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-2">Densidad</p>
                                    <p className="text-3xl font-bold text-white leading-none">{physicalData?.density_gl || '--'}<span className="text-[10px] text-blue-400 font-mono ml-1.5 opacity-40">g/L</span></p>
                                    <p className="text-[8px] text-blue-400 font-bold uppercase mt-3 tracking-widest  opacity-60">{physicalData?.water_activity || '--'} aw</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-brand-red uppercase tracking-[0.5em] flex items-center gap-4">
                                <div className="w-6 h-0.5 bg-brand-red"></div>
                                Grading Count
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-brand-red/[0.02] border border-brand-red/10 px-6 py-4 rounded-xl flex justify-between items-center group">
                                    <p className="text-[11px] font-bold text-gray-300 uppercase">Primarios <span className="text-[8px] text-brand-red ml-2 font-bold opacity-60">(Type 1)</span></p>
                                    <p className="text-3xl font-bold text-white leading-none">{physicalData?.defects_count?.primary ?? '0.0'}<span className="text-xs text-brand-red ml-1.5 font-bold">%</span></p>
                                </div>
                                <div className="bg-orange-500/[0.02] border border-orange-500/10 px-6 py-4 rounded-xl flex justify-between items-center group">
                                    <p className="text-[11px] font-bold text-gray-300 uppercase">Secundarios <span className="text-[8px] text-orange-500 ml-2 font-bold opacity-60">(Type 2)</span></p>
                                    <p className="text-3xl font-bold text-white leading-none">{physicalData?.defects_count?.secondary ?? '0.0'}<span className="text-xs text-orange-500 ml-1.5 font-bold">%</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Hoja 1 */}
                    <div className="mt-auto px-12 py-8 flex justify-between items-center opacity-20 border-t border-white/5">
                        <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.4</p>
                        <p className="text-[7px] font-mono text-gray-600 uppercase tracking-widest">{inventoryId.substring(0, 8).toUpperCase()}-P1</p>
                    </div>
                </div>

                {/* INDICADOR VISUAL DE CORTE (No visible al imprimir) */}
                <div className="w-full h-8 print:hidden"></div>

                {/* HOJA 2: PERFIL SENSORIAL Y TRAZABILIDAD DIGITAL */}
                <div className="w-full bg-[#08080c] border border-white/5 shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:border-none"
                    style={{ minHeight: '1056px', height: '1056px' }}>

                    {/* Header P2 */}
                    <div className="bg-black/40 px-10 py-6 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <img src="/logo.png" alt="AXIS" className="w-8 h-8 opacity-80" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-white">AXIS COFFEE ANALYTICS</p>
                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Industrial Quality Protocol | Page 02</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-brand-green-bright font-mono uppercase ">{lotData?.lot_number || '---'}</p>
                        </div>
                    </div>

                    {/* Perfil Sensorial SCA (Elegante y Visual) */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-12 pb-6 text-center">
                            <h2 className="text-[11px] font-bold text-brand-green uppercase tracking-[0.6em] mb-4">Evaluación Sensorial SCA</h2>
                            <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-medium">Análisis de Perfil Organoléptico de Especialidad</p>
                        </div>

                        {/* Radar Chart (Mucho más elegante) */}
                        <div className="flex-1 flex items-center justify-center p-12">
                            <div className="w-full h-full max-w-[540px] relative">
                                <div className="absolute inset-0 bg-brand-green/[0.03] rounded-full blur-[100px]"></div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="85%" data={scaRadarData}>
                                        <PolarGrid stroke="#ffffff05" strokeWidth={1} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#444', fontSize: 11, fontWeight: '700' }} />
                                        <Radar
                                            name="Profile"
                                            dataKey="A"
                                            stroke="#00df9a"
                                            strokeWidth={1.5}
                                            fill="#00df9a"
                                            fillOpacity={0.08}
                                            isAnimationActive={false}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                                {/* Puntos de datos destacados */}
                                <div className="absolute top-0 right-0 p-6 space-y-2 opacity-40">
                                    {scaRadarData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3 justify-end">
                                            <span className="text-[8px] font-bold uppercase text-gray-500 tracking-widest">{d.subject}</span>
                                            <span className="text-[10px] font-mono font-bold text-gray-400">{Number(d.A).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Descriptor Maestro (Elegancia Tipográfica) */}
                        <div className="px-16 py-12 bg-white/[0.01] border-y border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 px-8 py-3 bg-brand-green/5 text-[9px] font-bold uppercase tracking-widest text-brand-green-bright opacity-40">
                                Sensory Analysis Summary
                            </div>
                            <div className="space-y-6">
                                <p className="text-3xl font-regular text-gray-200 tracking-tight leading-relaxed  opacity-90 max-w-3xl">
                                    "{scaData?.notes || 'Un perfil exquisitamente balanceado con acidez brillante y cuerpo sedoso, preservado bajo estándares AXIS.'}"
                                </p>
                                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-black/40 text-[10px] font-bold text-brand-green">QG</div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">{scaData?.taster_name || 'Q-Grader Senior'}</p>
                                            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Professional Cupper • Digital Signature Verified</p>
                                        </div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-4 opacity-30">
                                        <img src="/logo.png" alt="Verify" className="w-8 h-8 grayscale" />
                                        <div className="text-right">
                                            <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Protocol S2.4</p>
                                            <p className="text-[7px] font-mono text-gray-600">ID SEAL: {inventoryId.substring(0, 6).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Hoja 2: Seguridad y QR */}
                    <div className="bg-black p-12 flex justify-between items-center gap-12 relative overflow-hidden mt-auto">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                        <div className="flex items-center gap-10 max-w-2xl">
                            <div className="bg-white p-1.5 rounded-xl shrink-0 opacity-90 hover:opacity-100 transition-all shadow-2xl">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://axis-pro.coffee') + '/verify/lot/' + inventoryId)}`}
                                    alt="QR Traceability"
                                    className="w-24 h-24 grayscale contrast-125"
                                />
                            </div>
                            <div className="space-y-3">
                                <p className="text-[9px] font-bold text-white uppercase tracking-[0.5em]">Trazabilidad Digital Inmutable</p>
                                <p className="text-[10px] text-gray-600 uppercase font-medium leading-[1.6] tracking-wider opacity-70">
                                    Certificación técnica de origen y calidad física-sensorial. Los datos han sido encriptados en la red AXIS para garantizar transparencia absoluta en la cadena de suministro industrial de café.
                                </p>
                            </div>
                        </div>

                        <div className="text-right space-y-4">
                            <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-[8px] font-mono text-gray-500 tracking-tighter">{inventoryId.toUpperCase()}</p>
                            </div>
                            <p className="text-[7px] text-gray-700 uppercase font-bold tracking-widest leading-none">© 2026 AXIS INTELLIGENCE GROUP<br /><span className="mt-1 block opacity-50">Industrial Quality Archive</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de Control Inferior (No exportable) */}
            <div className="w-full flex justify-end gap-4 no-export mt-10 p-10 bg-bg-card border border-white/5 rounded-2xl shadow-2xl">
                <ExportReportButton
                    elementId="lot-certificate-area"
                    fileName={`REPORT-AXIS-${lotData?.lot_number || 'LOT'}-${lotData?.farm_name || 'COFFEE'}`}
                />
                <button
                    onClick={onClose}
                    className="px-10 py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border border-white/10 active:scale-95 shadow-xl"
                >
                    Cerrar Certificado
                </button>
            </div>
        </div>
    );
}
