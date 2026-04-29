'use client';

import React, { useEffect, useState } from 'react';
import ExportReportButton from '@/shared/components/ui/ExportReportButton';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

interface CoffeePassportProps {
    lotData: any;
    scaData?: any;
    roastData?: any;
    degassingData?: any;
    onClose: () => void;
}

const GREEN = '#00df9a';
const RED = '#ef4444';
const ORANGE = '#f97316';

export default function CoffeePassport({ lotData: initialLotData, scaData: initialScaData, roastData, degassingData, onClose }: CoffeePassportProps) {
    const [lot, setLot] = useState<any>(initialLotData);
    const [sca, setSca] = useState<any>(initialScaData);
    const [phys, setPhys] = useState<any>(null);

    const batchId = initialLotData?.id;
    const passportId = `AX-${initialLotData?.lot_number || '9822'}-${new Date().getFullYear()}`;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        const load = async () => {
            // El id del lote ya viene en initialLotData gracias al fix de GlobalHistoryArchive
            const invId = initialLotData?.id;
            if (!invId) return;
            try {
                const { supabase } = await import('@/shared/lib/supabase');

                // SCA — copiado exacto de LotCertificate.tsx
                const { data: scaDB } = await supabase
                    .from('sca_cupping')
                    .select('*')
                    .eq('inventory_id', invId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                if (scaDB) {
                    if (scaDB.total_score == null) {
                        scaDB.total_score = (
                            Number(scaDB.fragrance_aroma || 0) + Number(scaDB.flavor || 0) +
                            Number(scaDB.aftertaste || 0) + Number(scaDB.acidity || 0) +
                            Number(scaDB.body || 0) + Number(scaDB.balance || 0) +
                            Number(scaDB.uniformity || 10) + Number(scaDB.clean_cup || 10) +
                            Number(scaDB.sweetness || 10) + Number(scaDB.overall || 0) -
                            (Number(scaDB.defects_score || 0) * 2)
                        );
                    }
                    setSca(scaDB);
                }

                // Physical Analysis — copiado exacto de LotCertificate.tsx
                const { data: physDB } = await supabase
                    .from('physical_analysis')
                    .select('*')
                    .eq('inventory_id', invId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                if (physDB) setPhys(physDB);

            } catch (e) { console.error('PASSPORT_ERROR:', e); }
        };
        load();
    }, [initialLotData?.id]);


    // Los datos del lote vienen completos en initialLotData (gracias al fix de GlobalHistoryArchive)
    // Igual que LotCertificate usa lotData directamente
    const physData = phys;

    const farmName   = initialLotData?.farm_name || '---';
    const producerName = initialLotData?.farmer_name || '---';
    const lotNum     = initialLotData?.lot_number || '---';
    const variety    = initialLotData?.variety || '---';
    const region     = initialLotData?.region || '---';
    const process    = initialLotData?.process || '---';

    // Campos de producción — exactos de LotCertificate línea 231-234
    const purchaseWeight   = initialLotData?.purchase_weight || '--';
    const thrashedWeight   = initialLotData?.thrashed_weight || '--';
    const thrashedYield    = initialLotData?.thrashing_yield ? Number(initialLotData.thrashing_yield).toFixed(2) : '--';

    // SCA score — igual que LotCertificate línea 220
    const scaScore = sca?.total_score;

    // Radar chart — igual que LotCertificate líneas 101-109
    const radarData = sca ? [
        { subject: 'Fragancia',  A: sca.fragrance_aroma },
        { subject: 'Sabor',      A: sca.flavor },
        { subject: 'Post-gusto', A: sca.aftertaste },
        { subject: 'Acidez',     A: sca.acidity },
        { subject: 'Cuerpo',     A: sca.body },
        { subject: 'Balance',    A: sca.balance },
        { subject: 'Global',     A: sca.overall },
    ] : [];

    // Granulometría — igual que LotCertificate líneas 111-120
    const screenData = physData?.screen_size_distribution ? [
        { m: 'M18',   v: physData.screen_size_distribution.size18,  big: true  },
        { m: 'M17',   v: physData.screen_size_distribution.size17,  big: true  },
        { m: 'M16',   v: physData.screen_size_distribution.size16,  big: true  },
        { m: 'M15',   v: physData.screen_size_distribution.size15,  big: true  },
        { m: 'M14',   v: physData.screen_size_distribution.size14,  big: false },
        { m: 'M13',   v: physData.screen_size_distribution.size13,  big: false },
        { m: 'M12',   v: physData.screen_size_distribution.size12,  big: false },
        { m: 'Fondo', v: physData.screen_size_distribution.under12, big: false },
    ] : [];
    const maxV = Math.max(...screenData.map(s => Number(s.v || 0)), 1);

    const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();


    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet" />
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0 !important; }
                    body { margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                }
                .pp { font-family: 'Montserrat', sans-serif; }
            `}</style>

            <div className="fixed inset-0 z-[100] w-full h-screen overflow-y-auto bg-black/90 pp"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

                {/* Control bar */}
                <div className="no-print w-[794px] mx-auto flex justify-between items-center bg-white border border-gray-200 p-3 rounded-xl mb-6 mt-8 shadow-2xl">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: GREEN }}></span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">AXISONE COFFEE Passport — Vista Previa</span>

                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-1.5 border border-gray-200 rounded-lg text-[10px] font-bold uppercase text-gray-600 hover:bg-gray-50">Cerrar</button>
                        <ExportReportButton elementId="passport-pages" fileName={`PASSPORT-${lotNum}`} />
                        <button onClick={() => window.print()} className="px-4 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold uppercase hover:bg-gray-800">Imprimir</button>
                    </div>
                </div>

                <div id="passport-pages" className="mx-auto flex flex-col gap-8 pb-32" style={{ width: '794px' }}>

                    {/* ══════════════ PÁGINA 1 ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>

                        {/* Header */}
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase tracking-[0.2em] leading-none">Asociación Tatama</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Industrial Quality Protocol | Page 01</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Expedición Digital</p>
                                <p className="text-[11px] font-bold uppercase leading-none mt-0.5" style={{ color: GREEN }}>{today}</p>
                            </div>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-6">
                            {/* Identity block */}
                            <div className="flex justify-between items-start gap-6">
                                <div className="flex-1">
                                    <div className="mb-3">
                                        <span className="text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-gray-200 text-gray-500">
                                            ● Identity Verified · Cloud-Stored Profile
                                        </span>
                                    </div>
                                    <h1 className="text-[52px] font-black text-black uppercase leading-none tracking-tighter mb-5">{farmName}</h1>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Productor</p>
                                            <p className="text-[12px] font-bold text-black uppercase leading-tight">{producerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lote ID</p>
                                            <p className="text-[12px] font-bold uppercase leading-tight" style={{ color: GREEN }}>{lotNum}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Variedad</p>
                                            <p className="text-[12px] font-bold text-black uppercase leading-tight">{variety}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Región</p>
                                            <p className="text-[12px] font-bold text-black uppercase leading-tight">{region}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* SCA Score box */}
                                <div className="border border-gray-200 rounded-xl p-5 text-center min-w-[160px] bg-white shadow-sm">
                                    <p className="text-[8px] font-bold uppercase tracking-widest mb-2 leading-tight" style={{ color: GREEN }}>Puntaje basado en estándares SCA</p>
                                    <p className="text-[44px] font-black text-black leading-none tracking-tighter">
                                        {scaScore != null ? Number(scaScore).toFixed(2) : '00.00'}
                                    </p>
                                </div>
                            </div>

                            {/* Weights row */}
                            <div className="grid grid-cols-4 gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="text-center">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Materia Prima</p>
                                    <p className="text-[20px] font-black text-black leading-none">{purchaseWeight} <span className="text-[12px] font-bold text-gray-400">Kg</span></p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Ingreso</p>
                                </div>
                                <div className="text-center border-l border-gray-200">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Materia Exportable</p>
                                    <p className="text-[20px] font-black text-black leading-none">{thrashedWeight} <span className="text-[12px] font-bold text-gray-400">Kg</span></p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Excelso</p>
                                </div>
                                <div className="text-center border-l border-gray-200">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Factor Rendimiento</p>
                                    <p className="text-[20px] font-black text-black leading-none">{thrashedYield} <span className="text-[12px] font-bold text-gray-400">Fr</span></p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Estimado</p>
                                </div>
                                <div className="text-center border-l border-gray-200">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Beneficio</p>
                                    <p className="text-[16px] font-black text-black leading-none uppercase">{process}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Método</p>
                                </div>
                            </div>

                            {/* Section headers */}
                            <div className="flex gap-8 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-0.5 rounded" style={{ background: GREEN }}></span>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-black">Physical Quality</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-0.5 rounded" style={{ background: RED }}></span>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-black">Grading Count</p>
                                </div>
                            </div>

                            {/* Quality cards */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Humedad</p>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.moisture_pct ?? '0.0'}<span className="text-[16px]" style={{ color: GREEN }}>%</span></p>
                                        <p className="text-[8px] font-bold uppercase mt-2" style={{ color: GREEN }}>{physData?.grain_color || 'Verde Oliva'}</p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Densidad</p>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.density_gl ?? '0'}<span className="text-[14px] text-brand-green ml-1">g/L</span></p>
                                        <p className="text-[8px] font-bold text-brand-green-bright uppercase mt-2">{physData?.water_activity ? `${physData.water_activity} AW` : '--- AW'}</p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Primarios</p>
                                        <p className="text-[8px] font-bold uppercase mt-0.5" style={{ color: RED }}>(Type 1)</p>
                                    </div>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.defects_count?.primary ?? '0'}<span className="text-[16px]" style={{ color: RED }}>%</span></p>
                                        <p className="text-[8px] font-bold uppercase mt-2" style={{ color: RED }}>Defectos Críticos</p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Secundarios</p>
                                        <p className="text-[8px] font-bold uppercase mt-0.5" style={{ color: ORANGE }}>(Type 2)</p>
                                    </div>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.defects_count?.secondary ?? '0'}<span className="text-[16px]" style={{ color: ORANGE }}>%</span></p>
                                        <p className="text-[8px] font-bold uppercase mt-2" style={{ color: ORANGE }}>Defectos Menores</p>
                                    </div>
                                </div>
                            </div>

                            {/* Granulometry */}
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="w-6 h-0.5 rounded" style={{ background: GREEN }}></span>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-black">Granulometría (Screen Size Distribution)</p>
                                </div>
                                <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                                    {!physData ? (
                                        <div className="h-[180px] flex items-center justify-center">
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sin análisis físico registrado para este lote</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-end gap-3 h-[160px]">
                                            {screenData.map((item, i) => (
                                                <div key={i} className="flex flex-col items-center flex-1">
                                                    <div className="w-full rounded-t-sm transition-all"
                                                        style={{
                                                            height: `${(Number(item.v || 0) / maxV) * 120}px`,
                                                            minHeight: Number(item.v || 0) > 0 ? '4px' : '2px',
                                                            backgroundColor: Number(item.v || 0) > 0 ? (item.big ? GREEN : '#64748b') : '#e2e8f0'
                                                        }}></div>
                                                    <p className="text-[8px] font-bold text-gray-500 uppercase mt-2 leading-none">{item.m}</p>
                                                    <p className="text-[10px] font-bold text-black mt-1 leading-none">{Number(item.v || 0).toFixed(1)}%</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer P1 */}
                        <div className="px-10 py-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                            <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">{passportId}</p>
                        </div>
                    </div>

                    {/* ══════════════ PÁGINA 2 ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>

                        {/* Header */}
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase tracking-[0.2em] leading-none">Asociación Tatama</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Industrial Quality Protocol | Page 02</p>
                                </div>
                            </div>
                            <p className="text-[12px] font-bold uppercase" style={{ color: GREEN }}>{lotNum}</p>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-6">
                            <div>
                                <h2 className="text-[22px] font-black text-black uppercase leading-tight tracking-tight mb-1">
                                    {sca?.is_cva_version ? 'SCA Coffee Value Assessment (CVA)' : 'Evaluación Sensorial Basada en Estándares de la SCA'}
                                </h2>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                                    {sca?.is_cva_version ? 'Basado en el Protocolo Descriptivo SCA-103 + Afectivo SCA-104' : 'Análisis de Perfil Organoléptico de Especialidad'}
                                </p>
                            </div>



                            <div className="flex gap-8 items-center">
                                {/* Radar Chart */}
                                <div className="flex-1 h-[400px] flex items-center justify-center">
                                    <RadarChart width={420} height={400} cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                                        <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 11, fontWeight: '600' }} />
                                        <Radar name="SCA" dataKey="A" stroke={GREEN} strokeWidth={2.5} fill={GREEN} fillOpacity={0.12} isAnimationActive={false} />
                                    </RadarChart>
                                </div>
                                {/* Score table */}
                                <div className="w-[180px] flex flex-col gap-0">
                                    {radarData.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center border-b border-gray-100 py-2.5">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.subject}</span>
                                            <span className="text-[14px] font-bold text-black">{Number(item.A).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sensory summary */}
                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3">Sensory Analysis Summary</p>
                                <p className="text-[22px] font-bold text-black text-center py-4" style={{ fontStyle: 'normal' }}>
                                    "{sca?.notes || 'bacancito, chocolate y frutos rojos'}"
                                </p>
                            </div>

                            {/* Q-Grader */}
                            <div className="flex items-center gap-6 py-4 border-t border-b border-gray-100">
                                <div className="w-14 h-14 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-black shrink-0">QG</div>
                                <div className="flex-1">
                                    <p className="text-[16px] font-black text-black uppercase leading-none">{sca?.taster_name?.toUpperCase() || 'Q-Grader Senior'}</p>
                                    <p className="text-[8px] font-bold uppercase mt-1 tracking-widest" style={{ color: GREEN }}>Professional Cupper · Digital Signature Verified</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                        <span className="text-[8px] font-bold uppercase text-gray-400 tracking-widest">AXIS</span>
                                    </div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Protocol 52.4</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">ID Seal: 121802</p>
                                </div>
                            </div>

                            {/* Trazabilidad digital */}
                            <div className="flex items-start gap-6 p-5 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="bg-white p-2 border border-gray-200 rounded-lg shrink-0 shadow-sm">
                                    <QRCodeSVG value={`${window.location.origin}/verify/lot/${batchId}`} size={72} level="H" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-2">Trazabilidad Digital Inmutable</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed tracking-wider">
                                        Certificación técnica de origen y calidad física-sensorial. Los datos han sido encriptados en la red Axis para garantizar transparencia absoluta en la cadena de suministro industrial de café.
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[8px] font-bold text-gray-300 uppercase break-all max-w-[120px] leading-tight font-mono">
                                        {lot?.export_data?.final_hash?.slice(0, 24) || '12B02A-62F1-4ED4-B9A5-9CAFC4A3C3E1'}
                                    </p>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase mt-3">© 2026 Axis Intelligence Group</p>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase">Industrial</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer P2 */}
                        <div className="px-10 py-4 border-t border-gray-100 mt-auto flex justify-between items-center">
                            <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">{passportId}-P2</p>
                        </div>
                    </div>

                    {/* ══════════════ PÁGINA 3: LOGÍSTICA ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase tracking-[0.2em] leading-none">Asociación Tatama</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Industrial Quality Protocol | Page 03</p>
                                </div>
                            </div>
                            <p className="text-[12px] font-bold uppercase" style={{ color: GREEN }}>{lotNum}</p>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-6">
                            <h2 className="text-[22px] font-black text-black uppercase leading-tight">Shipment & Port Security</h2>

                            {/* Hash */}
                            <div className="p-5 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-3">Blockchain Fingerprint (Immutable Hash)</p>
                                <p className="text-[11px] font-bold font-mono break-all text-black uppercase tracking-wider">
                                    {lot?.export_data?.final_hash || 'PENDING-SIGNATURE-X-000-PENDING'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Port Gate Timestamp</p>
                                    <p className="text-[14px] font-bold text-black font-mono">{lot?.export_data?.port_checkin_timestamp || '---'}</p>
                                </div>
                                <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">GPS Localization</p>
                                    <p className="text-[14px] font-bold text-black font-mono">{lot?.export_data?.port_checkin_location || '---'}</p>
                                </div>
                            </div>

                            {/* Vessel block */}
                            <div className="p-6 rounded-xl border-2 bg-white flex flex-col gap-4" style={{ borderColor: '#e2e8f0' }}>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.3em]">International Vessel Carrier</p>
                                <p className="text-[28px] font-black text-black uppercase leading-none">{lot?.export_data?.vessel_name || 'Pending Assignment'}</p>
                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bill of Lading (B/L)</p>
                                        <p className="text-[16px] font-bold text-black font-mono">{lot?.export_data?.bol_number || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Arrival (ETA)</p>
                                        <p className="text-[16px] font-bold text-black uppercase">{lot?.export_data?.eta || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Final Consignee</p>
                                    <p className="text-[16px] font-bold text-black uppercase leading-tight">{lot?.export_data?.consignee || '---'}</p>
                                </div>
                                <div className="p-5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-2" style={{ borderColor: GREEN }}>
                                    <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: GREEN }}>Security Seal No.</p>
                                    <p className="text-[22px] font-black text-black font-mono">{lot?.export_data?.seal_number || '---'}</p>
                                </div>
                            </div>

                            <div className="mt-4 p-5 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-black uppercase tracking-widest border-b pb-1 mb-1" style={{ borderColor: GREEN }}>Official International Manifest Release</p>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase leading-relaxed tracking-tight">La cadena de custodia ha sido sellada electrónicamente bajo normativas Axis para exportación definitiva internacional.</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-4 border-t border-gray-100 mt-auto flex justify-between items-center">
                            <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">{passportId}-P3</p>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
