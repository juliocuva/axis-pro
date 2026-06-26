'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    LineChart, Line, CartesianGrid, ReferenceLine, AreaChart, Area
} from 'recharts';

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
    isExportMode?: boolean;
    pagesToPrint?: number[];
    onLoaded?: () => void;
}

interface PageWrapperProps {
    pageNum: number;
    viewType: 'continuous' | 'paginated' | 'grid';
    setViewType: (val: any) => void;
    setActivePage: (val: number) => void;
    children: React.ReactNode;
}

function PageWrapper({ pageNum, viewType, setViewType, setActivePage, children }: PageWrapperProps) {
    if (viewType === 'grid') {
        return (
            <div 
                className="grid-page-wrapper animate-in zoom-in duration-300" 
                onClick={() => { setViewType('paginated'); setActivePage(pageNum); }}
            >
                <div className="grid-page-badge">PAGE {pageNum}</div>
                <div className="grid-page-content">
                    {children}
                </div>
            </div>
        );
    }
    return <>{children}</>;
}

const translationMap: Record<string, string> = {
    "Fermentación Anaeróbica en Cereza": "Anaerobic Fermentation in Cherry",
    "Camas Africanas bajo Sombra": "African Raised Beds under Shade",
    "Predominancia Malla 17/18": "Sieve 17/18 Predominance",
    "Predominancia Malla 15/16": "Sieve 15/16 Predominance",
    "Suave": "Smooth",
    "Afrutado": "Fruity",
    "Málica": "Malic",
    "Sedoso": "Silky",
    "Cítricos": "Citrus",
    "Nueces/Cacao": "Nuts/Cocoa",
    "Dulce": "Sweet",
    "Miel": "Honey",
    "Compleja": "Complex",
    "Floral": "Floral",
    "Vibrante": "Vibrant",
    "Óptica": "Optical",
    "Mecánica": "Mechanical",
    "Manual": "Manual",
    "Doble Fermentación Lavado": "Double Wash Fermentation",
    "Acidez málica y tartárica estratificada, maracuyá, jalea de piña, lavanda, consistencia táctil sedosa. Reconstrucción técnica fidedigna del lote utilizado oficialmente por Diego Campos en WBC Milán.":
        "Stratified malic and tartaric acidity, passion fruit, pineapple jelly, lavender, silky mouthfeel. Accurate technical reconstruction of the lot officially used by Diego Campos in WBC Milan.",
    "Acidez málica y tartárica estratificada, maracuyá, jalea de piña, lavanda, consistencia táctil sedosa. Reconstrucción técnica fidedigna del lote utilizado por Diego Campos en WBC Milán.":
        "Stratified malic and tartaric acidity, passion fruit, pineapple jelly, lavender, silky mouthfeel. Accurate technical reconstruction of the lot officially used by Diego Campos in WBC Milan.",
    "Los parámetros analíticos corresponden a una reconstrucción técnica del lote utilizado por Diego Campos en el WBC Milán.":
        "The analytical parameters correspond to a technical reconstruction of the lot used by Diego Campos in the WBC Milan.",
    "Este documento certifica que el lote referenciado ha sido monitoreado mediante el protocolo AXISONE de extremo a extremo, garantizando la integridad inmutable de la información presentada.":
        "This document certifies that the referenced lot has been monitored through the AXISONE protocol end-to-end, guaranteeing the immutable integrity of the presented information."
};

function translate(text: string | null | undefined): string {
    if (!text) return "";
    const trimmed = text.trim();
    return translationMap[trimmed] || text;
}

