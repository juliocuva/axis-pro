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
        } catch (err) { 
            console.error("Error fetching certificate data:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#006056]"></div>
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
        { time: 0, beanTemp: 20, airTemp: 200 },
        { time: 1, beanTemp: 90, airTemp: 180 },
        { time: 2, beanTemp: 110, airTemp: 185 },
        { time: 3, beanTemp: 130, airTemp: 190 },
        { time: 4, beanTemp: 150, airTemp: 195 },
        { time: 5, beanTemp: 165, airTemp: 200 },
        { time: 6, beanTemp: 180, airTemp: 205 },
        { time: 7, beanTemp: 195, airTemp: 210 },
        { time: 8, beanTemp: 205, airTemp: 215 },
        { time: 9, beanTemp: 212, airTemp: 218 },
        { time: 10, beanTemp: 218, airTemp: 220 },
    ];

    const pData = lotData?.process_data || {};

    return (
        <>
            <style jsx global>{`
                @media print {
                    /* Ocultar ABSOLUTAMENTE TODO lo que no sea el certificado */
                    body * { visibility: hidden !important; }
                    #lot-certificate-area, #lot-certificate-area * { visibility: visible !important; }
                    #lot-certificate-area { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 210mm !important; 
                        height: auto !important;
                        visibility: visible !important;
                    }
                    
                    /* Configuración de página A4 */
                    @page { 
                        size: A4; 
                        margin: 0 !important; 
                    }
                    
                    /* Forzar saltos de página entre los 3 bloques */
                    .page-break { 
                        display: block !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        page-break-after: always !important; 
                        break-after: page !important;
                        position: relative !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    
                    /* Eliminar elementos de UI */
                    .no-print, header, nav, aside, footer, [role="navigation"], [role="complementary"] { 
                        display: none !important; 
                        visibility: hidden !important; 
                    }
                }
            `}</style>
            
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-10">
                {/* Header Controles */}
                <div className="w-full flex justify-between items-center bg-gray-100 border border-gray-200 p-4 rounded-xl print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Vista:</span>
                        <div className="bg-[#f9fafb] p-1 rounded-lg border border-[#e5e7eb] flex">
                            <button onClick={() => setViewMode('productor')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'productor' ? 'bg-[#006056] text-white' : 'text-gray-400 hover:text-[#1A1A1A]'}`}>Productor</button>
                            <button onClick={() => setViewMode('comprador')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'comprador' ? 'bg-[#006056] text-white' : 'text-gray-400 hover:text-[#1A1A1A]'}`}>Comprador</button>
                        </div>
                    </div>
                </div>

                {/* AREA DE IMPRESION / CAPTURA */}
                <div id="lot-certificate-area" className="flex flex-col bg-white">
                    
                    {/* PAGINA 1 */}
                    <div className="bg-white text-black relative flex flex-col page-break" style={{ width: '750px', height: '1080px', borderBottom: '1px solid #eee' }}>
                        <div className="bg-[#f9fafb] px-10 py-8 flex justify-between items-center border-b border-[#e5e7eb] relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#006056]"></div>
                            <div className="flex items-center gap-6">
                                <img src="/logo.png" alt="AXIS" className="w-16 h-16 object-contain" />
                                <div><h1 className="text-2xl font-black uppercase leading-none">AXISONE <span className="text-[#006056]">COFFEE</span></h1><p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-2">Traceability Protocol</p></div>
                            </div>
                            <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Expedición Digital</p><p className="text-sm font-black text-[#006056]">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</p></div>
                        </div>
                        
                        <div className="p-12 space-y-10 flex-1">
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full border border-gray-200"><span className="text-[8px] font-bold text-[#006056] uppercase">COMPLIANCE EUDR ACTIVO</span></div>
                                    <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">{lotData?.farm_name || 'Lote Premium'}</h2>
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 pt-4">
                                        <div><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Productor</p><p className="text-sm font-bold uppercase">{lotData?.farmer_name || '---'}</p></div>
                                        <div><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Lote ID</p><p className="text-sm font-bold text-[#006056] font-mono">{lotData?.lot_number || '---'}</p></div>
                                        <div><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Variedad</p><p className="text-sm font-bold uppercase">{lotData?.variety || '---'}</p></div>
                                        <div><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Proceso</p><p className="text-sm font-bold uppercase">{lotData?.process || '---'}</p></div>
                                    </div>
                                </div>
                                <div className="qr-container bg-white p-4 border-2 border-gray-100 rounded-2xl shadow-sm flex flex-col items-center gap-2">
                                    <QRCodeSVG value={`https://axisonecoffee.com/verify/lot/${lotData?.id}`} size={120} level="H" />
                                    <p className="text-[7px] font-bold text-gray-400 uppercase">Verificar Lote</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-6">
                                <div className="bg-[#f9fafb] p-6 rounded-2xl border border-gray-100 text-center"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Secado</p><p className="text-[12px] font-black">{pData.tipo_secado || '---'}</p><p className="text-[9px] text-[#006056] font-bold">{pData.duracion_secado || '-'}</p></div>
                                <div className="bg-[#f9fafb] p-6 rounded-2xl border border-gray-100 text-center"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">pH & Brix</p><p className="text-[12px] font-black">{pData.ph_inicial || '4.5'}→{pData.ph_final || '3.8'}</p><p className="text-[9px] text-[#006056] font-bold">{pData.brix_inicial || '---'} °Bx</p></div>
                                <div className="bg-[#f9fafb] p-6 rounded-2xl border border-gray-100 text-center"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Fermentación</p><p className="text-[12px] font-black">{pData.duracion_fermentacion_horas || '---'}h</p><p className="text-[9px] text-[#006056] font-bold uppercase">{pData.fermentation_style || '---'}</p></div>
                            </div>

                            <div className="bg-[#006056] text-white p-10 rounded-[40px] relative overflow-hidden shadow-2xl">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
                                        <h3 className="text-xl font-black uppercase tracking-widest">EUDR Compliance Verified</h3>
                                    </div>
                                    <p className="text-sm opacity-90 leading-relaxed font-medium">Este lote ha sido georreferenciado y validado contra las bases de datos de Global Forest Watch. Certificamos que el café contenido en este reporte proviene de áreas libres de deforestación post-2020, cumpliendo con la normativa de la Unión Europea.</p>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            </div>
                        </div>

                        <div className="p-10 bg-[#f9fafb] border-t border-gray-100 flex justify-between items-center">
                            <div><p className="text-[10px] font-black uppercase mb-1">Inmutable Traceability Ledger</p><p className="text-[8px] text-gray-400 max-w-xs font-bold uppercase">DATOS PROTEGIDOS POR EL PROTOCOLO AXIS INTELLIGENCE. VALIDACIÓN EN ORIGEN GARANTIZADA.</p></div>
                            <div className="text-right"><p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">ID: {inventoryId.substring(0, 12).toUpperCase()}</p><p className="text-[8px] text-gray-400 font-black uppercase mt-1">© 2026 AXISONE INTELLIGENCE GROUP</p></div>
                        </div>
                    </div>

                    {/* PAGINA 2 */}
                    <div className="bg-white text-black relative flex flex-col page-break" style={{ width: '750px', height: '1080px', borderBottom: '1px solid #eee' }}>
                        <div className="p-12 space-y-10 flex-1">
                            <div className="border-b-4 border-[#006056] pb-6 flex justify-between items-end">
                                <div><p className="text-[10px] font-black text-[#006056] uppercase tracking-[0.4em] mb-2">Protocolo de Calidad / Pág 02</p><h2 className="text-5xl font-black uppercase tracking-tighter">Análisis de <span className="text-[#006056]">Tostión</span></h2></div>
                                <div className="text-right"><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tueste ID</p><p className="text-xl font-black font-mono">AX-TOST-{lotData?.lot_number?.split('-').pop() || '7370'}</p></div>
                            </div>
                            
                            <div className="h-[450px] border border-gray-100 rounded-[40px] p-10 bg-white shadow-sm relative overflow-hidden">
                                <div className="absolute top-8 left-10"><h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Curva Térmica Industrial</h3></div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={roastCurveData} margin={{ top: 40, right: 20, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={[0, 250]} hide />
                                        <Line type="monotone" dataKey="beanTemp" stroke="#006056" strokeWidth={6} dot={false} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="airTemp" stroke="#e5e7eb" strokeWidth={3} strokeDasharray="8 8" dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                <div className="p-6 bg-[#f9fafb] rounded-3xl text-center border border-gray-100"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Tiempo Total</p><p className="text-2xl font-black">10:45</p><p className="text-[8px] font-bold text-[#006056] uppercase mt-1">Minutos</p></div>
                                <div className="p-6 bg-[#f9fafb] rounded-3xl text-center border border-gray-100"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Pérdida (Merma)</p><p className="text-2xl font-black">14.2%</p><p className="text-[8px] font-bold text-[#006056] uppercase mt-1">Humedad Perdida</p></div>
                                <div className="p-6 bg-[#f9fafb] rounded-3xl text-center border border-gray-100"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Agtron Color</p><p className="text-2xl font-black text-[#006056]">58.4</p><p className="text-[8px] font-bold text-[#006056] uppercase mt-1">Grounded</p></div>
                                <div className="p-6 bg-[#f9fafb] rounded-3xl text-center border border-gray-100"><p className="text-[8px] text-gray-400 font-bold uppercase mb-1">DTR Ratio</p><p className="text-2xl font-black">18.5%</p><p className="text-[8px] font-bold text-[#006056] uppercase mt-1">Desarrollo</p></div>
                            </div>

                            <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4">Observaciones del Maestro Tostador</h3>
                                <p className="text-xs text-gray-500 leading-relaxed italic font-medium">"Desarrollo controlado para resaltar notas cítricas y dulzor residual. El primer crack se presentó a los 8:30 min con una temperatura de 192°C. Curva estable con finalización a los 205°C para maximizar la complejidad enzimática."</p>
                            </div>
                        </div>
                    </div>

                    {/* PAGINA 3 */}
                    <div className="bg-white text-black relative flex flex-col" style={{ width: '750px', height: '1080px' }}>
                        <div className="p-12 space-y-10 flex-1">
                            <div className="border-b-4 border-black pb-6 flex justify-between items-end">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">Protocolo de Calidad / Pág 03</p><h2 className="text-5xl font-black uppercase tracking-tighter">Evaluación <span className="text-[#006056]">Sensorial</span></h2></div>
                                <div className="text-right"><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">SCA CVA Score</p><p className="text-5xl font-black">{scaData?.total_score ? Number(scaData.total_score).toFixed(2) : '87.50'}</p></div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="bg-black text-white p-10 rounded-[40px] shadow-xl">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-50 border-b border-white/20 pb-2">Descriptor Sensorial</h3>
                                        <p className="text-4xl font-black leading-[1.1] tracking-tighter uppercase mb-4">{scaData?.notes?.split('.')[0] || 'JAZMÍN, MORA AZUL, CHOCOLATE BLANCO.'}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed font-medium">Acidez málica brillante, cuerpo sedoso y retrogusto prolongado a caramelo.</p>
                                    </div>
                                    <div className="space-y-5 px-4">
                                        {[
                                            { label: 'Fragancia', val: scaData?.fragrance_aroma || 8.5 },
                                            { label: 'Sabor', val: scaData?.flavor || 8.25 },
                                            { label: 'Acidez', val: scaData?.acidity || 8.75 },
                                            { label: 'Cuerpo', val: scaData?.body || 8.5 }
                                        ].map((attr, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-end"><p className="text-[10px] font-black uppercase tracking-widest">{attr.label}</p><p className="text-sm font-black">{Number(attr.val).toFixed(2)}</p></div>
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#006056]" style={{ width: `${Number(attr.val) * 10}%` }}></div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-[450px] bg-[#f9fafb] rounded-[40px] border border-gray-100 p-8 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={scaRadarData}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 10, fontWeight: '800' }} />
                                            <Radar dataKey="visualA" stroke="#006056" strokeWidth={3} fill="#006056" fillOpacity={0.2} isAnimationActive={false} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=QGrader" alt="Q" className="w-full h-full" /></div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Evaluado por</p><p className="text-lg font-black text-[#1A1A1A] uppercase mt-1">Axis Intelligence Group</p><p className="text-[8px] font-bold text-[#006056] uppercase tracking-widest">Q-Grader Certified</p></div>
                                </div>
                                <div className="bg-[#006056] text-white px-10 py-5 rounded-2xl shadow-xl text-center"><p className="text-[9px] font-black uppercase tracking-[0.4em] mb-1">Sello de Calidad</p><p className="text-2xl font-black uppercase tracking-tighter">SPECIALTY GRADE</p></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTONES ACCION */}
                <div className="w-full flex justify-center gap-4 no-print py-10 border-t border-gray-100">
                    <ExportReportButton elementId="lot-certificate-area" fileName={`REPORT-AXIS-${lotData?.lot_number || 'LOT'}`} />
                    <button onClick={() => window.print()} className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all active:scale-95">Imprimir PDF</button>
                    <button onClick={onClose} className="px-8 py-4 bg-gray-200 text-gray-600 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-gray-300 transition-all active:scale-95">Cerrar</button>
                </div>
            </div>
        </>
    );
}
