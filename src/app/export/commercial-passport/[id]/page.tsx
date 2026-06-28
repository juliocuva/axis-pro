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
        <div className="min-h-screen bg-gray-200 print:bg-white flex flex-col items-center py-8 print:py-0">
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
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none p-8 text-brand-navy font-sans relative">
                
                {/* Header */}
                <header className="flex justify-between items-start border-b-2 border-brand-green pb-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-brand-navy uppercase mb-1">Commercial Passport</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase">Export Lot Traceability Report</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Lot Internal Code</div>
                        <div className="text-sm font-black text-brand-navy uppercase">{lot.lot_code}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-2 mb-1">Lot Closed At (UTC)</div>
                        <div className="text-xs font-bold text-brand-navy">{issueDate}</div>
                    </div>
                </header>

                {/* Identity & Origin */}
                <section className="mb-4">
                    <h2 className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">1. Commercial Identity</h2>
                    <div className="grid grid-cols-3 gap-y-2 gap-x-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Total Consolidated Volume</div><div className="text-sm font-black text-brand-green">{totalKg.toFixed(1)} KG</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Participating Producers</div><div className="text-sm font-bold">{entries.length} Farmers</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Buyer / Destination</div><div className="text-sm font-bold">{lot.buyer || 'N/A'}</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Consolidated By</div><div className="text-sm font-bold">{lot.exporter || 'N/A'}</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Preparation</div><div className="text-sm font-bold text-brand-navy">{lot.preparation_protocol || 'Excelso EP'}</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Average Price Paid</div><div className="text-sm font-bold text-gray-600">${avgPrice.toFixed(2)} COP/KG</div></div>
                    </div>
                </section>

                {/* Physical Data Averages */}
                <section className="mb-4">
                    <h2 className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">2. Average Physical Quality (Weighted by Volume)</h2>
                    <div className="grid grid-cols-4 gap-y-2 gap-x-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Moisture</div><div className="text-sm font-black text-brand-navy">{avgMoisture.toFixed(2)} %</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Density</div><div className="text-sm font-black text-brand-navy">{avgDensity.toFixed(0)} g/L</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Yield Factor</div><div className="text-sm font-black text-brand-navy">{avgYield.toFixed(2)}</div></div>
                        <div><div className="text-[9px] font-bold text-gray-400 uppercase">Avg Defects</div><div className="text-sm font-black text-brand-navy">{avgDefects.toFixed(2)} %</div></div>
                    </div>
                </section>

                {/* Farms & Producers Traceability */}
                <section className="mb-6">
                    <h2 className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">3. Traceability Breakdown ({entries.length} Deliveries)</h2>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="py-1 text-[9px] font-bold text-gray-400 uppercase">Producer</th>
                                <th className="py-1 text-[9px] font-bold text-gray-400 uppercase">SICA ID</th>
                                <th className="py-1 text-[9px] font-bold text-gray-400 uppercase">Farm Location</th>
                                <th className="py-1 text-[9px] font-bold text-gray-400 uppercase">Variety</th>
                                <th className="py-1 text-[9px] font-bold text-gray-400 uppercase">Process</th>
                                <th className="py-1 text-[9px] font-bold text-gray-400 uppercase text-right">Volume</th>
                                <th className="py-1 text-[9px] font-bold text-gray-400 uppercase text-right">Moisture</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry: any, idx: number) => (
                                <tr key={entry.id} className="border-b border-gray-100">
                                    <td className="py-1 font-bold text-[10px]">{entry.producer_name}</td>
                                    <td className="py-1 font-mono text-[9px] text-gray-500">{entry.sica_code || 'N/A'}</td>
                                    <td className="py-1 text-[10px]">{entry.farm_name}, {entry.municipality}</td>
                                    <td className="py-1 text-[10px] text-gray-600">{entry.variety || 'Blend'}</td>
                                    <td className="py-1 text-[10px] text-gray-600 truncate max-w-[80px]">{entry.process || 'Lavado'}</td>
                                    <td className="py-1 font-bold text-right text-brand-green text-[10px]">{entry.kg_received} KG</td>
                                    <td className="py-1 text-right text-[10px]">{entry.moisture}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Footer with QR */}
                <footer className="absolute bottom-8 left-8 right-8 flex justify-between items-end border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-4">
                        <QRCodeSVG value={currentUrl} size={80} level="M" />
                        <div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Verify Authenticity</div>
                            <div className="text-[10px] font-bold text-brand-navy">Scan this code to view the immutable<br/>digital record on the Axis platform.</div>
                            <div className="text-[8px] font-mono text-gray-400 mt-1 max-w-[200px] truncate">{lotId}</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <img src="/logo.png" alt="AXISONE" className="h-8 w-auto mb-2 opacity-80 mix-blend-multiply ml-auto" onError={e => e.currentTarget.style.display='none'} />
                        <div className="text-[9px] font-bold text-brand-green uppercase tracking-widest">Powered by AxisOne</div>
                    </div>
                </footer>
            </div>
            
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
