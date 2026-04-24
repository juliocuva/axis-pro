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
            let query = supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('id', inventoryId);
            
            if (user?.companyId) {
                query = query.eq('company_id', user.companyId);
            }
            
            const { data: lot } = await query.single();

            let physQuery = supabase
                .from('physical_analysis')
                .select('*')
                .eq('inventory_id', inventoryId);
                
            if (user?.companyId) {
                physQuery = physQuery.eq('company_id', user.companyId);
            }
            
            const { data: physical } = await physQuery
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            let scaQuery = supabase
                .from('sca_cupping')
                .select('*')
                .eq('inventory_id', inventoryId);
                
            if (user?.companyId) {
                scaQuery = scaQuery.eq('company_id', user.companyId);
            }

            const { data: sca } = await scaQuery
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            const { data: expInfo } = await supabase
                .from('green_exports')
                .select('*')
                .eq('lot_id', inventoryId)
                .maybeSingle();

            setLotData(lot);
            setPhysicalData(physical);
            setExportData(expInfo);

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
    
    // Mockup de Datos de Tostión
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
                    @page { 
                        size: A4; 
                        margin: 15mm !important; 
                    }
                    body { 
                        margin: 0 !important; 
                        background: white !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    .no-print, .no-export { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
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

            {/* Contenedor Maestro para Exportación (Hoja A4 con márgenes de seguridad) */}
            <div id="lot-certificate-area" className="w-[750px] mx-auto space-y-8 print:space-y-0 print:m-0">

                {/* HOJA 1: IDENTIDAD, PRODUCCIÓN Y GRANULOMETRÍA */}
                <div className="bg-white border text-black relative flex flex-col print:border-none print:break-after-page"
                    style={{ width: '750px', minHeight: '1060px', borderColor: '#e5e7eb' }}>

                    {/* Header Minimalista */}
                    <div className="bg-gray-50 px-10 py-6 flex justify-between items-center border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <img src="/tatama.png" alt="TATAMA" className="h-10 w-auto object-contain" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-black italic">ASOCIACIÓN TATAMA SANTUARIO</p>
                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Origen de Alta Montaña | Page 01</p>
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
                                    <span className="text-[8px] font-bold text-brand-green uppercase tracking-widest ">COMPLIANCE EUDR ACTIVO • PROTOCOLO BAX-7370</span>
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
                                    {lotData && (
                                        <div className="lg:col-span-2">
                                            <p className="text-[8px] text-[#ea580c] font-bold uppercase tracking-widest mb-1">Verificación Satelital EUDR (WGS84)</p>
                                            <p className="text-sm font-bold text-black font-mono leading-none">
                                                {lotData.latitude && lotData.longitude ?
                                                    `${parseFloat(lotData.latitude).toFixed(6)} N, ${parseFloat(lotData.longitude).toFixed(6)} W` :
                                                    '2.220140 N, 75.890120 W'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Score Destacado Sutil */}
                            <div className="bg-gray-50 border border-gray-200 p-1.5 rounded-xl shrink-0 self-center">
                                <div className="bg-white px-8 py-5 rounded-lg flex flex-col items-center border border-gray-200">
                                    <p className="text-[9px] font-bold text-brand-green uppercase tracking-[0.3em] mb-1">
                                        {scaData?.is_cva_version ? 'Coffee Value Assessment (CVA v2.0)' : 'Puntaje basado en estándares SCA'}
                                    </p>
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

                        {/* Beneficio Extended */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Detalles de Beneficio</p>
                                <div className="flex justify-between items-center text-[11px]">
                                    <p className="text-black"><span className="text-gray-500 uppercase mr-1">Secado:</span> {pData.tipo_secado || 'No registrado'}</p>
                                    <p className="text-black"><span className="text-gray-500 uppercase mr-1">Tiempo:</span> {pData.duracion_secado || '-'}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Variedad Confirmada</p>
                                <p className="text-sm font-bold text-black uppercase">{lotData?.variety || 'Caturra'}</p>
                            </div>
                        </div>

                        {/* Selective Visibility: Parámetros Técnicos (LABORATORIO) */}
                        {(pData.ph_inicial || pData.ph_final || pData.brix_inicial) && (
                            <div className="space-y-3">
                                <h4 className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-4 h-[1px] bg-blue-500"></div>
                                    Análisis de Laboratorio
                                </h4>
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
                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Fermentación</p>
                                            <p className="text-xs text-black uppercase">{pData.duracion_fermentacion_horas || '-'} HRS</p>
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
                <div className="bg-white border text-black relative flex flex-col print:border-none print:break-after-page"
                    style={{ width: '750px', minHeight: '1060px', borderColor: '#e5e7eb' }}>

                    {/* Header P2 */}
                    <div className="bg-gray-50 px-12 py-6 flex justify-between items-center border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <img src="/tatama.png" alt="TATAMA" className="h-10 w-auto object-contain" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-black italic">ASOCIACIÓN TATAMA SANTUARIO</p>
                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Origen de Alta Montaña | Page 02</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-brand-green font-mono uppercase ">PROTOCOLO BAX-7370 • {lotData?.lot_number || '---'}</p>
                        </div>
                    </div>

                    {/* Perfil Sensorial basado en estándares SCA (Elegante y Visual) */}
                    <div className="flex flex-col w-full h-[885px] justify-between">

                        {/* Radar Chart (Mucho más elegante) */}
                        <div className="w-full relative flex flex-col pt-12 items-center">
                            {/* Title (Normal Flow) */}
                            <div className="flex flex-col items-center mb-6">
                                <h2 className="text-sm font-bold text-brand-green uppercase tracking-[0.6em] mb-4">
                                    {scaData?.is_cva_version ? 'SCA Coffee Value Assessment (CVA)' : 'Evaluación Sensorial basada en estándares de la SCA'}
                                </h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
                                    {scaData?.is_cva_version ? 'Protocolo Descriptivo y Afectivo 2025-2026' : 'Análisis de Perfil Organoléptico de Especialidad'}
                                </p>
                            </div>

                            {/* Chart & Data (Static Container) */}
                            <div className="w-full h-[450px] relative flex justify-center items-center">

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
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gray-200"></div>

                            <div className="flex items-center gap-10 max-w-2xl">
                                <div className="bg-white p-2 rounded-xl shrink-0 border border-gray-200 flex items-center justify-center">
                                    <QRCodeSVG
                                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://axis-pro.coffee'}/verify/lot/${inventoryId}`}
                                        size={96}
                                        style={{ width: "96px", height: "96px" }}
                                        level="H" 
                                        marginSize={0}
                                        includeMargin={false}
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
                                <p className="text-[7px] text-gray-700 uppercase font-bold tracking-widest leading-none">© 2026 AXIS INTELLIGENCE GROUP<br /><span className="mt-1 block opacity-50">Industrial Quality Archive - BAX-7370</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INDICADOR VISUAL DE CORTE (No visible al imprimir) */}
                <div className="w-full h-8 print:hidden"></div>

                {/* HOJA 3: COMPLIANCE EUDR Y LOGÍSTICA DE EMBARQUE */}
                <div className="bg-white border text-black relative flex flex-col print:border-none print:break-after-page"
                    style={{ width: '750px', minHeight: '1060px', borderColor: '#e5e7eb' }}>

                    {/* Header P3 */}
                    <div className="bg-gray-50 px-12 py-6 flex justify-between items-center border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <img src="/tatama.png" alt="TATAMA" className="h-10 w-auto object-contain" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-black italic">ASOCIACIÓN TATAMA SANTUARIO</p>
                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Export Compliance Protocol | Page 03</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-brand-green font-mono uppercase ">PROTOCOLO BAX-7370 • {lotData?.lot_number || '---'}</p>
                        </div>
                    </div>

                    <div className="flex-1 p-12 flex flex-col gap-12">
                        {/* EUDR */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-[0.6em] mb-4">Validación Satelital UE (EUDR)</h2>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-6">Aprobación Fitosanitaria y Deforestación Cero</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="h-64 bg-gray-900 rounded-3xl border border-gray-800 p-8 relative overflow-hidden flex items-center justify-center flex-col">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-orange-500 mb-4 opacity-80"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest text-center mt-2">Datos Topográficos / Polígonos<br />SICA WGS84 Verificados bajo BAX-7370.</p>
                                    <div className="mt-6 px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded text-[9px] font-bold tracking-widest uppercase">
                                        Polígono Satelital Confirmado
                                    </div>
                                    {pData?.eudr_gps_text && (
                                        <div className="mt-4 px-4 text-[8px] font-mono text-gray-500 w-full truncate text-center" title={pData.eudr_gps_text}>
                                            RAW: {pData.eudr_gps_text}
                                        </div>
                                    )}
                                </div>

                                <div className="h-64 bg-gray-50 rounded-3xl border border-brand-green/20 p-8 relative flex flex-col justify-center text-left">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="2" className="mb-4"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    <h3 className="text-xs font-bold text-black uppercase tracking-widest mb-2">Declaración Due Diligence (DDS)</h3>
                                    <p className="text-[10px] text-gray-600 leading-relaxed uppercase">
                                        Terreno libre de deforestación posterior al 31 Dic 2020 (EUDR 2023/1115).
                                    </p>
                                    <div className={`mt-4 border px-4 py-2 rounded text-[9px] font-bold tracking-widest uppercase flex items-center gap-2 w-max ${pData?.eudr_deforestation_free ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${pData?.eudr_deforestation_free ? 'bg-brand-green animate-pulse' : 'bg-gray-400'}`}></div>
                                        {pData?.eudr_deforestation_free ? 'COMPLIANCE APROBADO' : 'PENDIENTE DE FIRMA'}
                                    </div>
                                    {pData?.eudr_evidence_file && (
                                        <p className="text-[8px] text-gray-400 mt-4 uppercase font-mono tracking-tight truncate" title={pData.eudr_evidence_file}>
                                            EVIDENCIA: {pData.eudr_evidence_file}
                                        </p>
                                    )}
                                    <p className="text-[8px] text-gray-400 mt-auto pt-3 uppercase font-mono tracking-tight border-t border-gray-200">
                                        ★ RETENCIÓN SECURE DB: 5 AÑOS ACTIVADA ★
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Logística */}
                        <div className="space-y-6 mt-6">
                            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-[0.6em] mb-4">Logística de Embarque y Pasaporte Aduanero</h2>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-6">Trazabilidad Comercial Inmutable</p>

                            <div className="p-8 bg-gray-50 border border-gray-200 rounded-3xl grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase mb-2 tracking-widest">Mercado Destino Autorizado</p>
                                    <p className="text-base font-black text-black uppercase">{exportData?.destination?.toLowerCase().includes('nl') || exportData?.destination?.toLowerCase().includes('rotterdam') || exportData?.destination?.toLowerCase().includes('eu') ? 'UNION EUROPEA (EU)' : 'MERCADO INTERNACIONAL'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase mb-2 tracking-widest">Puerto de Descarga Declarado</p>
                                    <p className="text-base font-black text-black uppercase">{exportData?.destination || 'ROTTERDAM, NL'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase mb-2 tracking-widest">Tipo de Transporte Base</p>
                                    <p className="text-base font-black text-black uppercase">{exportData?.transport_type || 'Marítimo'} - Lined Cont.</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase mb-2 tracking-widest">Firma Digital (Hash SHA-256)</p>
                                    <p className="text-[11px] font-mono font-bold text-brand-green uppercase bg-white border border-brand-green/20 px-3 py-2 rounded shadow-sm w-max mt-1 break-all">
                                        {exportData?.final_hash || '121B021A-62FF-4ED4-B4A5-90AF0CA3C5E1'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Hoja 3 (mini version) */}
                        <div className="mt-auto pt-8 flex justify-between items-center border-t border-gray-200">
                            <p className="text-[7px] text-gray-700 uppercase font-bold tracking-widest leading-none">© 2026 AXIS INTELLIGENCE GROUP</p>
                            <p className="text-[7px] font-mono text-gray-500 tracking-tighter">{inventoryId.toUpperCase()}-P3</p>
                        </div>
                    </div>
                </div>

                {/* INDICADOR VISUAL DE CORTE (No visible al imprimir) */}
                <div className="w-full h-8 print:hidden"></div>

                {/* HOJA 4: CURVA DE TOSTIÓN E INTELIGENCIA TÉRMICA */}
                <div className="bg-white border text-black relative flex flex-col print:border-none print:break-after-page shadow-2xl print:shadow-none"
                    style={{ width: '750px', minHeight: '1060px', borderColor: '#e5e7eb' }}>

                    {/* Header P4 */}
                    <div className="bg-gray-50 px-12 py-6 flex justify-between items-center border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <img src="/tatama.png" alt="TATAMA" className="h-10 w-auto object-contain" />
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-black italic">ASOCIACIÓN TATAMA SANTUARIO</p>
                                <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">Roast Intelligence Protocol | Page 04</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-orange-500 font-mono uppercase ">BATCH ID: {lotData?.lot_number || '---'}-R</p>
                        </div>
                    </div>

                    <div className="flex-1 p-12 flex flex-col gap-8">
                        <div className="space-y-4 text-center">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-[0.6em]">Perfil de Tostión Dinámico</h2>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">Control de Transferencia Térmica y Cinética de Reacción</p>
                        </div>

                        {/* Contenedor de la Curva */}
                        <div className="bg-gray-50 border border-gray-200 rounded-[32px] p-8 h-[500px] relative mt-4">
                            <div className="absolute top-6 right-10 flex gap-6 z-20">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-orange-500 rounded-full"></div>
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Bean Temp</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-blue-400 rounded-full"></div>
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Air Temp</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-brand-green/30 rounded-full"></div>
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">RoR</span>
                                </div>
                            </div>

                            <div className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={roastCurveData} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis 
                                            dataKey="time" 
                                            label={{ value: 'Tiempo (min)', position: 'insideBottomRight', offset: -10, fontSize: 10, fill: '#666' }}
                                            tick={{ fontSize: 10, fill: '#999' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            yId="temp"
                                            label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#666' }}
                                            tick={{ fontSize: 10, fill: '#999' }}
                                            domain={[0, 250]}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            yId="ror"
                                            orientation="right"
                                            domain={[0, 25]}
                                            hide
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '10px' }}
                                        />
                                        <ReferenceLine yId="temp" y={205} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: '1st Crack', fill: '#ef4444', fontSize: 9, fontWeight: 'bold' }} />
                                        <ReferenceLine yId="temp" x={10} stroke="#000" strokeWidth={2} label={{ position: 'top', value: 'DROP', fill: '#000', fontSize: 10, fontWeight: 'black' }} />
                                        
                                        <Line yId="temp" type="monotone" dataKey="beanTemp" stroke="#f97316" strokeWidth={4} dot={false} isAnimationActive={false} />
                                        <Line yId="temp" type="monotone" dataKey="airTemp" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Métricas de Tostión */}
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Tiempo Total</p>
                                <p className="text-xl font-black text-black tracking-tight">10:45 <span className="text-[10px] text-gray-500">m:s</span></p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Pérdida (Merma)</p>
                                <p className="text-xl font-black text-brand-red tracking-tight">14.2 <span className="text-[10px] text-gray-500">%</span></p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Agtron (Grounded)</p>
                                <p className="text-xl font-black text-orange-600 tracking-tight">58.4 <span className="text-[10px] text-gray-500">Ag</span></p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-center">
                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">DTR</p>
                                <p className="text-xl font-black text-black tracking-tight">18.5 <span className="text-[10px] text-gray-500">%</span></p>
                            </div>
                        </div>

                        {/* Notas del Tostador */}
                        <div className="bg-orange-50/50 border border-orange-200 p-8 rounded-3xl mt-4">
                            <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-4">Observaciones del Maestro Tostador</h4>
                            <p className="text-sm font-medium text-gray-800 leading-relaxed italic">
                                "Tueste medio diseñado para resaltar la acidez cítrica y prolongar el dulzor del caramelo. Se aplicó una reducción de gas al inicio del primer crack para evitar el flick y mantener un RoR descendente constante hasta el drop."
                            </p>
                        </div>
                    </div>

                    {/* Footer P4 */}
                    <div className="mt-auto pt-8 pb-10 px-12 flex justify-between items-center border-t border-gray-100 opacity-30">
                        <p className="text-[7px] text-gray-700 uppercase font-bold tracking-widest leading-none">Axis Intelligence Coffee Division | Roast Analytics</p>
                        <p className="text-[7px] font-mono text-gray-500 tracking-tighter">{inventoryId.toUpperCase()}-P4</p>
                    </div>
                </div>
            </div> {/* Cierra el area de impresion lot-certificate-area */}

            {/* Panel de Control Inferior */}
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
        </>
    );
}
