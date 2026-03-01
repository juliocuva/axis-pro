'use client';

import React, { useState } from 'react';

export default function ComparisonCalibrationDashboard() {
    // Datos de ejemplo para demostrar la correlación sensorial vs tueste
    const [historicalData] = useState([
        { id: 'AX-2130', dtr: 18.5, ror_end: 5.2, sca_score: 86.8, notes: 'Chocolate, Nuez', consistency: 98.2 },
        { id: 'AX-1942', dtr: 20.1, ror_end: 4.8, sca_score: 84.5, notes: 'Caramelo, Tierra', consistency: 92.4 },
        { id: 'AX-2051', dtr: 17.2, ror_end: 6.1, sca_score: 87.2, notes: 'Cítrico, Flores', consistency: 95.8 },
    ]);

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header>
                <h2 className="text-2xl font-bold uppercase tracking-tight">Dashboard de Calibración Espectral</h2>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase mt-2 opacity-70">Análisis de Correlación: Roasting vs Cupping (Estándares SCA)</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visualización de Repetibilidad Global */}
                <div className="lg:col-span-2 bg-bg-card border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-3xl rounded-full"></div>

                    <h3 className="text-sm font-bold uppercase tracking-widest mb-10 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-brand-green-bright animate-pulse"></span>
                        Mapa de Consistencia por Lote
                    </h3>

                    <div className="space-y-6">
                        {historicalData.map((lot) => (
                            <div key={lot.id} className="group p-6 bg-bg-main border border-white/5 rounded-2xl hover:border-brand-green/30 transition-all cursor-pointer">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-white">Lote: {lot.id}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{lot.notes}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold tracking-tighter text-brand-green-bright">{lot.sca_score}</p>
                                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Puntaje basado en estándares de la SCA</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[8px] uppercase text-gray-500">
                                        <span>Consistencia vs Maestro</span>
                                        <span>{lot.consistency}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-brand-green-bright transition-all duration-1000"
                                            style={{ width: `${lot.consistency}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-center">
                                        <p className="text-[8px] text-gray-500 uppercase">DTR</p>
                                        <p className="text-xs font-bold">{lot.dtr}%</p>
                                    </div>
                                    <div className="text-center border-x border-white/10">
                                        <p className="text-[8px] text-gray-500 uppercase">RoR Final</p>
                                        <p className="text-xs font-bold">{lot.ror_end}°/min</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[8px] text-gray-500 uppercase">Desviación</p>
                                        <p className="text-xs font-bold text-brand-red">±0.4°C</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Algoritmo de Cierre de Círculo */}
                <div className="space-y-8">
                    <div className="bg-bg-card border border-white/10 rounded-[2.5rem] p-10">
                        <h3 className="text-xs font-bold text-brand-green-bright uppercase tracking-widest mb-6">IA Predictiva: Correlación</h3>
                        <div className="space-y-6">
                            <div className="p-6 bg-brand-green/5 border border-brand-green/10 rounded-2xl">
                                <p className="text-[9px] text-brand-green font-medium uppercase mb-2">Análisis de Repetibilidad</p>
                                <p className="text-xs text-gray-400 leading-relaxed font-bold uppercase text-[9px] opacity-70">
                                    "El DTR del 18.2% sugiere una caramelización óptima de los azúcares complejos, correlacionando positivamente con el puntaje basado en estándares de la SCA proyectado."
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase">Variables Críticas</h4>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Punto de First Crack</span>
                                    <span className="text-white font-mono">08:45</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">Temp de Carga</span>
                                    <span className="text-white font-mono">205°C</span>
                                </div>
                                <div className="h-px bg-white/5"></div>
                                <button className="w-full py-3 bg-brand-green/20 text-brand-green-bright rounded-xl text-[10px] font-bold uppercase hover:bg-brand-green/30 transition-all border border-brand-green/10">Exportar Reporte para Seed Capital</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-brand-green/20 to-transparent border border-brand-green/30 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1">Cierre del Círculo AXIS</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase opacity-70">Validación de trazabilidad sensorial completa.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
