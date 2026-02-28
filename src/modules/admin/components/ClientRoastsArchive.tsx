'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface ClientRoastsArchiveProps {
    companyId: string;
    companyName: string;
    onClose: () => void;
}

export default function ClientRoastsArchive({ companyId, companyName, onClose }: ClientRoastsArchiveProps) {
    const [roasts, setRoasts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ROASTS_PER_PAGE = 10;

    useEffect(() => {
        fetchRoasts();
    }, [companyId]);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        roasts.forEach(roast => {
            if (roast.roast_date) {
                const date = new Date(roast.roast_date);
                const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(monthYear);
            }
        });
        return Array.from(months).sort().reverse();
    }, [roasts]);

    const filteredRoasts = useMemo(() => {
        if (filterMonth === 'all') return roasts;
        return roasts.filter(roast => {
            if (!roast.roast_date) return false;
            const date = new Date(roast.roast_date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthYear === filterMonth;
        });
    }, [roasts, filterMonth]);

    const totalPages = Math.ceil(filteredRoasts.length / ROASTS_PER_PAGE);
    const paginatedRoasts = filteredRoasts.slice((currentPage - 1) * ROASTS_PER_PAGE, currentPage * ROASTS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterMonth]);

    const fetchRoasts = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('roast_batches')
                .select('*')
                .order('roast_date', { ascending: false });

            if (companyId === 'unassigned') {
                query = query.is('company_id', null);
            } else {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRoasts(data || []);
        } catch (error) {
            console.error('Error fetching roasts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRoast = async (id: string, batchId: string) => {
        if (!window.confirm(`⚠️ ELIMINAR TUESTE ⚠️\n\n¿Estás seguro de que deseas eliminar permanentemente el tueste ${batchId}? \n\nEsta acción es irreversible y borrará el historial de rendimiento de este tueste.`)) return;

        try {
            const { error } = await supabase.from('roast_batches').delete().eq('id', id);
            if (error) throw error;

            // Actualizar la lista localmente
            setRoasts(prev => prev.filter(roast => roast.id !== id));
        } catch (error) {
            console.error('Error al eliminar el tueste:', error);
            alert('Error: No se pudo eliminar el tueste.');
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md overflow-y-auto flex justify-center py-10 px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-bg-card border border-brand-green/30 rounded-industrial max-w-5xl w-full shadow-2xl relative overflow-hidden flex flex-col h-full max-h-[90vh]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green via-brand-green-bright to-transparent z-10"></div>

                <header className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center bg-black/40 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-brand-green/20 text-brand-green-bright text-[9px] font-bold uppercase tracking-widest rounded-sm border border-brand-green/30">
                                Archivo Confidencial
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">REGISTROS DE TUESTES</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tighter uppercase">{companyName}</h2>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                        {availableMonths.length > 0 && (
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="bg-black/50 border border-white/10 text-white rounded-industrial-sm px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-brand-green ring-0 transition-all appearance-none pr-10"
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

                        <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest transition-all group flex items-center justify-center gap-2 whitespace-nowrap">
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
                            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Cargando tuestes...</p>
                        </div>
                    ) : roasts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 opacity-50">
                            <svg className="w-16 h-16 text-gray-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">No hay tuestes registrados para este cliente</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tueste / ID</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Peso Verde (kg)</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Peso Tostado (kg)</th>
                                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedRoasts.map((roast) => (
                                    <tr key={roast.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-green/50 group-hover:bg-brand-green mt-1"></div>
                                                <div>
                                                    <p className="text-[12px] font-bold text-white uppercase tracking-tight">{roast.batch_id_label || 'S/N'}</p>
                                                    <p className="text-[9px] text-gray-600 font-mono tracking-tighter mt-1 truncate w-24">{roast.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 flex items-center gap-2">
                                            <p className="text-[12px] font-medium text-gray-200 uppercase">{roast.roast_date ? new Date(roast.roast_date).toLocaleDateString() : '--'}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">{roast.process}</p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-14px font-bold text-white">{roast.green_weight || 0}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-14px font-bold text-white">{roast.roasted_weight || 0}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <button
                                                    title="Eliminar Tueste Abandonado"
                                                    onClick={() => handleDeleteRoast(roast.id, roast.batch_id_label)}
                                                    className="p-1.5 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red border border-brand-red/20 rounded transition-all"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18"></path>
                                                        <path d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                    <span className="sr-only">Eliminar</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-8 flex justify-between items-center bg-black/20 p-4 rounded-industrial border border-white/5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">
                                Mostrando {(currentPage - 1) * ROASTS_PER_PAGE + 1} - {Math.min(currentPage * ROASTS_PER_PAGE, filteredRoasts.length)} de {filteredRoasts.length}
                            </p>
                            <div className="flex gap-2 w-full sm:w-auto justify-center">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white/5 text-white disabled:opacity-30 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                >
                                    Anterior
                                </button>
                                <span className="px-5 py-2 flex items-center text-[10px] text-brand-green-bright font-bold tracking-widest bg-brand-green/10 rounded-full border border-brand-green/20">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white/5 text-white disabled:opacity-30 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
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
