'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import CoffeePassport from './CoffeePassport';
import LotCertificate from '@/modules/supply/components/analysis/LotCertificate';
import ShipmentSealer from './ShipmentSealer';
import RoastCurveVisualizer from '@/modules/production/components/RoastCurveVisualizer';

export default function GlobalHistoryArchive({ user }: { user: { companyId: string, email?: string, role?: string } | null }) {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'passport' | 'certificate' | 'roast' | null>(null);
    const [sealerItem, setSealerItem] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filterType, setFilterType] = useState<'ALL' | 'EXPORT' | 'LOTE' | 'AUDIT'>('ALL');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [showAuditModal, setShowAuditModal] = useState(false);

    useEffect(() => {
        fetchGlobalHistory();
    }, []);

    const fetchGlobalHistory = async () => {
        setIsLoading(true);
        let allHistory: any[] = [];
        try {
            let exportsQuery = supabase.from('green_exports').select('*');
            
            // Si el usuario es Julio o Auditor, ve TODO el historial global
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase().includes('julio') && !user?.email?.toLowerCase().includes('main')) {
                exportsQuery = exportsQuery.eq('company_id', user?.companyId);
            }

            const { data: exports } = await exportsQuery.order('created_at', { ascending: false });

            if (exports) {
                const formatted = exports.map(exp => ({
                    id: exp.id,
                    type: 'EXPORT',
                    label: exp.lot_id,
                    date: exp.export_date,
                    status: exp.status === 'FINALIZADA' ? 'Finalizada' : 'Borrador',
                    raw: exp
                }));
                allHistory = [...allHistory, ...formatted];
            }

            // También traemos los certificados de materia prima y su progreso
            let lotsQuery = supabase.from('coffee_purchase_inventory').select('*');
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase().includes('julio') && !user?.email?.toLowerCase().includes('main')) {
                lotsQuery = lotsQuery.eq('company_id', user?.companyId);
            }
            const { data: lots, error: lotsError } = await lotsQuery.order('created_at', { ascending: false });

            // Traemos también los tuestes (Tostión) para cruzar datos
            let roastsQuery = supabase.from('roast_batches').select('*');
            if (user?.role !== 'auditor' && !user?.email?.toLowerCase().includes('julio') && !user?.email?.toLowerCase().includes('main')) {
                roastsQuery = roastsQuery.eq('company_id', user?.companyId);
            }
            const { data: roasts } = await roastsQuery.order('roast_date', { ascending: false });

            if (lots) {
                const formatted = lots.map(lot => {
                    // Calcular en qué punto de los 5 procesos está
                    let step = 1; // Ingreso (siempre 1)
                    if (lot.status === 'thrashed' || lot.status === 'completed' || lot.thrashed_weight > 0) step = 2;
                    if (lot.status === 'completed' || lot.status === 'physical_analyzed') step = 3;
                    if (lot.status === 'completed') step = 4;
                    
                    // Fase 5: Tostión (Si existe un tueste asociado a este lot_id)
                    const roasted = roasts?.some(r => r.inventory_id === lot.id || r.lot_id === lot.id);
                    if (roasted) step = 5;

                    return {
                        id: lot.id,
                        type: 'LOTE',
                        label: `${lot.lot_number} - ${lot.farmer_name}`,
                        date: new Date(lot.created_at).toISOString().split('T')[0],
                        status: lot.status === 'completed' ? 'Completado' : 'En Proceso',
                        step: step,
                        raw: lot
                    };
                });
                allHistory = [...allHistory, ...formatted];
            }


            setHistory(allHistory);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch('/api/track-verify');
            if (res.ok) {
                const logs = await res.json();
                setAuditLogs(logs);
            }
        } catch (e) {
            console.error("Error fetching audit logs:", e);
        }
    };

    const openReport = (item: any) => {
        setSelectedItem(item);
        setViewMode(item.type === 'MANIFIESTO' || item.type === 'EXPORT' ? 'passport' : 'certificate');
    };

    // Filtrado y Búsqueda
    const filteredHistory = history.filter(item => {
        const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

    return (
        <>
            {selectedItem && viewMode === 'passport' && (
                <CoffeePassport
                    lotData={{ 
                        ...selectedItem.raw,
                        batch_id: selectedItem.raw?.lot_number || selectedItem.raw?.id || selectedItem.label,
                        export_data: selectedItem.type === 'EXPORT' ? selectedItem.raw : selectedItem.raw?.export_data
                    }}
                    onClose={() => { setSelectedItem(null); setViewMode(null); }}
                />
            )}

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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl overflow-y-auto">
                    <div className="w-full max-w-4xl animate-in zoom-in-95 duration-500">
                        <header className="flex justify-between items-center mb-8 px-4">
                            <div>
                                <h3 className="text-3xl font-black text-black uppercase er">Perfil de Tueste</h3>
                                <p className="text-[11px] text-black font-bold uppercase  mt-1">{selectedItem.label} • Telemetría Auditable</p>
                            </div>
                            <button onClick={() => { setSelectedItem(null); setViewMode(null); }} className="p-3 bg-white rounded-full hover:bg-white transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </header>
                        <RoastCurveVisualizer data={selectedItem.raw.roast_curve || []} title={`Historial Térmico: ${selectedItem.label}`} />
                        <footer className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                             <div className="bg-white p-4 rounded-xl border border-gray-400 shadow-sm">
                                <p className="text-[9px] text-gray-900 uppercase font-bold mb-1">Carga Verde</p>
                                <p className="text-lg font-bold text-black">{selectedItem.raw.green_weight} KG</p>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-gray-400 shadow-sm">
                                <p className="text-[9px] text-gray-900 uppercase font-bold mb-1">Café Tostado</p>
                                <p className="text-lg font-bold text-black">{selectedItem.raw.roasted_weight} KG</p>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-gray-400 shadow-sm">
                                <p className="text-[9px] text-gray-900 uppercase font-bold mb-1">Merma</p>
                                <p className="text-lg font-bold text-black">
                                    {(((selectedItem.raw.green_weight - selectedItem.raw.roasted_weight)/selectedItem.raw.green_weight)*100).toFixed(2)}%
                                </p>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-gray-400 shadow-sm">
                                <p className="text-[9px] text-gray-900 uppercase font-bold mb-1">Fecha</p>
                                <p className="text-lg font-bold text-black-bright">{selectedItem.raw.roast_date}</p>
                             </div>
                        </footer>
                    </div>
                </div>
            )}

            {sealerItem && (
                <ShipmentSealer
                    exportId={sealerItem.id}
                    lotId={sealerItem.label}
                    baseHash={sealerItem.raw.lot_id}
                    onClose={() => setSealerItem(null)}
                    onSuccess={() => {
                        setSealerItem(null);
                        fetchGlobalHistory();
                    }}
                />
            )}

            <div className="space-y-8 animate-in fade-in duration-700">

                

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 group-focus-within:text-black transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Buscar por Nombre del Caficultor o Lote (Ej: Londoño)..." 
                                className="w-full bg-bg-card border border-gray-400 shadow-sm rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-black uppercase outline-none focus:border-black transition-all"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="flex items-center gap-4 bg-bg-card border border-gray-400 shadow-sm rounded-2xl p-1 px-4">
                            <span className="text-[9px] font-bold text-gray-900 uppercase">Ver:</span>
                            {[10, 25, 50, 100].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => { setItemsPerPage(n); setCurrentPage(1); }}
                                    className={`px-3 py-2 rounded-lg text-[9px] font-bold transition-all ${itemsPerPage === n ? 'bg-white text-black-bright' : 'text-gray-600 hover:text-black'}`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-bg-card border border-gray-400 shadow-sm rounded-2xl p-1">
                            {['ALL', 'EXPORT', 'LOTE', 'AUDIT'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { 
                                        if (t === 'AUDIT') {
                                            fetchAuditLogs();
                                            setShowAuditModal(true);
                                        } else {
                                            setFilterType(t as any); 
                                            setCurrentPage(1); 
                                        }
                                    }}
                                    className={`px-6 py-2 rounded-xl text-[9px] font-bold uppercase  transition-all ${filterType === t || (t === 'AUDIT' && showAuditModal) ? 'bg-brand-green text-black' : 'text-gray-900 hover:text-black'}`}
                                >
                                    {t === 'ALL' ? 'Todo' : t === 'EXPORT' ? 'Exports' : t === 'LOTE' ? 'Lotes' : 'Auditoría'}
                                </button>
                            ))}
                        </div>
                    </div>


                <div className="bg-transparent overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/2 border-b border-gray-400 shadow-sm">
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-900 uppercase  leading-none">Tipo</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-900 uppercase  leading-none">ID Lote / Referencia</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-900 uppercase  leading-none">Fases (01-05)</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-900 uppercase  leading-none">Fecha</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-900 uppercase  leading-none text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-[11px] text-gray-900 font-bold uppercase ">Sincronizando con AXIS CLOUD...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-600 font-mono">
                                        No se encontraron resultados para "{searchTerm}"
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black-bright">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                </div>
                                                <span className="text-xs font-bold text-black">{item.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-mono text-black group-hover:text-black transition-colors uppercase">{item.label}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <div
                                                        key={s}
                                                        className={`w-3 h-3 rounded-full border ${item.type === 'EXPORT'
                                                            ? 'bg-brand-green border-black'
                                                            : (item.step >= s ? 'bg-brand-green border-black' : 'border-gray-400 shadow-sm bg-white')
                                                            } transition-all duration-500`}
                                                        title={`Paso ${s}: ${s === 1 ? 'Ingreso' : s === 2 ? 'Trilla' : s === 3 ? 'Laboratorio' : s === 4 ? 'Catación' : 'Tostión'}`}
                                                    ></div>
                                                ))}
                                                {item.type !== 'EXPORT' && (
                                                    <span className="ml-2 text-[9px] font-bold text-gray-900 uppercase">
                                                        {item.step}/5
                                                    </span>
                                                )}
                                                {item.type === 'EXPORT' && (
                                                    <span className="ml-2 text-[9px] font-bold text-black-bright uppercase">Export</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-gray-900">{item.date}</span>
                                            {item.type === 'EXPORT' && (
                                              <span className={`ml-3 text-[9px] font-bold uppercase px-2 py-1 rounded-md ${item.raw.status === 'FINALIZADA' ? 'bg-white border border-gray-400 shadow-sm text-black border border-gray-400 shadow-sm' : 'bg-white border border-gray-400 shadow-sm text-black-bright border border-gray-400 shadow-sm'}`}>
                                                  {item.raw.status === 'FINALIZADA' ? 'Inmutable' : 'Borrador'}
                                              </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.type === 'EXPORT' && item.raw.status !== 'FINALIZADA' ? (
                                                    <button
                                                        onClick={() => setSealerItem(item)}
                                                        className="px-6 py-2 bg-white text-black-bright hover:bg-brand-green hover:text-black rounded-xl text-[11px] font-bold uppercase  border border-gray-400 shadow-sm transition-all"
                                                    >
                                                        Sellar Embarque
                                                    </button>
                                                ) : null}
                                                <button
                                                    onClick={() => {
                                                        if (item.type === 'TOSTION') {
                                                            setSelectedItem(item);
                                                            setViewMode('roast');
                                                        } else {
                                                            openReport(item);
                                                        }
                                                    }}
                                                    className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase  border transition-all disabled:opacity-30 ${item.type === 'EXPORT' && item.raw.status === 'FINALIZADA' ? 'bg-brand-green text-black hover:bg-brand-green-bright border-black' : 'bg-white hover:bg-brand-green hover:text-black border-gray-400 shadow-sm'}`}
                                                    disabled={item.step < 4 && item.raw.status !== 'Tostado' && item.type !== 'EXPORT'}
                                                >
                                                    {item.type === 'EXPORT' || item.type === 'TOSTION' || item.step === 4 ? 'Visualizar' : 'En Proceso'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    <div className="bg-white/2 border-t border-gray-400 shadow-sm p-6 flex justify-between items-center bg-black/20">
                        <div className="space-y-1">
                            <p className="text-[11px] text-black font-bold uppercase ">
                                Mostrando <span className="text-black">{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredHistory.length)}</span> de <span className="text-black-bright">{filteredHistory.length}</span> registros
                            </p>
                            {searchTerm && <p className="text-[9px] text-gray-600 uppercase">Filtro activo: "{searchTerm}"</p>}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <p className="text-[11px] text-gray-900 font-bold uppercase ">Página {currentPage} / {totalPages || 1}</p>
                            <div className="flex gap-2">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="px-5 py-2.5 border border-gray-400 shadow-sm rounded-xl text-[9px] font-bold uppercase disabled:opacity-10 hover:bg-white hover:border-gray-400 shadow-sm transition-all flex items-center gap-2"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="15 18 9 12 15 6"/></svg>
                                    Anterior
                                </button>
                                <button 
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="px-5 py-2.5 border border-gray-400 shadow-sm rounded-xl text-[9px] font-bold uppercase disabled:opacity-10 hover:bg-white hover:border-gray-400 shadow-sm transition-all flex items-center gap-2"
                                >
                                    Siguiente
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-bg-card border border-gray-400 shadow-sm rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white blur-3xl rounded-full group-hover:bg-white transition-all"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-bold text-gray-900 uppercase ">Analytics Export</h4>
                                <p className="text-xl font-bold text-black ">Reporte Consolidado Mensual</p>
                                <p className="text-xs text-gray-900 leading-relaxed uppercase font-bold ">Genera un PDF con todos los movimientos del mes, puntajes basados en estándares de la SCA promedio y yield de trilla acumulado.</p>
                            </div>
                            <button className="mt-8 w-full py-4 border border-gray-400 shadow-sm rounded-2xl text-[11px] font-bold uppercase  hover:bg-white transition-all">Sincronizar Reporte Completo</button>
                        </div>
                    </div>

                    <div className="p-8 bg-white border border-gray-400 shadow-sm rounded-3xl relative overflow-hidden group">
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white blur-3xl rounded-full"></div>
                        <div className="relative z-10 flex h-full items-center justify-between">
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-bold text-black uppercase ">Ready for Print</h4>
                                <p className="text-xl font-bold text-black ">Vista de Impresión Unificada</p>
                                <p className="text-xs text-black/70 uppercase font-bold  leading-relaxed">Configurado para papel certificado 250g.</p>
                            </div>
                            <div className="w-16 h-16 bg-brand-green text-black rounded-2xl flex items-center justify-center shadow-xl shadow-brand-green/20 group-hover:scale-110 transition-transform">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AUDIT LOGS MODAL */}
            {showAuditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAuditModal(false)}></div>
                    <div className="w-full max-w-4xl bg-bg-card border border-gray-400 shadow-sm rounded-industrial shadow-3xl relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
                        <header className="p-8 border-b border-gray-400 shadow-sm flex justify-between items-center bg-white/2">
                            <div>
                                <h3 className="text-xl font-bold text-black uppercase er">Bóveda de Trazabilidad In-Situ</h3>
                                <p className="text-[11px] text-black font-bold uppercase  mt-1">Registros de validación y georreferenciación en tiempo real</p>
                            </div>
                            <button onClick={() => setShowAuditModal(false)} className="text-gray-900 hover:text-black transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-4">
                                {auditLogs.length === 0 ? (
                                    <div className="text-center py-20 text-gray-700 uppercase font-bold text-xs ">No hay registros de auditoría recientes</div>
                                ) : (
                                    auditLogs.slice().reverse().map((log) => (
                                        <div key={log.id} className="p-5 bg-white/2 border border-gray-400 shadow-sm rounded-2xl flex justify-between items-center group hover:bg-white transition-all">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 bg-white text-black-bright text-[9px] font-bold rounded uppercase border border-gray-400 shadow-sm">{log.eudr_status || 'CAPTURED'}</span>
                                                    <span className="text-sm font-bold text-black uppercase">{log.farm_name}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[11px] text-gray-900 font-bold uppercase ">
                                                    <span className="text-black-bright">{log.email}</span>
                                                    <span>•</span>
                                                    <span>{new Date(log.verified_at).toLocaleString()}</span>
                                                </div>
                                                {log.polygon && (
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                            <span className="text-[9px] font-mono text-gray-600 truncate max-w-[200px]">POLY: {log.polygon.substring(0, 50)}...</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const blob = new Blob([log.polygon], { type: 'application/json' });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `AXIS_AUDIT_${log.farm_name}_${log.id.substring(0,8)}.geojson`;
                                                                document.body.appendChild(a);
                                                                a.click();
                                                                document.body.removeChild(a);
                                                                URL.revokeObjectURL(url);
                                                            }}
                                                            className="text-[9px] bg-white text-black hover:bg-brand-green hover:text-black px-2 py-0.5 rounded transition-all font-bold uppercase"
                                                        >
                                                            Descargar GeoJSON
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-[9px] font-mono text-gray-700 bg-white px-2 py-1 rounded">{log.id}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div>
                                                    <span className="text-[9px] font-bold text-gray-900 uppercase">Sincronizado</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
