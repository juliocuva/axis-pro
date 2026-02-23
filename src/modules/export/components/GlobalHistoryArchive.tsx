'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import CoffeePassport from './CoffeePassport';
import LotCertificate from '@/modules/supply/components/analysis/LotCertificate';

export default function GlobalHistoryArchive() {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'passport' | 'certificate' | null>(null);

    useEffect(() => {
        fetchGlobalHistory();
    }, []);

    const fetchGlobalHistory = async () => {
        setIsLoading(true);
        let allHistory: any[] = [];
        try {
            const { data: exports } = await supabase
                .from('green_exports')
                .select('*')
                .order('created_at', { ascending: false });

            if (exports) {
                const formatted = exports.map(exp => ({
                    id: exp.id,
                    type: 'EXPORT',
                    label: exp.lot_id,
                    date: exp.export_date,
                    status: 'Exportado',
                    raw: exp
                }));
                allHistory = [...allHistory, ...formatted];
            }

            // También traemos los certificados de materia prima
            const { data: lots } = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            if (lots) {
                const formatted = lots.map(lot => ({
                    id: lot.id,
                    type: 'CERTIFICADO',
                    label: lot.farmer_name,
                    date: new Date(lot.created_at).toISOString().split('T')[0],
                    status: 'Calidad SCA',
                    raw: lot
                }));
                allHistory = [...allHistory, ...formatted];
            }

            setHistory(allHistory);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openReport = (item: any) => {
        setSelectedItem(item);
        // Si es un manifiesto de exportación, ver pasaporte. Si es un lote de inventario, ver certificado.
        setViewMode(item.type === 'MANIFIESTO' || item.type === 'EXPORT' ? 'passport' : 'certificate');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {selectedItem && viewMode === 'passport' && (
                <CoffeePassport
                    lotData={{ batch_id: selectedItem.label }}
                    onClose={() => { setSelectedItem(null); setViewMode(null); }}
                />
            )}

            {selectedItem && viewMode === 'certificate' && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl overflow-y-auto">
                    <LotCertificate
                        inventoryId={selectedItem.id}
                        onClose={() => { setSelectedItem(null); setViewMode(null); }}
                    />
                </div>
            )}

            <header className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Archivo de Nube AXIS</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Visualización de historial verificado in-situ</p>
                </div>
                <button onClick={fetchGlobalHistory} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                </button>
            </header>

            <div className="bg-bg-card border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/2 border-b border-white/5">
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Tipo de Documento</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">ID Lote / Lote</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Fecha de Registro</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Estado Asset</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sincronizando con AXIS CLOUD...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : history.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No hay manifiestos generados aún.</p>
                                </td>
                            </tr>
                        ) : (
                            history.map((item) => (
                                <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <span className="text-xs font-bold text-white">{item.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-mono text-gray-400 group-hover:text-white transition-colors uppercase">{item.label}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-bold text-gray-500">{item.date}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                            <span className="text-[9px] font-bold text-brand-green uppercase tracking-widest">{item.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => openReport(item)}
                                            className="px-6 py-2 bg-white/5 hover:bg-brand-green hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all"
                                        >
                                            Visualizar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-bg-card border border-white/5 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full group-hover:bg-brand-green/10 transition-all"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em]">Analytics Export</h4>
                            <p className="text-xl font-bold text-white tracking-tight">Reporte Consolidado Mensual</p>
                            <p className="text-xs text-gray-500 leading-relaxed uppercase font-bold tracking-wider">Genera un PDF con todos los movimientos del mes, puntajes SCA promedio y yield de trilla acumulado.</p>
                        </div>
                        <button className="mt-8 w-full py-4 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Sincronizar Reporte Completo</button>
                    </div>
                </div>

                <div className="p-8 bg-brand-green/5 border border-brand-green/10 rounded-3xl relative overflow-hidden group">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-green/10 blur-3xl rounded-full"></div>
                    <div className="relative z-10 flex h-full items-center justify-between">
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-brand-green uppercase tracking-[0.4em]">Ready for Print</h4>
                            <p className="text-xl font-bold text-white tracking-tight">Vista de Impresión Unificada</p>
                            <p className="text-xs text-brand-green/70 uppercase font-bold tracking-wider leading-relaxed">Configurado para papel certificado 250g.</p>
                        </div>
                        <div className="w-16 h-16 bg-brand-green text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand-green/20 group-hover:scale-110 transition-transform">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
