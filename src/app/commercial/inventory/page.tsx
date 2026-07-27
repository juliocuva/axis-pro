'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import commercialData from '@/data/commercialInventory.json';

export default function CommercialInventory() {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filtro básico de búsqueda
    const filteredLots = commercialData.filter(lot => 
        lot.Finca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.Municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.Lote_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.Variedad.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white min-h-screen p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-8 pt-4 gap-4">
                <div>
                    <Link href="/commercial" className="text-[10px] font-bold text-gray-400 hover:text-brand-green uppercase tracking-widest mb-4 inline-block transition-colors">
                        &larr; VOLVER A CONSOLIDACIÓN
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-brand-navy uppercase flex items-center gap-4">
                        Inventario de Lotes Comerciales
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                        Total Disponible: <span className="text-brand-navy">{commercialData.length} Lotes</span>
                    </p>
                </div>
                
                <div className="relative w-full md:w-64">
                    <input 
                        type="text"
                        placeholder="Buscar finca, lote o variedad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 px-4 text-xs text-brand-navy focus:outline-none focus:border-brand-green transition-colors"
                    />
                </div>
            </div>

            {/* Premium Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50">
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Lote ID</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Finca / Productor</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Variedad</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Volumen</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Humedad</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rendimiento</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">SCA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLots.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="text-2xl mb-2">🔍</div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">No se encontraron lotes</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLots.map((lot, idx) => {
                                    // Highlight premium lots (e.g., SCA >= 83 or Yield >= 91)
                                    const isHighYield = parseFloat(lot['Factor Rendimiento']) >= 91.0;
                                    const isHighScore = parseFloat(lot['Puntaje Taza (SCA)']) >= 83.0;
                                    
                                    return (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-[#F8F9FA] transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-brand-navy">{lot.Lote_ID}</div>
                                                <div className="text-[9px] text-gray-400 uppercase mt-0.5">{lot.Municipio}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-brand-navy">{lot.Finca}</div>
                                                <div className="text-[10px] text-gray-400">{lot.Productor}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase">
                                                    {lot.Variedad}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-brand-navy">
                                                {Number(lot['Volumen Aportado (kg)']).toLocaleString('es-CO')} KG
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-600">
                                                {lot['Humedad Salida (%)']}%
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-xs font-bold ${isHighYield ? 'text-brand-green' : 'text-gray-600'}`}>
                                                    {lot['Factor Rendimiento']}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-xs font-bold ${isHighScore ? 'text-orange-500' : 'text-brand-navy'}`}>
                                                        {lot['Puntaje Taza (SCA)']}
                                                    </div>
                                                    {isHighScore && (
                                                        <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                            Top
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
