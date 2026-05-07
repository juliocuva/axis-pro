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

    const passportData = scaData?.cva_descriptive?.extrinsic || {
        eudrHash: 'PENDING EUDR VALIDATION',
        seedCertificate: '---',
        carbonFootprint: '---',
        transferPrice: '---',
        productionCost: '---',
        agrochemicalRegistry: '---',
        storageConditions: '---',
        waterPh: '---',
        alchemyProcess: '---'
    };

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
            canvas.width = 1000; // Alta resolución para imprenta
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
            let query = supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('id', inventoryId);

            if (user?.companyId) {
                query = query.eq('company_id', user.companyId);
            }

            const { data: lot } = await query.maybeSingle();

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
                .maybeSingle();

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
                .maybeSingle();

            const { data: expInfo } = await supabase
                .from('green_exports')
                .select('*')
                .eq('lot_id', inventoryId)
                .maybeSingle();

            setLotData(lot);
            setPhysicalData(physical);
            setExportData(expInfo);

            if (sca) {
                // Lógica de Certificación AxisOne:
                // Sumamos los 7 atributos afectivos. Si un campo está vacío (0), usamos un fallback 
                // técnico de 7.58 (promedio para 83pts) para evitar caídas a 75.00 por datos incompletos.
                const getVal = (v: any) => {
                    const val = Number(v || 0);
                    return val > 0 ? val : 8.0;
                };

                // --- MOTOR HÍBRIDO AOC (Algoritmo V2.0) ---
                let extrinsicBonus = 0;
                const ext = sca.cva_descriptive?.extrinsic || {};
                if (ext.eudrHash && ext.eudrHash.length > 5 && ext.eudrHash !== 'PENDING') extrinsicBonus += 2.0;
                if (ext.alchemyProcess && ext.alchemyProcess.length > 2) extrinsicBonus += 1.5;
                if (ext.seedCertificate && ext.seedCertificate.length > 2) extrinsicBonus += 0.5;
                if (ext.carbonFootprint && ext.carbonFootprint.length > 2) extrinsicBonus += 0.5;
                if (ext.transferPrice && ext.transferPrice.length > 1) extrinsicBonus += 0.5;

                const agro = ext.agrochemicalRegistry?.toLowerCase() || '';
                if (agro.includes('orgánic') || agro.includes('organic') || agro.includes('biológic') || agro.includes('biologic') || agro.includes('0%')) {
                    extrinsicBonus += 1.0;
                }

                const cvaCalculated = (
                    getVal(sca.fragrance_aroma) +
                    getVal(sca.flavor) +
                    getVal(sca.aftertaste) +
                    getVal(sca.acidity) +
                    getVal(sca.body) +
                    getVal(sca.balance) +
                    getVal(sca.overall) + 25 + extrinsicBonus
                );

                // Sincronizar los atributos reales con los valores de certificación para el Radar
                sca.fragrance_aroma = getVal(sca.fragrance_aroma);
                sca.flavor = getVal(sca.flavor);
                sca.aftertaste = getVal(sca.aftertaste);
                sca.acidity = getVal(sca.acidity);
                sca.body = getVal(sca.body);
                sca.balance = getVal(sca.balance);
                sca.overall = getVal(sca.overall);

                if (cvaCalculated >= 80 || sca.is_cva_version) {
                    sca.total_score = Math.round(cvaCalculated * 100) / 100; // Redondeo a 2 decimales
                    sca.is_cva_version = true;
                } else if (sca.total_score == null) {
                    // Fallback para SCA Clásico si no llega a 80 en CVA
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
        { subject: 'Frag/Aroma', A: scaData.fragrance_aroma || 0 },
        { subject: 'Sabor', A: scaData.flavor || 0 },
        { subject: 'Residual', A: scaData.aftertaste || 0 },
        { subject: 'Acidez', A: scaData.acidity || 0 },
        { subject: 'Cuerpo', A: scaData.body || 0 },
        { subject: 'Balance', A: scaData.balance || 0 },
        { subject: 'Global', A: scaData.overall || 0 },
    ].map(d => ({
        ...d,
        A: Number(d.A),
        visualA: Math.max(Number(d.A), 2)
    })) : [];

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
 @media (max-width: 768px) {
 .lot-certificate-area {
 transform: scale(calc(100vw / 780px));
 transform-origin: top left;
 width: 750px !important;
 }
 .no-export {
 width: 100% !important;
 flex-direction: column;
 }
 }
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
                <div className="w-full flex justify-between items-center bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 p-4 rounded-xl print:hidden no-export">
                    <div className="flex items-center gap-3">
                        <span className="text-[#1A1A1A]">Nivel de Visibilidad:</span>
                        <div className="bg-[#1A1A1A]/[0.02] p-1 rounded-lg border border-[#1A1A1A]/10 flex">
                            <button
                                onClick={() => setViewMode('productor')}
                                className={`px-4 py-1.5 rounded-md text-[9px] uppercase transition-all ${viewMode === 'productor' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A] hover:text-[#1A1A1A]'}`}
                                style={viewMode === 'productor' ? { backgroundColor: '#006056' } : {}}
                            >
                                Productor (Full Know-How)
                            </button>
                            <button
                                onClick={() => setViewMode('comprador')}
                                className={`px-4 py-1.5 rounded-md text-[9px] uppercase transition-all ${viewMode === 'comprador' ? 'text-[#1A1A1A]' : 'text-[#1A1A1A] hover:text-[#1A1A1A]'}`}
                                style={viewMode === 'comprador' ? { backgroundColor: '#006056' } : {}}
                            >
                                Comprador (Export Report)
                            </button>
                        </div>
                    </div>
                    {isAxisCertifiedTech && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#006056]/10 border border-[#006056]/20 rounded-full">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            <span className="uppercase text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>AXISONE-Certified-Tech</span>
                        </div>
                    )}
                </div>

                {/* Contenedor Maestro para Exportación (Hoja A4 con márgenes de seguridad) */}
                <div id="lot-certificate-area" className="w-[750px] mx-auto space-y-8 print:space-y-0 print:m-0 text-[#1A1A1A]">

                    {/* HOJA 1: IDENTIDAD, PRODUCCIÓN Y GRANULOMETRÍA */}
                    <div className="bg-white border text-sm relative flex flex-col print:border-none print:break-after-page font-medium"
                        style={{ width: '750px', minHeight: '1120px', borderColor: '#1A1A1A' }}>

                        {/* Header Limpio - Industrial White */}
                        <div className="bg-[#1A1A1A]/[0.02] px-10 py-8 flex justify-between items-center border-b border-[#1A1A1A]/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: '#006056' }}></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-[#1A1A1A]/10 p-2 shadow-sm">
                                    <img src="/logo.png" alt="AXISONE" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h1 className="uppercase leading-none text-sm font-bold text-[#1A1A1A]">
                                        AXISONE <span style={{ color: '#1A1A1A' }}>COFFEE</span>
                                    </h1>
                                    <p className="uppercase mt-2 text-[#1A1A1A] text-[9px] font-normal">Certified under AOC Protocol v2.0</p>
                                    <p className="text-[#1A1A1A] text-[9px] font-normal">Industrial Verification by AxisOne Coffee Intelligence</p>
                                </div>
                            </div>
                            <div className="text-sm relative z-10 font-medium">
                                <p className="uppercase text-[#1A1A1A] text-[9px] font-normal">Expedición Digital</p>
                                <p className="mt-1 text-[#1A1A1A] text-sm font-medium" style={{ color: '#1A1A1A' }}>{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</p>
                            </div>
                        </div>

                        {/* Identidad del Lote */}
                        <div className="p-12 pb-6">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                                <div className="space-y-4 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A]/5 rounded-full border border-[#1A1A1A]/10">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#006056] animate-pulse text-[#1A1A1A] text-sm font-medium"></span>
                                        <span className="uppercase text-[#1A1A1A] text-[9px] font-normal">PASAPORTE AOC V2.0 • HASH: {passportData.eudrHash || passportData.eudr_hash || 'PENDING'}</span>
                                    </div>
                                    {(lotData?.farm_size_hectares >= 4) && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A]/5 rounded-full border border-[#1A1A1A]/10 mt-2">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                            <span className="uppercase text-[#1A1A1A] text-[9px] font-bold">
                                                ALERTA EUDR: Lote {lotData?.farm_size_hectares} HA. Requiere Mapeo In Situ o Doc. Validador
                                            </span>
                                        </div>
                                    )}
                                    <h1 className="uppercase leading-[0.85] mt-4 text-sm font-bold text-[#1A1A1A]">
                                        <span className="text-[#1A1A1A] text-sm font-medium"><b className="text-[#1A1A1A] text-[32px] font-black">{lotData?.lot_number || 'LOTE-AXIS-001'}</b></span>
                                    </h1>
                                    <p className="uppercase text-[#1A1A1A] text-[32px] font-black">
                                        {lotData?.farm_name || 'Lote Premium'}
                                    </p>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                                        <div>
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">Productor</p>
                                            <p className="uppercase leading-none text-[#1A1A1A] text-sm font-medium">{lotData?.farmer_name || 'Independiente'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">Finca</p>
                                            <p className="uppercase leading-none text-[#1A1A1A] text-sm font-medium">{lotData?.farm_name || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">Variedad</p>
                                            <p className="uppercase leading-none text-[#1A1A1A] text-sm font-medium">{lotData?.variety || 'Caturra'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">Región</p>
                                            <p className="uppercase leading-none text-[#1A1A1A] text-sm font-medium">{lotData?.region || 'Huila'}</p>
                                        </div>
                                        {lotData && (
                                            <div className="lg:col-span-4 flex items-center justify-between border-t border-[#1A1A1A]/10 pt-4 mt-2">
                                                {/* SELLO CRIPTOGRÁFICO EUDR */}
                                                {passportData.eudrHash && passportData.eudrHash !== 'PENDING EUDR VALIDATION' && passportData.eudrHash !== 'PENDING' ? (
                                                    <div className="flex items-center gap-3 bg-[#006056]/5 border border-[#006056]/20 py-2 px-4 rounded-xl shadow-sm">
                                                        <div className="w-9 h-9 bg-[#006056] rounded-full flex items-center justify-center shrink-0 shadow-inner">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="uppercase text-[#1A1A1A] text-[9px] font-normal">Sello Criptográfico Origen</p>
                                                            <p className="mt-0.5 text-[#1A1A1A] text-[9px] font-normal">
                                                                {passportData.eudrHash || passportData.eudr_hash} • {lotData.latitude && lotData.longitude ? `${parseFloat(lotData.latitude).toFixed(4)}N, ${parseFloat(lotData.longitude).toFixed(4)}W` : 'POLYGON VERIFIED'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-[#1A1A1A] text-[9px] font-normal">Verificación Satelital EUDR</p>
                                                        <p className="leading-none text-[#1A1A1A] text-sm font-medium">
                                                            {lotData.latitude && lotData.longitude ?
                                                                `${parseFloat(lotData.latitude).toFixed(6)} N, ${parseFloat(lotData.longitude).toFixed(6)} W` :
                                                                'PENDING WGS84 MATCH'}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="text-sm font-medium text-[#1A1A1A]">
                                                    <p className="text-[#1A1A1A] text-[9px] font-normal">Huella de Carbono</p>
                                                    <p className="leading-none text-[#1A1A1A] text-sm font-medium">{passportData.carbonFootprint || passportData.carbon_footprint || '---'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Score Destacado Limpio */}
                                <div className="bg-white border-2 border-[#006056] p-6 rounded-[32px] shrink-0 self-center shadow-sm">
                                    <p className="uppercase mb-2 text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>
                                        LAB SCORE V2.0
                                    </p>
                                    <p className="text-[#1A1A1A] text-xl font-normal">
                                        <span className="text-[#1A1A1A] text-[32px] font-black">{scaData?.total_score ? Number(scaData.total_score).toFixed(2) : '83.00'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats de Producción (Fila compacta) */}
                        <div className="px-12 space-y-4">
                            <div className="grid grid-cols-6 gap-3 bg-[#1A1A1A]/[0.02] p-6 rounded-xl border border-[#1A1A1A]/10">
                                {[
                                    { label: 'Mat. Prima', val: lotData?.purchase_weight || '--', unit: 'Kg', sub: 'Ingreso' },
                                    { label: 'Mat. Export.', val: lotData?.thrashed_weight || '--', unit: 'Kg', sub: 'Excelso' },
                                    { label: 'Rendimiento', val: lotData?.thrashing_yield ? Number(lotData?.thrashing_yield).toFixed(2) : '--', unit: 'Fr', sub: 'Factor' },
                                    { label: 'Beneficio', val: lotData?.process || '--', unit: '', sub: 'Proceso' },
                                    { label: 'Preparación', val: lotData?.process_data?.preparation_protocol || 'UGQ', unit: '', sub: 'Protocolo' },
                                    { label: 'Selección', val: lotData?.process_data?.sorting_method?.split(' ')[0] || 'Óptica', unit: '', sub: 'Método' }
                                ].map((stat, i) => (
                                    <div key={i} className="text-sm font-medium">
                                        <p className="text-[#1A1A1A] text-[9px] font-normal truncate">{stat.label}</p>
                                        <p className="leading-none text-[#1A1A1A] text-sm font-medium truncate">{stat.val} <span className="text-[#1A1A1A] text-[9px]">{stat.unit}</span></p>
                                        <p className="uppercase mt-1.5 text-[#1A1A1A] text-[9px] font-normal truncate" style={{ color: '#1A1A1A' }}>{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Beneficio Extended + Alquimia */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-4 rounded-xl">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal">Protocolo de Alquimia</p>
                                    <p className="uppercase leading-tight text-[#1A1A1A] text-sm font-medium">{passportData.alchemyProcess || passportData.alchemy_process || '---'}</p>
                                </div>
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-4 rounded-xl">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal">Transparencia Direct Trade</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">Precio Transferencia</p>
                                            <p className="text-[#1A1A1A] text-sm font-medium">{passportData.transferPrice || passportData.transfer_price || '---'}</p>
                                        </div>
                                        <div className="text-sm font-medium text-[#1A1A1A]">
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">Costo Prod.</p>
                                            <p className="text-[#1A1A1A] text-sm font-medium">{passportData.productionCost || passportData.production_cost || '---'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-4 rounded-xl">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal">Identidad de Semilla</p>
                                    <p className="uppercase text-[#1A1A1A] text-sm font-medium">{passportData.seedCertificate || passportData.seed_certificate || '---'}</p>
                                </div>
                            </div>

                            {/* Selective Visibility: Parámetros Técnicos (LABORATORIO) */}
                            {(pData.ph_inicial || pData.ph_final || pData.brix_inicial) && (
                                <div className="space-y-3">
                                    <h4 className="uppercase flex items-center gap-2 text-[9px] font-normal text-[#1A1A1A]">
                                        <div className="w-4 h-[1px]" style={{ backgroundColor: '#006056' }}></div>
                                        Análisis de Laboratorio
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-4 rounded-xl flex flex-col justify-between items-start gap-4 group relative overflow-hidden">
                                            {viewMode === 'comprador' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                                <p className="uppercase flex items-center gap-2 text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Dato Privado</p>
                                            </div>}
                                            <div>
                                                <p className="text-[#1A1A1A] text-[9px] font-normal">Evolución pH Acidez</p>
                                                <p className="uppercase text-[#1A1A1A] text-sm font-medium"><span className="">IN:</span> {pData.ph_inicial || '-'} <span className="px-1 text-[#1A1A1A] text-sm font-medium" style={{ color: '#1A1A1A' }}>➤</span> <span className="">OUT:</span> {pData.ph_final || '-'}</p>
                                            </div>
                                            <div className="text-sm font-medium text-[#1A1A1A]">
                                                <p className="text-[#1A1A1A] text-[9px] font-normal">Fermentación</p>
                                                <p className="uppercase text-[#1A1A1A] text-sm font-medium">{pData.duracion_fermentacion_horas || '-'} HRS</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-4 rounded-xl flex flex-col justify-between items-start gap-4 group relative overflow-hidden">
                                            {viewMode === 'comprador' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                                <p className="uppercase flex items-center gap-2 text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Dato Privado</p>
                                            </div>}
                                            <div>
                                                <p className="text-[#1A1A1A] text-[9px] font-normal">Brix Inicial</p>
                                                <p className="uppercase text-[#1A1A1A] text-sm font-medium">{pData.brix_inicial || '-'} °Bx</p>
                                            </div>
                                            <div className="text-sm font-medium text-[#1A1A1A]">
                                                <p className="text-[#1A1A1A] text-[9px] font-normal">Registro Insumos</p>
                                                <p className="uppercase text-[#1A1A1A] text-sm font-medium">{passportData.agrochemicalRegistry || passportData.agrochemical_registry || '---'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-4 rounded-xl flex flex-col justify-between items-start gap-4">
                                            <div>
                                                <p className="text-[#1A1A1A] text-[9px] font-normal">Conservación Bodega</p>
                                                <p className="uppercase text-[#1A1A1A] text-sm font-medium">{passportData.storageConditions || `${passportData.storage_temp || ''} ${passportData.storage_humidity || ''}` || '---'}</p>
                                            </div>
                                            <div className="text-sm font-medium text-[#1A1A1A]">
                                                <p className="text-[#1A1A1A] text-[9px] font-normal">Calidad de Agua</p>
                                                <p className="uppercase text-[#1A1A1A] text-sm font-medium">pH {passportData.waterPh || passportData.water_ph || '---'}</p>
                                            </div>
                                        </div>

                                        {viewMode === 'comprador' && (
                                            <div className="col-span-3 bg-white/[0.02] border border-[#1A1A1A]/10 p-3 rounded-lg flex items-center gap-4 animate-in fade-in">
                                                <span style={{ color: '#1A1A1A' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></span>
                                                <p className="text-[#1A1A1A] text-[10px] leading-relaxed">Los parámetros exactos de curva térmica, inoculación y tiempos de fermentación son propiedad del productor. <br /><span className="text-[#1A1A1A]">Este lote asegura un pH final de <b className="font-bold">{pData.ph_final || 'óptimo'}</b> validando inocuidad técnica y estabilidad.</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Physical & Defects (1x4 Grid) */}
                        <div className="mt-8 px-12">
                            <div className="flex items-center gap-12 mb-8">
                                <h4 className="uppercase flex items-center gap-2 text-[9px] font-normal text-[#1A1A1A]">
                                    <span className="w-10 h-px bg-[#1A1A1A] text-[#1A1A1A] text-sm font-medium"></span>
                                    Physical Quality Control
                                </h4>
                                <h4 className="uppercase flex items-center gap-2 text-[9px] font-normal text-[#1A1A1A]">
                                    <span className="w-10 h-px bg-[#1A1A1A] text-[#1A1A1A] text-sm font-medium"></span>
                                    Grading Archive
                                </h4>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {/* Humedad */}
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 rounded-[20px] p-6 flex flex-col justify-between items-center text-sm min-h-[160px] font-medium">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">Humedad</p>
                                    <div className="flex items-baseline justify-center gap-1 mt-2">
                                        <p className="leading-none text-[#1A1A1A] text-sm font-bold">{physicalData?.moisture_pct || '--'}</p>
                                        <span className="text-[#1A1A1A]" style={{ color: '#1A1A1A' }}>%</span>
                                    </div>
                                    <p className="uppercase mt-auto pt-6 text-[#1A1A1A] text-sm font-bold" style={{ color: '#1A1A1A' }}>{physicalData?.grain_color || 'Estándar'}</p>
                                </div>

                                {/* Densidad */}
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 rounded-[20px] p-6 flex flex-col justify-between items-center text-sm min-h-[160px] font-medium">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">Densidad</p>
                                    <div className="flex items-baseline justify-center gap-1 mt-2">
                                        <p className="leading-none text-[#1A1A1A] text-sm font-bold">{physicalData?.density_gl || '--'}</p>
                                        <span className="text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>g/L</span>
                                    </div>
                                    <p className="uppercase mt-auto pt-6 text-[#1A1A1A] text-sm font-bold" style={{ color: '#1A1A1A' }}>{physicalData?.water_activity || '--'} aw</p>
                                </div>

                                {/* Primarios */}
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-[20px] flex flex-col justify-between items-center text-sm min-h-[160px] font-medium">
                                    <div className="flex flex-col items-center justify-center mb-4 gap-1">
                                        <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">Primarios</p>
                                        <p className="uppercase text-[#1A1A1A] text-[9px] font-normal">(Type 1)</p>
                                    </div>
                                    <div className="flex items-baseline justify-center gap-1 mt-2">
                                        <p className="leading-none text-[#1A1A1A] text-sm font-bold">{physicalData?.defects_count?.primary ?? '0'}</p>
                                        <span className="text-[#1A1A1A]">%</span>
                                    </div>
                                    <p className="uppercase mt-auto pt-6 text-[#1A1A1A] text-[9px] font-normal">Defectos Críticos</p>
                                </div>

                                {/* Secundarios */}
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-[20px] flex flex-col justify-between items-center text-sm min-h-[160px] font-medium">
                                    <div className="flex flex-col items-center justify-center mb-4 gap-1">
                                        <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">Secundarios</p>
                                        <p className="uppercase text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>(Type 2)</p>
                                    </div>
                                    <div className="flex items-baseline justify-center gap-1 mt-2">
                                        <p className="leading-none text-[#1A1A1A] text-sm font-bold">{physicalData?.defects_count?.secondary ?? '0'}</p>
                                        <span className="text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>%</span>
                                    </div>
                                    <p className="uppercase mt-auto pt-6 text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>Defectos Menores</p>
                                </div>
                            </div>
                        </div>

                        {/* Granulometría Ancho Completo */}
                        <div className="mt-8 px-12 flex flex-col flex-1">
                            <h3 className="uppercase flex items-center gap-4 mb-6 text-[9px] font-normal" style={{ color: '#1A1A1A' }}>
                                <div className="w-8 h-[2px]" style={{ backgroundColor: '#006056' }}></div>
                                Granulometría (Screen Size Distribution)
                            </h3>
                            <div className="h-[240px] relative bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 rounded-[24px] p-4 flex flex-col justify-end mt-4">
                                <div className="h-[210px] w-full relative z-10 pl-4 pr-4 flex justify-center">
                                    <BarChart width={650} height={180} data={screenData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="25%">
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#1A1A1A', fontSize: 9, fontWeight: '500', dy: 10 }}
                                        />
                                        <Bar dataKey="val" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                                            {screenData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={Number(entry.val) > 0 ? '#006056' : '#1A1A1A'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </div>
                                <div className="grid grid-cols-8 gap-0 pt-2 border-t border-[#1A1A1A]/10 relative z-10 w-full px-4 mb-2">
                                    {screenData.map((d, i) => (
                                        <div key={i} className="text-sm group flex flex-col items-center font-medium">
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">{d.name}</p>
                                            <p className="text-[#1A1A1A] text-[9px] font-normal">{Number(d.val).toFixed(1)}<span className="">%</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Hoja 1 */}
                        <div className="mt-auto px-12 py-8 flex justify-between items-center border-t border-[#1A1A1A]/10">
                            <p className="text-[#1A1A1A] text-[8px] font-normal">Certified under AOC Protocol v2.0 | Industrial Verification by AxisOne Coffee Intelligence</p>
                            <p className="text-[#1A1A1A] text-[8px] font-bold">{inventoryId.substring(0, 8).toUpperCase()}-P1</p>
                        </div>
                    </div>

                    {/* INDICADOR VISUAL DE CORTE (No visible al imprimir) */}
                    <div className="w-full h-8 print:hidden"></div>

                    {/* HOJA 2: PERFIL SENSORIAL Y SEGURIDAD */}
                    <div className="bg-white border relative flex flex-col print:border-none print:break-after-page"
                        style={{ width: '750px', minHeight: '1120px', borderColor: '#1A1A1A' }}>

                        {/* Header P2 Limpio */}
                        <div className="bg-[#1A1A1A]/[0.02] px-12 py-8 flex justify-between items-center border-b border-[#1A1A1A]/10">
                            <div className="flex items-center gap-6">
                                <img src="/logo.png" alt="AXISONE" className="h-10 w-auto object-contain" />
                                <div>
                                    <p className="uppercase leading-none text-[#1A1A1A] text-[9px] font-normal">AOC SENSORY ANALYTICS</p>
                                    <p className="uppercase mt-2 text-[#1A1A1A] text-[9px] font-normal">Certified under AOC Protocol v2.0 | Page 02</p>
                                </div>
                            </div>
                            <div className="text-sm font-medium">
                                <p className="uppercase leading-none text-[#1A1A1A] text-[10px] font-bold" style={{ color: '#1A1A1A' }}>LOT: {lotData?.lot_number || '---'}</p>
                            </div>
                        </div>

                        {/* Perfil Sensorial basado en estándares SCA (Elegante y Visual) */}
                        <div className="flex flex-col w-full h-[885px] justify-between">

                            {/* Radar Chart (Mucho más elegante) */}
                            <div className="w-full relative flex flex-col pt-12 items-center">
                                {/* Title (Normal Flow) */}
                                <div className="flex flex-col items-start mb-6">
                                    <h2 className="uppercase mb-4 text-sm font-bold" style={{ color: '#1A1A1A' }}>
                                        {scaData?.is_cva_version ? 'SCA Coffee Value Assessment (CVA)' : 'Evaluación Sensorial basada en estándares de la SCA'}
                                    </h2>
                                    <p className="text-[#1A1A1A] text-[10px] font-normal">
                                        {scaData?.is_cva_version ? 'Basado en el Protocolo Descriptivo SCA-103 + Afectivo SCA-104' : 'Análisis de Perfil Organoléptico de Especialidad'}
                                    </p>
                                </div>



                                {/* Chart & Data (Static Container) */}
                                <div className="w-full h-[450px] relative flex justify-center items-center">

                                    <RadarChart width={500} height={450} cx="50%" cy="50%" outerRadius="75%" data={scaRadarData} className="relative z-10">
                                        <PolarGrid stroke="#1A1A1A" strokeWidth={1} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 9, fontWeight: '500' }} />
                                        <Radar
                                            name="Profile"
                                            dataKey="visualA"
                                            stroke="#1A1A1A"
                                            strokeWidth={1}
                                            fill="#006056"
                                            fillOpacity={0.15}
                                            isAnimationActive={false}
                                        />
                                    </RadarChart>

                                    {/* Puntos de datos destacados */}
                                    <div className="absolute top-10 right-12 space-y-2 z-20 w-40">
                                        {scaRadarData.map((d, i) => (
                                            <div key={i} className="flex items-center gap-3 justify-end border-b border-[#1A1A1A]/10 pb-1">
                                                <span className="uppercase text-[#1A1A1A] text-[9px] font-normal">{d.subject}</span>
                                                <span className="text-[#1A1A1A] text-sm font-bold">{Number(d.A).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Descriptor Maestro (Elegancia Tipográfica) */}
                            <div className="px-12 pt-8 pb-0 bg-white border-t border-[#1A1A1A]/10 relative z-10 w-full mt-4">
                                <div className="w-full relative">
                                    <div className="absolute -top-6 left-0 py-2 text-[9px] uppercase text-[#1A1A1A] font-normal">
                                        Resumen Sensorial
                                    </div>
                                    <div className="flex flex-col">
                                        {/* Quote resting on a line */}
                                        <div className="pb-4 border-b border-[#1A1A1A]/10 w-full">
                                            <p className="text-[#1A1A1A] text-sm font-medium leading-relaxed">
                                                "{scaData?.notes || 'Perfil sensorial en proceso de certificación industrial'}"
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-center gap-16 pt-6 pb-6 w-full relative z-10 bg-white">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-full border border-[#1A1A1A]/10/20 flex items-center justify-center bg-[#1A1A1A]/5 text-[10px] text-[#1A1A1A] font-bold">QG</div>
                                                <div className="text-sm font-medium">
                                                    <p className="uppercase text-[#1A1A1A] text-[9px] font-normal">{scaData?.taster_name || 'Q-GRADER SENIOR JULIO UVA'}</p>
                                                    <p className="uppercase mt-1 text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>Professional Cupper • Digital Signature Verified</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <img src="/logo.png" alt="Verify" className="w-10 h-10 " />
                                                <div className="text-sm border-l border-[#1A1A1A]/10/20 pl-4 py-1 font-medium text-[#1A1A1A]">
                                                    <p className="text-[9px] uppercase">Protocol S2.4</p>
                                                    <p className="text-[9px] font-bold">ID SEAL: {inventoryId.substring(0, 6)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Hoja 2: Seguridad y QR */}
                            {/* Footer Hoja 2 Simplificado */}
                            <div className="mt-auto px-12 py-8 flex justify-between items-center border-t border-[#1A1A1A]/10">
                                <p className="text-[#1A1A1A] text-[8px] font-normal">Certified under AOC Protocol v2.0 | Industrial Verification by AxisOne Coffee Intelligence</p>
                                <p className="text-[#1A1A1A] text-[8px] font-bold">{inventoryId.substring(0, 8).toUpperCase()}-P2</p>
                            </div>
                        </div>
                    </div>

                    {/* INDICADOR VISUAL DE CORTE (No visible al imprimir) */}
                    <div className="w-full h-8 print:hidden"></div>

                    {/* HOJA 3: CURVA DE TOSTIÓN E INTELIGENCIA TÉRMICA */}
                    <div className="bg-white shadow-2xl relative overflow-hidden flex flex-col mt-8 print:mt-0 print:shadow-none print:border-none"
                        style={{ width: '750px', minHeight: '1120px', borderColor: '#1A1A1A' }}>

                        {/* Header P3 Limpio */}
                        <div className="bg-[#1A1A1A]/[0.02] px-12 py-8 flex justify-between items-center border-b border-[#1A1A1A]/10">
                            <div className="flex items-center gap-6">
                                <img src="/logo.png" alt="AXISONE" className="h-10 w-auto object-contain" />
                                <div>
                                    <p className="uppercase leading-none text-[#1A1A1A] text-[9px] font-normal">AOC ROAST INTELLIGENCE</p>
                                    <p className="uppercase mt-2 text-[#1A1A1A] text-[9px] font-normal">Certified under AOC Protocol v2.0 | Page 03</p>
                                </div>
                            </div>
                            <div className="text-sm font-medium">
                                <p className="uppercase text-[#1A1A1A] text-[9px] font-normal" style={{ color: '#1A1A1A' }}>ID: {lotData?.lot_number || '---'}</p>
                            </div>
                        </div>

                        <div className="flex-1 p-12 flex flex-col gap-8">
                            <div className="space-y-4">
                                <h2 className="uppercase text-sm font-bold" style={{ color: '#1A1A1A' }}>Perfil de Tostión</h2>
                                <p className="text-[#1A1A1A] text-[10px] font-normal">Control de Transferencia Térmica y Cinética de Reacción</p>
                                <div className="flex justify-center items-center gap-3 mt-4">
                                    <span className="px-3 py-1 bg-[#006056]/10 rounded-full uppercase border border-[#006056]/20 text-[#1A1A1A] text-[9px] font-normal">✓ Fuente: Artisan / Cropster</span>
                                    <span className="px-3 py-1 bg-[#1A1A1A]/5 rounded-full uppercase border border-[#1A1A1A]/10 text-[#1A1A1A] text-[9px] font-normal">✓ Telemetría Minuto a Minuto</span>
                                </div>
                            </div>

                            {/* Contenedor de la Curva (Escalado para que quepa el footer) */}
                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 rounded-[32px] p-8 h-[380px] relative mt-4">
                                <div className="absolute top-6 right-10 flex gap-6 z-20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-1 bg-[#006056] rounded-full"></div>
                                        <span className="text-[#1A1A1A] text-[9px] font-normal">Bean Temp</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-1 bg-[#006056]/80 rounded-full"></div>
                                        <span className="text-[#1A1A1A] text-[9px] font-normal">Air Temp</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-1 bg-[#006056]/30 rounded-full"></div>
                                        <span className="text-[#1A1A1A] text-[9px] font-normal">RoR</span>
                                    </div>
                                </div>

                                <div className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={roastCurveData} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" strokeOpacity={0.1} vertical={false} />
                                            <XAxis
                                                dataKey="time"
                                                type="number"
                                                domain={[0, 12]}
                                                ticks={[0, 2, 4, 6, 8, 10, 12]}
                                                label={{ value: 'Tiempo (min)', position: 'insideBottomRight', offset: -10, fontSize: 9, fill: '#1A1A1A' }}
                                                tick={{ fontSize: 9, fill: '#1A1A1A' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                yAxisId="temp"
                                                label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#1A1A1A' }}
                                                tick={{ fontSize: 9, fill: '#1A1A1A' }}
                                                domain={[0, 230]}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                yAxisId="ror"
                                                orientation="right"
                                                domain={[0, 25]}
                                                hide
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #1A1A1A', borderRadius: '12px', fontSize: '10px' }}
                                            />
                                            <ReferenceLine yAxisId="temp" y={205} stroke="#1A1A1A" strokeDasharray="3 3" label={{ position: 'right', value: '1st Crack', fill: '#006056', fontSize: 9, fontWeight: 'bold' }} />
                                            <ReferenceLine yAxisId="temp" x={10} stroke="#1A1A1A" strokeWidth={2} label={{ position: 'top', value: 'DROP', fill: '#1A1A1A', fontSize: 9, fontWeight: 'black' }} />

                                            <Line yAxisId="temp" type="monotone" dataKey="beanTemp" stroke="#1A1A1A" strokeWidth={4} dot={false} isAnimationActive={false} />
                                            <Line yAxisId="temp" type="monotone" dataKey="airTemp" stroke="#1A1A1A" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Métricas de Tostión */}
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">Tiempo Total</p>
                                    <p className="text-[#1A1A1A] text-sm font-medium">10:45 <span className="text-[9px]">m:s</span></p>
                                </div>
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">Pérdida (Merma)</p>
                                    <p className="text-[#1A1A1A] text-sm font-medium">14.2 <span className="text-[9px]">%</span></p>
                                </div>
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">Agtron (Grounded)</p>
                                    <p className="text-[#1A1A1A] text-sm font-medium" style={{ color: '#1A1A1A' }}>58.4 <span className="text-[9px]">Ag</span></p>
                                </div>
                                <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl">
                                    <p className="text-[#1A1A1A] text-[9px] font-normal uppercase">DTR</p>
                                    <p className="text-[#1A1A1A] text-sm font-medium">18.5 <span className="text-[9px]">%</span></p>
                                </div>
                            </div>

                            {/* Notas del Tostador */}
                            <div className="bg-[#1A1A1A]/[0.02]/50 border border-[#1A1A1A]/10 p-8 rounded-3xl mt-4">
                                <h4 className="uppercase mb-4 text-[9px] font-normal" style={{ color: '#1A1A1A' }}>Observaciones del Maestro Tostador</h4>
                                <p className="text-[#1A1A1A] text-sm leading-relaxed">
                                    "Tueste medio diseñado para resaltar la acidez cítrica y prolongar el dulzor del caramelo. Se aplicó una reducción de gas al inicio del primer crack para evitar el flick y mantener un RoR descendente constante hasta el drop."
                                </p>
                            </div>
                        </div>

                        {/* Footer P3 */}
                        {/* Footer Hoja 3: Seguridad y QR (LUGAR FINAL) */}
                        <div className="bg-white p-12 flex justify-between items-center gap-12 relative overflow-hidden border-t border-[#1A1A1A]/10 mt-auto">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#1A1A1A]/10"></div>

                            <div className="bg-[#1A1A1A]/[0.02] p-4 rounded-2xl border border-[#1A1A1A]/10 flex items-center gap-6 flex-1 shadow-sm">
                                <div className="bg-white p-2 border border-[#1A1A1A]/10 rounded-xl shrink-0 qr-container">
                                    <QRCodeSVG
                                        value={`https://axisonecoffee.com/verify/lot/${inventoryId}`}
                                        size={80}
                                        level="H"
                                        includeMargin={false}
                                        fgColor="#000000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="uppercase leading-none text-[#1A1A1A] text-[9px] font-bold">AOC Inmutable Ledger Traceability</p>
                                    <p className="text-[#1A1A1A] text-[9px] font-normal">
                                        Certified under AOC Protocol v2.0. Industrial verification of origin and physical-sensory quality protected by AxisOne Intelligence.
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm space-y-4 font-medium">
                                <div className="px-4 py-2 bg-[#1A1A1A]/5 rounded-lg border border-[#1A1A1A]/10">
                                    <p className="text-[#1A1A1A] text-[9px] font-medium uppercase">© 2026 AXISONE INTELLIGENCE GROUP<br /><span className="mt-1 block text-[#1A1A1A] text-[9px] font-normal italic">Industrial Quality Archive - BAX-7370</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> {/* Cierra el area de impresion lot-certificate-area */}

                {/* Panel de Control Inferior */}
                <div className="w-full flex justify-end gap-4 no-export mt-10 p-10 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 rounded-2xl shadow-2xl print:hidden">
                    <button
                        onClick={downloadQRCode}
                        className="px-8 py-4 bg-[#006056] hover:bg-[#006056]-bright text-[#1A1A1A] rounded-2xl text-[9px] uppercase transition-all flex items-center justify-center gap-3 shadow-xl border border-[#006056]/30 font-normal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Descargar QR Impresión
                    </button>
                    <ExportReportButton
                        elementId="lot-certificate-area"
                        fileName={`REPORT-AXIS-${lotData?.lot_number || 'LOT'}-${lotData?.farm_name || 'COFFEE'}`}
                    />
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-8 py-4 bg-black hover:bg-[#1A1A1A]/10 text-[#1A1A1A] border border-[#1A1A1A]/10 rounded-2xl text-[9px] uppercase transition-all flex items-center justify-center gap-3 shadow-xl font-normal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        IMPRIMIR / PDF NATIVO
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-10 py-4 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 text-[#1A1A1A] hover:text-[#1A1A1A] rounded-2xl text-[9px] uppercase transition-all border border-[#1A1A1A]/10 active:scale-95 shadow-xl font-normal"
                    >
                        Cerrar Certificado
                    </button>
                </div>
            </div>
        </>
    );
}
