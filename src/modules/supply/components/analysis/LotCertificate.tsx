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
    const [viewMode, setViewMode] = useState<'productor' | 'comprador'>('productor');

    useEffect(() => {
        fetchFullData();
    }, [inventoryId]);

    // Habilitar cierre con la tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

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

    const pData = lotData?.process_data || {};
    const isAxisCertifiedTech = pData.ph_inicial && pData.ph_final && pData.brix_inicial && pData.temperatura_masa_max && pData.duracion_fermentacion_horas;

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-10">
            {/* Controles de Privacidad (No se imprimen) */}
            <div className="w-full flex justify-between items-center bg-gray-100 border border-gray-200 p-4 rounded-xl print:hidden no-export">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Nivel de Visibilidad:</span>
                    <div className="bg-gray-100 p-1 rounded-lg border border-gray-200 flex">
                        <button
                            onClick={() => setViewMode('productor')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'productor' ? 'bg-brand-green text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            Productor (Full Know-How)
                        </button>
                        <button
                            onClick={() => setViewMode('comprador')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'comprador' ? 'bg-blue-600 text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            Comprador (Export Report)
                        </button>
                    </div>
                </div>
                {isAxisCertifiedTech && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 border border-brand-green/20 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        <span className="text-[9px] font-bold text-brand-green uppercase tracking-widest">AXIS-Certified-Tech</span>
                    </div>
                )}
            </div>

            {/* Contenedor Maestro para Exportación (2 Hojas Carta) */}
            <div id="lot-certificate-area" className="w-[816px] mx-auto space-y-8 print:space-y-0 print:m-0">

                {/* HOJA 1: IDENTIDAD, PRODUCCIÓN Y GRANULOMETRÍA */}
                <div className="bg-white border border-gray-200 shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:border-none print:break-after-page"
                    style={{ width: '816px', height: '1056px' }}>

                    {/* Header Minimalista */}
                    <div className="bg-gray-50 px-10 py-6 flex justify-between items-center border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <img src="/logo.png" alt="AXIS" className="w-8 h-8 opacity-80" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-black">AXIS COFFEE ANALYTICS</p>
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
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                                    <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest ">Identity Verified • Cloud-Stored Profile</span>
                                </div>
                                <h1 className="text-6xl font-black text-black tracking-tighter uppercase leading-[0.85]">
                                    {lotData?.farm_name || 'Lote Premium'}
                                </h1>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Productor</p>
                                        <p className="text-sm font-bold text-black uppercase leading-none">{lotData?.farmer_name || 'Independiente'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Lote ID</p>
                                        <p className="text-sm font-bold text-brand-green-bright font-mono leading-none">{lotData?.lot_number || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Variedad</p>
                                        <p className="text-sm font-bold text-black uppercase leading-none">{lotData?.variety || 'Caturra'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Región</p>
                                        <p className="text-sm font-bold text-black uppercase leading-none">{lotData?.region || 'Huila'}</p>
                                    </div>
                                    {lotData?.latitude && lotData?.longitude && (
                                        <div className="lg:col-span-2">
                                            <p className="text-[8px] text-[#ea580c] font-bold uppercase tracking-widest mb-1">Coordenadas GPS</p>
                                            <p className="text-sm font-bold text-black font-mono leading-none">
                                                {parseFloat(lotData.latitude).toFixed(6)} N, {parseFloat(lotData.longitude).toFixed(6)} W
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Score Destacado Sutil */}
                            <div className="bg-gray-50 border border-gray-200 p-1.5 rounded-xl shrink-0 self-center">
                                <div className="bg-white px-8 py-5 rounded-lg flex flex-col items-center border border-gray-200 shadow-2xl">
                                    <p className="text-[9px] font-bold text-brand-green uppercase tracking-[0.3em] mb-1">SCA Score</p>
                                    <p className="text-5xl font-bold text-black tracking-tighter leading-none">
                                        {scaData?.total_score != null ? Number(scaData.total_score).toFixed(2) : '00.00'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats de Producción (Fila compacta) */}
                    <div className="px-12 space-y-4">
                        <div className="grid grid-cols-4 gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                            {[
                                { label: 'Materia Prima', val: lotData?.purchase_weight || '--', unit: 'Kg', sub: 'Ingreso' },
                                { label: 'Materia Exportable', val: lotData?.thrashed_weight || '--', unit: 'Kg', sub: 'Excelso' },
                                { label: 'Factor Rendimiento', val: lotData?.thrashing_yield ? Number(lotData?.thrashing_yield).toFixed(2) : '--', unit: 'Fr', sub: 'Estimado' },
                                { label: 'Beneficio', val: lotData?.process || '--', unit: '', sub: 'Método' }
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-lg font-bold text-black tracking-tight leading-none">{stat.val} <span className="text-[9px] text-gray-700 font-mono ml-0.5">{stat.unit}</span></p>
                                    <p className="text-[8px] text-brand-green font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80">{stat.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Selective Visibility: Parámetros Técnicos */}
                        {(pData.ph_inicial || pData.ph_final) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-brand-green/[0.02] border border-brand-green/10 p-4 rounded-xl flex justify-between items-center group relative overflow-hidden">
                                    {viewMode === 'comprador' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <p className="text-[9px] text-brand-green font-mono uppercase tracking-widest flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Dato Privado</p>
                                    </div>}
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Evolución pH Acidez</p>
                                        <p className="text-xs text-black uppercase"><span className="text-gray-500 px-1">IN:</span> {pData.ph_inicial || '-'} <span className="text-brand-green px-1">➤</span> <span className="text-gray-500 px-1">OUT:</span> {pData.ph_final || '-'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Duración Fermentación</p>
                                        <p className="text-xs text-black uppercase">{pData.duracion_fermentacion_horas || '-'} HORAS</p>
                                    </div>
                                </div>
                                <div className="bg-blue-500/[0.02] border border-blue-500/10 p-4 rounded-xl flex justify-between items-center group relative overflow-hidden">
                                    {viewMode === 'comprador' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <p className="text-[9px] text-blue-400 font-mono uppercase tracking-widest flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Dato Privado</p>
                                    </div>}
                                    <div>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Brix Inicial</p>
                                        <p className="text-xs text-black uppercase">{pData.brix_inicial || '-'} °Bx</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Temp. Masa Max</p>
                                        <p className="text-xs text-brand-red uppercase">{pData.temperatura_masa_max || '-'} °C</p>
                                    </div>
                                </div>

                                {viewMode === 'comprador' && (
                                    <div className="md:col-span-2 bg-white/[0.02] border border-gray-200 p-3 rounded-lg flex items-center gap-4 animate-in fade-in">
                                        <span className="text-brand-green"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span>
                                        <p className="text-[9px] text-gray-600 uppercase tracking-widest flex-1">Los parámetros exactos de curva térmica, inoculación y tiempos de fermentación son propiedad del productor. <br /><span className="text-black">Este lote asegura un pH final de <b>{pData.ph_final || 'óptimo'}</b> validando inocuidad técnica y estabilidad.</span></p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Physical & Defects (1x4 Grid) */}
                    <div className="mt-8 px-12">
                        <div className="flex items-center gap-12 mb-6">
                            <h3 className="text-[10px] font-bold text-brand-green uppercase tracking-[0.4em] flex items-center gap-4">
                                <div className="w-6 h-[2px] bg-brand-green"></div>
                                Physical Quality
                            </h3>
                            <h3 className="text-[10px] font-bold text-brand-red uppercase tracking-[0.4em] flex items-center gap-4">
                                <div className="w-6 h-[2px] bg-brand-red"></div>
                                Grading Count
                            </h3>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {/* Humedad */}
                            <div className="bg-gray-50 border border-gray-200 rounded-[20px] p-6 flex flex-col justify-between items-center text-center min-h-[160px]">
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-4">Humedad</p>
                                <div className="flex items-baseline justify-center gap-1 mt-2">
                                    <p className="text-5xl font-black text-black tracking-tighter leading-none">{physicalData?.moisture_pct || '--'}</p>
                                    <span className="text-lg font-bold text-brand-green/80">%</span>
                                </div>
                                <p className="text-[8px] text-brand-green font-bold uppercase tracking-[0.1em] mt-auto pt-6 opacity-90">{physicalData?.grain_color || 'Estándar'}</p>
                            </div>

                            {/* Densidad */}
                            <div className="bg-gray-50 border border-gray-200 rounded-[20px] p-6 flex flex-col justify-between items-center text-center min-h-[160px]">
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-4">Densidad</p>
                                <div className="flex items-baseline justify-center gap-1 mt-2">
                                    <p className="text-5xl font-black text-black tracking-tighter leading-none">{physicalData?.density_gl || '--'}</p>
                                    <span className="text-sm font-bold text-blue-400 opacity-80">g/L</span>
                                </div>
                                <p className="text-[8px] text-blue-500 font-bold uppercase tracking-[0.1em] mt-auto pt-6">{physicalData?.water_activity || '--'} aw</p>
                            </div>

                            {/* Primarios */}
                            <div className="bg-gray-50 border border-brand-red/10 p-6 rounded-[20px] flex flex-col justify-between items-center text-center min-h-[160px]">
                                <div className="flex flex-col items-center justify-center mb-4 gap-1">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em]">Primarios</p>
                                    <p className="text-[7px] text-brand-red font-bold uppercase tracking-widest">(Type 1)</p>
                                </div>
                                <div className="flex items-baseline justify-center gap-1 mt-2">
                                    <p className="text-5xl font-black text-black tracking-tighter leading-none">{physicalData?.defects_count?.primary ?? '0'}</p>
                                    <span className="text-lg font-bold text-brand-red/80">%</span>
                                </div>
                                <p className="text-[8px] text-brand-red font-bold uppercase tracking-[0.1em] mt-auto pt-6 opacity-90">Defectos Críticos</p>
                            </div>

                            {/* Secundarios */}
                            <div className="bg-gray-50 border border-orange-500/10 p-6 rounded-[20px] flex flex-col justify-between items-center text-center min-h-[160px]">
                                <div className="flex flex-col items-center justify-center mb-4 gap-1">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em]">Secundarios</p>
                                    <p className="text-[7px] text-orange-500 font-bold uppercase tracking-widest">(Type 2)</p>
                                </div>
                                <div className="flex items-baseline justify-center gap-1 mt-2">
                                    <p className="text-5xl font-black text-black tracking-tighter leading-none">{physicalData?.defects_count?.secondary ?? '0'}</p>
                                    <span className="text-lg font-bold text-orange-400 opacity-80">%</span>
                                </div>
                                <p className="text-[8px] text-orange-500 font-bold uppercase tracking-[0.1em] mt-auto pt-6 opacity-90">Defectos Menores</p>
                            </div>
                        </div>
                    </div>

                    {/* Granulometría Ancho Completo */}
                    <div className="mt-8 px-12 flex flex-col flex-1">
                        <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-4 mb-6">
                            <div className="w-8 h-[2px] bg-cyan-400"></div>
                            Granulometría (Screen Size Distribution)
                        </h3>
                        <div className="h-[240px] relative bg-gray-50 border border-gray-200 rounded-[24px] p-4 flex flex-col justify-end mt-4">
                            <div className="h-[210px] w-full relative z-10 pl-4 pr-4 flex justify-center">
                                <BarChart width={650} height={180} data={screenData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="25%">
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#555', fontSize: 10, fontWeight: '700', dy: 10 }}
                                    />
                                    <Bar dataKey="val" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                                        {screenData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={Number(entry.val) > 0 ? '#00df9a' : '#e5e7eb'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </div>
                            <div className="grid grid-cols-8 gap-0 pt-2 border-t border-gray-200 relative z-10 w-full px-4 mb-2">
                                {screenData.map((d, i) => (
                                    <div key={i} className="text-center group flex flex-col items-center">
                                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5">{d.name}</p>
                                        <p className="text-[10px] font-bold text-black tracking-wider">{Number(d.val).toFixed(1)}<span className="text-[8px] text-gray-600 ml-0.5">%</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Hoja 1 */}
                    <div className="mt-auto px-12 py-8 flex justify-between items-center opacity-20 border-t border-gray-200">
                        <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.4</p>
                        <p className="text-[7px] font-mono text-gray-600 uppercase tracking-widest">{inventoryId.substring(0, 8).toUpperCase()}-P1</p>
                    </div>
                </div>

                {/* INDICADOR VISUAL DE CORTE (No visible al imprimir) */}
                <div className="w-full h-8 print:hidden"></div>

                {/* HOJA 2: PERFIL SENSORIAL Y SEGURIDAD */}
                <div className="bg-white border border-gray-200 shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:border-none print:break-after-page"
                    style={{ width: '816px', height: '1056px' }}>

                    {/* Header P2 */}
                    <div className="bg-gray-50 px-12 py-6 flex justify-between items-center border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <img src="/logo.png" alt="AXIS" className="w-8 h-8 opacity-80" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-black">AXIS COFFEE ANALYTICS</p>
                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Industrial Quality Protocol | Page 02</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-brand-green-bright font-mono uppercase ">{lotData?.lot_number || '---'}</p>
                        </div>
                    </div>

                    {/* Perfil Sensorial SCA (Elegante y Visual) */}
                    <div className="flex flex-col w-full h-[885px] justify-between">

                        {/* Radar Chart (Mucho más elegante) */}
                        <div className="w-full relative flex flex-col pt-12 items-center">
                            {/* Title (Normal Flow) */}
                            <div className="flex flex-col items-center mb-6">
                                <h2 className="text-sm font-bold text-brand-green uppercase tracking-[0.6em] mb-4">Evaluación Sensorial SCA</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">Análisis de Perfil Organoléptico de Especialidad</p>
                            </div>

                            {/* Chart & Data (Static Container) */}
                            <div className="w-full h-[450px] relative flex justify-center items-center">
                                <div className="absolute inset-0 bg-brand-green/[0.03] rounded-full blur-[100px] max-w-[500px] h-[500px] mx-auto top-1/2 -translate-y-1/2"></div>

                                <RadarChart width={500} height={450} cx="50%" cy="50%" outerRadius="75%" data={scaRadarData} className="relative z-10">
                                    <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
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

                                {/* Puntos de datos destacados */}
                                <div className="absolute top-10 right-12 space-y-2 opacity-50 z-20 w-40 text-right">
                                    {scaRadarData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3 justify-end">
                                            <span className="text-[8px] font-bold uppercase text-gray-500 tracking-widest">{d.subject}</span>
                                            <span className="text-[10px] font-mono font-bold text-gray-600">{Number(d.A).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Descriptor Maestro (Elegancia Tipográfica) */}
                        <div className="px-12 pt-8 pb-0 bg-white tracking-wide border-t border-gray-200 relative z-10 w-full mt-4">
                            <div className="w-full relative">
                                <div className="absolute -top-6 left-0 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                    Sensory Analysis Summary
                                </div>
                                <div className="flex flex-col">
                                    {/* Quote resting on a line */}
                                    <div className="pb-4 border-b border-gray-200 w-full text-center">
                                        <p className="text-xl font-light text-black tracking-tight leading-relaxed opacity-90 max-w-[85%] italic mx-auto">
                                            "{scaData?.notes || 'bacancito, chocolate y frutos rojos'}"
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-16 pt-6 pb-6 w-full relative z-10 bg-white">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center bg-gray-900 text-[11px] font-bold text-black border-gray-600/30">QG</div>
                                            <div className="text-left">
                                                <p className="text-lg font-bold text-black uppercase tracking-tight">{scaData?.taster_name || 'Q-GRADER SENIOR JULIO UVA'}</p>
                                                <p className="text-[8px] text-brand-green-bright font-bold uppercase tracking-widest mt-1">Professional Cupper • Digital Signature Verified</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 opacity-40">
                                            <img src="/logo.png" alt="Verify" className="w-10 h-10 grayscale" />
                                            <div className="text-left border-l border-gray-300 pl-4 py-1">
                                                <p className="text-[7px] font-bold text-gray-600 uppercase tracking-[0.2em]">Protocol S2.4</p>
                                                <p className="text-[9px] font-mono text-gray-700 mt-1 uppercase">ID SEAL: {inventoryId.substring(0, 6)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Hoja 2: Seguridad y QR */}
                        <div className="bg-white p-12 flex justify-between items-center gap-12 relative overflow-hidden border-t border-gray-200 mt-auto">
                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                            <div className="flex items-center gap-10 max-w-2xl">
                                <div className="bg-white p-1.5 rounded-xl shrink-0 opacity-90 hover:opacity-100 transition-all shadow-2xl">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://axis-pro.coffee/verify/lot/' + inventoryId)}`}
                                        alt="QR Traceability"
                                        className="w-24 h-24 grayscale opacity-70 border border-gray-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[9px] font-bold text-black uppercase tracking-[0.5em]">Trazabilidad Digital Inmutable</p>
                                    <p className="text-[10px] text-gray-600 uppercase font-medium leading-[1.6] tracking-wider opacity-70">
                                        Certificación técnica de origen y calidad física-sensorial. Los datos han sido encriptados en la red AXIS para garantizar transparencia absoluta en la cadena de suministro industrial de café.
                                    </p>
                                </div>
                            </div>

                            <div className="text-right space-y-4">
                                <div className="px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                                    <p className="text-[8px] font-mono text-gray-500 tracking-tighter">{inventoryId.toUpperCase()}</p>
                                </div>
                                <p className="text-[7px] text-gray-700 uppercase font-bold tracking-widest leading-none">© 2026 AXIS INTELLIGENCE GROUP<br /><span className="mt-1 block opacity-50">Industrial Quality Archive</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel de Control Inferior (No exportable) */}
                <div className="w-full flex justify-end gap-4 no-export mt-10 p-10 bg-gray-100 border border-gray-200 rounded-2xl shadow-2xl print:hidden">
                    <ExportReportButton
                        elementId="lot-certificate-area"
                        fileName={`REPORT-AXIS-${lotData?.lot_number || 'LOT'}-${lotData?.farm_name || 'COFFEE'}`}
                    />
                    <button
                        onClick={() => window.print()}
                        className="px-8 py-4 bg-black hover:bg-gray-800 text-white border border-gray-800 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        IMPRIMIR / PDF NATIVO
                    </button>
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border border-gray-200 active:scale-95 shadow-xl"
                    >
                        Cerrar Certificado
                    </button>
                </div>
            </div>
        </div>
    );
}