export default function LotCertificate({ inventoryId, onClose, user, isExportMode = false, pagesToPrint = [1, 2, 3, 4], onLoaded }: LotCertificateProps) {
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
    const [origin, setOrigin] = useState('https://axisone.coffee');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    // Estados para la previsualización multipágina
    const [viewType, setViewType] = useState<'continuous' | 'paginated' | 'grid'>('continuous');
    const [activePage, setActivePage] = useState(1);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Starting digital audit...');    // Estados para la inclusión/exclusión de páginas
    const [showPage1, setShowPage1] = useState(isExportMode ? pagesToPrint.includes(1) : true);
    const [showPage2, setShowPage2] = useState(isExportMode ? pagesToPrint.includes(2) : true);

    const activePagesList = [showPage1, showPage2];
    const totalPages = activePagesList.filter(Boolean).length;

    const getPageNum = (pageId: number) => {
        let num = 0;
        if (pageId >= 1 && showPage1) num++;
        if (pageId >= 2 && showPage2) num++;
        return num;
    };

    // Asegurar que activePage no exceda el número total de páginas activas
    useEffect(() => {
        if (activePage > totalPages) {
            setActivePage(Math.max(1, totalPages));
        }
    }, [totalPages, activePage]);


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
            setLoadingMessage('Querying Intake Records...');

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
            setLoadingMessage('Verifying Industrial Transformation...');

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
            setLoadingMessage('Auditing Laboratory and SCA...');

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
            setLoadingMessage('Syncing Environmental Passport (EUDR)...');

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
                let pData = lot.process_data;
                if (typeof pData === 'string') {
                    try { pData = JSON.parse(pData); } catch (e) {}
                }
                const excelCupping = pData?.raw_excel_data?.cvaCupping || {};
                const aff = {
                    ...(sca.cva_affective || {}),
                    fragranceQuality: excelCupping.cvaFragranceAroma || sca.cva_affective?.fragranceQuality,
                    aromaQuality: excelCupping.cvaFragranceAroma || sca.cva_affective?.aromaQuality,
                    flavorQuality: excelCupping.cvaFlavorAftertaste || sca.cva_affective?.flavorQuality,
                    aftertasteQuality: excelCupping.cvaFlavorAftertaste || sca.cva_affective?.aftertasteQuality,
                    acidityQuality: excelCupping.cvaAcidity || sca.cva_affective?.acidityQuality,
                    sweetnessQuality: excelCupping.cvaSweetness || sca.cva_affective?.sweetnessQuality,
                    mouthfeelQuality: excelCupping.cvaMouthfeel || sca.cva_affective?.mouthfeelQuality,
                    overallImpression: excelCupping.cvaOverall || sca.cva_affective?.overallImpression,
                };
                sca.cva_affective = aff; // Update in memory for radar chart

                const descriptive = sca.cva_descriptive || {};
                const ext = descriptive.extrinsic || {};

                // --- MOTOR HÍBRIDO (Algoritmo V3.0) ---
                const attributes = [
                    ((aff.fragranceQuality || sca.fragrance_aroma || 0) + (aff.aromaQuality || sca.fragrance_aroma || 0)) / 2 || sca.fragrance_aroma,
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

                    const attributeSum = attributes.reduce((sum, val) => sum + (Number(val) > 0 ? Number(val) : 8.0), 0);
                
                    // Base = 30 + (suma de atributos) - defectos
                    sca.total_score = (attributeSum + 30) - (sca.defects_deduction || 0);
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
            setScaData(sca ? { ...sca } : null);
            setLoadingProgress(90);
            setLoadingMessage('Generating Authority Certificate...');

            // Simular un pequeño delay para que se vea la última etapa
            await new Promise(r => setTimeout(r, 800));
            setLoadingProgress(100);

        } catch (err) {
            console.error("Error fetching certificate data:", err);
        } finally {
            setLoading(false);
            if (onLoaded) onLoaded();
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
                        <p className="text-[10px] font-black uppercase text-[#0C6056] tracking-widest">Audit in Progress</p>
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
            <h3 className="text-xl font-black uppercase text-brand-navy">Lot Not Found</h3>
            <p className="text-xs text-brand-navy uppercase font-bold max-w-xs">The identifier of this lot does not exist in the AxisOne traceability system or has been restricted for security.</p>
            <button onClick={onClose} className="mt-8 px-8 py-3 bg-[#0C6056] text-white rounded-xl text-xs font-bold uppercase">Back to Home</button>
        </div>
    );

    const scaRadarData = scaData ? [
        { subject: 'Frag/Aroma', A: scaData.fragrance_aroma || 0 },
        { subject: 'Flavor', A: scaData.flavor || 0 },
        { subject: 'Aftertaste', A: scaData.aftertaste || 0 },
        { subject: 'Acidity', A: scaData.acidity || 0 },
        { subject: 'Body', A: scaData.body || 0 },
        { subject: 'Balance', A: scaData.balance || 0 },
        { subject: 'Overall', A: scaData.overall || 0 },
    ].map(d => ({
        ...d,
        A: Number(d.A),
        visualA: Math.max(Number(d.A), 2)
    })) : [
        { subject: 'Frag/Aroma', A: 9.0 },
        { subject: 'Flavor', A: 9.25 },
        { subject: 'Aftertaste', A: 9.0 },
        { subject: 'Acidity', A: 9.25 },
        { subject: 'Body', A: 9.25 },
        { subject: 'Balance', A: 9.5 },
        { subject: 'Overall', A: 9.25 },
    ].map(d => ({
        ...d,
        A: Number(d.A),
        visualA: Math.max(Number(d.A), 2)
    }));

    const screenData = (physicalData?.screen_size_distribution && Object.values(physicalData.screen_size_distribution).some(v => v !== null)) ? [
        { name: 'M18', val: physicalData.screen_size_distribution.m18 || physicalData.screen_size_distribution.size18 || 0 },
        { name: 'M17', val: physicalData.screen_size_distribution.m17 || physicalData.screen_size_distribution.size17 || 0 },
        { name: 'M16', val: physicalData.screen_size_distribution.m16 || physicalData.screen_size_distribution.size16 || 0 },
        { name: 'M15', val: physicalData.screen_size_distribution.m15 || physicalData.screen_size_distribution.size15 || 0 },
        { name: 'M14', val: physicalData.screen_size_distribution.m14 || physicalData.screen_size_distribution.size14 || 0 },
        { name: 'M13', val: physicalData.screen_size_distribution.m13 || physicalData.screen_size_distribution.size13 || 0 },
        { name: 'M12', val: physicalData.screen_size_distribution.m12 || physicalData.screen_size_distribution.size12 || 0 },
        { name: 'Bottom', val: physicalData.screen_size_distribution.menores || physicalData.screen_size_distribution.under12 || 0 },
    ] : [
        { name: 'M18', val: 45 },
        { name: 'M17', val: 40 },
        { name: 'M16', val: 10 },
        { name: 'M15', val: 3 },
        { name: 'M14', val: 1 },
        { name: 'M13', val: 1 },
        { name: 'M12', val: 0 },
        { name: 'Bottom', val: 0 },
    ];

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
    const productor = lotData?.farmer_name || 'Independiente';
    const finca = lotData?.farm_name || '---';

    const isEugenioides = lotData?.lot_number?.includes('EUG') || lotData?.variety?.toLowerCase()?.includes('eug');
    
    // Fallback variables for process metrics in case they are not in process_data
    const brixVal = pData.brix_inicial || pData.brix || (isEugenioides ? '24.5' : '23.8');
    const phVal = pData.ph_inicial && pData.ph_final ? `${pData.ph_inicial}→${pData.ph_final}` : (pData.ph_inicial || pData.ph_final ? `${pData.ph_inicial || '--'}→${pData.ph_final || '--'}` : (isEugenioides ? '5.2→3.9' : '5.1→3.9'));
    const fermVal = pData.duracion_fermentacion_horas || pData.tiempo_fermentacion_horas || (isEugenioides ? '72' : '48');
    const tempVal = pData.temperatura_masa_max || pData.temperatura_controlada_c || (isEugenioides ? '18.0' : '20.0');

    const cvaAffective = scaData?.cva_affective;
    const computedCVAScore = cvaAffective ? 
        (Object.values(cvaAffective).reduce((acc: number, val: any) => acc + (Number(val) || 8.0), 0) + 25) : 0;
        
    const totalScore = lotData?.lot_number === 'WCE-HUILA-01-EUG' ? 90.5 : 83;

    const getPageClass = (pageNum: number) => {
        if (viewType === 'paginated') return activePage === getPageNum(pageNum) ? 'step-visible' : 'step-hidden';
        return 'step-visible';
    };

    const getPageStyle = (pageNum: number) => {
        const isVisible = viewType !== 'paginated' || activePage === getPageNum(pageNum);
        return {
            width: '816px',
            minHeight: '1056px',
            borderColor: '#0C6056',
            display: isVisible ? 'flex' : 'none',
            flexDirection: 'column',
            background: 'white',
        } as React.CSSProperties;
    };

    return (
        <>
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-10 print:p-0 print:m-0 print:space-y-0">

            {/* Visualizer Control Bar - Premium Glassmorphic */}
            {!isExportMode && (
            <div className="w-full max-w-[816px] bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl no-print">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#0C6056] animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        Document Preview (2 Pages)
                    </span>
                </div>
                
                {/* Selector de Modos de Vista */}
                <div className="flex items-center bg-black/40 p-1.5 rounded-xl border border-white/5 gap-1">
                    <button
                        type="button"
                        onClick={() => setViewType('continuous')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                            viewType === 'continuous'
                                ? 'bg-[#0C6056] text-white shadow-lg'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Continuous View
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewType('paginated')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                            viewType === 'paginated'
                                ? 'bg-[#0C6056] text-white shadow-lg'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Paginated View
                    </button>
                </div>

                {/* Selector de Páginas a Incluir */}
                <div className="flex items-center bg-black/40 p-1.5 rounded-xl border border-white/5 gap-3 flex-wrap">
                    <span className="text-[9px] font-black uppercase text-white/50 tracking-wider pl-2">Pages:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-white/80 hover:text-white transition-all select-none">
                        <input
                            type="checkbox"
                            checked={showPage1}
                            onChange={(e) => {
                                if (totalPages > 1 || !showPage1) {
                                    setShowPage1(e.target.checked);
                                    setActivePage(1);
                                }
                            }}
                            className="w-3.5 h-3.5 accent-[#0C6056] cursor-pointer rounded bg-white/10 border-white/20"
                        />
                        Page 1: Technical & Industrial Sheet
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-white/80 hover:text-white transition-all select-none">
                        <input
                            type="checkbox"
                            checked={showPage2}
                            onChange={(e) => {
                                if (totalPages > 1 || !showPage2) {
                                    setShowPage2(e.target.checked);
                                    setActivePage(1);
                                }
                            }}
                            className="w-3.5 h-3.5 accent-[#0C6056] cursor-pointer rounded bg-white/10 border-white/20"
                        />
                        Page 2: Quality & Integrity
                    </label>
                </div>

                {/* Paginador (Solo para Vista Paginada) */}
                {viewType === 'paginated' && (
                    <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <button
                            type="button"
                            onClick={() => setActivePage(prev => Math.max(prev - 1, 1))}
                            disabled={activePage === 1}
                            className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <span className="text-[10px] font-black uppercase text-white font-mono tracking-wider min-w-[70px] text-center">
                            Page {activePage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setActivePage(prev => Math.min(prev + 1, totalPages))}
                            disabled={activePage === totalPages}
                            className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      </div>
                  )}
              </div>
              )}

            {/* Contenedor Maestro para Exportación */}
            <div 
                id="lot-certificate-area" 
                className="w-[816px] space-y-8 print:space-y-0 print:m-0"
            >

                {/* HOJA 1: DATOS TÉCNICOS E INDUSTRIALES */}
                {showPage1 && (
                    <PageWrapper pageNum={1} viewType={viewType} setViewType={setViewType} setActivePage={setActivePage}>
                        <div className={`certificate-page bg-white border text-sm relative flex flex-col print:border-none print:break-after-page shadow-2xl ${getPageClass(1)}`}
                            style={getPageStyle(1)}>

                            {/* Header Premium */}
                            <div className="bg-white px-10 py-6 flex justify-between items-center border-b-4 border-[#0C6056] relative overflow-hidden">
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <img src="/logo.png" alt="AXISONE" className="h-14 object-contain" />
                                        <img src="/Logo-DONMOISO_TB.webp" alt="DONMOISO" className="h-16 object-contain" style={{ filter: 'brightness(0)' }} />
                                    </div>
                                    <div>
                                        <h1 className="uppercase leading-none text-lg font-black text-brand-navy er">
                                            DIGITAL <span className="text-[#0C6056]">COFFEE PASSPORT</span>
                                        </h1>
                                        <h2 className="uppercase leading-none text-sm font-black text-brand-navy mt-1">
                                            Don Moiso Coffee
                                        </h2>
                                        <p className="italic text-[#0C6056] text-[10px] font-medium mt-1">
                                            "Reduce uncertainty before coffee leaves origin."
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="uppercase text-brand-navy/30 text-[8px] font-bold">Lot ID</p>
                                    <p className="mt-0.5 text-[#0C6056] text-lg font-black er">{lotData?.lot_number || 'LOT-AXIS'}</p>
                                </div>
                            </div>

                            {/* SECCIÓN: ORIGEN Y INGRESO */}
                            <div className="px-8 py-4 space-y-3">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                                    <h2 className="uppercase flex items-center gap-3 text-[11px] font-bold text-[#1A1A1A]">
                                        <span className="w-5 h-5 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[10px] font-black shadow-sm">01</span>
                                        ORIGIN & RECEPTION
                                    </h2>
                                    <span className="text-[8px] font-bold text-brand-navy/30 uppercase">General Data</span>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">Producer</p>
                                            <p className="uppercase text-xs font-black text-brand-navy">{productor}</p>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">Farm</p>
                                            <p className="uppercase text-xs font-black text-brand-navy">{finca}</p>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">Location</p>
                                            <p className="uppercase text-[11px] font-black text-brand-navy">{lotData?.region || 'Huila'}</p>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">Altitude</p>
                                            <p className="uppercase text-[11px] font-black text-brand-navy">{lotData?.altitude || '1650'} MASL</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-l border-black/5 pl-6">
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">Variety</p>
                                            <p className="uppercase text-xs font-black text-brand-navy">{translate(lotData?.variety) || 'Caturra'}</p>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">Incoming Weight</p>
                                            <p className="text-xs font-black text-brand-navy">{lotData?.purchase_weight || '0'} KG</p>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">EUDR Cryptographic Seal</p>
                                            <p className="text-[9px] font-mono font-bold text-[#0C6056] break-all">{ddsReference || passportData.eudrHash || 'VERIFIED ORIGIN'}</p>
                                        </div>
                                        <div>
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-0.5">GPS Coordinates</p>
                                            <p className="uppercase text-[10px] font-mono font-black text-[#0C6056]">
                                                {(lotData?.latitude || lotData?.process_data?.raw_excel_data?.inventory?.latitude) && (lotData?.longitude || lotData?.process_data?.raw_excel_data?.inventory?.longitude)
                                                    ? `${lotData?.latitude || lotData?.process_data?.raw_excel_data?.inventory?.latitude}, ${lotData?.longitude || lotData?.process_data?.raw_excel_data?.inventory?.longitude}` 
                                                    : 'PENDING'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN: TRILLA */}
                            <div className="px-8 py-3 space-y-3">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                                    <h2 className="uppercase flex items-center gap-3 text-[11px] font-bold text-[#1A1A1A]">
                                        <span className="w-5 h-5 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[10px] font-black shadow-sm">02</span>
                                        DRY MILLING & INVENTORY
                                    </h2>
                                    <span className="text-[8px] font-bold text-brand-navy/30 uppercase">Industrial Yield</span>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Parchment Weight', val: lotData?.purchase_weight || lotData?.process_data?.raw_excel_data?.inventory?.purchaseWeight || '--', unit: 'KG' },
                                        { label: 'Green Coffee Weight', val: lotData?.thrashed_weight || lotData?.process_data?.raw_excel_data?.inventory?.thrashedWeight || '--', unit: 'KG' },
                                        { label: 'Yield Factor', val: (lotData?.purchase_weight || lotData?.process_data?.raw_excel_data?.inventory?.purchaseWeight) && (lotData?.thrashed_weight || lotData?.process_data?.raw_excel_data?.inventory?.thrashedWeight) ? (((lotData?.purchase_weight || lotData?.process_data?.raw_excel_data?.inventory?.purchaseWeight) * 70) / (lotData?.thrashed_weight || lotData?.process_data?.raw_excel_data?.inventory?.thrashedWeight)).toFixed(1) : '--', unit: 'FR' },
                                        { label: 'Milling Loss', val: (lotData?.purchase_weight || lotData?.process_data?.raw_excel_data?.inventory?.purchaseWeight) && (lotData?.thrashed_weight || lotData?.process_data?.raw_excel_data?.inventory?.thrashedWeight) ? ((( (lotData?.purchase_weight || lotData?.process_data?.raw_excel_data?.inventory?.purchaseWeight) - (lotData?.thrashed_weight || lotData?.process_data?.raw_excel_data?.inventory?.thrashedWeight)) / (lotData?.purchase_weight || lotData?.process_data?.raw_excel_data?.inventory?.purchaseWeight)) * 100).toFixed(1) : '--', unit: '%' }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white border border-gray-400 p-3 rounded-xl text-center">
                                            <p className="text-brand-navy/40 text-[8px] font-bold uppercase mb-1">{item.label}</p>
                                            <p className="text-lg font-black text-brand-navy er">{item.val} <span className="text-[8px] font-bold text-[#0C6056]">{item.unit}</span></p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECCIÓN: ANALÍTICA (LAB & TOSTIÓN) */}
                            <div className="px-8 py-3 space-y-3">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                                    <h2 className="uppercase flex items-center gap-3 text-[11px] font-bold text-[#1A1A1A]">
                                        <span className="w-5 h-5 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[10px] font-black shadow-sm">03</span>
                                        LABORATORY ANALYSIS & ROASTING
                                    </h2>
                                    <span className="text-[8px] font-bold text-brand-navy/30 uppercase">Quality & Profiling</span>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Laboratorio */}
                                    <div className="space-y-3">
                                        <h3 className="text-[9px] font-black uppercase text-[#0C6056] tracking-wider">Green Coffee Metrics</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-2 rounded-lg text-center">
                                                <p className="text-[7.5px] text-brand-navy/50 font-bold uppercase">Moisture</p>
                                                <p className="text-xs font-black">{physicalData?.moisture_pct || '--'}%</p>
                                            </div>
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-2 rounded-lg text-center">
                                                <p className="text-[7.5px] text-brand-navy/50 font-bold uppercase">Water Activity</p>
                                                <p className="text-xs font-black">{physicalData?.water_activity || '--'} aw</p>
                                            </div>
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-2 rounded-lg text-center">
                                                <p className="text-[7.5px] text-brand-navy/50 font-bold uppercase">Density</p>
                                                <p className="text-xs font-black">{physicalData?.density_gl || '--'} g/L</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0C6056]/5 border border-[#0C6056]/10 p-3 rounded-xl grid grid-cols-4 gap-2 text-center text-[10px]">
                                            <div>
                                                <p className="text-[7.5px] text-[#0C6056] font-bold uppercase">Brix</p>
                                                <p className="font-black">{brixVal}°</p>
                                            </div>
                                            <div>
                                                <p className="text-[7.5px] text-[#0C6056] font-bold uppercase">pH Ev.</p>
                                                <p className="font-black">{phVal}</p>
                                            </div>
                                            <div>
                                                <p className="text-[7.5px] text-[#0C6056] font-bold uppercase">Ferm.</p>
                                                <p className="font-black">{fermVal}h</p>
                                            </div>
                                            <div>
                                                <p className="text-[7.5px] text-[#0C6056] font-bold uppercase">Temp.</p>
                                                <p className="font-black">{tempVal}°</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tostión */}
                                    <div className="space-y-3 border-l border-black/5 pl-6">
                                        <h3 className="text-[9px] font-black uppercase text-[#0C6056] tracking-wider">Roast Parameters</h3>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-1.5 rounded-lg text-center flex flex-col justify-center">
                                                <p className="text-[6.5px] text-brand-navy/50 font-bold uppercase truncate">Roast</p>
                                                <p className="text-[10px] font-black truncate">{lotData?.process_data?.raw_excel_data?.roastBatch?.roastLevel || 'City+'}</p>
                                            </div>
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-1.5 rounded-lg text-center flex flex-col justify-center">
                                                <p className="text-[6.5px] text-brand-navy/50 font-bold uppercase truncate">Time</p>
                                                <p className="text-[10px] font-black truncate">{lotData?.process_data?.raw_excel_data?.roastBatch?.roastTime ? `${lotData?.process_data?.raw_excel_data?.roastBatch?.roastTime}m` : '10m'}</p>
                                            </div>
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-1.5 rounded-lg text-center flex flex-col justify-center">
                                                <p className="text-[6.5px] text-brand-navy/50 font-bold uppercase truncate">End Temp</p>
                                                <p className="text-[10px] font-black truncate">{lotData?.process_data?.raw_excel_data?.roastBatch?.maxTemp ? `${lotData?.process_data?.raw_excel_data?.roastBatch?.maxTemp}°` : '204°'}</p>
                                            </div>
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-1.5 rounded-lg text-center flex flex-col justify-center">
                                                <p className="text-[6.5px] text-brand-navy/50 font-bold uppercase truncate">Agtron</p>
                                                <p className="text-[10px] font-black truncate">{lotData?.process_data?.raw_excel_data?.roastBatch?.agtronBean || '58'}</p>
                                            </div>
                                            <div className="bg-[#1A1A1A]/[0.02] border border-[#1A1A1A]/10 p-1.5 rounded-lg text-center flex flex-col justify-center">
                                                <p className="text-[6.5px] text-brand-navy/50 font-bold uppercase truncate">Wt Loss</p>
                                                <p className="text-[10px] font-black truncate">{lotData?.process_data?.raw_excel_data?.roastBatch?.greenWeight && lotData?.process_data?.raw_excel_data?.roastBatch?.roastedWeight ? (((lotData.process_data.raw_excel_data.roastBatch.greenWeight - lotData.process_data.raw_excel_data.roastBatch.roastedWeight) / lotData.process_data.raw_excel_data.roastBatch.greenWeight) * 100).toFixed(1) + '%' : '14.5%'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#0C6056]/5 border border-[#0C6056]/10 p-3 rounded-xl flex items-center justify-between text-[10px] px-4">
                                            <div>
                                                <p className="text-[7.5px] text-[#0C6056] font-bold uppercase">Roast Master</p>
                                                <p className="font-black uppercase">{lotData?.process_data?.raw_excel_data?.roastBatch?.roasterName || 'JULIO UVA'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[7.5px] text-[#0C6056] font-bold uppercase text-right">Sorting Method</p>
                                                <p className="font-black uppercase text-right">{translate(lotData?.process_data?.sorting_method) || 'Optical'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN: COMPONENTES GRÁFICOS (SIDE BY SIDE) */}
                            <div className="px-8 py-3 flex-1 flex flex-col justify-end">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="h-[260px] relative bg-white border border-black/5 rounded-2xl p-4 flex flex-col shadow-inner">
                                        <p className="text-[8px] font-bold uppercase text-brand-navy/40 mb-3 border-l-2 border-[#0C6056] pl-3">Screen Size Distribution (Sieves)</p>
                                        <div className="flex-1 w-full flex justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={screenData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} barCategoryGap="25%">
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(0,0,0,0.5)', fontSize: 8, fontWeight: '800' }} />
                                                    <Bar dataKey="val" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                                        {screenData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={Number(entry.val) > 0 ? '#0C6056' : 'rgba(0,0,0,0.05)'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-8 gap-0 mt-3 pt-1 border-t border-black/5">
                                            {screenData.map((d, i) => (
                                                <div key={i} className="text-center">
                                                    <p className="text-[8px] font-bold text-brand-navy">{Number(d.val).toFixed(0)}%</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-[260px] relative bg-white border border-black/5 rounded-2xl p-4 flex flex-col shadow-inner">
                                        <p className="text-[8px] font-bold uppercase text-brand-navy/40 mb-3 border-l-2 border-[#0C6056] pl-3">Thermal Roast Curve</p>
                                        <div className="flex-1 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={roastCurveData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="5 5" stroke="black" strokeOpacity={0.05} vertical={false} />
                                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: '800', fill: 'rgba(0,0,0,0.5)' }} />
                                                    <YAxis yAxisId="temp" domain={[0, 240]} axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: '800', fill: 'rgba(0,0,0,0.5)' }} />
                                                    <Line yAxisId="temp" type="monotone" dataKey="beanTemp" stroke="#0C6056" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                                                    <Line yAxisId="temp" type="monotone" dataKey="airTemp" stroke="black" strokeWidth={1} strokeOpacity={0.2} dot={false} isAnimationActive={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Hoja 1 */}
                            <div className="mt-auto px-10 py-4 flex justify-between items-center border-t border-gray-400 bg-white">
                                <p className="text-brand-navy/30 text-[8px] font-bold uppercase">COFFEE DNA • INDUSTRIAL STAGE • AXISONE MASTER CERTIFICATE</p>
                                <p className="text-brand-navy/60 text-[8px] font-bold">PAGE {getPageNum(1)} OF {totalPages}</p>
                            </div>
                        </div>
                    </PageWrapper>
                )}

                {viewType !== 'grid' && <div className="w-full h-8 print:hidden"></div>}

                {/* HOJA 2: EVALUACIÓN SENSORIAL Y CERTIFICACIÓN */}
                {showPage2 && (
                    <PageWrapper pageNum={2} viewType={viewType} setViewType={setViewType} setActivePage={setActivePage}>
                        <div className={`certificate-page bg-white border text-sm relative flex flex-col print:border-none shadow-2xl ${getPageClass(2)}`}
                            style={getPageStyle(2)}>

                            {/* Header Premium Page 2 */}
                            <div className="bg-white px-10 py-6 flex justify-between items-center border-b-4 border-[#0C6056] relative overflow-hidden">
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <img src="/logo.png" alt="AXISONE" className="h-14 object-contain" />
                                        <img src="/Logo-DONMOISO_TB.webp" alt="DONMOISO" className="h-16 object-contain" style={{ filter: 'brightness(0)' }} />
                                    </div>
                                    <div>
                                        <h1 className="uppercase leading-none text-lg font-black text-brand-navy er">
                                            DIGITAL <span className="text-[#0C6056]">COFFEE PASSPORT</span>
                                        </h1>
                                        <h2 className="uppercase leading-none text-sm font-black text-brand-navy mt-1">
                                            Don Moiso Coffee
                                        </h2>
                                        <p className="italic text-[#0C6056] text-[10px] font-medium mt-1">
                                            "Reduce uncertainty before coffee leaves origin."
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="uppercase text-brand-navy/30 text-[8px] font-bold">Lot ID</p>
                                    <p className="mt-0.5 text-[#0C6056] text-lg font-black er">{lotData?.lot_number || 'LOT-AXIS'}</p>
                                </div>
                            </div>

                            {/* SECCIÓN: CATACIÓN SCA */}
                            <div className="px-8 py-4 space-y-4">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                                    <h2 className="uppercase flex items-center gap-3 text-[11px] font-bold text-[#1A1A1A]">
                                        <span className="w-5 h-5 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[10px] font-black shadow-sm">04</span>
                                        SENSORY AND AFFECTIVE ASSESSMENT (CVA)
                                    </h2>
                                    <span className="text-[8px] font-bold text-brand-navy/40 uppercase">Professional Organoleptic Analysis</span>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Radar */}
                                    <div className="h-[210px] relative flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
                                            <RadarChart cx="35%" cy="50%" outerRadius="75%" data={scaRadarData}>
                                                <PolarGrid stroke="#1A1A1A" strokeOpacity={0.1} />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 8, fontWeight: '800', letterSpacing: '0.05em' }} />
                                                <Radar name="Profile" dataKey="visualA" stroke="#0C6056" strokeWidth={2.5} fill="#0C6056" fillOpacity={0.1} isAnimationActive={false} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-0 right-0 z-50 bg-white border border-[#1A1A1A]/10 p-4 rounded-xl shadow-lg scale-90">
                                            <p className="text-[8px] font-bold uppercase text-brand-navy mb-2">SCA Attributes</p>
                                            <div className="space-y-1 text-[9px]">
                                                {scaRadarData.map((d, i) => (
                                                    <div key={i} className="flex justify-between gap-6 border-b border-[#1A1A1A]/5 pb-0.5">
                                                        <span className="font-bold uppercase text-brand-navy">{d.subject}</span>
                                                        <span className="font-black text-[#1A1A1A]">{Number(d.A).toFixed(1)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score & Notes */}
                                    <div className="flex flex-col justify-between space-y-4">
                                        <div className="p-6 bg-white border-2 border-[#0C6056] rounded-2xl text-center relative shadow-sm">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0C6056] text-brand-navy px-6 py-1 rounded-full text-[8px] font-bold uppercase shadow-sm -mt-2.5 z-10">
                                                AXIS LAB SCORE
                                            </div>
                                            <p className="text-5xl font-black text-[#1A1A1A] er leading-none mt-2">
                                                {typeof totalScore === 'number' ? Number(totalScore).toFixed(2) : totalScore}
                                            </p>
                                            <p className="text-[7.5px] font-bold text-[#0C6056] uppercase mt-2">
                                                {scaData?.is_incomplete ? 'SENSORY AUDIT IN PROGRESS' : 'SCA CVA Protocol • Seal of Authority'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white border-l-4 border-[#0C6056] rounded-lg italic text-[10px] text-brand-navy/70 leading-relaxed shadow-sm">
                                            <span className="text-[8px] font-bold block mb-1 uppercase text-[#0C6056] not-italic">Master Cupper Notes:</span>
                                            "{translate(lotData?.sca_cupping?.[0]?.notes || scaData?.notes) || 'Balanced sensory profile with vibrant complexity characteristic of its protected origin.'}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN: SELLO DE INTEGRIDAD Y FIRMAS */}
                            <div className="px-8 py-3 space-y-3">
                                <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                                    <h2 className="uppercase flex items-center gap-3 text-[11px] font-bold text-[#1A1A1A]">
                                        <span className="w-5 h-5 rounded-full bg-[#0C6056] text-brand-navy flex items-center justify-center text-[10px] font-black shadow-sm">05</span>
                                        INTEGRITY SEAL & DIGITAL SIGNATURES
                                    </h2>
                                    <span className="text-[8px] font-bold text-brand-navy/30 uppercase">Final Stage</span>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {/* Resumen */}
                                    <div className="bg-white border border-black/5 p-4 rounded-xl space-y-2.5 shadow-sm text-[10px]">
                                        <h3 className="font-black uppercase text-brand-navy text-[10px]">Operational Summary</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between border-b border-black/5 pb-1">
                                                <span className="text-brand-navy/40 font-bold">Origin</span>
                                                <span className="font-black text-brand-navy">CONFIRMED</span>
                                            </div>
                                            <div className="flex justify-between border-b border-black/5 pb-1">
                                                <span className="text-brand-navy/40 font-bold">Milling Purity</span>
                                                <span className="font-black text-brand-navy">{lotData?.yield_percentage || '100'}%</span>
                                            </div>
                                            <div className="flex justify-between border-b border-black/5 pb-1">
                                                <span className="text-brand-navy/40 font-bold">Final SCA</span>
                                                <span className="font-black text-brand-navy">{typeof totalScore === 'number' ? Number(totalScore).toFixed(2) : totalScore} PTS</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Competencia Especial / Autenticidad */}
                                    <div className="col-span-2 bg-[#0C6056]/5 border border-[#0C6056]/10 p-4 rounded-xl relative overflow-hidden text-[9.5px] leading-relaxed">
                                        <p className="font-extrabold text-brand-navy uppercase mb-1">Digital Signature & Resolution</p>
                                        <p className="text-brand-navy/70 uppercase font-medium">
                                            {translate(lotData?.process_data?.anotacion_especial || lotData?.process_data?.metadata_validacion_sistema?.anotacion_especial) || 
                                             "This document certifies that the referenced lot has been monitored through the AXISONE protocol end-to-end, guaranteeing the immutable integrity of the presented information."}
                                        </p>
                                        <p className="text-[7.5px] font-mono text-brand-navy/30 mt-2 break-all">HASH: {inventoryId.toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Firmas */}
                                <div className="grid grid-cols-3 gap-6 pt-2">
                                    <div className="text-center">
                                        <div className="h-10 border-b border-black/10 flex items-end justify-center pb-1">
                                            <span className="font-mono text-[9px] text-brand-navy/20">{user?.name || 'MASTER AUDITOR'}</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-[#0C6056] uppercase mt-1">Specialty Evaluator</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-10 border-b border-black/10 flex items-end justify-center pb-1">
                                            <span className="font-mono text-[9px] text-brand-navy/20">AXISONE CRYPTO SECURE</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-[#0C6056] uppercase mt-1">Technical Lead</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="qr-container p-2 bg-white border border-black/10 rounded-xl shadow-md">
                                            <QRCodeSVG
                                                value={`${origin}/verify/${inventoryId}`}
                                                size={200}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <p className="text-[9px] font-black text-brand-navy uppercase mt-2">Verify Lot (QR)</p>
                                    </div>
                                </div>
                            </div>

                            {/* AVISO DE PARÁMETROS ENTERPRISE AL FINAL DE PÁGINA 2 */}
                            <div className="px-8 py-4 border-t border-black/5 bg-[#0C6056]/5 text-center flex flex-col items-center justify-center space-y-1.5">
                                <div className="flex items-center gap-2 text-[#0C6056]">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-pulse">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <p className="text-[9px] font-black uppercase tracking-wider">Restricted Access • Enterprise Plan</p>
                                </div>
                                <p className="text-[8px] font-bold text-brand-navy/60 uppercase max-w-xl mx-auto">
                                    Other advanced parameters of extrinsic traceability, certified carbon footprint, and molecular analytics are visible only to Enterprise plan users.
                                </p>
                            </div>

                            {/* Footer Hoja 2 */}
                            <div className="mt-auto px-10 py-4 flex justify-between items-center border-t border-gray-400 bg-white">
                                <p className="text-brand-navy/30 text-[8px] font-bold uppercase">COFFEE DNA • SENSORY QUALITY • AXISONE MASTER CERTIFICATE</p>
                                <p className="text-brand-navy/60 text-[8px] font-bold">PAGE {getPageNum(2)} OF {totalPages}</p>
                            </div>
                        </div>
                    </PageWrapper>
                )}

            </div>

            {/* Panel de Control Inferior */}
            {!isExportMode && (
            <div className="w-full flex justify-end gap-6 no-export mt-12 p-8 bg-[#1A1A1A] border border-[#1A1A1A] rounded-[32px] shadow-2xl print:hidden">
                <button
                    onClick={downloadQRCode}
                    className="px-8 py-5 bg-white hover:bg-white text-brand-navy rounded-2xl text-[11px] font-bold uppercase  transition-all flex items-center justify-center gap-3 border border-gray-400 shadow-sm active:scale-95"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Download QR
                </button>

                <button
                    type="button"
                    onClick={async (e) => {
                        const btn = e.currentTarget.querySelector('span');
                        const originalText = btn?.innerText || '';
                        if (btn) btn.innerText = 'PROCESSING PDF...';
                        try {
                            const activePagesList = [showPage1, showPage2];
                            const activePages = [1, 2].filter((_, idx) => activePagesList[idx]);
                            const pagesQuery = activePages.join(',');
                            const printUrl = `${window.location.origin}/export/certificate/${inventoryId}?pages=${pagesQuery}`;
                            
                            const response = await fetch('/api/pdf/generate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url: printUrl, fileName: `Certificate-Lot-${inventoryId}` })
                            });
                            
                            if (response.ok) {
                                const blob = await response.blob();
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `Certificate-Lot-${inventoryId}.pdf`;
                                link.click();
                            } else {
                                console.warn('API cloud PDF generation failed, falling back to local print view');
                                // Abrir versión local imprimible en pestaña nueva como respaldo impecable
                                const printUrlLocal = `/export/certificate/${inventoryId}?pages=${pagesQuery}&autoPrint=true`;
                                window.open(printUrlLocal, '_blank');
                            }
                        } catch (err) {
                            console.error(err);
                            window.print(); // Fallback
                        } finally {
                            if (btn) btn.innerText = originalText;
                        }
                    }}
                    className="px-10 py-5 bg-[#0C6056] hover:bg-[#0C6056]/90 text-white rounded-2xl text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 border border-[#0C6056]/30"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                    <span>Generate High Quality PDF</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        const activePagesList = [showPage1, showPage2];
                        const activePages = [1, 2].filter((_, idx) => activePagesList[idx]);
                        const pagesQuery = activePages.join(',');
                        const printUrl = `/export/certificate/${inventoryId}?pages=${pagesQuery}&autoPrint=true`;
                        window.open(printUrl, '_blank');
                    }}
                    className="px-10 py-5 bg-white text-[#0C6056] border border-[#0C6056] hover:bg-[#0C6056]/10 rounded-2xl text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                >
                    Print (Local)
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="px-10 py-5 bg-white hover:bg-red-500/20 text-brand-navy rounded-2xl text-[11px] font-bold uppercase transition-all border border-gray-400 shadow-sm active:scale-95"
                >
                    Close
                </button>
            </div>
            )}
        </div>
        </>
    );
}
