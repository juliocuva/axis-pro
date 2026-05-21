'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase';
import LotCertificate from '@/modules/supply/components/analysis/LotCertificate';

interface ClientLotsArchiveProps {
    companyId: string;
    companyName: string;
    onClose: () => void;
}

export default function ClientLotsArchive({ companyId, companyName, onClose }: ClientLotsArchiveProps) {
    const [lots, setLots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const LOTS_PER_PAGE = 10;

    useEffect(() => {
        fetchLots();
    }, [companyId]);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        lots.forEach(lot => {
            if (lot.created_at) {
                const date = new Date(lot.created_at);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(monthYear);
            }
        });
        return Array.from(months).sort().reverse();
    }, [lots]);

    const filteredLots = useMemo(() => {
        if (filterMonth === 'all') return lots;
        return lots.filter(lot => {
            if (!lot.created_at) return false;
            const date = new Date(lot.created_at);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthYear === filterMonth;
        });
    }, [lots, filterMonth]);

    const totalPages = Math.ceil(filteredLots.length / LOTS_PER_PAGE);
    const paginatedLots = filteredLots.slice((currentPage - 1) * LOTS_PER_PAGE, currentPage * LOTS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterMonth]);

    const fetchLots = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .order('created_at', { ascending: false });

            if (companyId === 'unassigned') {
                query = query.is('company_id', null);
            } else {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLots(data || []);
        } catch (error) {
            console.error('Error fetching lots:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteLot = async (id: string, lotNumber: string) => {
        if (!window.confirm(`⚠️ CONFIRMACIÓN DE SEGURIDAD ⚠️\n\n¿Estás seguro de que deseas eliminar permanentemente el lote ${lotNumber || id}? \n\nEsta acción no se puede deshacer y borrará todos los registros vinculados en la base de datos.`)) return;

        try {
            const { error } = await supabase.from('coffee_purchase_inventory').delete().eq('id', id);
            if (error) throw error;

            // Actualizar la lista localmente
            setLots(prev => prev.filter(lot => lot.id !== id));
        } catch (error) {
            console.error('Error al eliminar el lote:', error);
            alert('Fallo Crítico: No se pudo eliminar el lote de la bóveda.');
        }
    };

    if (selectedLotId) {
        return (
            <div className="fixed inset-0 z-[120] bg-black/95 overflow-y-auto print:static print:overflow-visible print:bg-transparent print:h-auto print:w-auto">
                <div className="min-h-screen py-10 print:min-h-0 print:p-0">
                    <LotCertificate
                        inventoryId={selectedLotId}
                        onClose={() => setSelectedLotId(null)}
                        user={{ companyId }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md overflow-y-auto flex justify-center py-10 px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-bg-card border border-gray-400 shadow-sm rounded-industrial max-w-6xl w-full shadow-2xl relative overflow-hidden flex flex-col h-full max-h-[90vh]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green via-brand-green-bright to-transparent z-10"></div>

                <header className="p-8 border-b border-gray-400 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center bg-black/40 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-white border border-gray-400 shadow-sm text-brand-navy-bright text-[9px] font-bold uppercase  rounded-sm border border-gray-400 shadow-sm">
                                Archivo Confidencial
                            </span>
                            <span className="text-[11px] text-brand-navy font-mono">LOTES DE INVENTARIO</span>
                        </div>
                        <h2 className="text-3xl font-bold text-brand-navy er uppercase">{companyName}</h2>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                        {availableMonths.length > 0 && (
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="bg-black/50 border border-gray-400 shadow-sm text-brand-navy rounded-industrial-sm px-4 py-2.5 text-[11px] font-bold uppercase  outline-none focus:border-black ring-0 transition-all appearance-none pr-10"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300df9a' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px 16px' }}
                            >
                                <option value="all">TODOS LOS MESES</option>
                                {availableMonths.map(m => {
                                    const [year, month] = m.split('-');
                                    const date = new Date(parseInt(year), parseInt(month) - 1);
                                    return (
                                        <option key={m} value={m}>
                                            {date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase()}
                                        </option>
                                    );
                                })}
                            </select>
                        )}

                        <button onClick={onClose} className="px-5 py-2.5 bg-white hover:bg-white text-brand-navy border border-gray-400 shadow-sm rounded-industrial-sm text-[11px] font-bold uppercase  transition-all group flex items-center justify-center gap-2 whitespace-nowrap">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Cerrar Archivo
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-[11px] text-gray-900 font-bold uppercase ">Cargando registros...</p>
                        </div>
                    ) : lots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 opacity-50">
                            <svg className="w-16 h-16 text-gray-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-[12px] text-brand-navy font-bold uppercase ">No hay lotes registrados para este cliente</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-400 shadow-sm">
                                    <th className="p-4 text-[11px] font-bold text-brand-navy uppercase ">Lote ID</th>
                                    <th className="p-4 text-[11px] font-bold text-brand-navy uppercase ">Productor / Origen</th>
                                    <th className="p-4 text-[11px] font-bold text-brand-navy uppercase ">Variedad / Proceso</th>
                                    <th className="p-4 text-[11px] font-bold text-brand-navy uppercase ">Volumen</th>
                                    <th className="p-4 text-[11px] font-bold text-brand-navy uppercase  text-center">Estado</th>
                                    <th className="p-4 text-[11px] font-bold text-brand-navy uppercase  text-right">Fecha Entrada</th>
                                    <th className="p-4 text-[11px] font-bold text-brand-navy uppercase  text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedLots.map((lot) => (
                                    <tr key={lot.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-green/50 group-hover:bg-brand-green mt-1"></div>
                                                <div>
                                                    <p className="text-[12px] font-bold text-brand-navy uppercase ">{lot.lot_number || 'S/N'}</p>
                                                    <p className="text-[9px] text-gray-600 font-mono er mt-1 truncate w-24">{lot.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[12px] font-medium text-gray-200">{lot.farmer_name || 'Desconocido'}</p>
                                            <p className="text-[11px] text-gray-900">{lot.farm_name || lot.region || '--'}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-[12px] font-medium text-gray-300">{lot.variety || '--'}</p>
                                            <p className="text-[11px] text-gray-900">{lot.process || '--'}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-end gap-1">
                                                <span className="text-14px font-bold text-brand-navy">{lot.net_weight || 0}</span>
                                                <span className="text-[9px] text-gray-900 mb-0.5">kg</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase  rounded-full border ${lot.status === 'purchased' ? 'bg-white text-brand-navy-bright border-gray-400 shadow-sm' :
                                                lot.status === 'thrashed' ? 'bg-white text-brand-navy-bright border-gray-400 shadow-sm' :
                                                    lot.status === 'completed' ? 'bg-white text-brand-navy-bright border-gray-400 shadow-sm' :
                                                        'bg-white0/10 text-brand-navy border-gray-500/20'
                                                }`}>
                                                {lot.status || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <p className="text-[11px] text-brand-navy font-mono">
                                                {new Date(lot.created_at).toLocaleDateString('es-CO')}
                                            </p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {(lot.status !== 'completed' || companyId === 'unassigned') && (
                                                    <button
                                                        title={companyId === 'unassigned' ? "Eliminar Lote Huérfano" : "Eliminar Lote Incompleto"}
                                                        onClick={() => handleDeleteLot(lot.id, lot.lot_number)}
                                                        className="p-1.5 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red border border-brand-red/20 rounded transition-all"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18"></path>
                                                            <path d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                                        </svg>
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setSelectedLotId(lot.id)}
                                                    className="px-3 py-1.5 bg-white hover:bg-white border border-gray-400 shadow-sm text-brand-navy border border-gray-400 shadow-sm rounded text-[9px] font-bold uppercase  transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    disabled={lot.status !== 'completed'}
                                                >
                                                    Certificado
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-between items-center bg-black/20 p-4 rounded-industrial border border-gray-400 shadow-sm">
                            <p className="text-[11px] text-brand-navy font-bold uppercase  hidden sm:block">
                                Mostrando {(currentPage - 1) * LOTS_PER_PAGE + 1} - {Math.min(currentPage * LOTS_PER_PAGE, filteredLots.length)} de {filteredLots.length}
                            </p>
                            <div className="flex gap-2 w-full sm:w-auto justify-center">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white text-brand-navy disabled:opacity-30 rounded-full text-[11px] font-bold uppercase  hover:bg-white transition-all border border-gray-400 shadow-sm"
                                >
                                    Anterior
                                </button>
                                <span className="px-5 py-2 flex items-center text-[11px] text-brand-navy-bright font-bold  bg-white rounded-full border border-gray-400 shadow-sm">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white text-brand-navy disabled:opacity-30 rounded-full text-[11px] font-bold uppercase  hover:bg-white transition-all border border-gray-400 shadow-sm"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
