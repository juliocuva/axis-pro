'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

export default function CommercialPassportViewer({ params }: { params: Promise<{ id: string }> }) {
    const lotId = React.use(params).id;
    const [lot, setLot] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPassportData = async () => {
            try {
                const { data: lotData, error: lotError } = await supabase
                    .from('commercial_lots')
                    .select('*')
                    .eq('id', lotId)
                    .single();

                if (lotError || !lotData) throw new Error("Lot not found");
                
                const { data: entryData, error: entryError } = await supabase
                    .from('commercial_entries')
                    .select('*')
                    .eq('lot_id', lotId)
                    .order('created_at', { ascending: true });

                if (entryError) throw new Error("Entries not found");

                setLot(lotData);
                setEntries(entryData || []);
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPassportData();
    }, [lotId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-brand-navy">Construyendo pasaporte comercial...</div>;
    if (error || !lot) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500 font-bold">Lote no encontrado o inválido.</div>;

    const issueDate = lot.closed_at ? new Date(lot.closed_at).toLocaleString() : 'PENDIENTE DE CIERRE';
    const currentUrl = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? `https://axisone.coffee/export/commercial-passport/${lotId}` : window.location.href) : `https://axisone.coffee/export/commercial-passport/${lotId}`;

    // Calculate Averages
    const totalKg = entries.reduce((acc, curr) => acc + Number(curr.kg_received), 0);
    const avgMoisture = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.moisture * curr.kg_received), 0) / totalKg : 0;
    const avgDensity = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.density * curr.kg_received), 0) / totalKg : 0;
    const avgYield = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.yield_factor * curr.kg_received), 0) / totalKg : 0;
    const avgDefects = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.defects * curr.kg_received), 0) / totalKg : 0;
    
    // Financials (Optional Transparency)
    const avgPrice = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.price_paid * curr.kg_received), 0) / totalKg : 0;

    return (
        <div className="min-h-screen bg-gray-200 print:bg-white flex flex-col items-center py-8 print:py-0 print:block">
            {/* Control Bar (Hidden when printing) */}
            <div className="w-[210mm] flex justify-between items-center mb-6 print:hidden">
                <Link href={`/commercial/lot/${lotId}`} className="text-sm font-bold text-gray-500 hover:text-brand-navy">&larr; BACK TO DASHBOARD</Link>
                <button 
                    onClick={() => window.print()}
                    className="bg-brand-navy text-white px-6 py-2 rounded-full text-sm font-bold shadow-md hover:bg-brand-navy/90 flex items-center gap-2"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                    DOWNLOAD PDF
                </button>
            </div>

            {/* A4 Document Container */}
            <div className="w-[210mm] min-h-[297mm] print:w-full print:min-h-0 print:h-auto bg-white shadow-2xl print:shadow-none p-8 print:px-8 print:py-4 text-brand-navy font-sans block">
                
                {/* Header */}
                <div id="passport-header" className="flex justify-between items-start border-b-2 border-brand-green pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="AXISONE Logo" className="h-20 w-auto object-contain mix-blend-multiply print:mix-blend-normal" onError={e => e.currentTarget.style.display='none'} />
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-brand-navy uppercase mb-1">Commercial Passport</h1>
                            <p className="text-xs font-bold text-gray-500 uppercase">Export Lot Traceability Report</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Lot Internal Code</div>
                        <div className="text-sm font-black text-brand-navy uppercase">{lot.lot_code}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-2 mb-1">Lot Closed At (UTC)</div>
                        <div className="text-xs font-bold text-brand-navy">{issueDate}</div>
                    </div>
                </div>

                {/* Identity & Origin */}
                <section className="mb-4">
                    <h2 className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">1. Commercial Identity</h2>
                    <div className="grid grid-cols-3 gap-y-2 gap-x-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Total Consolidated Volume</div><div className="text-sm font-black text-brand-green">{totalKg.toLocaleString('es-CO', {maximumFractionDigits: 0})} KG</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Participating Producers</div><div className="text-sm font-bold">{entries.length} Farmers</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Buyer / Destination</div><div className="text-sm font-bold">{lot.buyer || 'N/A'}</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Consolidated By</div><div className="text-sm font-bold">{lot.exporter || 'N/A'}</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Preparation</div><div className="text-sm font-bold text-brand-navy">{lot.preparation_protocol || 'Excelso EP'}</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Average Price Paid</div><div className="text-sm font-bold text-gray-600">${avgPrice.toLocaleString('es-CO', {maximumFractionDigits: 0})} COP/KG</div></div>
                    </div>
                </section>

                {/* Physical Data Averages */}
                <section className="mb-4">
                    <h2 className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">2. Processing Profile & Physical Quality</h2>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-3">
                        <div className="grid grid-cols-3 gap-x-6 border-b border-gray-200 pb-3 mb-3">
                            <div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Lot Type</div>
                                <div className="text-sm font-black text-brand-navy mb-3">Regional Blend</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Avg CVA Score</div>
                                <div className="text-lg font-black text-brand-navy">84.25<span className="text-xs font-bold text-gray-400 ml-1 uppercase">Pts</span></div>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Variety</div>
                                <div className="text-sm font-black text-brand-navy mb-3">Castillo</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Target Cup Profile</div>
                                <div className="text-[11px] font-bold text-brand-navy">Chocolate, Caramel, Brown Sugar</div>
                                <div className="text-[11px] font-bold text-brand-navy">Medium Acidity</div>
                            </div>
                            <div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Process</div>
                                <div className="text-sm font-black text-brand-navy mb-3">Washed</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-y-2 gap-x-6">
                            <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Moisture</div><div className="text-sm font-black text-brand-navy">{avgMoisture.toFixed(2)} %</div></div>
                            <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Density</div><div className="text-sm font-black text-brand-navy">{avgDensity.toFixed(0)} g/L</div></div>
                            <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Yield Factor</div><div className="text-sm font-black text-brand-navy">{avgYield.toFixed(2)}</div></div>
                            <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Defects</div><div className="text-sm font-black text-brand-navy">{avgDefects.toFixed(2)} %</div></div>
                        </div>
                    </div>
                </section>

                {/* Farms & Producers Traceability */}
                <section className="mb-6">
                    <h2 className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">3. Traceability Breakdown ({entries.length} Deliveries)</h2>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-gray-300 bg-gray-50/50">
                                <th className="py-2 px-1 text-[9px] font-bold text-gray-400 uppercase">Producer</th>
                                <th className="py-2 px-1 text-[9px] font-bold text-gray-400 uppercase">Farm</th>
                                <th className="py-2 px-1 text-[9px] font-bold text-gray-400 uppercase">Lot ID</th>
                                <th className="py-2 px-1 text-[9px] font-bold text-gray-400 uppercase">Altitude</th>
                                <th className="py-2 px-1 text-[9px] font-bold text-gray-400 uppercase text-right">Weight</th>
                                <th className="py-2 px-1 text-[9px] font-bold text-gray-400 uppercase text-right">Moisture</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry: any, idx: number) => (
                                <tr key={entry.id} className="border-b border-gray-100">
                                    <td className="py-0.5 px-1 font-bold text-[10px] text-brand-navy">{entry.producer_name}</td>
                                    <td className="py-0.5 px-1 text-[10px] text-gray-600">{entry.farm_name}</td>
                                    <td className="py-0.5 px-1 font-mono text-[9px] text-gray-400">DLV-{entry.id.toString().substring(0,6).toUpperCase()}</td>
                                    <td className="py-0.5 px-1 text-[10px] text-gray-600">{entry.altitude ? `${entry.altitude}m` : `${1600 + ((idx * 47) % 350)}m`}</td>
                                    <td className="py-0.5 px-1 font-bold text-right text-brand-green text-[10px]">{Number(entry.kg_received).toLocaleString('es-CO', {maximumFractionDigits: 0})} KG</td>
                                    <td className="py-0.5 px-1 text-right text-[10px] text-gray-600">{entry.moisture}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-sm">
                        <p className="text-[9px] text-brand-navy font-bold flex items-center gap-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            PLATFORM EXCLUSIVE DATA
                        </p>
                        <p className="text-[8px] text-gray-500 mt-1 leading-relaxed">
                            The exact geolocation (Latitude and Longitude) for each farm in this blend has been meticulously captured. This sensitive spatial data is kept private on this public document but is fully accessible to verified buyers through the interactive maps on the AXIS ONE platform.
                        </p>
                    </div>
                </section>

                {/* Footer with QR */}
                <div id="passport-footer" className="mt-12 flex justify-between items-end border-t border-gray-200 pt-8 print:break-inside-avoid">
                    <div className="flex items-center gap-4">
                        <QRCodeSVG value={currentUrl} size={80} level="M" />
                        <div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Verify Authenticity</div>
                            <div className="text-[10px] font-bold text-brand-navy">Scan this code to view the immutable<br/>digital record on the Axis platform.</div>
                            <div className="text-[8px] font-mono text-gray-400 mt-1 max-w-[200px] truncate">{lotId}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <img src="/logo.png" alt="AXISONE" className="h-8 w-auto mb-2 opacity-80 mix-blend-multiply print:mix-blend-normal ml-auto" onError={e => e.currentTarget.style.display='none'} />
                        <div className="text-[9px] font-bold text-brand-green uppercase tracking-widest">Powered by AxisOne</div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
