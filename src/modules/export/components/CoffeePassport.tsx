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

const GREEN = '#000000';
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
    const farmerPhone = initialLotData?.farmerPhone || initialLotData?.farmer_phone || '---';

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
                <div className="no-print w-[794px] mx-auto flex justify-between items-center bg-white border border-gray-400 p-3 rounded-xl mb-6 mt-8 shadow-2xl">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: GREEN }}></span>
                        <span className="text-[11px] font-bold text-gray-600 uppercase ">AXISONE COFFEE Passport — Vista Previa</span>

                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-1.5 border border-gray-400 rounded-lg text-[11px] font-bold uppercase text-gray-600 hover:bg-white">Cerrar</button>
                        <ExportReportButton elementId="passport-pages" fileName={`PASSPORT-${lotNum}`} />
                        <button onClick={() => window.print()} className="px-4 py-1.5 bg-black text-black rounded-lg text-[11px] font-bold uppercase hover:bg-gray-800">Imprimir</button>
                    </div>
                </div>

                <div id="passport-pages" className="mx-auto flex flex-col gap-8 pb-32" style={{ width: '794px' }}>

                    {/* ══════════════ PÁGINA 1 ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>

                        {/* Header */}
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-400">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase  leading-none">Asociación Tatama</p>
                                    <p className="text-[9px] font-bold text-black uppercase  leading-none mt-0.5">Industrial Quality Protocol | Page 01</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-black uppercase  leading-none">Expedición Digital</p>
                                <p className="text-[11px] font-bold uppercase leading-none mt-0.5" style={{ color: GREEN }}>{today}</p>
                            </div>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-6">
                            {/* Identity block */}
                            <div className="flex justify-between items-start gap-6">
                                <div className="flex-1">
                                    <div className="mb-3">
                                        <span className="text-[9px] font-bold uppercase  px-2.5 py-1 rounded border border-gray-400 text-gray-900">
                                            ● Identity Verified · Cloud-Stored Profile
                                        </span>
                                    </div>
                                    <h1 className="text-[52px] font-black text-black uppercase leading-none er mb-5">{farmName}</h1>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div>
                                            <p className="text-[9px] font-bold text-black uppercase  mb-1">Productor</p>
                                            <p className="text-[12px] font-bold text-black uppercase leading-tight">{producerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-black uppercase  mb-1">Lote ID</p>
                                            <p className="text-[12px] font-bold uppercase leading-tight" style={{ color: GREEN }}>{lotNum}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-black uppercase  mb-1">Variedad</p>
                                            <p className="text-[12px] font-bold text-black uppercase leading-tight">{variety}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-black uppercase  mb-1">Región</p>
                                            <p className="text-[12px] font-bold text-black uppercase leading-tight">{region}</p>
                                        </div>
                                    </div>
                                </div>
                                {/* SCA Score box */}
                                <div className="border border-gray-400 rounded-xl p-5 text-center min-w-[160px] bg-white shadow-sm">
                                    <p className="text-[9px] font-bold uppercase  mb-2 leading-tight" style={{ color: GREEN }}>Puntaje basado en estándares SCA</p>
                                    <p className="text-[44px] font-black text-black leading-none er">
                                        {scaScore != null ? Number(scaScore).toFixed(2) : '00.00'}
                                    </p>
                                </div>
                            </div>

                            {/* Weights row */}
                            <div className="grid grid-cols-4 gap-4 p-5 rounded-xl bg-white border border-gray-400">
                                <div className="text-center">
                                    <p className="text-[9px] font-bold text-black uppercase  mb-1">Materia Prima</p>
                                    <p className="text-[20px] font-black text-black leading-none">{purchaseWeight} <span className="text-[12px] font-bold text-black">Kg</span></p>
                                    <p className="text-[9px] font-bold text-black uppercase mt-1">Ingreso</p>
                                </div>
                                <div className="text-center border-l border-gray-400">
                                    <p className="text-[9px] font-bold text-black uppercase  mb-1">Materia Exportable</p>
                                    <p className="text-[20px] font-black text-black leading-none">{thrashedWeight} <span className="text-[12px] font-bold text-black">Kg</span></p>
                                    <p className="text-[9px] font-bold text-black uppercase mt-1">Excelso</p>
                                </div>
                                <div className="text-center border-l border-gray-400">
                                    <p className="text-[9px] font-bold text-black uppercase  mb-1">Factor Rendimiento</p>
                                    <p className="text-[20px] font-black text-black leading-none">{thrashedYield} <span className="text-[12px] font-bold text-black">Fr</span></p>
                                    <p className="text-[9px] font-bold text-black uppercase mt-1">Estimado</p>
                                </div>
                                <div className="text-center border-l border-gray-400">
                                    <p className="text-[9px] font-bold text-black uppercase  mb-1">Beneficio</p>
                                    <p className="text-[16px] font-black text-black leading-none uppercase">{process}</p>
                                    <p className="text-[9px] font-bold text-black uppercase mt-1">Método</p>
                                </div>
                            </div>

                            {/* Section headers */}
                            <div className="flex gap-8 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-0.5 rounded" style={{ background: GREEN }}></span>
                                    <p className="text-[9px] font-bold uppercase  text-black">Physical Quality</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-0.5 rounded" style={{ background: RED }}></span>
                                    <p className="text-[9px] font-bold uppercase  text-black">Grading Count</p>
                                </div>
                            </div>

                            {/* Quality cards */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-5 rounded-xl bg-white border border-gray-400 flex flex-col justify-between">
                                    <p className="text-[9px] font-bold text-black uppercase ">Humedad</p>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.moisture_pct ?? '0.0'}<span className="text-[16px]" style={{ color: GREEN }}>%</span></p>
                                        <p className="text-[9px] font-bold uppercase mt-2" style={{ color: GREEN }}>{physData?.grain_color || 'Verde Oliva'}</p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-white border border-gray-400 flex flex-col justify-between">
                                    <p className="text-[9px] font-bold text-black uppercase ">Densidad</p>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.density_gl ?? '0'}<span className="text-[14px] text-black ml-1">g/L</span></p>
                                        <p className="text-[9px] font-bold text-black-bright uppercase mt-2">{physData?.water_activity ? `${physData.water_activity} AW` : '--- AW'}</p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-white border border-gray-400 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[9px] font-bold text-black uppercase ">Primarios</p>
                                        <p className="text-[9px] font-bold uppercase mt-0.5" style={{ color: RED }}>(Type 1)</p>
                                    </div>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.defects_count?.primary ?? '0'}<span className="text-[16px]" style={{ color: RED }}>%</span></p>
                                        <p className="text-[9px] font-bold uppercase mt-2" style={{ color: RED }}>Defectos Críticos</p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-white border border-gray-400 flex flex-col justify-between">
                                    <div>
                                        <p className="text-[9px] font-bold text-black uppercase ">Secundarios</p>
                                        <p className="text-[9px] font-bold uppercase mt-0.5" style={{ color: ORANGE }}>(Type 2)</p>
                                    </div>
                                    <div>
                                        <p className="text-[36px] font-black text-black leading-none">{physData?.defects_count?.secondary ?? '0'}<span className="text-[16px]" style={{ color: ORANGE }}>%</span></p>
                                        <p className="text-[9px] font-bold uppercase mt-2" style={{ color: ORANGE }}>Defectos Menores</p>
                                    </div>
                                </div>
                            </div>

                            {/* Granulometry */}
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="w-6 h-0.5 rounded" style={{ background: GREEN }}></span>
                                    <p className="text-[9px] font-bold uppercase  text-black">Granulometría (Screen Size Distribution)</p>
                                </div>
                                <div className="p-6 rounded-xl bg-white border border-gray-400">
                                    {!physData ? (
                                        <div className="h-[180px] flex items-center justify-center">
                                            <p className="text-[11px] font-bold text-gray-300 uppercase ">Sin análisis físico registrado para este lote</p>
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
                                                    <p className="text-[9px] font-bold text-gray-900 uppercase mt-2 leading-none">{item.m}</p>
                                                    <p className="text-[11px] font-bold text-black mt-1 leading-none">{Number(item.v || 0).toFixed(1)}%</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer P1 */}
                        <div className="px-10 py-4 border-t border-gray-400 flex justify-between items-center mt-auto">
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">{passportId}</p>
                        </div>
                    </div>

                    {/* ══════════════ PÁGINA 2 ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>

                        {/* Header */}
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-400">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase  leading-none">Asociación Tatama</p>
                                    <p className="text-[9px] font-bold text-black uppercase  leading-none mt-0.5">Industrial Quality Protocol | Page 02</p>
                                </div>
                            </div>
                            <p className="text-[12px] font-bold uppercase" style={{ color: GREEN }}>{lotNum}</p>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-6">
                            <div>
                                <h2 className="text-[22px] font-black text-black uppercase leading-tight  mb-1">
                                    {sca?.is_cva_version ? 'SCA Coffee Value Assessment (CVA)' : 'Evaluación Sensorial Basada en Estándares de la SCA'}
                                </h2>
                                <p className="text-[9px] font-bold text-black uppercase ">
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
                                        <div key={i} className="flex justify-between items-center border-b border-gray-400 py-2.5">
                                            <span className="text-[9px] font-bold text-black uppercase ">{item.subject}</span>
                                            <span className="text-[14px] font-bold text-black">{Number(item.A).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sensory summary */}
                            <div className="border-t border-gray-400 pt-6">
                                <p className="text-[9px] font-bold text-black uppercase  mb-3">Sensory Analysis Summary</p>
                                <p className="text-[22px] font-bold text-black text-center py-4" style={{ fontStyle: 'normal' }}>
                                    "{sca?.notes || 'bacancito, chocolate y frutos rojos'}"
                                </p>
                            </div>

                            {/* Q-Grader */}
                            <div className="flex items-center gap-6 py-4 border-t border-b border-gray-400">
                                <div className="w-14 h-14 rounded-full bg-gray-800 text-black flex items-center justify-center text-sm font-black shrink-0">QG</div>
                                <div className="flex-1">
                                    <p className="text-[16px] font-black text-black uppercase leading-none">{sca?.taster_name?.toUpperCase() || 'Q-Grader Senior'}</p>
                                    <p className="text-[9px] font-bold uppercase mt-1 " style={{ color: GREEN }}>Professional Cupper · Digital Signature Verified</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                        <span className="text-[9px] font-bold uppercase text-black ">AXIS</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-black uppercase">Protocol 52.4</p>
                                    <p className="text-[9px] font-bold text-black uppercase">ID Seal: 121802</p>
                                </div>
                            </div>

                            {/* Trazabilidad digital */}
                            <div className="flex items-start gap-6 p-5 rounded-xl bg-white border border-gray-400">
                                <div className="bg-white p-2 border border-gray-400 rounded-lg shrink-0 shadow-sm">
                                    <QRCodeSVG value={`${window.location.origin}/verify/lot/${batchId}`} size={72} level="H" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-black uppercase  mb-2">Trazabilidad Digital Inmutable</p>
                                    <p className="text-[9px] font-bold text-gray-900 uppercase leading-relaxed ">
                                        Certificación técnica de origen y calidad física-sensorial. Los datos han sido encriptados en la red Axis para garantizar transparencia absoluta en la cadena de suministro industrial de café.
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[9px] font-bold text-gray-300 uppercase break-all max-w-[120px] leading-tight font-mono">
                                        {lot?.export_data?.final_hash?.slice(0, 24) || '12B02A-62F1-4ED4-B9A5-9CAFC4A3C3E1'}
                                    </p>
                                    <p className="text-[7px] font-bold text-black uppercase mt-3">© 2026 Axis Intelligence Group</p>
                                    <p className="text-[7px] font-bold text-black uppercase">Industrial</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer P2 */}
                        <div className="px-10 py-4 border-t border-gray-400 mt-auto flex justify-between items-center">
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">{passportId}-P2</p>
                        </div>
                    </div>

                    {/* ══════════════ PÁGINA 3: LOGÍSTICA ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-400">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase  leading-none">Asociación Tatama</p>
                                    <p className="text-[9px] font-bold text-black uppercase  leading-none mt-0.5">Industrial Quality Protocol | Page 03</p>
                                </div>
                            </div>
                            <p className="text-[12px] font-bold uppercase" style={{ color: GREEN }}>{lotNum}</p>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-6">
                            <h2 className="text-[22px] font-black text-black uppercase leading-tight">Shipment & Port Security</h2>

                            {/* Hash */}
                            <div className="p-5 rounded-xl bg-white border border-gray-400">
                                <p className="text-[9px] font-bold text-black uppercase  mb-3">Blockchain Fingerprint (Immutable Hash)</p>
                                <p className="text-[11px] font-bold font-mono break-all text-black uppercase ">
                                    {lot?.export_data?.final_hash || 'PENDING-SIGNATURE-X-000-PENDING'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-5 rounded-xl bg-white border border-gray-400 flex flex-col gap-2">
                                    <p className="text-[9px] font-bold text-black uppercase ">Port Gate Timestamp</p>
                                    <p className="text-[14px] font-bold text-black font-mono">{lot?.export_data?.port_checkin_timestamp || '---'}</p>
                                </div>
                                <div className="p-5 rounded-xl bg-white border border-gray-400 flex flex-col gap-2">
                                    <p className="text-[9px] font-bold text-black uppercase ">GPS Localization</p>
                                    <p className="text-[14px] font-bold text-black font-mono">{lot?.export_data?.port_checkin_location || '---'}</p>
                                </div>
                            </div>

                            {/* Vessel block */}
                            <div className="p-6 rounded-xl border-2 bg-white flex flex-col gap-4" style={{ borderColor: '#e2e8f0' }}>
                                <p className="text-[9px] font-bold text-black uppercase ">International Vessel Carrier</p>
                                <p className="text-[28px] font-black text-black uppercase leading-none">{lot?.export_data?.vessel_name || 'Pending Assignment'}</p>
                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-400">
                                    <div>
                                        <p className="text-[9px] font-bold text-black uppercase  mb-1">Bill of Lading (B/L)</p>
                                        <p className="text-[16px] font-bold text-black font-mono">{lot?.export_data?.bol_number || '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-black uppercase  mb-1">Estimated Arrival (ETA)</p>
                                        <p className="text-[16px] font-bold text-black uppercase">{lot?.export_data?.eta || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-5 rounded-xl bg-white border border-gray-400 flex flex-col gap-2">
                                    <p className="text-[9px] font-bold text-black uppercase ">Final Consignee</p>
                                    <p className="text-[16px] font-bold text-black uppercase leading-tight">{lot?.export_data?.consignee || '---'}</p>
                                </div>
                                <div className="p-5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-2" style={{ borderColor: GREEN }}>
                                    <p className="text-[9px] font-bold uppercase " style={{ color: GREEN }}>Security Seal No.</p>
                                    <p className="text-[22px] font-black text-black font-mono">{lot?.export_data?.seal_number || '---'}</p>
                                </div>
                            </div>

                            <div className="mt-4 p-5 rounded-xl border border-gray-400 bg-white flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase  border-b pb-1 mb-1" style={{ borderColor: GREEN }}>Official International Manifest Release</p>
                                    <p className="text-[9px] font-bold text-gray-900 uppercase leading-relaxed ">La cadena de custodia ha sido sellada electrónicamente bajo normativas Axis para exportación definitiva internacional.</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-4 border-t border-gray-400 mt-auto flex justify-between items-center">
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">{passportId}-P3</p>
                        </div>
                    </div>

                    {/* ══════════════ PÁGINA 4: EUDR & ENVIRONMENT ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-400">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase  leading-none">Asociación Tatama</p>
                                    <p className="text-[9px] font-bold text-black uppercase  leading-none mt-0.5">Industrial Quality Protocol | Page 04</p>
                                </div>
                            </div>
                            <p className="text-[12px] font-bold uppercase" style={{ color: GREEN }}>EUDR COMPLIANT</p>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-[28px] font-black text-black uppercase leading-tight er">Environmental Passport</h2>
                                    <p className="text-[9px] font-bold text-black uppercase ">EU Regulation 2023/1115 (Deforestation-Free)</p>
                                </div>
                                <div className="bg-black text-black px-4 py-2 rounded font-black text-[11px] ">
                                    STATUS: CERTIFIED
                                </div>
                            </div>

                            {/* Mapa de Origen (Simulación visual del Polígono) */}
                            <div className="relative w-full h-[400px] bg-white rounded-2xl border border-gray-400 overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 opacity-20 grayscale">
                                    <div className="w-full h-full bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i15!2i9245!3i15467!2m3!1e0!2sm!3i633044030!3m8!2ses!3sCO!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2')] bg-cover"></div>
                                </div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <svg width="200" height="200" viewBox="0 0 100 100" className="drop-shadow-xl">
                                        <path 
                                            d="M30 20 L70 25 L85 60 L60 85 L20 75 L15 40 Z" 
                                            fill="rgba(0, 223, 154, 0.2)" 
                                            stroke={GREEN} 
                                            strokeWidth="2" 
                                            strokeDasharray="4 2"
                                        />
                                        <circle cx="30" cy="20" r="1.5" fill={GREEN} />
                                        <circle cx="70" cy="25" r="1.5" fill={GREEN} />
                                        <circle cx="85" cy="60" r="1.5" fill={GREEN} />
                                        <circle cx="60" cy="85" r="1.5" fill={GREEN} />
                                        <circle cx="20" cy="75" r="1.5" fill={GREEN} />
                                        <circle cx="15" cy="40" r="1.5" fill={GREEN} />
                                    </svg>
                                    <div className="mt-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full border border-gray-400 shadow-sm flex items-center gap-3">
                                        <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
                                        <span className="text-[9px] font-black uppercase text-black ">Origen: {producerName}</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-black px-3 py-1.5 rounded-lg text-[9px] font-mono">
                                    LAT: 2.44192 | LNG: -76.60632
                                </div>
                            </div>

                            {/* Auditoría Sensorial e IMU */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white rounded-2xl border border-gray-400">
                                    <p className="text-[9px] font-bold text-black uppercase  mb-4">Sensor Audit (IMU Fingerprint)</p>
                                    <div className="flex items-end gap-[2px] h-12 mb-4">
                                        {[4, 8, 12, 10, 15, 20, 18, 25, 30, 22, 15, 10, 8, 5].map((h, i) => (
                                            <div key={i} className="flex-1 bg-brand-green opacity-40" style={{ height: `${h}px` }}></div>
                                        ))}
                                    </div>
                                    <p className="text-[11px] font-bold text-black uppercase leading-tight">Caminata Humana Verificada</p>
                                    <p className="text-[9px] text-gray-900 mt-1 uppercase">Validación de acelerómetro y giroscopio exitosa.</p>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-gray-400">
                                    <p className="text-[9px] font-bold text-black uppercase  mb-4">EUDR Authentication Hash</p>
                                    <div className="bg-white p-3 rounded-xl border border-gray-400 mb-2">
                                        <p className="text-[11px] font-mono font-bold text-black break-all uppercase leading-none">
                                            {initialLotData?.process_data?.eudr_hash || 'SHA256:7B8A2C1D4E9F0A2B3C4D'}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-bold text-black uppercase ">
                                        {(initialLotData?.process_data?.eudr_hash?.startsWith('EUDR-')) 
                                            ? 'OFFICIAL DDS REFERENCE' 
                                            : 'Libre de Deforestación (GFW Verified)'}
                                    </p>
                                </div>
                            </div>

                            {/* Nota de Seguridad de Orden Público */}
                            <div className="p-8 bg-black text-black rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white border border-gray-400 shadow-sm blur-[80px]"></div>
                                <h4 className="text-[11px] font-black uppercase  mb-4 text-black-bright">Protocolo de Seguridad y Orden Público</h4>
                                <p className="text-[11px] font-bold uppercase leading-relaxed  opacity-90">
                                    DEBIDO A CONDICIONES DE ORDEN PÚBLICO Y SEGURIDAD EN LA ZONA DE ORIGEN, ASÍ COMO RESTRICCIONES DE SEGURIDAD OPERATIVA DEL EJÉRCITO Y GRUPOS ILEGALES, SE HA PROHIBIDO EL USO DE AERONAVES NO TRIPULADAS (DRONES). EN SU LUGAR, SE EMPLEA TECNOLOGÍA DE CAPTURA SENSORIAL MÓVIL (IMU) PARA GARANTIZAR LA INTEGRIDAD DE LOS DATOS Y LA SEGURIDAD DEL PERSONAL EN CAMPO. ESTA METODOLOGÍA HA SIDO VALIDADA BAJO LOS ESTÁNDARES AXIS-SAFE.
                                </p>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <div className="flex items-center gap-3">
                                    <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'https://axisone.coffee'}/verify/lot/${lotNum}`} size={64} />
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-black">Verificación Satelital</p>
                                        <p className="text-[9px] text-black uppercase">Escanea para ver el mapa interactivo</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-black uppercase">Approved by Axis Security Division</p>
                                    <p className="text-[7px] text-black uppercase mt-1">Industrial Transparency Seal No. 09923</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-4 border-t border-gray-400 mt-auto flex justify-between items-center">
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">{passportId}-P4</p>
                        </div>
                    </div>

                    {/* ══════════════ PÁGINA 5: GRATEFUL LEDGER (RECOGNITION) ══════════════ */}
                    <div className="bg-white relative overflow-hidden print:break-after-page" style={{ width: '794px', minHeight: '1123px' }}>
                        <div className="px-10 py-5 flex justify-between items-center border-b border-gray-400">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border-2 border-black rounded flex items-center justify-center shrink-0 overflow-hidden bg-white">
                                    <img src="/tatama.png" alt="TATAMA" className="w-full h-full object-contain p-1" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-black uppercase  leading-none">Asociación Tatama</p>
                                    <p className="text-[9px] font-bold text-black uppercase  leading-none mt-0.5">Industrial Quality Protocol | Page 05</p>
                                </div>
                            </div>
                            <p className="text-[12px] font-bold uppercase text-black">Axis Alchemist Registry</p>
                        </div>

                        <div className="px-10 py-7 flex flex-col gap-8">
                            <div className="text-center">
                                <h2 className="text-[42px] font-black text-black uppercase leading-none er mb-2">Grateful Ledger</h2>
                                <p className="text-[11px] font-bold text-black uppercase ">Consumer-to-Producer Recognition Protocol</p>
                            </div>

                            {/* Alchemist Profile Card */}
                            <div className="p-10 rounded-[40px] bg-white border border-gray-400 relative overflow-hidden flex flex-col items-center text-center">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-green to-transparent"></div>
                                <div className="w-32 h-32 rounded-full bg-black flex items-center justify-center mb-6 border-4 border-white shadow-xl">
                                    <span className="text-4xl font-black text-black">
                                        {producerName.charAt(0)}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-black uppercase mb-1">{producerName}</h3>
                                <p className="text-[11px] font-bold text-black uppercase  mb-2">Certified Axis Coffee Alchemist</p>
                                <p className="text-[11px] font-mono font-bold text-black mb-6 ">ID: {farmerPhone}</p>
                                
                                <div className="flex gap-4 w-full">
                                    <div className="flex-1 p-4 bg-white rounded-2xl border border-gray-400 shadow-sm">
                                        <p className="text-[9px] font-bold text-black uppercase mb-1">Reputation Score</p>
                                        <p className="text-2xl font-black text-black">4.9 / 5.0</p>
                                    </div>
                                    <div className="flex-1 p-4 bg-white rounded-2xl border border-gray-400 shadow-sm">
                                        <p className="text-[9px] font-bold text-black uppercase mb-1">Global Impact</p>
                                        <p className="text-2xl font-black text-black">Top 5%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recognition Vault */}
                            <div>
                                <h4 className="text-[11px] font-black uppercase  mb-6 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-black"></span>
                                    Recognition Vault (Últimos Agradecimientos)
                                </h4>
                                <div className="space-y-4">
                                    <div className="p-6 rounded-2xl border border-dashed border-gray-400 bg-white/50">
                                        <p className="text-[14px] font-bold text-gray-800 italic leading-relaxed mb-3">
                                            "El perfil sensorial de este lote es extraordinario. Gracias por cuidar cada etapa de la fermentación. Un saludo desde Berlín."
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-black uppercase ">— Barista Senior, The Barn (Berlin)</span>
                                            <span className="text-[9px] font-bold text-black uppercase">Verified Gratitude · 0.05 SOL Tip Sent</span>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl border border-dashed border-gray-400 bg-white/50">
                                        <p className="text-[14px] font-bold text-gray-800 italic leading-relaxed mb-3">
                                            "Increíble balance. Se nota la pasión del productor en el secado. ¡Sigan así!"
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-black uppercase ">— Roaster Master, Coffee Collective</span>
                                            <span className="text-[9px] font-bold text-black uppercase">Verified Gratitude</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Call to Action for Consumer */}
                            <div className="mt-auto p-8 rounded-3xl bg-brand-green text-black flex flex-col items-center text-center">
                                <h4 className="text-[16px] font-black uppercase mb-2">¿Te gustó esta Alquimia?</h4>
                                <p className="text-[11px] font-bold uppercase mb-6 leading-tight max-w-[300px]">
                                    Envía un reconocimiento directo al productor y ayuda a dignificar su labor en el campo.
                                </p>
                                <div className="bg-white p-4 rounded-2xl shadow-xl">
                                    <QRCodeSVG value={`${window.location.origin}/verify/lot/${batchId}`} size={120} level="H" />
                                </div>
                                <p className="mt-4 text-[9px] font-black uppercase  text-black/60 text-center">Escanea para aprender y agradecer</p>
                            </div>
                        </div>

                        <div className="px-10 py-4 border-t border-gray-400 mt-auto flex justify-between items-center">
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">Axis Intelligence Coffee Division | Traceability Protocol Ver 2.1</p>
                            <p className="text-[7px] font-bold text-gray-300 uppercase ">{passportId}-P5</p>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
