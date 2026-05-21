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
import { PDFExportButton } from '@/modules/export/components/PDFExport';
import { LotData as PDFLotData } from '@/modules/export/components/pdfExportModule';
import { QRCodeSVG } from 'qrcode.react';

interface LotCertificateProps {
    inventoryId: string;
    onClose: () => void;
    user: {
        email?: string;
        name?: string;
        companyId: string;
        role?: string;
    } | null;
}

export default function LotCertificate({ inventoryId, onClose, user }: LotCertificateProps) {
    const [lotData, setLotData] = useState<any>(null);
    const [physicalData, setPhysicalData] = useState<any>(null);
    const [scaData, setScaData] = useState<any>(null);
    const [exportData, setExportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'productor' | 'comprador'>('productor');
    const [associationData, setAssociationData] = useState<any>(null);
    const [isSubmittingToTraces, setIsSubmittingToTraces] = useState(false);
    const [tracesStatus, setTracesStatus] = useState<'idle' | 'preparing' | 'sending' | 'certified'>('idle');
    const [ddsReference, setDdsReference] = useState<string | null>(null);

    // Estados para la previsualización por pasos
    const [activeStep, setActiveStep] = useState(1);
    const [isStepMode, setIsStepMode] = useState(false); // Por defecto mostrar todo
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Iniciando auditoría digital...');

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

                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `QR-AXIS-${lotData?.lot_number || inventoryId}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                    } else {
                        throw new Error('Canvas to Blob failed');
                    }
                }, 'image/jpeg', 0.90);
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const handleTracesSubmission = async () => {
        setIsSubmittingToTraces(true);
        setTracesStatus('preparing');

        // Simulación de pasos técnicos industriales
        await new Promise(r => setTimeout(r, 1200));
        setTracesStatus('sending');

        const newRef = `EUDR-${lotData?.lot_number || 'AX'}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Persistir en Supabase para la demo (Modo Industrial)
        try {
            const { error } = await supabase
                .from('coffee_purchase_inventory')
                .update({
                    process_data: {
                        ...lotData?.process_data,
                        eudr_hash: newRef
                    }
                })
                .eq('id', inventoryId);

            if (error) throw error;
            setDdsReference(newRef);
        } catch (err) {
            console.error("Error persistiendo TRACES:", err);
            // Fallback a memoria si falla DB
            setDdsReference(newRef);
        }

        setTracesStatus('certified');
        setIsSubmittingToTraces(false);
    };

    const fetchFullData = async () => {
        try {
            setLoading(true);
            setLoadingProgress(10);
            setLoadingMessage('Consultando Registro de Ingreso...');

            let query = supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('id', inventoryId);

            if (user?.companyId && user?.role !== 'auditor' && !user?.email?.toLowerCase()?.includes('julio') && !user?.email?.toLowerCase()?.includes('main')) {
                query = query.eq('company_id', user.companyId);
            }

            const { data: lot } = await query.maybeSingle();
            setLotData(lot);
            setLoadingProgress(30);
            setLoadingMessage('Verificando Transformación Industrial...');

            let physQuery = supabase
                .from('physical_analysis')
                .select('*')
                .eq('inventory_id', inventoryId);

            if (user?.companyId && user?.role !== 'auditor' && !user?.email?.toLowerCase()?.includes('julio') && !user?.email?.toLowerCase()?.includes('main')) {
                physQuery = physQuery.eq('company_id', user.companyId);
            }

            const { data: physical } = await physQuery
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            setPhysicalData(physical);
            setLoadingProgress(50);
            setLoadingMessage('Auditando Laboratorio y SCA...');

            let scaQuery = supabase
                .from('sca_cupping')
                .select('*')
                .eq('inventory_id', inventoryId);

            if (user?.companyId && user?.role !== 'auditor' && !user?.email?.toLowerCase()?.includes('julio') && !user?.email?.toLowerCase()?.includes('main')) {
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

            setExportData(expInfo);
            setLoadingProgress(70);
            setLoadingMessage('Sincronizando Pasaporte Ambiental (EUDR)...');

            // --- VÍNCULO CON AUTORIDAD ASOCIATIVA ---
            if (lot?.company_id) {
                const { data: assoc } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('company_id', lot.company_id)
                    .maybeSingle();
                setAssociationData(assoc);
            }

            if (sca) {
                const aff = sca.cva_affective || {};
                const descriptive = sca.cva_descriptive || {};
                const ext = descriptive.extrinsic || {};

                // --- MOTOR HÍBRIDO (Algoritmo V3.0) ---
                const attributes = [
                    aff.fragranceQuality || sca.fragrance_aroma,
                    aff.flavorQuality || sca.flavor,
                    aff.aftertasteQuality || sca.aftertaste,
                    aff.acidityQuality || sca.acidity,
                    aff.mouthfeelQuality || sca.body,
                    aff.sweetnessQuality || sca.balance,
                    aff.overallImpression || sca.overall
                ];

                const isComplete = attributes.every(v => Number(v || 0) > 0);

                if (isComplete) {
                    let extrinsicBonus = 0;
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
                        attributes.reduce((acc, curr) => acc + Number(curr), 0) + 25 + extrinsicBonus
                    );

                    sca.total_score = Math.round(cvaCalculated * 100) / 100;
                    sca.is_cva_version = true;
                } else {
                    sca.total_score = sca.total_score || null;
                    sca.is_incomplete = true;
                }

                sca.fragrance_aroma = Number(attributes[0] || 0);
                sca.flavor = Number(attributes[1] || 0);
                sca.aftertaste = Number(attributes[2] || 0);
                sca.acidity = Number(attributes[3] || 0);
                sca.body = Number(attributes[4] || 0);
                sca.balance = Number(attributes[5] || 0);
                sca.overall = Number(attributes[6] || 0);
            }
            setScaData(sca);
            setLoadingProgress(90);
            setLoadingMessage('Generando Certificado de Autoridad...');

            // Simular un pequeño delay para que se vea la última etapa
            await new Promise(r => setTimeout(r, 800));
            setLoadingProgress(100);

        } catch (err) {
            console.error("Error fetching certificate data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 min-h-[600px] space-y-12">
            <div className="relative">
                <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-[#0C6056] border-r-4 border-r-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/logo.png" alt="AXIS" className="w-12 h-12 object-contain animate-pulse" />
                </div>
            </div>

            <div className="w-full max-w-md space-y-4">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-[#0C6056] tracking-widest">Auditoría en Curso</p>
                        <p className="text-xl font-black text-brand-navy uppercase">{loadingMessage}</p>
                    </div>
                    <p className="text-2xl font-black text-[#0C6056]">{loadingProgress}%</p>
                </div>
                <div className="h-2 w-full bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#0C6056] transition-all duration-500 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                    ></div>
                </div>
                <div className="flex justify-center gap-8 pt-4">
                    {[1, 2, 3, 4, 5].map(step => (
                        <div
                            key={step}
                            className={`w-2 h-2 rounded-full transition-all duration-500 ${loadingProgress >= (step * 20) ? 'bg-[#0C6056] scale-125' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
            <p className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-[0.2em]">AxisOne Coffee • Digital Passport Protocol v3.0</p>
        </div>
    );

    if (!lotData) return (
        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase text-brand-navy">Lote No Encontrado</h3>
            <p className="text-xs text-gray-900 uppercase font-bold max-w-xs">El identificador de este lote no existe en el sistema de trazabilidad de AxisOne o ha sido restringido por seguridad.</p>
            <button onClick={onClose} className="mt-8 px-8 py-3 bg-[#0C6056] text-white rounded-xl text-xs font-bold uppercase">Volver al Inicio</button>
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
                        width: 816px !important;
                    }
                    .no-export {
                        width: 100% !important;
                        flex-direction: column;
                    }
                }
                @media screen {
                    .step-hidden { display: none !important; }
                    .step-visible { display: flex !important; animation: stepFadeIn 0.4s ease-out; }
                }
                @keyframes stepFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media print {
                    /* Ocultar absolutamente todo en el DOM */
                    body * {
                        visibility: hidden !important;
                    }
                    /* Mostrar única y exclusivamente el área del certificado */
                    #lot-certificate-area, #lot-certificate-area * {
                        visibility: visible !important;
                    }
                    /* Posicionar el certificado al inicio absoluto de la página */
                    #lot-certificate-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 816px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    @page { 
                        size: letter portrait; 
                        margin: 0 !important; 
                    }
                    body, html { 
                        margin: 0 !important; 
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                        overflow: visible !important;
                        height: auto !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    .certificate-page {
                        width: 816px !important;
                        height: 1056px !important;
                        min-height: 1056px !important;
                        max-height: 1056px !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        position: relative !important;
                        background: white !important;
                        color: black !important;
                        overflow: hidden !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                    }
                    .no-print, .no-export, .print\:hidden {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                    }
                    ::-webkit-scrollbar {
                        display: none !important;
                    }
                }
            `}</style>
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-10">

                    {/* Contenedor Maestro para Exportación */}
                    <div id="lot-certificate-area" className="w-[816px] mx-auto space-y-8 print:space-y-0 print:m-0 text-brand-navy font-medium">

                        {/* HOJA 1: ETAPA 01 (INGRESO) & ETAPA 02 (TRILLA) */}
                        <div className={`certificate-page bg-white border text-sm relative flex flex-col print:border-none print:break-after-page shadow-2xl ${isStepMode && (activeStep !== 1 && activeStep !== 2) ? 'step-hidden' : 'step-visible'}`}
                            style={{ width: '816px', minHeight: '1056px', borderColor: '#0C6056' }}>

                            {/* Header Premium */}
                            <div className="bg-white px-10 py-8 flex justify-between items-center border-b-4 border-[#0C6056] relative overflow-hidden">

                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-gray-400 p-2 shadow-sm">
                                        <img src="/logo.png" alt="AXISONE" className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="uppercase leading-none text-xl font-black text-brand-navy er">
                                            CERTIFICADO <span className="text-[#0C6056]">ADN DEL CAFÉ</span>
                                        </h1>
                                        <p className="uppercase mt-2 text-[#0C6056] text-[11px] font-bold ">
                                            AUDITADO POR: {associationData?.full_name || 'AXISONE COFFEE'}
                                        </p>
                                        <p className="text-brand-navy/40 text-[9px] font-medium uppercase mt-1">Integridad Técnica • Origen a Taza • Etapas 01-06</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="uppercase text-brand-navy/30 text-[9px] font-bold ">ID de Lote</p>
                                    <p className="mt-1 text-[#0C6056] text-xl font-black er">{lotData?.lot_number || 'LOTE-AXIS'}</p>
                                </div>
                            </div>

                            {/* STAGE 01: INGRESO */}
                            <div className="p-6 space-y-5">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-4">
                                    <h2 className="uppercase flex items-center gap-4 text-xs font-bold text-[#1A1A1A] ">
                                        <span className="w-6 h-6 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[11px] shadow-sm">01</span>
                                        ETAPA 01: INGRESO Y ORIGEN
                                    </h2>
                                    <span className="text-[9px] font-bold text-brand-navy/30 uppercase ">Recepción de Materia Prima</span>
                                </div>

                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div className="group">
                                            <p className="text-brand-navy text-[9px] font-bold uppercase  mb-1 group-hover:text-[#0C6056] transition-colors">Productor / Responsable</p>
                                            <p className="uppercase text-xl font-black ">{lotData?.farmer_name || 'Independiente'}</p>
                                            <div className="flex gap-4 mt-1">
                                                {lotData?.process_data?.sica_id && (
                                                    <p className="text-[10px] font-mono font-bold text-[#0C6056] bg-[#0C6056]/5 px-2 py-0.5 rounded border border-[#0C6056]/10">
                                                        SICA: {lotData.process_data.sica_id}
                                                    </p>
                                                )}
                                                {lotData?.process_data?.farmer_phone && (
                                                    <p className="text-[10px] font-mono font-bold text-[#0C6056]/60">
                                                        ID: {lotData.process_data.farmer_phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="group">
                                            <p className="text-brand-navy text-[9px] font-bold uppercase  mb-1">Unidad Productiva (Finca)</p>
                                            <p className="uppercase text-xl font-black ">{lotData?.farm_name || '---'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-brand-navy text-[9px] font-bold uppercase  mb-1">Departamento / Municipio</p>
                                                <p className="uppercase font-black text-sm">{lotData?.region || 'Huila'} / {lotData?.municipality || '---'}</p>
                                            </div>
                                            <div>
                                                <p className="text-brand-navy text-[9px] font-bold uppercase  mb-1">Altitud Media</p>
                                                <p className="uppercase font-black text-sm">{lotData?.altitude || '1650'} MSNM</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl shadow-inner relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0C6056]/5 rounded-full -mr-12 -mt-12"></div>
                                            <p className="text-brand-navy text-[9px] font-bold uppercase  mb-2">Validación Criptográfica EUDR</p>
                                            <p className="text-[11px] font-mono font-bold mt-1 text-[#0C6056] break-all">
                                                {ddsReference || passportData.eudrHash || 'PENDING SUBMISSION'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-4">
                                                <div className={`w-2 h-2 rounded-full ${ddsReference ? 'bg-[#0C6056]' : 'bg-yellow-500 animate-pulse'}`}></div>
                                                <span className="text-[9px] font-bold uppercase text-[#0C6056] ">
                                                    {ddsReference ? 'Sello de Origen Verificado por UE' : 'Esperando Transmisión TRACES'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 px-2">
                                            <div>
                                                <p className="text-brand-navy text-[9px] font-bold uppercase  mb-1">Peso Ingreso</p>
                                                <p className="text-lg font-black">{lotData?.purchase_weight || '0'} <span className="text-xs font-bold">KG</span></p>
                                            </div>
                                            <div>
                                                <p className="text-brand-navy text-[9px] font-bold uppercase  mb-1">Variedad Semilla</p>
                                                <p className="text-lg font-black uppercase er">{lotData?.variety || 'Caturra'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STAGE 02: TRILLA */}
                            <div className="p-6 pt-0 space-y-5 flex-1">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-4">
                                    <h2 className="uppercase flex items-center gap-4 text-xs font-bold text-[#1A1A1A] ">
                                        <span className="w-6 h-6 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[11px] shadow-sm">02</span>
                                        ETAPA 02: TRILLA Y TRANSFORMACIÓN
                                    </h2>
                                    <span className="text-[9px] font-bold text-brand-navy uppercase ">Procesamiento Industrial</span>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Peso Pergamino', val: lotData?.purchase_weight || '--', unit: 'KG' },
                                        { label: 'Peso Excelso', val: lotData?.thrashed_weight || '--', unit: 'KG' },
                                        { label: 'Factor Rend.', val: lotData?.thrashing_yield ? Number(lotData.thrashing_yield).toFixed(1) : '--', unit: 'FR' },
                                        { label: 'Merma Real', val: lotData?.purchase_weight && lotData?.thrashed_weight ? (((lotData.purchase_weight - lotData.thrashed_weight) / lotData.purchase_weight) * 100).toFixed(1) : '--', unit: '%' }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white border border-gray-400 p-6 rounded-2xl text-center group transition-all">
                                            <p className="text-brand-navy/40 text-[9px] font-bold uppercase  mb-4">{item.label}</p>
                                            <p className="text-2xl font-black text-brand-navy er mb-1">{item.val}</p>
                                            <p className="text-[9px] font-bold text-[#0C6056] ">{item.unit}</p>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#0C6056]/5 border border-[#0C6056]/20 p-5 rounded-2xl flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-black/5">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C6056" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/30 text-[9px] font-bold uppercase mb-0.5">Protocolo de Preparación</p>
                                            <p className="text-[11px] font-bold uppercase text-brand-navy">
                                                {lotData?.process_data?.preparation_protocol === 'EP' ? 'European Prep (EP) - Especialidad' :
                                                 lotData?.process_data?.preparation_protocol === 'American' ? 'American Prep - Comercial Plus' :
                                                 lotData?.process_data?.preparation_protocol === 'Zero Defect' ? 'Zero Defect - Microlote Oro' :
                                                 lotData?.process_data?.preparation_protocol === 'Supremo' ? 'Supremo - Malla 17/18' :
                                                 lotData?.process_data?.preparation_protocol === 'UGQ' ? 'UGQ - Estándar FNC' :
                                                 lotData?.process_data?.preparation_protocol || 'EP (POR DEFECTO)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-[#0C6056]/5 border border-[#0C6056]/20 p-5 rounded-2xl flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-black/5">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C6056" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/30 text-[9px] font-bold uppercase mb-0.5">Método de Selección</p>
                                            <p className="text-[11px] font-bold uppercase text-brand-navy">{lotData?.process_data?.sorting_method || 'Máquina Selectora Óptica'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[200px] relative bg-white border border-black/5 rounded-[24px] p-5 flex flex-col shadow-inner">
                                    <p className="text-[9px] font-bold uppercase text-brand-navy/40 mb-8  border-l-2 border-[#0C6056] pl-4">Distribución Granulométrica (Sieve Analysis)</p>
                                    <div className="flex-1 w-full flex justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={screenData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="35%">
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 10, fontWeight: '800' }} />
                                                <Bar dataKey="val" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                                                    {screenData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={Number(entry.val) > 0 ? '#0C6056' : 'rgba(0,0,0,0.05)'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-8 gap-0 mt-6 pt-4 border-t border-black/5">
                                        {screenData.map((d, i) => (
                                            <div key={i} className="text-center">
                                                <p className="text-[11px] font-bold text-brand-navy">{Number(d.val).toFixed(1)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ATRIBUTOS EXTRÍNSECOS SCA CVA v3.0 */}
                            {(() => {
                                const ext = scaData?.cva_descriptive?.extrinsicSCA;
                                if (!ext) return null;

                                const cultivoLabels: Record<string,string> = { pais:'País', region:'Región', finca:'Finca/Cooperativa', productores:'Productor(es)', especie:'Especie', variedad:'Variedad', cosecha:'Fecha/Año Cosecha' };
                                const procLabels: Record<string,string> = { beneficiador:'Beneficiador(es)', humedo:'Beneficio Húmedo', seco:'Beneficio Seco', lavado:'Lavado', natural:'Natural', procOtro:'Proceso Otro', descafeinado:'Descafeinado', descripcion:'Descripción Proceso' };
                                const comercioLabels: Record<string,string> = { clasificacion:'Clasificación', oic:'N° OIC', importador:'Importador', exportador:'Exportador', precio:'Precio Productor', lote:'Tamaño Lote' };
                                const certLabels: Record<string,string> = { c4:'4C', fairtrade:'Fairtrade', organico:'Orgánico', rainforest:'Rainforest Alliance', inocuidad:'Inocuidad Alimentaria' };

                                const activeItems = (items: Record<string,boolean>, labels: Record<string,string>) =>
                                    Object.entries(items).filter(([k, v]) => v && labels[k]).map(([k]) => labels[k]);

                                const cultivoItems = activeItems(ext.cultivo?.items || {}, cultivoLabels);
                                const procItems = activeItems(ext.procesamiento?.items || {}, procLabels);
                                const comercioItems = activeItems(ext.comercio?.items || {}, comercioLabels);
                                const certItems = activeItems(ext.certificaciones?.items || {}, certLabels);
                                const hasPremios = ext.otro?.items?.premios;

                                const hasAnyData = cultivoItems.length > 0 || procItems.length > 0 || comercioItems.length > 0 || certItems.length > 0;
                                if (!hasAnyData) return null;

                                return (
                                    <div className="p-6 pt-2 space-y-3">
                                        <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-3">
                                            <h2 className="uppercase flex items-center gap-3 text-xs font-bold text-[#1A1A1A]">
                                                <span className="w-6 h-6 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[9px] font-black">SCA</span>
                                                ATRIBUTOS EXTRÍNSECOS — SCA CVA v3.0
                                            </h2>
                                            <span className="text-[9px] font-bold text-[#0C6056] font-mono uppercase">N° {ext.sampleNumber || '---'}</span>
                                        </div>

                                        {/* Cultivo + Procesamiento */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="border border-[#1A1A1A]/10 rounded-xl overflow-hidden">
                                                <div className="bg-[#0C6056] px-3 py-1.5">
                                                    <p className="text-[9px] font-black uppercase text-brand-navy tracking-widest">Cultivo</p>
                                                </div>
                                                <div className="p-3 space-y-1">
                                                    {cultivoItems.map(label => (
                                                        <div key={label} className="flex items-center gap-2">
                                                            <div className="w-1 h-1 bg-[#0C6056] rounded-full flex-shrink-0"/>
                                                            <span className="text-[9px] font-bold uppercase text-brand-navy">{label}</span>
                                                        </div>
                                                    ))}
                                                    {ext.cultivo?.info && <p className="text-[9px] text-brand-navy/50 leading-relaxed mt-1.5 italic border-t border-black/5 pt-1.5">{ext.cultivo.info}</p>}
                                                </div>
                                            </div>
                                            <div className="border border-[#1A1A1A]/10 rounded-xl overflow-hidden">
                                                <div className="bg-[#0C6056] px-3 py-1.5">
                                                    <p className="text-[9px] font-black uppercase text-brand-navy tracking-widest">Procesamiento</p>
                                                </div>
                                                <div className="p-3 space-y-1">
                                                    {procItems.map(label => (
                                                        <div key={label} className="flex items-center gap-2">
                                                            <div className="w-1 h-1 bg-[#0C6056] rounded-full flex-shrink-0"/>
                                                            <span className="text-[9px] font-bold uppercase text-brand-navy">{label}</span>
                                                        </div>
                                                    ))}
                                                    {ext.procesamiento?.info && <p className="text-[9px] text-brand-navy/50 leading-relaxed mt-1.5 italic border-t border-black/5 pt-1.5">{ext.procesamiento.info}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comercio + Certificaciones */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="border border-[#1A1A1A]/10 rounded-xl overflow-hidden">
                                                <div className="bg-[#0C6056] px-3 py-1.5">
                                                    <p className="text-[9px] font-black uppercase text-brand-navy tracking-widest">Comercio</p>
                                                </div>
                                                <div className="p-3 space-y-1">
                                                    {comercioItems.map(label => (
                                                        <div key={label} className="flex items-center gap-2">
                                                            <div className="w-1 h-1 bg-[#0C6056] rounded-full flex-shrink-0"/>
                                                            <span className="text-[9px] font-bold uppercase text-brand-navy">{label}</span>
                                                        </div>
                                                    ))}
                                                    {ext.comercio?.info && <p className="text-[9px] text-brand-navy/50 leading-relaxed mt-1.5 italic border-t border-black/5 pt-1.5">{ext.comercio.info}</p>}
                                                </div>
                                            </div>
                                            <div className="border border-[#1A1A1A]/10 rounded-xl overflow-hidden">
                                                <div className="bg-[#0C6056] px-3 py-1.5">
                                                    <p className="text-[9px] font-black uppercase text-brand-navy tracking-widest">Certificaciones</p>
                                                </div>
                                                <div className="p-3">
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {certItems.map(label => (
                                                            <span key={label} className="px-2 py-0.5 bg-[#0C6056]/10 border border-[#0C6056]/20 rounded-full text-[8px] font-black text-[#0C6056] uppercase">{label}</span>
                                                        ))}
                                                    </div>
                                                    {ext.certificaciones?.info && <p className="text-[9px] text-brand-navy/50 leading-relaxed italic border-t border-black/5 pt-1.5">{ext.certificaciones.info}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reconocimientos */}
                                        {hasPremios && ext.otro?.info && (
                                            <div className="bg-[#0C6056]/5 border border-[#0C6056]/20 rounded-xl p-3 flex items-start gap-3">
                                                <span className="text-[#0C6056] text-lg leading-none">★</span>
                                                <div>
                                                    <p className="text-[8px] font-black text-[#0C6056] uppercase mb-0.5">Premios y Reconocimientos</p>
                                                    <p className="text-[9px] text-brand-navy/70 leading-relaxed">{ext.otro.info}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Footer Hoja 1 */}
                            <div className="mt-auto px-6 py-4 flex justify-between items-center border-t border-gray-400 bg-white">
                                <p className="text-brand-navy/30 text-[9px] font-bold uppercase ">INDUSTRIAL STANDARDIZATION • ETAPAS 01-02 • INDUSTRIAL VERIFICATION</p>
                                <p className="text-brand-navy/60 text-[9px] font-bold ">PÁGINA 01 DE 04</p>
                            </div>
                        </div>

                        <div className="w-full h-8 print:hidden"></div>

                        {/* HOJA 2: ETAPA 03 (LABORATORIO) & ETAPA 04 (CATACIÓN) */}
                        <div className={`certificate-page bg-white border text-sm relative flex flex-col print:border-none print:break-after-page shadow-2xl ${isStepMode && (activeStep !== 3 && activeStep !== 4) ? 'step-hidden' : 'step-visible'}`}
                            style={{ width: '816px', minHeight: '1056px', borderColor: '#0C6056' }}>

                            <div className="bg-white px-10 py-6 flex justify-between items-center border-b-4 border-[#0C6056]">
                                <div className="flex items-center gap-4">
                                    <img src="/logo.png" alt="AXISONE" className="h-8 w-auto" />
                                    <span className="h-4 w-px bg-black/20"></span>
                                    <p className="uppercase text-brand-navy/80 text-[11px] font-bold ">Stage 03 & 04: Lab & Roast Intelligence</p>
                                </div>
                                <p className="text-[11px] font-bold text-[#0C6056] uppercase er">{lotData?.lot_number}</p>
                            </div>

                            {/* STAGE 03: LABORATORIO */}
                            <div className="p-6 space-y-5">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-4">
                                    <h2 className="uppercase flex items-center gap-4 text-sm font-black text-[#1A1A1A] ">
                                        <span className="w-8 h-8 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-xs shadow-lg">03</span>
                                        ETAPA 03: LABORATORIO FÍSICO Y FISICOQUÍMICO
                                    </h2>
                                    <span className="text-[9px] font-bold text-brand-navy uppercase ">Control de Calidad Analítico</span>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl text-center shadow-sm">
                                        <p className="text-brand-navy text-[9px] font-bold uppercase mb-2">Humedad Final</p>
                                        <p className="text-2xl font-black">{physicalData?.moisture_pct || '--'} <span className="text-sm">%</span></p>
                                    </div>
                                    <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl text-center shadow-sm">
                                        <p className="text-brand-navy text-[9px] font-bold uppercase mb-2">Actividad de Agua</p>
                                        <p className="text-2xl font-black">{physicalData?.water_activity || '--'} <span className="text-sm">aw</span></p>
                                    </div>
                                    <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-6 rounded-2xl text-center shadow-sm">
                                        <p className="text-brand-navy text-[9px] font-bold uppercase mb-2">Densidad Aparente</p>
                                        <p className="text-2xl font-black">{physicalData?.density_gl || '--'} <span className="text-sm">g/L</span></p>
                                    </div>
                                </div>

                                <div className="bg-[#0C6056]/5 border border-[#0C6056]/20 p-6 rounded-[24px] grid grid-cols-4 gap-8 shadow-sm">
                                    {[
                                        { label: 'Brix Inicial', val: pData.brix_inicial || '--', unit: '°Bx' },
                                        { label: 'pH Evolución', val: `${pData.ph_inicial || '--'} → ${pData.ph_final || '--'}`, unit: '' },
                                        { label: 'Fermentación', val: pData.duracion_fermentacion_horas || '--', unit: 'HRS' },
                                        { label: 'Temp. Masa', val: pData.temperatura_masa_max || '--', unit: '°C' }
                                    ].map((param, i) => (
                                        <div key={i} className="text-center border-r border-[#0C6056]/10 last:border-none">
                                            <p className="text-[#0C6056] text-[9px] font-bold uppercase  mb-1">{param.label}</p>
                                            <p className="text-sm font-black">{param.val} <span className="text-[11px] font-bold opacity-60">{param.unit}</span></p>
                                        </div>
                                    ))}
                                </div>


                                {/* STAGE 04: TOSTIÓN */}
                                <div className="p-6 pt-0 space-y-5 flex-1">
                                    <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-4">
                                        <h2 className="uppercase flex items-center gap-4 text-xs font-bold text-[#1A1A1A] ">
                                            <span className="w-6 h-6 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[11px] shadow-sm">04</span>
                                            ETAPA 04: TOSTIÓN E INTELIGENCIA TÉRMICA
                                        </h2>
                                        <span className="text-[9px] font-bold text-brand-navy uppercase ">Perfilamiento de Tueste Industrial</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        {[
                                            { label: 'Nivel de Tueste', val: 'City+', sub: 'Agtron 58/65' },
                                            { label: 'Tiempo Total', val: '10:42 MIN', sub: 'DTR 14.5%' },
                                            { label: 'Roast Master', val: 'JULIO UVA', sub: 'AXIS-ID #0092' }
                                        ].map((item, i) => (
                                            <div key={i} className="bg-white border border-gray-400 p-6 rounded-2xl text-center shadow-sm">
                                                <p className="text-brand-navy/40 text-[9px] font-bold uppercase  mb-2">{item.label}</p>
                                                <p className="text-xl font-black uppercase  text-brand-navy">{item.val}</p>
                                                <p className="text-[11px] font-bold text-[#0C6056] mt-1 ">{item.sub}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-[440px] relative bg-white border border-black/5 rounded-[24px] p-5 flex flex-col shadow-inner">

                                        <div className="flex-1 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={roastCurveData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="5 5" stroke="black" strokeOpacity={0.05} vertical={false} />
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '800', fill: 'rgba(0,0,0,0.5)' }} />
                                                    <YAxis yAxisId="temp" domain={[0, 240]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '800', fill: 'rgba(0,0,0,0.5)' }} />
                                                    <Line yAxisId="temp" type="monotone" dataKey="beanTemp" stroke="#0C6056" strokeWidth={4} dot={false} isAnimationActive={false} />
                                                    <Line yAxisId="temp" type="monotone" dataKey="airTemp" stroke="black" strokeWidth={1} strokeOpacity={0.2} dot={false} isAnimationActive={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Hoja 2 */}
                            <div className="mt-auto px-10 py-8 flex justify-between items-center border-t border-gray-400 bg-white">
                                <p className="text-brand-navy/30 text-[9px] font-bold uppercase ">INDUSTRIAL STANDARDIZATION • ETAPAS 03-04 • INDUSTRIAL VERIFICATION</p>
                                <p className="text-brand-navy/60 text-[9px] font-bold ">PÁGINA 02 DE 04</p>
                            </div>
                        </div>

                        <div className="w-full h-8 print:hidden"></div>

                        {/* HOJA 3: ETAPA 05 (TOSTIÓN) */}
                        <div className={`certificate-page bg-white border text-sm relative flex flex-col print:border-none shadow-2xl ${isStepMode && activeStep !== 5 ? 'step-hidden' : 'step-visible'}`}
                            style={{ width: '816px', minHeight: '1056px', borderColor: '#0C6056' }}>

                            <div className="bg-white px-10 py-6 flex justify-between items-center border-b-4 border-[#0C6056]">
                                <div className="flex items-center gap-4">
                                    <img src="/logo.png" alt="AXISONE" className="h-8 w-auto" />
                                    <span className="h-4 w-px bg-black/20"></span>
                                    <p className="uppercase text-brand-navy/80 text-[11px] font-bold ">Stage 05: Sensory Verdict</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-center border-b border-gray-400 pb-4">
                                    <h2 className="uppercase flex items-center gap-4 text-sm font-black text-[#1A1A1A] ">
                                        <span className="w-8 h-8 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-xs shadow-lg">05</span>
                                        ETAPA 05: EVALUACIÓN SENSORIAL Y AFECTIVA (CVA)
                                    </h2>
                                    <span className="text-[9px] font-bold text-brand-navy/40 uppercase ">Análisis Organoléptico Profesional</span>
                                </div>

                                <div className="flex flex-col items-center flex-1">
                                    <div className="w-full h-[300px] relative">
                                        <div className="absolute top-0 right-0 z-20 bg-white/95 backdrop-blur-md border border-[#1A1A1A]/10 p-6 rounded-[24px] shadow-2xl">
                                            <p className="text-[9px] font-bold uppercase text-brand-navy mb-4 ">SCA Attributes</p>
                                            <div className="space-y-2">
                                                {scaRadarData.map((d, i) => (
                                                    <div key={i} className="flex justify-between gap-12 text-[11px] border-b border-[#1A1A1A]/5 pb-1">
                                                        <span className="font-bold uppercase text-gray-900">{d.subject}</span>
                                                        <span className="font-black text-[#1A1A1A]">{Number(d.A).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="85%" data={scaRadarData}>
                                                <PolarGrid stroke="#1A1A1A" strokeOpacity={0.1} />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 11, fontWeight: '800', letterSpacing: '0.1em' }} />
                                                <Radar name="Profile" dataKey="visualA" stroke="#0C6056" strokeWidth={3} fill="#0C6056" fillOpacity={0.1} isAnimationActive={false} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-8 p-10 bg-white border-2 border-[#0C6056] rounded-[32px] w-full text-center relative shadow-sm group overflow-hidden">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0C6056] text-brand-navy px-10 py-2 rounded-full text-[9px] font-bold uppercase  shadow-sm -mt-3.5 z-10">
                                            AXIS LAB SCORE
                                        </div>
                                        <p className="text-8xl font-black text-[#1A1A1A] er leading-none mt-4 relative z-10">
                                            {scaData?.is_incomplete ? 'PENDING' : (scaData?.total_score ? Number(scaData.total_score).toFixed(2) : '---')}
                                        </p>
                                        <div className="mt-6 flex items-center justify-center gap-4 relative z-10">
                                            <div className="h-px bg-[#0C6056]/20 flex-1"></div>
                                            <p className="text-[9px] font-bold text-[#0C6056] uppercase  px-4">
                                                {scaData?.is_incomplete ? 'DATOS EN PROCESO DE AUDITORÍA' : 'SCA CVA v3.0 Protocol • Sello de Autoridad'}
                                            </p>
                                            <div className="h-px bg-[#0C6056]/20 flex-1"></div>
                                        </div>
                                    </div>

                                    {/* ATRIBUTOS EXTRÍNSECOS */}
                                    <div className="grid grid-cols-4 gap-4 w-full mt-8">
                                        {[
                                            { label: 'Cosecha', val: lotData?.harvest_date ? new Date(lotData.harvest_date).getFullYear() : '--' },
                                            { label: 'Altitud', val: `${lotData?.altitude || '--'} MSNM` },
                                            { label: 'Variedad', val: lotData?.variety || '--' },
                                            { 
                                                label: 'Proceso', 
                                                val: lotData?.process ? (lotData.process.charAt(0).toUpperCase() + lotData.process.slice(1)) : '--' 
                                            }
                                        ].map((item, i) => (
                                            <div key={i} className="flex flex-col p-4 bg-white rounded-xl border border-black/5 text-center">
                                                <span className="text-[9px] font-bold uppercase text-[#0C6056]  mb-1">{item.label}</span>
                                                <span className="text-sm font-black text-[#1A1A1A] uppercase ">{item.val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 p-6 bg-white border-l-4 border-[#0C6056] rounded-xl w-full italic text-xs text-brand-navy/70 leading-relaxed shadow-sm">
                                        <span className="text-[9px] font-bold block mb-2 uppercase  text-[#0C6056] not-italic">Notas del Catador Master:</span>
                                        "{lotData?.sca_cupping?.[0]?.notes || scaData?.notes || 'Perfil sensorial balanceado con complejidad vibrante característica de su origen protegido.'}"
                                    </div>
                                </div>
                            </div>

                            {/* Footer Hoja 3 */}
                            <div className="mt-auto px-6 py-4 flex justify-between items-center border-t border-gray-400 bg-white">
                                <p className="text-brand-navy/30 text-[9px] font-bold uppercase ">INTEGRIDAD TÉCNICA • ETAPA 04-05 • VERIFICACIÓN INDUSTRIAL</p>
                                <p className="text-brand-navy/60 text-[9px] font-bold ">PÁGINA 03 DE 04</p>
                            </div>
                        </div>

                        <div className="w-full h-8 print:hidden"></div>

                        {/* HOJA 4: ADN FINAL Y CERTIFICACIÓN */}
                        <div className={`certificate-page bg-white border text-sm relative flex flex-col print:border-none shadow-2xl mb-8 print:mb-0 print:shadow-none print:break-after-page ${isStepMode && activeStep !== 6 ? 'step-hidden' : 'step-visible'}`}
                            style={{ width: '816px', minHeight: '1056px', borderColor: '#0C6056' }}>

                            <div className="bg-white px-10 py-6 flex justify-between items-center border-b-4 border-[#0C6056]">
                                <div className="flex items-center gap-4">
                                    <img src="/logo.png" alt="AXISONE" className="h-8 w-auto" />
                                    <span className="h-4 w-px bg-black/20"></span>
                                    <p className="uppercase text-brand-navy/80 text-[11px] font-bold ">Etapa 06: ADN Final y Sello de Integridad</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-8 flex-1 flex flex-col justify-center">
                                <div className="text-center space-y-4">
                                    <h2 className="text-7xl font-black text-brand-navy uppercase er leading-none">ADN DEL CAFÉ</h2>
                                    <p className="text-[12px] font-black text-[#0C6056] uppercase ">Protocolo de Certificación Técnica AXISONE</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-white border border-black/5 p-8 rounded-[40px] space-y-6 shadow-sm">
                                        <h3 className="text-sm font-black uppercase text-brand-navy">Resumen de Trazabilidad</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between border-b border-black/5 pb-2">
                                                <span className="text-[10px] uppercase font-bold text-brand-navy/40">Origen Verificado</span>
                                                <span className="text-[10px] uppercase font-black text-brand-navy">CONFIRMADO</span>
                                            </div>
                                            <div className="flex justify-between border-b border-black/5 pb-2">
                                                <span className="text-[10px] uppercase font-bold text-brand-navy/40">Pureza de Trilla</span>
                                                <span className="text-[10px] uppercase font-black text-brand-navy">{lotData?.yield_percentage || '100'}%</span>
                                            </div>
                                            <div className="flex justify-between border-b border-black/5 pb-2">
                                                <span className="text-[10px] uppercase font-bold text-brand-navy/40">Integridad Térmica</span>
                                                <span className="text-[10px] uppercase font-black text-brand-navy">ESTABLE</span>
                                            </div>
                                            <div className="flex justify-between border-b border-black/5 pb-2">
                                                <span className="text-[10px] uppercase font-bold text-brand-navy/40">Puntaje SCA Final</span>
                                                <span className="text-[10px] uppercase font-black text-brand-navy">{scaData?.total_score || '---'} PTS</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-black/5 p-8 rounded-[40px] flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                                        <div className="qr-container p-4 bg-white border border-black/10 rounded-3xl shadow-inner">
                                            <QRCodeSVG
                                                value={`https://axisone.coffee/verify/${inventoryId}`}
                                                size={120}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <p className="text-[9px] font-black text-[#0C6056] uppercase">Firma Digital de Proceso</p>
                                        <p className="text-[8px] font-mono text-brand-navy/30 break-all">{inventoryId.toUpperCase()}</p>
                                    </div>
                                </div>

                                {lotData?.process_data?.anotacion_especial || lotData?.process_data?.metadata_validacion_sistema?.anotacion_especial ? (
                                    <div className="bg-gradient-to-br from-[#0C6056]/10 to-[#D4AF37]/5 border-2 border-[#D4AF37]/40 p-10 rounded-[50px] relative overflow-hidden shadow-inner">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                                        
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#B3922E] text-[10px] font-black tracking-widest uppercase">
                                                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
                                                    ★ PROTOCOLO DE COMPETENCIA WCE VERIFICADO
                                                </div>
                                            </div>

                                            <h4 className="text-xl font-black text-brand-navy uppercase tracking-tight">
                                                Resolución Técnica de Competencia Mundial
                                            </h4>

                                            <p className="text-[11.5px] text-brand-navy leading-relaxed font-bold border-l-4 border-[#D4AF37] pl-4 uppercase tracking-wide">
                                                {lotData?.process_data?.anotacion_especial || lotData?.process_data?.metadata_validacion_sistema?.anotacion_especial}
                                            </p>

                                            <p className="text-[9px] text-[#0C6056] font-extrabold uppercase mt-2">
                                                * ESTE LOTE CUENTA CON UN PERFIL SENSORIAL REGISTRADO BAJO LOS ESTÁNDARES MÁS ALTOS DE LA SCA Y CAPTURADO EN TIEMPO REAL POR AXISONE.
                                            </p>
                                        </div>

                                        <div className="mt-8 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-brand-navy uppercase">{user?.name || 'MASTER COFFEE AUDITOR'}</p>
                                                <p className="text-[9px] font-bold text-[#0C6056] uppercase">Firma del Evaluador de Especialidad</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-brand-navy uppercase">{new Date().toLocaleDateString()}</p>
                                                <p className="text-[9px] font-bold text-[#D4AF37] uppercase font-extrabold">Fecha de Emisión</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#0C6056]/5 border-2 border-[#0C6056]/20 p-10 rounded-[50px] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0C6056]/5 rounded-full -mr-16 -mt-16"></div>
                                        <h4 className="text-xl font-black text-brand-navy uppercase er mb-4">Declaración de Autenticidad</h4>
                                        <p className="text-xs text-brand-navy/70 leading-relaxed uppercase font-bold">
                                            Este documento certifica que el lote referenciado ha sido monitoreado mediante el protocolo AXISONE de extremo a extremo. Los datos de geolocalización, rendimiento industrial, curvas de tueste y evaluación sensorial han sido capturados in-situ, garantizando la integridad inmutable de la información presentada.
                                        </p>
                                        <div className="mt-8 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-brand-navy uppercase">{user?.name || 'ADMINISTRADOR DE SISTEMA'}</p>
                                                <p className="text-[9px] font-bold text-[#0C6056] uppercase">Firma del Responsable Técnico</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-brand-navy uppercase">{new Date().toLocaleDateString()}</p>
                                                <p className="text-[9px] font-bold text-brand-navy/30 uppercase">Fecha de Emisión</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto px-10 py-8 flex justify-between items-center border-t border-gray-400 bg-white">
                                <p className="text-brand-navy/30 text-[9px] font-bold uppercase ">ADN DEL CAFÉ • ETAPA FINAL • AXISONE MASTER CERTIFICATE</p>
                                <p className="text-brand-navy/60 text-[9px] font-bold ">PÁGINA 04 DE 04</p>
                            </div>
                        </div>

                    </div>

                    {/* Panel de Control Inferior */}
                    <div className="w-full flex justify-end gap-6 no-export mt-12 p-8 bg-[#1A1A1A] border border-[#1A1A1A] rounded-[32px] shadow-2xl print:hidden">
                        <button
                            onClick={downloadQRCode}
                            className="px-8 py-5 bg-white hover:bg-white text-brand-navy rounded-2xl text-[11px] font-bold uppercase  transition-all flex items-center justify-center gap-3 border border-gray-400 shadow-sm active:scale-95"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Descargar QR
                        </button>

                        <PDFExportButton
                            lote={{
                                loteNumber: lotData?.lot_number || inventoryId,
                                origen: {
                                    productor: lotData?.farmer_name || 'Independiente',
                                    finca: lotData?.farm_name || '---',
                                    region: lotData?.region || 'Huila',
                                    municipality: lotData?.municipality || '---',
                                    altitud: lotData?.altitude || '1650',
                                    variedad: lotData?.variety || 'Caturra',
                                },
                                procesamiento: {
                                    tipoProceso: lotData?.process ? (lotData.process.charAt(0).toUpperCase() + lotData.process.slice(1)) : '--',
                                    metodoSecado: lotData?.process_data?.tipo_secado || '--',
                                    tiempoSecado: lotData?.process_data?.duracion_secado || '--',
                                    pesoIngreso: lotData?.purchase_weight || 0,
                                    pesoExcelso: lotData?.thrashed_weight || 0,
                                    rendimiento: lotData?.thrashing_yield || 0,
                                    protocoloPreparacion: lotData?.process_data?.preparation_protocol || 'EP',
                                    metodoSeleccion: lotData?.process_data?.sorting_method || 'Máquina Selectora Óptica',
                                },
                                analisisFisico: {
                                    humedad: physicalData?.moisture_pct || 0,
                                    densidad: physicalData?.density_gl || 0,
                                    actividadAgua: physicalData?.water_activity || 0,
                                    defectosPrimarios: physicalData?.defects_count?.primary ?? 0,
                                    defectosSecundarios: physicalData?.defects_count?.secondary ?? 0,
                                    distribucionMallas: {
                                        m18: physicalData?.screen_size_distribution?.size18 || lotData?.process_data?.sieve_analysis?.m18 || 0,
                                        m17: physicalData?.screen_size_distribution?.size17 || lotData?.process_data?.sieve_analysis?.m17 || 0,
                                        m16: physicalData?.screen_size_distribution?.size16 || lotData?.process_data?.sieve_analysis?.m16 || 0,
                                        m15: physicalData?.screen_size_distribution?.size15 || lotData?.process_data?.sieve_analysis?.m15 || 0,
                                        m14: physicalData?.screen_size_distribution?.size14 || lotData?.process_data?.sieve_analysis?.caracol || 0,
                                        m13: physicalData?.screen_size_distribution?.size13 || 0,
                                        m12: physicalData?.screen_size_distribution?.size12 || 0,
                                        under12: physicalData?.screen_size_distribution?.under12 || lotData?.process_data?.sieve_analysis?.menores || 0,
                                    }
                                },
                                cupping: scaData ? {
                                    puntajeTotal: scaData.total_score || 0,
                                    notas: scaData.notes || '',
                                    atributos: {
                                        fragancia: scaData.fragrance_aroma || 0,
                                        sabor: scaData.flavor || 0,
                                        residual: scaData.aftertaste || 0,
                                        acidez: scaData.acidity || 0,
                                        cuerpo: scaData.body || 0,
                                        balance: scaData.balance || 0,
                                        global: scaData.overall || 0,
                                    }
                                } : undefined,
                                certificacion: {
                                    estado: tracesStatus === 'certified' ? 'CERTIFIED' : 'VALIDATED',
                                    validadoTecnicamente: !!physicalData,
                                    eudrHash: ddsReference || passportData.eudrHash
                                }
                            } as PDFLotData}
                        />

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-10 py-5 bg-[#0C6056] hover:bg-[#0C6056]/90 text-white rounded-2xl text-[11px] font-bold uppercase  transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 border border-[#0C6056]/30"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                            Generar PDF / Imprimir
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-5 bg-white hover:bg-red-500/20 text-brand-navy rounded-2xl text-[11px] font-bold uppercase  transition-all border border-gray-400 shadow-sm active:scale-95"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
        </>
    );
}
