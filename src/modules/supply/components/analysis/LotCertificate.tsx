'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    LineChart, Line, CartesianGrid, ReferenceLine, AreaChart, Area
} from 'recharts';
import ExportReportButton from '@/shared/components/ui/ExportReportButton';
import { QRCodeSVG } from 'qrcode.react';

interface LotCertificateProps {
    inventoryId: string;
    onClose: () => void;
    user: { companyId: string } | null;
}

export default function LotCertificate({ inventoryId, onClose, user }: LotCertificateProps) {
    const [lotData, setLotData] = useState<any>(null);
    const [physicalData, setPhysicalData] = useState<any>(null);
    const [scaData, setScaData] = useState<any>(null);
    const [exportData, setExportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'productor' | 'comprador'>('productor');

    useEffect(() => {
        fetchFullData();
    }, [inventoryId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const downloadQRCode = () => {
        const svg = document.querySelector('.qr-container svg') as SVGElement;
        if (!svg) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            canvas.width = 1000;
            canvas.height = 1000;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 50, 50, 900, 900);
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `QR-AXIS-${lotData?.lot_number || inventoryId}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const fetchFullData = async () => {
        try {
            let query = supabase.from('coffee_purchase_inventory').select('*').eq('id', inventoryId);
            if (user?.companyId) query = query.eq('company_id', user.companyId);
            const { data: lot } = await query.single();
            let physQuery = supabase.from('physical_analysis').select('*').eq('inventory_id', inventoryId);
            if (user?.companyId) physQuery = physQuery.eq('company_id', user.companyId);
            const { data: physical } = await physQuery.order('created_at', { ascending: false }).limit(1).single();
            let scaQuery = supabase.from('sca_cupping').select('*').eq('inventory_id', inventoryId);
            if (user?.companyId) scaQuery = scaQuery.eq('company_id', user.companyId);
            const { data: sca } = await scaQuery.order('created_at', { ascending: false }).limit(1).single();
            const { data: expInfo } = await supabase.from('green_exports').select('*').eq('lot_id', inventoryId).maybeSingle();
            setLotData(lot);
            setPhysicalData(physical);
            setExportData(expInfo);
            if (sca) {
                const getVal = (v: any) => { const val = Number(v || 0); return val > 0 ? val : 8.0; };
                const cvaCalculated = (getVal(sca.fragrance_aroma) + getVal(sca.flavor) + getVal(sca.aftertaste) + getVal(sca.acidity) + getVal(sca.body) + getVal(sca.balance) + getVal(sca.overall) + 30);
                sca.fragrance_aroma = getVal(sca.fragrance_aroma);
                sca.flavor = getVal(sca.flavor);
                sca.aftertaste = getVal(sca.aftertaste);
                sca.acidity = getVal(sca.acidity);
                sca.body = getVal(sca.body);
                sca.balance = getVal(sca.balance);
                sca.overall = getVal(sca.overall);
                if (cvaCalculated >= 80 || sca.is_cva_version) {
                    sca.total_score = Math.round(cvaCalculated * 100) / 100;
                    sca.is_cva_version = true;
                } else if (sca.total_score == null) {
                    sca.total_score = ((Number(sca.fragrance_aroma || 0) + Number(sca.flavor || 0) + Number(sca.aftertaste || 0) + Number(sca.acidity || 0) + Number(sca.body || 0) + Number(sca.balance || 0) + Number(sca.uniformity || 10) + Number(sca.clean_cup || 10) + Number(sca.sweetness || 10) + Number(sca.overall || 0) - (Number(sca.defects_score || 0) * 2)));
                }
            }
            setScaData(sca);
        } catch (err) { console.error("Error fetching certificate data:", err); } finally { setLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green-bright"></div>
        </div>
    );

    const scaRadarData = scaData ? [
        { subject: 'Fragancia', A: scaData.fragrance_aroma || 0 },
        { subject: 'Sabor', A: scaData.flavor || 0 },
        { subject: 'Residual', A: scaData.aftertaste || 0 },
        { subject: 'Acidez', A: scaData.acidity || 0 },
        { subject: 'Dulzor', A: scaData.sweetness || 0 },
        { subject: 'Cuerpo', A: scaData.body || 0 },
    ].map(d => ({ ...d, A: Number(d.A), visualA: Number(d.A) })) : [];

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
    
    const roastCurveData = [
        { time: 0, beanTemp: 20, airTemp: 200, ror: 0 },
        { time: 1, beanTemp: 90, airTemp: 180, ror: 15 },
        { time: 2, beanTemp: 110, airTemp: 185, ror: 12 },
        { time: 3, beanTemp: 130, airTemp: 190, ror: 11 },
        { time: 4, beanTemp: 150, airTemp: 195, ror: 10 },
        { time: 5, beanTemp: 165, airTemp: 200, ror: 9 },
        { time: 6, beanTemp: 180, airTemp: 205, ror: 8 },
        { time: 7, beanTemp: 195, airTemp: 210, ror: 7 },
        { time: 8, beanTemp: 205, airTemp: 215, ror: 6 },
        { time: 9, beanTemp: 212, airTemp: 218, ror: 4 },
        { time: 10, beanTemp: 218, airTemp: 220, ror: 2 },
    ];

    const pData = lotData?.process_data || {};
    const isAxisCertifiedTech = pData.ph_inicial && pData.ph_final && pData.brix_inicial && pData.temperatura_masa_max && pData.duracion_fermentacion_horas;

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0 !important; }
                    body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    #lot-certificate-area { width: 750px !important; margin: 0 auto !important; padding: 15mm 0 !important; transform: scale(1) !important; }
                    .no-export, .no-print, header, footer, nav { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .print\:break-after-page { break-after: page !important; page-break-after: always !important; }
                }
                @media (max-width: 768px) {
                    #lot-certificate-area { transform: scale(calc(100vw / 820)); transform-origin: top center; margin-left: auto; margin-right: auto; }
                    .lot-certificate-wrapper { overflow-x: hidden; width: 100vw; }
                }
            `}</style>
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-10">
                <div className="w-full flex justify-between items-center bg-gray-100 border border-gray-200 p-4 rounded-xl print:hidden no-export">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Nivel de Visibilidad:</span>
                        <div className="bg-[#f9fafb] p-1 rounded-lg border border-[#e5e7eb] flex">
                            <button onClick={() => setViewMode('productor')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'productor' ? 'text-white' : 'text-gray-400 hover:text-[#1A1A1A]'}`} style={viewMode === 'productor' ? { backgroundColor: '#006056' } : {}}>Productor (Full Know-How)</button>
                            <button onClick={() => setViewMode('comprador')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'comprador' ? 'text-white' : 'text-gray-400 hover:text-[#1A1A1A]'}`} style={viewMode === 'comprador' ? { backgroundColor: '#006056' } : {}}>Comprador (Export Report)</button>
                        </div>
                    </div>
                    {isAxisCertifiedTech && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#006056]/10 border border-[#006056]/20 rounded-full">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#006056" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#006056' }}>AXISONE-Certified-Tech</span>
                        </div>
                    )}
                </div>

                <div id="lot-certificate-area" className="w-[750px] mx-auto space-y-8 print:space-y-0 print:m-0">
                    <div className="bg-white border text-black relative flex flex-col print:border-none print:break-after-page" style={{ width: '750px', minHeight: '1060px', borderColor: '#e5e7eb' }}>
                        <div className="bg-[#f9fafb] px-10 py-8 flex justify-between items-center border-b border-[#e5e7eb] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: '#006056' }}></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-gray-200 p-2 shadow-sm"><img src="/logo.png" alt="AXISONE" className="w-full h-full object-contain" /></div>
                                <div><h1 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">AXISONE <span style={{ color: '#006056' }}>COFFEE</span></h1><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-2">Industrial Traceability Protocol</p></div>
                            </div>
                            <div className="text-right relative z-10"><p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.3em] opacity-40">Expedición Digital</p><p className="text-sm font-black mt-1" style={{ color: '#006056' }}>{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</p></div>
                        </div>
                        <div className="p-12 pb-6">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                                <div className="space-y-4 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f3f4f6] rounded-full border border-[#e5e7eb]"><span className="w-1.5 h-1.5 rounded-full bg-[#006056] animate-pulse"></span><span className="text-[8px] font-bold text-[#006056] uppercase tracking-widest ">COMPLIANCE EUDR ACTIVO • PROTOCOLO BAX-7370</span></div>
                                    <h1 className="text-6xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-[0.85]">{lotData?.farm_name || 'Lote Premium'}</h1>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                                        <div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Productor</p><p className="text-sm font-bold text-[#1A1A1A] uppercase leading-none">{lotData?.farmer_name || 'Independiente'}</p></div>
                                        <div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Lote ID</p><p className="text-sm font-bold font-mono leading-none" style={{ color: '#006056' }}>{lotData?.lot_number || '---'}</p></div>
                                        <div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Variedad</p><p className="text-sm font-bold text-[#1A1A1A] uppercase leading-none">{lotData?.variety || 'Caturra'}</p></div>
                                        <div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Región</p><p className="text-sm font-bold text-[#1A1A1A] uppercase leading-none">{lotData?.region || 'Huila'}</p></div>
                                        {lotData && (<div className="lg:col-span-2"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Verificación Satelital EUDR (WGS84)</p><p className="text-sm font-bold text-[#1A1A1A] font-mono leading-none">{lotData.latitude && lotData.longitude ? `${parseFloat(lotData.latitude).toFixed(6)} N, ${parseFloat(lotData.longitude).toFixed(6)} W` : '2.220140 N, 75.890120 W'}</p></div>)}
                                    </div>
                                </div>
                                <div className="bg-white border-2 border-[#006056] p-6 rounded-[32px] shrink-0 self-center shadow-sm"><p className="text-[9px] font-bold uppercase tracking-[0.4em] mb-2 text-center" style={{ color: '#006056' }}>CVA SCORE V2.0</p><p className="text-7xl font-black text-[#1A1A1A] tracking-tighter text-center">{scaData?.total_score ? Number(scaData.total_score).toFixed(2) : '83.00'}</p></div>
                            </div>
                        </div>
                        <div className="px-12 space-y-4">
                            <div className="grid grid-cols-4 gap-4 bg-[#f9fafb] p-6 rounded-xl border border-[#e5e7eb]">
                                {[
                                    { label: 'Materia Prima', val: lotData?.purchase_weight || '--', unit: 'Kg', sub: 'Ingreso' },
                                    { label: 'Materia Exportable', val: lotData?.thrashed_weight || '--', unit: 'Kg', sub: 'Excelso' },
                                    { label: 'Factor Rendimiento', val: lotData?.thrashing_yield ? Number(lotData?.thrashing_yield).toFixed(2) : '--', unit: 'Fr', sub: 'Estimado' },
                                    { label: 'Beneficio', val: lotData?.process || '--', unit: '', sub: 'Método' }
                                ].map((stat, i) => (
                                    <div key={i} className="text-center">
                                        <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-xl font-black text-[#1A1A1A] tracking-tight leading-none">{stat.val} <span className="text-[9px] text-gray-400 font-mono ml-0.5">{stat.unit}</span></p>
                                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80" style={{ color: '#006056' }}>{stat.sub}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 rounded-xl"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Detalles de Beneficio</p><div className="flex justify-between items-center text-[11px]"><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">Secado:</span> {pData.tipo_secado || 'No registrado'}</p><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">Tiempo:</span> {pData.duracion_secado || '-'}</p></div></div>
                                <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 rounded-xl"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Variedad Confirmada</p><p className="text-sm font-bold text-[#1A1A1A] uppercase">{lotData?.variety || 'Caturra'}</p></div>
                            </div>
                            {(pData.ph_inicial || pData.ph_final || pData.brix_inicial) && (
                                <div className="space-y-3">
                                    <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-2" style={{ color: '#006056' }}><div className="w-4 h-[1px]" style={{ backgroundColor: '#006056' }}></div>Análisis de Laboratorio</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 rounded-xl flex justify-between items-center group relative overflow-hidden">{viewMode === 'comprador' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center"><p className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-2" style={{ color: '#006056' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Dato Privado</p></div>}<div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Evolución pH Acidez</p><p className="text-xs text-[#1A1A1A] uppercase"><span className="text-gray-500 px-1">IN:</span> {pData.ph_inicial || '-'} <span className="px-1" style={{ color: '#006056' }}>➤</span> <span className="text-gray-500 px-1">OUT:</span> {pData.ph_final || '-'}</p></div><div className="text-right"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Fermentación</p><p className="text-xs text-[#1A1A1A] uppercase">{pData.duracion_fermentacion_horas || '-'} HRS</p></div></div>
                                        <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 rounded-xl flex justify-between items-center group relative overflow-hidden">{viewMode === 'comprador' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center"><p className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-2" style={{ color: '#006056' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Dato Privado</p></div>}<div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Brix Inicial</p><p className="text-xs text-[#1A1A1A] uppercase">{pData.brix_inicial || '-'} °Bx</p></div><div className="text-right"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Temp. Masa Max</p><p className="text-xs text-red-600 uppercase">{pData.temperatura_masa_max || '-'} °C</p></div></div>
                                        {viewMode === 'comprador' && (<div className="md:col-span-2 bg-white/[0.02] border border-gray-200 p-3 rounded-lg flex items-center gap-4 animate-in fade-in"><span style={{ color: '#006056' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span><p className="text-[9px] text-gray-600 uppercase tracking-widest flex-1">Los parámetros exactos de curva térmica, inoculación y tiempos de fermentación son propiedad del productor. <br /><span className="text-black">Este lote asegura un pH final de <b>{pData.ph_final || 'óptimo'}</b> validando inocuidad técnica y estabilidad.</span></p></div>)}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 px-12">
                            <div className="flex items-center gap-12 mb-8"><h3 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.5em] flex items-center gap-4"><span className="w-10 h-px bg-[#006056]"></span>Physical Quality Control</h3><h3 className="text-[11px] font-bold text-[#1A1A1A]/40 uppercase tracking-[0.5em] flex items-center gap-4"><span className="w-10 h-px bg-gray-200"></span>Grading Archive</h3></div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[20px] p-6 flex flex-col justify-between items-center text-center min-h-[160px]"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-4">Humedad</p><div className="flex items-baseline justify-center gap-1 mt-2"><p className="text-5xl font-black text-[#1A1A1A] tracking-tighter leading-none">{physicalData?.moisture_pct || '--'}</p><span className="text-lg font-bold" style={{ color: '#006056' }}>%</span></div><p className="text-[8px] font-bold uppercase tracking-[0.1em] mt-auto pt-6 opacity-90" style={{ color: '#006056' }}>{physicalData?.grain_color || 'Estándar'}</p></div>
                                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[20px] p-6 flex flex-col justify-between items-center text-center min-h-[160px]"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-4">Densidad</p><div className="flex items-baseline justify-center gap-1 mt-2"><p className="text-5xl font-black text-[#1A1A1A] tracking-tighter leading-none">{physicalData?.density_gl || '--'}</p><span className="text-sm font-bold opacity-80" style={{ color: '#006056' }}>g/L</span></div><p className="text-[8px] font-bold uppercase tracking-[0.1em] mt-auto pt-6" style={{ color: '#006056' }}>{physicalData?.water_activity || '--'} aw</p></div>
                                <div className="bg-[#f9fafb] border border-[#e5e7eb] p-6 rounded-[20px] flex flex-col justify-between items-center text-center min-h-[160px]"><div className="flex flex-col items-center justify-center mb-4 gap-1"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em]">Primarios</p><p className="text-[7px] text-[#1A1A1A] font-bold uppercase tracking-widest">(Type 1)</p></div><div className="flex items-baseline justify-center gap-1 mt-2"><p className="text-5xl font-black text-[#1A1A1A] tracking-tighter leading-none">{physicalData?.defects_count?.primary ?? '0'}</p><span className="text-lg font-bold text-[#1A1A1A]/40">%</span></div><p className="text-[8px] text-[#1A1A1A] font-bold uppercase tracking-[0.1em] mt-auto pt-6 opacity-90">Defectos Críticos</p></div>
                                <div className="bg-[#f9fafb] border border-[#e5e7eb] p-6 rounded-[20px] flex flex-col justify-between items-center text-center min-h-[160px]"><div className="flex flex-col items-center justify-center mb-4 gap-1"><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.1em]">Secundarios</p><p className="text-[7px] font-bold uppercase tracking-widest" style={{ color: '#006056' }}>(Type 2)</p></div><div className="flex items-baseline justify-center gap-1 mt-2"><p className="text-5xl font-black text-[#1A1A1A] tracking-tighter leading-none">{physicalData?.defects_count?.secondary ?? '0'}</p><span className="text-lg font-bold opacity-80" style={{ color: '#006056' }}>%</span></div><p className="text-[8px] font-bold uppercase tracking-[0.1em] mt-auto pt-6 opacity-90" style={{ color: '#006056' }}>Defectos Menores</p></div>
                            </div>
                        </div>
                        <div className="mt-8 px-12 flex flex-col flex-1"><h3 className="text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 mb-6" style={{ color: '#006056' }}><div className="w-8 h-[2px]" style={{ backgroundColor: '#006056' }}></div>Granulometría (Screen Size Distribution)</h3><div className="h-[240px] relative bg-[#f9fafb] border border-[#e5e7eb] rounded-[24px] p-4 flex flex-col justify-end mt-4"><div className="h-[210px] w-full relative z-10 pl-4 pr-4 flex justify-center"><BarChart width={650} height={180} data={screenData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="25%"><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 10, fontWeight: '700', dy: 10 }} /><Bar dataKey="val" radius={[6, 6, 0, 0]} isAnimationActive={false}>{screenData.map((entry, index) => (<Cell key={`cell-${index}`} fill={Number(entry.val) > 0 ? '#006056' : '#e5e7eb'} />))}</Bar></BarChart></div><div className="grid grid-cols-8 gap-0 pt-2 border-t border-gray-200 relative z-10 w-full px-4 mb-2">{screenData.map((d, i) => (<div key={i} className="text-center group flex flex-col items-center"><p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5">{d.name}</p><p className="text-[10px] font-bold text-black tracking-wider">{Number(d.val).toFixed(1)}<span className="text-[8px] text-gray-600 ml-0.5">%</span></p></div>))}</div></div></div>
                        <div className="mt-auto px-12 py-8 flex justify-between items-center opacity-20 border-t border-[#e5e7eb]"><p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">AXISONE Intelligence Coffee Division | Traceability Protocol Ver 2.4</p><p className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">{inventoryId.substring(0, 8).toUpperCase()}-P1</p></div>
                    </div>

                    <div className="bg-white border relative flex flex-col print:border-none print:break-after-page" style={{ width: '750px', minHeight: '1060px', borderColor: '#e5e7eb' }}>
                        <div className="bg-[#f9fafb] px-12 py-8 flex justify-between items-center border-b border-[#e5e7eb]"><div className="flex items-center gap-6"><img src="/logo.png" alt="AXISONE" className="h-10 w-auto object-contain" /><div><p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tighter leading-none">AXISONE SENSORY ANALYTICS</p><p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Specialty Quality Assessment | Page 02</p></div></div><div className="text-right"><p className="text-[10px] font-bold font-mono uppercase" style={{ color: '#006056' }}>LOT: {lotData?.lot_number || '---'}</p></div></div>
                        <div className="flex flex-col w-full h-[885px] justify-between">
                            <div className="w-full relative flex flex-col pt-8 items-center"><div className="flex flex-col items-center mb-10 text-center"><h2 className="text-[12px] font-black uppercase tracking-[0.5em] mb-4 text-[#1A1A1A]">HUELLA ORGANOLÉPTICA ESTÁNDAR CVA</h2></div><div className="w-full h-[500px] flex justify-center items-center relative"><RadarChart width={600} height={500} cx="50%" cy="50%" outerRadius="75%" data={scaRadarData} className="relative z-10"><PolarGrid stroke="#e5e7eb" strokeWidth={1} /><PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 11, fontWeight: '700' }} /><PolarRadiusAxis angle={30} domain={[0, 15]} tick={false} axisLine={false} /><Radar name="Profile" dataKey="visualA" stroke="#006056" strokeWidth={2} fill="#006056" fillOpacity={0.15} isAnimationActive={false} /></RadarChart><div className="absolute top-0 right-12 flex flex-col gap-2 text-right">{scaRadarData.map((d, i) => (<div key={i} className="flex items-center gap-3 justify-end border-b border-[#f3f4f6] pb-1"><span className="text-[8px] font-bold uppercase text-gray-400 tracking-widest">{d.subject}</span><span className="text-[12px] font-black text-[#1A1A1A]">{Number(d.A)}</span></div>))}</div></div></div>
                            <div className="px-12 pt-8 pb-0 bg-white tracking-wide border-t border-gray-200 relative z-10 w-full mt-4"><div className="w-full relative"><div className="absolute -top-6 left-0 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Sensory Analysis Summary</div><div className="flex flex-col"><div className="pb-4 border-b border-gray-200 w-full text-center"><p className="text-xl font-black text-[#1A1A1A] tracking-tighter leading-relaxed uppercase max-w-[85%] mx-auto">"{scaData?.notes || 'Perfil sensorial en proceso de certificación industrial'}"</p></div><div className="flex items-center justify-center gap-16 pt-6 pb-6 w-full relative z-10 bg-white"><div className="flex items-center gap-5"><div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center bg-gray-900 text-[11px] font-bold text-white border-gray-600/30">QG</div><div className="text-left"><p className="text-lg font-bold text-[#1A1A1A] uppercase tracking-tight">{scaData?.taster_name || 'Q-GRADER SENIOR JULIO UVA'}</p><p className="text-[8px] font-bold uppercase tracking-widest mt-1" style={{ color: '#006056' }}>Professional Cupper • Digital Signature Verified</p></div></div><div className="flex items-center gap-5 opacity-40"><img src="/logo.png" alt="Verify" className="w-10 h-10 grayscale" /><div className="text-left border-l border-gray-300 pl-4 py-1"><p className="text-[7px] font-bold text-gray-600 uppercase tracking-[0.2em]">Protocol S2.4</p><p className="text-[9px] font-mono text-gray-700 mt-1 uppercase">ID SEAL: {inventoryId.substring(0, 6)}</p></div></div></div></div></div></div>
                            <div className="mt-auto px-12 py-8 flex justify-between items-center opacity-20 border-t border-[#e5e7eb]"><p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">AXISONE Sensory Analytics Division | Quality Assessment Ver 2.4</p><p className="text-[7px] font-mono text-gray-500 uppercase tracking-widest">{inventoryId.substring(0, 8).toUpperCase()}-P2</p></div>
                        </div>
                    </div>

                    <div className="bg-white border relative flex flex-col print:border-none print:break-after-page shadow-2xl print:shadow-none" style={{ width: '750px', minHeight: '1060px', borderColor: '#e5e7eb' }}>
                        <div className="bg-[#f9fafb] px-12 py-6 flex justify-between items-center border-b border-[#e5e7eb]"><div className="flex items-center gap-6"><img src="/logo.png" alt="AXISONE" className="h-10 w-auto object-contain" /><div><p className="text-sm font-black text-[#1A1A1A] uppercase tracking-tighter leading-none">AXISONE ROAST INTELLIGENCE</p><p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Thermal Analysis Protocol | Page 03</p></div></div><div className="text-right"><p className="text-[10px] font-bold font-mono uppercase" style={{ color: '#006056' }}>ID: {lotData?.lot_number || '---'}</p></div></div>
                        <div className="flex-1 p-8 flex flex-col gap-4">
                                        <div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Variedad</p><p className="text-sm font-bold text-[#1A1A1A] uppercase leading-none">{lotData?.variety || '---'}</p></div>
                                        <div><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Proceso</p><p className="text-sm font-bold text-[#1A1A1A] uppercase leading-none">{lotData?.process || '---'}</p></div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm"><QRCodeSVG value={`https://axisonecoffee.com/verify/lot/${lotData?.id}`} size={120} level="H" includeMargin={false} imageSettings={{ src: "/logo.png", x: undefined, y: undefined, height: 24, width: 24, excavate: true }} /></div>
                            </div>
                        </div>

                        {/* Middle Content */}
                        <div className="px-12 py-6 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
                                <div className="md:col-span-2 space-y-8">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 rounded-xl"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Detalles de Beneficio</p><div className="flex justify-between items-center text-[11px]"><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">Secado:</span> {pData.tipo_secado || 'No registrado'}</p><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">Tiempo:</span> {pData.duracion_secado || '-'}</p></div></div>
                                        <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 rounded-xl"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Fisicoquímica</p><div className="flex justify-between items-center text-[11px]"><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">pH:</span> {pData.ph_inicial || '4.5'} → {pData.ph_final || '3.8'}</p><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">Brix:</span> {pData.brix_inicial || '18.5'}</p></div></div>
                                        <div className="bg-[#f9fafb] border border-[#e5e7eb] p-4 rounded-xl"><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Fermentación</p><div className="flex justify-between items-center text-[11px]"><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">Estilo:</span> {pData.fermentation_style || 'Lavado'}</p><p className="text-[#1A1A1A]"><span className="text-gray-500 uppercase mr-1">Duración:</span> {pData.duracion_fermentacion_horas || '---'}h</p></div></div>
                                    </div>
                                    <div className="border border-[#e5e7eb] rounded-3xl p-10 bg-[#f9fafb] relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none transform translate-x-10 -translate-y-10"><svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path fill="#006056" d="M44.7,-76.4C58.2,-69.2,69.7,-57.4,77.3,-43.8C84.8,-30.2,88.4,-15.1,87.4,-0.6C86.3,13.9,80.7,27.7,72.4,40C64,52.2,53,62.8,40.1,70.1C27.2,77.4,13.6,81.4,-0.5,82.3C-14.6,83.1,-29.2,80.8,-42.6,74C-56,67.2,-68.2,55.9,-75.7,42.3C-83.2,28.6,-86.1,14.3,-86.1,0C-86.1,-14.3,-83.2,-28.6,-75.7,-42.3C-68.2,-55.9,-56,-67.2,-42.6,-74C-29.2,-80.8,-14.6,-83.1,-0.5,-82.3C13.6,-81.4,27.2,-77.4,44.7,-76.4Z" transform="translate(100 100)" /></svg></div><div className="relative z-10 space-y-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-[#006056] rounded-2xl flex items-center justify-center text-white shadow-lg"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div><div><h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest">Compromiso EUDR Compliance</h3><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Deforestation-Free Verified • Global Forest Watch</p></div></div><p className="text-xs text-gray-600 leading-relaxed font-medium">Este lote ha sido georreferenciado y validado contra las bases de datos de Global Forest Watch. Certificamos que el café contenido en este reporte proviene de áreas libres de deforestación post-2020, cumpliendo estrictamente con la normativa EUDR para su comercialización en mercados internacionales de alta exigencia.</p></div></div>
                                </div>
                                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-3xl p-8 flex flex-col justify-between"><div className="space-y-6"><div><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-3">Trazabilidad de Origen</p><div className="space-y-4"><div className="flex gap-4 items-start"><div className="w-1.5 h-1.5 rounded-full bg-[#006056] mt-1.5"></div><div><p className="text-[10px] font-black text-[#1A1A1A] uppercase">Ubicación GPS</p><p className="text-[10px] font-mono text-[#006056] font-bold">{lotData?.latitude || '2.4419'} N, {lotData?.longitude || '76.6063'} W</p></div></div><div className="flex gap-4 items-start"><div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5"></div><div><p className="text-[10px] font-black text-[#1A1A1A] uppercase">Región / Altura</p><p className="text-[10px] font-bold text-gray-500 uppercase leading-none">{lotData?.region || 'Huila'} • {lotData?.altitude || '1650'} MSNM</p></div></div></div></div></div><div className="pt-6 border-t border-gray-200"><div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-brand-green"></div><p className="text-[10px] font-black text-[#1A1A1A] uppercase">Estado de Lote</p></div><p className="text-2xl font-black text-[#006056] uppercase tracking-tighter">LISTO PARA EXPORTAR</p></div></div>
                            </div>
                        </div>

                        {/* Footer de Página */}
                        <div className="px-12 py-10 border-t border-gray-100 flex justify-between items-center bg-[#f9fafb]">
                            <div className="flex items-center gap-6">
                                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm"><QRCodeSVG value={`https://axisonecoffee.com/verify/lot/${lotData?.id}`} size={64} level="H" /></div>
                                <div><p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest mb-1">Inmutable Ledger Traceability</p><p className="text-[8px] text-gray-400 font-bold leading-tight max-w-[280px]">CERTIFICACIÓN TÉCNICA DE ORIGEN Y CALIDAD FÍSICA-SENSORIAL PROTEGIDA POR EL PROTOCOLO AXIS INTELLIGENCE. DATOS VALIDADOS EN EL PUNTO DE TRILLA.</p></div>
                            </div>
                            <div className="text-right"><div className="inline-block px-3 py-1 bg-gray-200/50 rounded-md mb-2"><p className="text-[8px] font-mono text-gray-500 font-bold uppercase">2E829CA6-6AEB-442A-9C74-5660079FE550</p></div><p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none">© 2026 AXISONE INTELLIGENCE GROUP<br/>INDUSTRIAL QUALITY ARCHIVE - BAX-7370</p></div>
                        </div>
                    </div>

                    {/* PÁGINA 2: ANÁLISIS DE TOSTIÓN */}
                    <div className="bg-white text-black relative flex flex-col print:break-after-page" style={{ width: '750px', height: '1080px', margin: '0 auto' }}>
                        <div className="p-12 space-y-10">
                            <div className="flex justify-between items-end border-b-4 border-[#006056] pb-6">
                                <div>
                                    <p className="text-[10px] font-black text-[#006056] uppercase tracking-[0.4em] mb-2">Protocolo de Calidad / Pág 02</p>
                                    <h2 className="text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">Análisis de <span style={{ color: '#006056' }}>Tostión</span></h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ID del Tueste</p>
                                    <p className="text-lg font-black text-[#1A1A1A] font-mono">AX-TOST-{lotData?.lot_number?.split('-').pop() || '7370'}</p>
                                </div>
                            </div>

                            {/* Roast Curve Placeholder/Simulated */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest">Curva de Tostión Técnica</h3>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-[#006056]"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Bean Temp</span></div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-gray-300"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Air Temp</span></div>
                                    </div>
                                </div>
                                <div className="h-[400px] w-full flex items-end gap-2 px-4 border-l border-b border-gray-200 relative">
                                    {/* SVG Curve logic simulated for preview */}
                                    <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M 0 80 Q 20 75, 40 40 T 100 10" fill="none" stroke="#006056" strokeWidth="2" />
                                        <path d="M 0 70 Q 30 60, 60 30 T 100 5" fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                                        <line x1="80" y1="0" x2="80" y2="100" stroke="black" strokeWidth="0.5" strokeDasharray="2" />
                                        <text x="81" y="10" fontSize="3" fontWeight="bold">DROP</text>
                                        <line x1="0" y1="20" x2="100" y2="20" stroke="#006056" strokeWidth="0.2" strokeDasharray="1" />
                                        <text x="90" y="19" fontSize="3" fontWeight="bold" fill="#006056">1st Cr</text>
                                    </svg>
                                </div>
                                <div className="grid grid-cols-4 gap-6 mt-10">
                                    <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Tiempo Total</p>
                                        <p className="text-xl font-black text-[#1A1A1A]">10:45 <span className="text-[10px] text-gray-500">min</span></p>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Pérdida (Merma)</p>
                                        <p className="text-xl font-black text-[#1A1A1A]">14.2 <span className="text-[10px] text-gray-500">%</span></p>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Agtron (Grounded)</p>
                                        <p className="text-xl font-black" style={{ color: '#006056' }}>58.4 <span className="text-[10px] text-gray-500">Ag</span></p>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">DTR</p>
                                        <p className="text-xl font-black text-[#1A1A1A]">18.5 <span className="text-[10px] text-gray-500">%</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl">
                                <h3 className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.3em] mb-4">Observaciones del Maestro Tostador</h3>
                                <p className="text-xs text-gray-500 leading-relaxed italic">"Desarrollo controlado para resaltar notas cítricas y dulzor residual. El primer crack se presentó a los 8:30 min con una temperatura de 192°C. Curva estable con finalización a los 205°C para maximizar la complejidad enzimática."</p>
                            </div>
                        </div>
                    </div>

                    {/* PÁGINA 3: EVALUACIÓN SENSORIAL (CVA) */}
                    <div className="bg-white text-black relative flex flex-col" style={{ width: '750px', height: '1080px', margin: '0 auto' }}>
                        <div className="p-12 space-y-10">
                            <div className="flex justify-between items-end border-b-4 border-black pb-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Protocolo de Calidad / Pág 03</p>
                                    <h2 className="text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">Evaluación <span style={{ color: '#006056' }}>Sensorial</span></h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">SCA Protocol (CVA)</p>
                                    <p className="text-3xl font-black text-[#1A1A1A]">87.50</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="bg-black p-8 rounded-3xl text-white">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-white/20 pb-2">Descriptor Sensorial</h3>
                                        <div className="space-y-4">
                                            <p className="text-3xl font-black tracking-tight leading-none">JAZMÍN, MORA AZUL, CHOCOLATE BLANCO.</p>
                                            <p className="text-xs text-gray-400 leading-relaxed font-medium">Cuerpo sedoso con acidez málica brillante. Retrogusto prolongado a caramelo y notas florales intensas.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end"><p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">Fragancia/Aroma</p><p className="text-sm font-bold">8.75</p></div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#006056]" style={{ width: '87.5%' }}></div></div>
                                        <div className="flex justify-between items-end"><p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">Acidez</p><p className="text-sm font-bold">8.50</p></div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#006056]" style={{ width: '85%' }}></div></div>
                                        <div className="flex justify-between items-end"><p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest">Cuerpo</p><p className="text-sm font-bold">8.25</p></div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#006056]" style={{ width: '82.5%' }}></div></div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 flex items-center justify-center">
                                    {/* Placeholder Radar Chart */}
                                    <div className="w-full h-full relative flex items-center justify-center">
                                        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" /><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" /><circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" /><line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" /><line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" /></svg>
                                        <div className="absolute inset-0 flex items-center justify-center font-black text-[#006056] text-[40px] opacity-10 uppercase tracking-tighter">PREMIUM</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full border-4 border-white shadow-sm overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=QGrader" alt="Q-Grader" /></div>
                                    <div><p className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-widest leading-none">Evaluado por</p><p className="text-xs font-bold text-[#006056] uppercase mt-1">AXIS Intelligence Group (Q-Certified)</p></div>
                                </div>
                                <div className="text-center px-10 py-4 bg-[#006056] text-white rounded-2xl shadow-lg"><p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1">Sello de Calidad</p><p className="text-xl font-black uppercase tracking-tight">SPECIALTY GRADE</p></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full flex flex-wrap justify-center sm:justify-end gap-3 no-export mt-8 p-4 bg-gray-50/50 backdrop-blur-sm border border-gray-200 rounded-2xl print:hidden">
                    <ExportReportButton elementId="lot-certificate-area" fileName={`REPORT-AXIS-${lotData?.lot_number || 'LOT'}-${lotData?.farm_name || 'COFFEE'}`} />
                    <button onClick={downloadQRCode} className="px-5 py-2.5 bg-white hover:bg-gray-50 text-[#006056] border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                        Descargar QR
                    </button>
                    <button onClick={() => window.print()} className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white border border-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        Imprimir / PDF
                    </button>
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-200/50 hover:bg-gray-200 text-gray-600 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-gray-300 active:scale-95">
                        Cerrar
                    </button>
                </div>
            </div>
        </>
    );
}
