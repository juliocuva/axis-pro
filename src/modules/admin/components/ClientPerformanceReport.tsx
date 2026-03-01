'use client';

import React from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface ClientPerformanceReportProps {
    companyId: string;
    companyName: string;
    onClose: () => void;
}

// Mock Data for the prototype
const productionData = [
    { month: 'Oct', volume: 450, score: 82 },
    { month: 'Nov', volume: 620, score: 83.5 },
    { month: 'Dic', volume: 890, score: 84 },
    { month: 'Ene', volume: 1100, score: 85.2 },
    { month: 'Feb', volume: 1450, score: 86.8 },
];

const varietalData = [
    { name: 'Castillo', value: 45, color: '#00A651' },
    { name: 'Caturra', value: 30, color: '#00843D' },
    { name: 'Borbón', value: 15, color: '#F0D58C' },
    { name: 'Geisha', value: 10, color: '#C8A252' },
];

export default function ClientPerformanceReport({ companyId, companyName, onClose }: ClientPerformanceReportProps) {
    const handleExport = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md overflow-y-auto flex justify-center py-10 px-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-bg-card border border-brand-green/30 rounded-industrial-lg shadow-2xl shadow-brand-green/5 w-full max-w-7xl relative" id="report-container">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green via-brand-green-bright to-transparent z-10"></div>

                {/* Header */}
                <header className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10 bg-black/20">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-brand-green/20 text-brand-green-bright text-[9px] font-bold uppercase tracking-widest rounded-sm border border-brand-green/30">
                                Reporte de Rendimiento
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">ÚLTIMOS 5 MESES</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-tighter uppercase">{companyName}</h2>
                        <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">ID: {companyId}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={handleExport} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest transition-all">
                            Exportar Reporte
                        </button>
                        <button onClick={onClose} className="px-6 py-3 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red border border-brand-red/20 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest transition-all">
                            Cerrar Panel
                        </button>
                    </div>
                </header>

                <div className="p-10 space-y-10 relative z-10">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-black/30 border border-white/5 p-6 rounded-industrial hover:border-brand-green/30 transition-colors">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Volumen Trimestre</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-white">3,440</p>
                                <p className="text-sm text-gray-500 mb-1 font-mono">kg</p>
                            </div>
                            <div className="mt-4 inline-flex text-[10px] font-bold text-brand-green-bright bg-brand-green/10 px-2 py-1 rounded">
                                +31.8% vs Anterior
                            </div>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-6 rounded-industrial hover:border-gold/30 transition-colors">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Tueste Consistente</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-white">96.5</p>
                                <p className="text-sm text-gray-500 mb-1 font-mono">%</p>
                            </div>
                            <div className="mt-4 inline-flex text-[10px] font-bold text-gold bg-gold/10 px-2 py-1 rounded">
                                R-Squared: 0.98
                            </div>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-6 rounded-industrial hover:border-blue-500/30 transition-colors">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Merma Promedio</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-white">14.2</p>
                                <p className="text-sm text-gray-500 mb-1 font-mono">%</p>
                            </div>
                            <div className="mt-4 inline-flex text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                -1.2% Optimizado
                            </div>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-6 rounded-industrial hover:border-white/20 transition-colors">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Impacto Ambiental</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-white">B+</p>
                                <p className="text-sm text-gray-500 mb-1 font-mono">Score</p>
                            </div>
                            <div className="mt-4 inline-flex text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-1 rounded">
                                Huella Medida
                            </div>
                        </div>
                    </div>

                    {/* AXIS AI Insights */}
                    <div className="bg-gradient-to-r from-brand-green/10 to-black border border-brand-green/40 p-8 rounded-industrial">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-8 h-8 rounded-full bg-brand-green/20 border border-brand-green/50 flex flex-col items-center justify-center animate-pulse gap-[2px]">
                                <div className="w-1 h-1 bg-brand-green-bright rounded-full"></div>
                                <div className="w-3 h-1 bg-brand-green-bright rounded-sm"></div>
                                <div className="w-2 h-1 bg-brand-green rounded-full"></div>
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest">AXIS AI: Insights Predictivos</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-black/50 border border-white/5 p-5 rounded-lg border-l-2 border-l-brand-green shadow-xl shadow-brand-green/5">
                                <p className="text-sm text-gray-300 font-medium">Variedad <strong className="text-white">Castillo</strong> rinde <strong className="text-brand-green-bright">5.2% mejor</strong> en factor de merma durante este mes.</p>
                            </div>
                            <div className="bg-black/50 border border-white/5 p-5 rounded-lg border-l-2 border-l-gold shadow-xl shadow-gold/5">
                                <p className="text-sm text-gray-300 font-medium">Logrando <strong className="text-gold">alta consistencia</strong> en tuestes <strong className="text-white">Medio-Claro</strong> superando promedios comerciales.</p>
                            </div>
                            <div className="bg-black/50 border border-white/5 p-5 rounded-lg border-l-2 border-l-blue-400 shadow-xl shadow-blue-400/5">
                                <p className="text-sm text-gray-300 font-medium">Predicción: Necesitarás reabastecimiento para <strong className="text-white">Dubai</strong> en <strong className="text-blue-400">14 días</strong>.</p>
                            </div>
                        </div>
                    </div>

                    {/* Gráficas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-black/30 border border-white/5 p-6 rounded-industrial lg:col-span-2">
                            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Producción vs Puntaje basado en estándares de la SCA</h4>
                            <div className="h-72 w-full min-h-[288px] min-w-[300px]" style={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={300}>
                                    <AreaChart data={productionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00A651" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#00A651" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="month" stroke="#ffffff50" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis stroke="#ffffff50" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                        <Area type="monotone" dataKey="volume" stroke="#00A651" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-6 rounded-industrial">
                            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Por Variedad</h4>
                            <div className="h-48 pt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={varietalData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                                            {varietalData.map((e, idx) => <Cell key={"c-" + idx} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 space-y-2">
                                {varietalData.map((v, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm" style={{ backgroundColor: v.color }} /> <span className="text-gray-400">{v.name}</span></div>
                                        <span className="text-white font-mono">{v.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
