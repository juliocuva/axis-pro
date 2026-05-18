'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import LotCertificate from '@/modules/supply/components/analysis/LotCertificate';
import RoastCurveVisualizer from '@/modules/production/components/RoastCurveVisualizer';

type VaultCategory = 'ALL' | 'SUPPLY' | 'ROAST' | 'AUDIT';

export default function CloudVault({ user }: { user: any }) {
    const [vaultItems, setVaultItems] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'certificate' | 'roast' | 'audit' | null>(null);
    const [category, setCategory] = useState<VaultCategory>('ALL');

    useEffect(() => {
        fetchUnifiedVault();
    }, []);

    const fetchUnifiedVault = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Inventory (Recolección y Procesos)
            const { data: lots } = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('company_id', user?.companyId)
                .order('created_at', { ascending: false });

            // 2. Fetch Roasts (Tostión)
            const { data: roasts } = await supabase
                .from('roast_batches')
                .select('*')
                .eq('company_id', user?.companyId)
                .order('roast_date', { ascending: false });

            // 3. Fetch Audit Logs (Auditoría EUDR)
            const auditRes = await fetch('/api/track-verify');
            const logs = auditRes.ok ? await auditRes.json() : [];
            setAuditLogs(logs.filter((log: any) => log.company_id === user?.companyId || user?.role === 'admin'));

            const items = [
                ...(lots || []).map(l => ({ 
                    ...l, 
                    vaultType: 'SUPPLY', 
                    label: `LOTE: ${l.lot_number}`, 
                    date: l.created_at 
                })),
                ...(roasts || []).map(r => ({ 
                    ...r, 
                    vaultType: 'ROAST', 
                    label: `TOSTIÓN: ${r.lot_id || r.id.substring(0,8)}`, 
                    date: r.roast_date 
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setVaultItems(items);
        } catch (error) {
            console.error("Unified Vault Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredItems = vaultItems.filter(item => {
        if (category === 'ALL') return true;
        return item.vaultType === category;
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Unificado */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-black/5 pb-8">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-black">Archivo Maestro</h2>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mt-2">ADN del Café: Recolección, Proceso y Taza</p>
                </div>
                <div className="flex bg-black/5 p-1 rounded-2xl border border-black/5">
                    {[
                        { id: 'ALL', label: 'Todo el Historial' },
                        { id: 'SUPPLY', label: 'Lotes y Procesos' },
                        { id: 'ROAST', label: 'Tostión' },
                        { id: 'AUDIT', label: 'Auditoría EUDR' }
                    ].map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id as VaultCategory)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${category === cat.id ? 'bg-black text-white shadow-lg' : 'text-black/40 hover:text-black'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modales de Visualización */}
            {selectedItem && viewMode === 'certificate' && (
                <div className="fixed inset-0 z-[9999] w-full h-screen overflow-y-auto bg-black/95 backdrop-blur-2xl">
                    <div className="w-full py-10 pb-[150px]">
                        <LotCertificate
                            inventoryId={selectedItem.id}
                            user={user}
                            onClose={() => { setSelectedItem(null); setViewMode(null); }}
                        />
                    </div>
                </div>
            )}

            {selectedItem && viewMode === 'roast' && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
                    <div className="w-full max-w-4xl animate-in zoom-in-95 duration-500">
                        <header className="flex justify-between items-center mb-8 bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase">Perfil de Tueste</h3>
                                <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Telemetría In-Situ</p>
                            </div>
                            <button onClick={() => { setSelectedItem(null); setViewMode(null); }} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-all">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </header>
                        <RoastCurveVisualizer data={selectedItem.roast_curve || []} title={`Lote: ${selectedItem.label}`} />
                    </div>
                </div>
            )}

            {/* Grid de Contenido */}
            {category === 'AUDIT' ? (
                <div className="space-y-4">
                    {auditLogs.length === 0 ? (
                        <div className="py-20 text-center text-black/20 font-black uppercase text-xs">No hay registros de auditoría</div>
                    ) : (
                        auditLogs.map((log, i) => (
                            <div key={i} className="p-6 bg-white border border-gray-200 rounded-3xl flex justify-between items-center hover:border-brand-green transition-all group">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-0.5 bg-brand-green text-black text-[9px] font-black rounded uppercase">Verified</span>
                                        <h4 className="text-sm font-black uppercase">{log.farm_name}</h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-black/40 uppercase">
                                        {new Date(log.verified_at).toLocaleString()} • {log.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-black/20 uppercase mb-1">Status EUDR</p>
                                        <p className="text-[10px] font-black text-brand-green uppercase">Deforestation Free</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black group-hover:bg-brand-green transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-black/5 animate-pulse rounded-3xl border border-black/5"></div>
                        ))
                    ) : filteredItems.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-black/20 uppercase font-black text-xs tracking-widest">
                            No se encontraron registros
                        </div>
                    ) : (
                        filteredItems.map((item, i) => (
                            <div 
                                key={i}
                                onClick={() => {
                                    setSelectedItem(item);
                                    if (item.vaultType === 'SUPPLY') setViewMode('certificate');
                                    if (item.vaultType === 'ROAST') setViewMode('roast');
                                }}
                                className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 group cursor-pointer hover:border-brand-green transition-all relative overflow-hidden flex flex-col justify-between h-52"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                    <div className="w-10 h-10 rounded-full bg-brand-green text-black flex items-center justify-center shadow-lg">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                        item.vaultType === 'ROAST' ? 'bg-orange-500/10 text-orange-600' : 
                                        'bg-black/5 text-black'
                                    }`}>
                                        {item.vaultType === 'ROAST' ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8a6 6 0 0 1-7.74 5.74M6 16a6 6 0 0 1-5.74-7.74M8 18a6 6 0 0 1 5.74-7.74M16 6a6 6 0 0 1 5.74 7.74"/></svg>
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">
                                            {item.vaultType === 'ROAST' ? 'Perfil de Tueste' : 'Certificado Industrial'}
                                        </p>
                                        <h4 className="text-sm font-black text-black truncate uppercase">{item.label}</h4>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between border-t border-black/5 pt-4">
                                    <span className="text-[10px] font-mono font-bold text-black/40">
                                        {new Date(item.date).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div>
                                        <span className="text-[8px] font-black text-brand-green uppercase">Certificado</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
