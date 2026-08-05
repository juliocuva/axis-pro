'use client';

import React from 'react';

interface PublicMillingReportProps {
    lotId: string;
    trillaData: any;
    leadData: any;
    purchaseWeight: number;
}

export default function PublicMillingReport({ lotId, trillaData, leadData, purchaseWeight }: PublicMillingReportProps) {
    const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }).toUpperCase();

    const processMap: Record<string, string> = {
        'Lavado': 'Washed',
        'Natural': 'Natural',
        'Honey': 'Honey'
    };
    const sortingMap: Record<string, string> = {
        'Máquina Selectora Óptica': 'Optical Sorter',
        'Zaranda Manual': 'Manual Screen',
        'Electrónica': 'Electronic Sorter'
    };

    // Data Extraction
    const farmName = leadData?.company || 'INDEPENDIENTE';
    const producerName = leadData?.name || 'NO REGISTRADO';
    const variety = trillaData?.varietal || 'N/A';
    const rawProcess = trillaData?.processType || 'N/A';
    const process = processMap[rawProcess] || rawProcess;
    const humidity = trillaData?.humidity || '0.0';
    const preparationProtocol = trillaData?.preparationProtocol || 'N/A';
    const rawSorting = trillaData?.sortingMethod || 'N/A';
    const sortingMethod = sortingMap[rawSorting] || rawSorting;

    // Weights & Yield
    const thrashedYield = trillaData?.stats?.yieldFactor ? Number(trillaData.stats.yieldFactor).toFixed(2) : '--';
    const almondWeight = trillaData?.stats?.almondWeight ? Number(trillaData.stats.almondWeight).toFixed(1) : '0';
    const lossPct = trillaData?.stats?.lossPct ? Number(trillaData.stats.lossPct).toFixed(1) : '0';

    // Granulometry
    const physData = trillaData?.sieveAnalysis || {};
    const screenData = [
        { m: 'M18',   v: physData.m18,  big: true  },
        { m: 'M17',   v: physData.m17,  big: true  },
        { m: 'M16',   v: physData.m16,  big: true  },
        { m: 'M15',   v: physData.m15,  big: true  },
        { m: 'M14',   v: physData.m14,  big: false },
        { m: 'M13',   v: physData.m13,  big: false },
        { m: 'M12',   v: physData.m12,  big: false },
        { m: 'FONDO', v: physData.menores, big: false },
    ];
    const hasGranulometry = screenData.some(s => Number(s.v || 0) > 0);

    return (
        <div id="public-milling-report" className="relative mx-auto bg-white overflow-hidden shadow-2xl" style={{ width: '794px', minHeight: '1123px' }}>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 0 !important; }
                    body { margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                #public-milling-report { font-family: 'Montserrat', sans-serif; }
            `}} />

            <div className="px-10 py-10 pb-8 flex flex-col h-full bg-white relative">
                
                {/* Header */}
                <div className="flex justify-between items-end mb-4">
                    {/* Logo Area */}
                    <div className="flex flex-col">
                        <img src="/logo-axisone.png" alt="AxisOne Coffee" className="h-20 object-contain" />
                    </div>

                    {/* Title Area */}
                    <div className="text-center px-4 relative top-1">
                        <h1 className="text-[28px] font-black text-brand-navy tracking-tight leading-none uppercase">MILLING PASSPORT</h1>
                        <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mt-1">PUBLIC YIELD & QUALITY REPORT</p>
                    </div>

                    {/* Placeholder to balance flex-between */}
                    <div className="w-[120px]"></div>
                </div>

                {/* Thick Green Divider */}
                <div className="h-1 w-full bg-brand-green mb-4"></div>

                {/* Meta Area (Centered Distribution) */}
                <div className="bg-gray-50 rounded-xl px-5 py-4 mb-8 border border-gray-100/50 text-center mx-auto w-[90%]">
                    <div className="mb-3">
                        <p className="text-[11px] font-black text-brand-navy tracking-wider uppercase leading-none mb-1.5">REPORT OBJECTIVE</p>
                        <p className="text-[10px] font-bold text-brand-navy leading-snug">To provide a standardized digital record of physical quality and milling yield. <br/><span className="text-gray-500 font-medium">Cloud storage and advanced traceability features are unlocked in AxisOne PRO.</span></p>
                    </div>
                    <div className="flex justify-center items-center gap-10 border-t border-gray-200/60 pt-4 mt-3">
                        <div>
                            <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase leading-none mb-1.5">LOT INTERNAL CODE</p>
                            <p className="text-[13px] font-black text-brand-navy leading-none">{lotId}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div>
                            <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase leading-none mb-1.5">LOT CLOSED AT (LOCAL)</p>
                            <p className="text-[13px] font-black text-brand-navy leading-none">{today}, {time}</p>
                        </div>
                    </div>
                </div>

                {/* Section 1 */}
                <div className="mb-8">
                    <h2 className="text-[11px] font-black text-brand-green uppercase tracking-wider mb-3 text-center">1. LOT IDENTITY & ORIGIN</h2>
                    <div className="bg-[#f8fafc] rounded-2xl px-6 py-2">
                        <div className="grid grid-cols-3 py-5 border-b border-gray-200/60 text-center">
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">YIELD FACTOR</p>
                                <p className="text-[26px] font-black text-brand-green leading-none">{thrashedYield}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">PRODUCER</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none truncate px-2">{producerName}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">FARM / COMPANY</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none truncate px-2">{farmName}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 py-5 text-center">
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">SOURCE PLATFORM</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none">AxisOne Milling Tool</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">PREPARATION</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none">{preparationProtocol}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">SORTING METHOD</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none">{sortingMethod}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div className="mb-8">
                    <h2 className="text-[11px] font-black text-brand-green uppercase tracking-wider mb-3 text-center">2. PROCESSING PROFILE & PHYSICAL QUALITY</h2>
                    <div className="bg-[#f8fafc] rounded-2xl px-6 py-2">
                        <div className="grid grid-cols-3 py-5 border-b border-gray-200/60 text-center">
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">LOT TYPE</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none">Blend Comercial</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">VARIETY</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none">{variety}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">PROCESS</p>
                                <p className="text-[15px] font-black text-brand-navy leading-none">{process}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 py-5 text-center items-center">
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">MILLING LOSS (MERMA)</p>
                                <p className="text-[18px] font-black text-brand-navy leading-none">{lossPct} <span className="text-[12px]">%</span></p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">RAW PARCHMENT VOLUME</p>
                                <p className="text-[18px] font-black text-brand-navy leading-none">{purchaseWeight} <span className="text-[12px] text-gray-400">KG</span></p>
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-gray-400 tracking-wider uppercase mb-1">ALMOND OUTPUT</p>
                                <p className="text-[26px] font-black text-brand-green leading-none">{almondWeight} <span className="text-[14px]">KG</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3 */}
                {hasGranulometry && (
                    <div className="mb-4">
                        <h2 className="text-[11px] font-black text-brand-green uppercase tracking-wider mb-3 text-center">3. SIEVE ANALYSIS BREAKDOWN</h2>
                        <div className="w-1/2 mx-auto bg-[#f8fafc] rounded-2xl px-6 py-4">
                            {screenData.filter(s => Number(s.v || 0) > 0).map((item, i) => (
                                <div key={i} className="flex items-center gap-4 mb-3 last:mb-0">
                                    <div className="w-10 text-[10px] font-black text-brand-navy text-right">{item.m}</div>
                                    <div className="flex-1 h-3.5 bg-gray-200 rounded-sm overflow-hidden relative">
                                        <div 
                                            className="h-full bg-brand-green absolute top-0 left-0 rounded-sm" 
                                            style={{ width: `${(Number(item.v || 0) / Math.max(...screenData.map(s => Number(s.v || 0)), 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-10 text-[11px] font-black text-brand-green">{Number(item.v || 0).toFixed(1)}<span className="text-[9px]">%</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer fixed at Bottom */}
                <div className="mt-auto flex justify-end items-end border-t border-gray-200 pt-6">
                    <div className="text-right pb-1 flex flex-row items-center justify-end gap-3">
                        <p className="text-[7px] font-black text-gray-400 tracking-widest uppercase relative top-0.5">POWERED BY</p>
                        <img src="/logo-axisone.png" alt="AxisOne Coffee" className="h-8 object-contain opacity-90 grayscale" />
                    </div>
                </div>

            </div>
        </div>
    );
}
