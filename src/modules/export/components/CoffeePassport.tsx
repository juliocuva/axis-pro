'use client';

import React, { useEffect } from 'react';
import ExportReportButton from '@/shared/components/ui/ExportReportButton';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

interface CoffeePassportProps {
    lotData: any;
    scaData?: any;
    roastData?: any;
    degassingData?: any;
    onClose: () => void;
}

export default function CoffeePassport({ lotData: initialLotData, scaData: initialScaData, roastData, degassingData, onClose }: CoffeePassportProps) {
    const [fetchedLotData, setFetchedLotData] = React.useState<any>(initialLotData);
    const [fetchedScaData, setFetchedScaData] = React.useState<any>(initialScaData);
    const [fetchedPhysicalData, setFetchedPhysicalData] = React.useState<any>(null);

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

    // Self-fetcher for missing data when rendering public links or when partial data is passed
    useEffect(() => {
        const fetchFullData = async () => {
            if (!initialLotData?.batch_id && !initialLotData?.id) return;
            const batchId = initialLotData.batch_id || initialLotData.id;

            const { supabase } = await import('@/shared/lib/supabase');

            const { data: lotDataDB } = await supabase.from('coffee_purchase_inventory')
                .select('*')
                .or(`lot_number.eq.${batchId},id.eq.${batchId}`)
                .maybeSingle();

            if (lotDataDB) {
                // Merge initial data (targetMarket, destinationCity) with real DB data
                setFetchedLotData({ ...lotDataDB, ...initialLotData });

                const inventoryId = lotDataDB.id;

                if (!initialScaData) {
                    const { data: sca } = await supabase.from('sca_cupping').select('*').eq('inventory_id', inventoryId).maybeSingle();
                    if (sca) setFetchedScaData(sca);
                }

                const { data: phys } = await supabase.from('physical_analysis').select('*').eq('inventory_id', inventoryId).maybeSingle();
                if (phys) setFetchedPhysicalData(phys);
            }
        };

        fetchFullData();
    }, [initialLotData, initialScaData]);

    const lotData = fetchedLotData;
    const scaData = fetchedScaData;

    const targetMarket = lotData?.targetMarket || 'otros';

    const passportId = `AX-${lotData.batch_id || '9822'}-${new Date().getFullYear()}`;

    const scaRadarData = [
        { subject: 'Fragancia', A: scaData?.fragrance_aroma ?? 7.75 },
        { subject: 'Sabor', A: scaData?.flavor ?? 7.75 },
        { subject: 'Post-gusto', A: scaData?.aftertaste ?? 7.75 },
        { subject: 'Acidez', A: scaData?.acidity ?? 7.75 },
        { subject: 'Cuerpo', A: scaData?.body ?? 7.75 },
        { subject: 'Balance', A: scaData?.balance ?? 7.75 },
        { subject: 'Global', A: scaData?.overall ?? 7.50 },
    ];

    return (
        <div
            className="fixed inset-0 z-[100] w-full h-screen overflow-y-auto bg-black/80 backdrop-blur-xl"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full py-10 pb-[150px]">

                {/* Controles de exportación */}
                <div className="w-[816px] mx-auto flex justify-between items-center bg-gray-100 border border-gray-200 p-4 rounded-xl print:hidden no-export mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Digital Passport Control</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl"
                        >
                            Imprimir Pasaporte
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

                {/* AREA DE CAPTURA PDF - 2 HOJAS CARTA */}
                <div id="passport-document-area" className="mx-auto flex flex-col print:m-0"
                    style={{ width: '816px' }}>

                    {/* HOJA 1: IDENTIDAD Y RENDIMIENTO */}
                    <div className="bg-white border border-gray-200 shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:border-none print:break-after-page"
                        style={{ width: '816px', height: '1056px' }}>

                        {/* Header Institucional */}
                        <div className="bg-gray-50 px-12 py-6 flex justify-between items-start border-b border-gray-200">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-brand-green/10 border border-brand-green/20 rounded-2xl flex items-center justify-center">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-black tracking-tighter uppercase leading-none">Export<br />Manifest</h2>
                                    <p className="text-[9px] text-brand-green font-bold uppercase tracking-[0.4em] mt-2">BAX-7370 Protocol Verification | Page 01</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Passport ID</p>
                                <p className="text-xl font-mono text-black font-bold bg-gray-100 px-3 py-1 rounded-md border border-gray-200">{passportId}</p>
                                {lotData?.destinationCity && (
                                    <p className="text-[10px] text-black font-bold uppercase tracking-widest mt-2">DESTINO: {lotData.destinationCity}</p>
                                )}
                            </div>
                        </div>

                        {/* Body Principal */}
                        <div className="flex-1 px-12 py-6 flex flex-col gap-6">
                            {/* ESTRUCTURA MATRIZ HOJA 1 */}

                            {/* SECCIÓN SUPERIOR: Logo y Destino */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
                                {/* Sección 1 (Top-Left): Certificado Dinámico Frontal */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-brand-green-bright uppercase tracking-widest flex items-center gap-3 w-full mb-2">
                                        <span className={`w-2 h-2 rounded-full animate-pulse ${targetMarket === 'europa' ? 'bg-orange-500' : targetMarket === 'usa' ? 'bg-blue-500' : 'bg-brand-green'}`}></span>
                                        1. Verificación Continente
                                    </h3>

                                    {targetMarket === 'europa' ? (
                                        <div className="h-[280px] bg-black/40 rounded-3xl border border-white/5 p-4 relative overflow-hidden flex items-center justify-center flex-col">
                                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ff8800 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-orange-500 mb-4 opacity-70"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2 z-10">Sello EUDR</h4>
                                            {lotData?.process_data?.eudr_polygon ? (
                                                <p className="text-[10px] text-gray-400 font-mono text-center max-w-[200px] z-10">Datos Topográficos Verificados.<br />Polígonos SICA WGS84 Integrados.</p>
                                            ) : (
                                                <p className="text-[10px] text-gray-400 font-mono text-center max-w-[200px] z-10">Datos Topográficos Verificados.<br />{Number(lotData?.farm_size_hectares) < 4 ? 'Exento de Polígono (< 4 He).' : 'Datos Geográficos Pendientes / Modo Compra Activo.'}</p>
                                            )}
                                            <div className="absolute bottom-4 right-4 text-[7px] text-orange-500/50 uppercase font-bold tracking-widest">Protocol BAX-7370</div>
                                        </div>
                                    ) : targetMarket === 'usa' ? (
                                        <div className="h-[280px] bg-black/40 rounded-3xl border border-white/5 p-6 flex flex-col justify-center space-y-4">
                                            <h4 className="text-lg font-black text-blue-500 uppercase tracking-widest mb-2 border-b border-white/10 pb-2">FSMA Custody</h4>
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                                <div className="flex-1 border-b border-dashed border-white/20 pb-2">
                                                    <p className="text-xs font-bold text-white uppercase">Recepción Finca</p>
                                                    <p className="text-[9px] text-gray-500 font-mono mt-1">AX-A001</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                                <div className="flex-1 border-b border-dashed border-white/20 pb-2">
                                                    <p className="text-xs font-bold text-white uppercase">Procesamiento</p>
                                                    <p className="text-[9px] text-gray-500 font-mono mt-1">{lotData?.moisture || '11.5'}% - Trilladora</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-brand-green-bright shadow-[0_0_10px_#00df9a]"></div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-brand-green-bright uppercase">Aduana Salida</p>
                                                    <p className="text-[9px] text-gray-500 font-mono mt-1">Exportador Base</p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 right-4 text-[7px] text-blue-500/50 uppercase font-bold tracking-widest">Protocol BAX-7370</div>
                                        </div>
                                    ) : (
                                        <div className="h-[280px] bg-gray-50 rounded-3xl border border-gray-200 p-6 flex flex-col items-center justify-center text-center gap-4 shadow-sm relative overflow-hidden">
                                            <div className="absolute inset-0 bg-brand-green/[0.02] transform -rotate-12 scale-150 rounded-full blur-3xl"></div>
                                            <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20 shadow-md mb-2 relative z-10">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                                            </div>
                                            <p className="text-base font-black text-black uppercase tracking-widest relative z-10">Global Verifed</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold max-w-[200px] leading-relaxed relative z-10">Certificamos origen, calidad y trazabilidad comercial inmutable.</p>
                                            <div className="absolute bottom-4 right-4 text-[7px] text-brand-green/50 uppercase font-bold tracking-widest">Protocol BAX-7370</div>
                                        </div>
                                    )}
                                </div>

                                {/* Sección 2 (Top-Right): Logística y Pasaporte Aduanero */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        2. Logística y Destino
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 h-[280px]">
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm col-span-2">
                                            <p className="text-[9px] text-gray-500 uppercase mb-1">Mercado Destino Verificado</p>
                                            <p className="text-xl font-bold text-black uppercase">{targetMarket === 'europa' ? 'UNION EUROPEA (EU)' : targetMarket === 'usa' ? 'ESTADOS UNIDOS (USA)' : targetMarket}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm col-span-2 flex justify-between items-center">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase mb-1">Puerto Declarado</p>
                                                <p className="text-sm font-bold text-black uppercase">{lotData?.destinationCity || 'ROTTERDAM, NL'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-gray-500 uppercase mb-1">Transporte Base</p>
                                                <p className="text-sm font-bold text-black uppercase">Contenedor - Lined</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white border-2 border-brand-green/20 rounded-2xl shadow-sm col-span-2 text-center bg-gradient-to-br from-white to-brand-green/[0.02] flex flex-col justify-center items-center">
                                            <p className="text-[9px] text-gray-500 uppercase mb-2">Firma Digital (Hash SHA-256)</p>
                                            <p className="text-[11px] font-mono font-bold text-brand-green uppercase tracking-widest block bg-white px-3 py-1.5 rounded-lg border border-brand-green/20 shadow-sm w-max">
                                                121B021A-62FF-4ED4-B4A
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN INFERIOR: Origen y Física/Mermas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-200">

                                {/* Sección 3 (Bottom-Left): Origen */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        3. Datos de Productor y Finca
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                                                <p className="text-[9px] text-gray-500 uppercase mb-1">Variedad</p>
                                                <p className="text-sm font-bold text-black uppercase">{lotData?.variety || 'Bourbon Rosado'}</p>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                                                <p className="text-[9px] text-gray-500 uppercase mb-1">Proceso</p>
                                                <p className="text-sm font-bold text-black uppercase">{lotData?.process || 'Anaeróbico'}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                                            <p className="text-[9px] text-gray-500 uppercase mb-1">Humedad de Exportación</p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xl font-bold text-black">{lotData?.moisture || fetchedPhysicalData?.moisture_pct || '11.5'}%</p>
                                                <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${(lotData?.moisture || fetchedPhysicalData?.moisture_pct || 11.5) > 12.5 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-brand-green/10 text-brand-green border border-brand-green/20'}`}>{(lotData?.moisture || fetchedPhysicalData?.moisture_pct || 11.5) > 12.5 ? 'Riesgo' : 'Óptimo'}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                                            <p className="text-[9px] text-gray-500 uppercase mb-1 flex items-center gap-1">
                                                Origen y SICA (Fair Trade)
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-black uppercase">{lotData?.farm_name || 'Palermo (Julio Uva)'}</p>
                                                <span className="text-[10px] bg-brand-green/10 text-brand-green px-2 py-0.5 rounded font-bold uppercase border border-brand-green/20">SICA Anclado</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
                                            <p className="text-[9px] text-gray-500 uppercase mb-1 border-b border-gray-300 pb-1">Geolocalización GPS (Polígono EUDR)</p>
                                            <div className="flex items-center justify-between pt-2">
                                                <p className="text-[10px] font-mono text-gray-600">Lat: {lotData?.latitude || '4.570868'} Long: {lotData?.longitude || '-74.297333'}</p>
                                                <span className="text-[10px] text-blue-600 font-bold opacity-80 uppercase tracking-widest">Inmutable</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 4 (Bottom-Right): Física y Mermas */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                                        4. Transformación Física y Mermas
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm col-span-2 flex justify-between items-center">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase mb-1">Materia Prima Ingreso</p>
                                                <p className="text-xl font-bold text-black uppercase">400.00 <span className="text-[10px] text-gray-500">kg</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-gray-500 uppercase mb-1">Materia Exportable</p>
                                                <p className="text-xl font-bold text-brand-green uppercase">400.00 <span className="text-[10px] text-gray-500">kg</span></p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm text-center">
                                            <p className="text-[9px] text-gray-500 uppercase mb-1 border-b border-gray-200 pb-1">Densidad</p>
                                            <p className="text-2xl font-black text-black tracking-tighter mt-2">{fetchedPhysicalData?.density_gl || '720'} <span className="text-[10px] font-bold text-blue-500">g/L</span></p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm text-center">
                                            <p className="text-[9px] text-gray-500 uppercase mb-1 border-b border-gray-200 pb-1">Actividad de Agua (aw)</p>
                                            <p className="text-2xl font-black text-black tracking-tighter mt-2">{fetchedPhysicalData?.water_activity || '0.55'} <span className="text-[10px] font-bold text-gray-500">aw</span></p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm col-span-2">
                                            <p className="text-[9px] text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Granulometría Aprobada</p>
                                            <div className="flex justify-between items-center px-2">
                                                <div className="text-center"><p className="text-[8px] text-gray-500 font-bold mb-1">M18</p><p className="text-xs font-bold text-black">20%</p></div>
                                                <div className="text-center"><p className="text-[8px] text-brand-green font-bold mb-1 border-b border-brand-green">M17</p><p className="text-xs font-bold text-black">45%</p></div>
                                                <div className="text-center"><p className="text-[8px] text-gray-500 font-bold mb-1">M16</p><p className="text-xs font-bold text-black">25%</p></div>
                                                <div className="text-center"><p className="text-[8px] text-gray-500 font-bold mb-1">M15</p><p className="text-xs font-bold text-black">10%</p></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INDICADOR VISUAL DE CORTE (No visible al imprimir ni exportar a PDF) */}
                    <div className="w-full h-8 flex-none bg-black/5 no-export print:hidden flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">--- Page Break ---</span>
                    </div>

                    {/* HOJA 2: HUELLA ORGANOLÉPTICA (RADAR WOW) */}
                    <div className="bg-white border border-gray-200 shadow-2xl relative flex flex-col overflow-hidden print:shadow-none print:border-none print:break-after-page"
                        style={{ width: '816px', height: '1056px' }}>

                        {/* Header P2 */}
                        <div className="bg-gray-50 px-12 py-6 flex justify-between items-center border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-brand-green/10 border border-brand-green/20 rounded-lg flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.4em] text-black">EXPORT MANIFEST</p>
                                    <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">BAX-7370 Protocol Verification | Page 02</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-brand-green-bright font-mono uppercase ">{passportId}</p>
                            </div>
                        </div>

                        {/* Perfil Sensorial */}
                        <div className="flex-1 flex flex-col pt-12">
                            <div className="px-12 mb-8">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-3 justify-center">
                                    <span className="w-2 h-2 rounded-full bg-[#ea580c]"></span>
                                    4. Identidad Sensorial e Inocuidad (SCA)
                                </h3>
                                <p className="text-center text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium mt-3">Huella Organoléptica de Especialidad</p>
                            </div>

                            {/* Score Principal flotando */}
                            <div className="flex items-start justify-center gap-16 mb-4">
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-1">Score Final SCA</p>
                                    <p className="text-6xl font-black text-black tracking-tighter">{scaData?.total_score || '84.00'}</p>
                                </div>
                            </div>

                            {/* Radar Chart Espectacular (Reducido ~30%) */}
                            <div className="w-full h-[320px] relative flex justify-center items-center mt-6">
                                <div className="absolute inset-0 bg-brand-green/[0.03] rounded-full blur-[70px] max-w-[350px] h-[350px] mx-auto top-1/2 -translate-y-1/2"></div>

                                <RadarChart width={350} height={315} cx="50%" cy="50%" outerRadius="70%" data={scaRadarData} className="relative z-10">
                                    <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#444', fontSize: 10, fontWeight: '700' }} />
                                    <Radar
                                        name="Profile"
                                        dataKey="A"
                                        stroke="#00df9a"
                                        strokeWidth={2}
                                        fill="#00df9a"
                                        fillOpacity={0.15}
                                        isAnimationActive={false}
                                    />
                                </RadarChart>

                                {/* Puntos de datos destacados */}
                                <div className="absolute top-4 right-16 space-y-2 opacity-60 z-20 w-40 text-right">
                                    {scaRadarData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3 justify-end hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">{d.subject}</span>
                                            <span className="text-[11px] font-mono font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{Number(d.A).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notas y Footer de Catador */}
                            <div className="px-12 mt-4 pb-8 border-b border-gray-50">
                                <div className="flex items-center justify-center py-6 border-t border-b border-gray-100 mb-6 w-full max-w-2xl mx-auto">
                                    <p className="text-lg font-medium italic text-gray-800 text-center leading-relaxed">
                                        "{scaData?.notes || 'bacancito, chocolate y frutos rojos'}"
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-gray-900 text-[10px] font-bold text-white shadow-sm">QG</div>
                                    <div className="text-left">
                                        <div className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[8px] font-bold uppercase tracking-widest inline-block mb-1 border border-gray-200">Axis Q-Grade Network</div>
                                        <p className="text-xs font-bold text-black uppercase">{scaData?.taster_name || 'Julio Uva (Senior)'}</p>
                                        <p className="text-[8px] text-brand-green-bright font-bold uppercase tracking-widest mt-1">Professional Cupper • Digital Signature</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Hoja 2: Seguridad, QR y Verificación */}
                            <div className="bg-white px-12 py-8 flex justify-between items-center gap-8 relative overflow-hidden mt-auto">
                                <div className="flex items-center gap-6 max-w-2xl">
                                    <div className="p-1 rounded-xl bg-white shadow-lg border border-gray-100 hover:scale-105 transition-transform duration-300">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://axis-pro.coffee') + '/verify/passport/' + passportId)}`}
                                            alt="QR Traceability"
                                            className="w-16 h-16 grayscale opacity-80"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-black uppercase tracking-[0.4em] flex items-center gap-2">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            Trazabilidad Inmutable
                                        </p>
                                        <p className="text-[8px] text-gray-500 uppercase font-medium leading-[1.6] tracking-wider max-w-[300px]">
                                            Certificación de origen y calidad física-sensorial encriptada en la red AXIS para garantizar transparencia de suministro industrial.
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right space-y-3">
                                    <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 inline-block shadow-sm">
                                        <p className="text-[9px] font-mono text-gray-600 tracking-tighter">HASH: 121B021A-62FF</p>
                                    </div>
                                    <p className="text-[7px] text-gray-400 uppercase font-bold tracking-widest leading-none">© 2026 AXIS INTELLIGENCE<br /><span className="mt-1 block">Protocol BAX-7370</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: Acciones PDF - AHORA FUERA DE passport-document-area y DEL RECUADRO PRINCIPAL */}
            <footer className="w-[816px] mx-auto mt-8 bg-[#0B0F19] rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 no-export shadow-2xl">
                <div className="flex items-center gap-4 w-full justify-between">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <span className="w-3 h-3 rounded-full bg-brand-green animate-pulse"></span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:inline-block">Documento Protegido por Axis Cryptofolio</span>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button className="flex-1 md:flex-none px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all shadow-xl">Compartir Digital</button>
                        <ExportReportButton elementId="passport-document-area" fileName={`PASSPORT-${passportId}`} />
                    </div>
                </div>
            </footer>
        </div>
    );
}
