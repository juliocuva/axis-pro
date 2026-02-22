'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    AreaChart,
    Area
} from 'recharts';

// Datos simulados de una curva de tostión profesional (12 minutos)
const roastData = [
    { time: '00:00', temp: 200, ror: 0, airflow: 20, event: 'CHARGE' },
    { time: '01:00', temp: 95, ror: -25, airflow: 20, event: 'TP' },
    { time: '02:00', temp: 110, ror: 15, airflow: 30 },
    { time: '03:00', temp: 125, ror: 15, airflow: 30 },
    { time: '04:00', temp: 140, ror: 14, airflow: 40 },
    { time: '05:00', temp: 155, ror: 13, airflow: 50, event: 'DRY' },
    { time: '06:00', temp: 168, ror: 12, airflow: 60 },
    { time: '07:00', temp: 180, ror: 10, airflow: 70 },
    { time: '08:00', temp: 190, ror: 9, airflow: 80 },
    { time: '09:00', temp: 202, ror: 8, airflow: 90, event: 'FC' },
    { time: '10:00', temp: 210, ror: 6, airflow: 90 },
    { time: '11:00', temp: 218, ror: 4, airflow: 100 },
    { time: '12:00', temp: 225, ror: 3, airflow: 100, event: 'DROP' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-bg-card border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-xs font-mono text-gray-500 mb-2">{`TIEMPO: ${label}`}</p>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-brand-green-bright flex justify-between gap-4">
                        Temp: <span className="text-white">{payload[0].value}°C</span>
                    </p>
                    {payload[1] && (
                        <p className="text-sm font-bold text-orange-400 flex justify-between gap-4">
                            RoR: <span className="text-white">{payload[1].value} Δ</span>
                        </p>
                    )}
                    {payload[2] && (
                        <p className="text-sm font-bold text-cyan-400 flex justify-between gap-4">
                            Aire: <span className="text-white">{payload[2].value}%</span>
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

interface RoastCurveProps {
    batchId?: string;
}

export default function RoastCurveAnalysis({ batchId = 'AX-PREVIEW', isLive = true }: { batchId?: string, isLive?: boolean }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header de Análisis Espectral */}
            <div className="flex flex-wrap justify-between items-end gap-6 relative z-10 px-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-brand-green'}`}></div>
                        <h3 className="text-3xl font-bold uppercase tracking-tighter text-white">
                            Análisis Espectral de Tostión
                        </h3>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] ml-5">
                        {isLive ? 'Monitoreo de Termografía Infrarroja en Vivo' : 'Análisis Post-Proceso de Curva de Calor'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-bg-card border border-white/5 px-6 py-3 rounded-2xl flex flex-col items-center">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">Carga Sensorial</p>
                        <p className="text-xl font-bold text-white leading-none">88.5</p>
                    </div>
                    <div className="bg-brand-green/10 border border-brand-green/20 px-6 py-3 rounded-2xl flex flex-col items-center">
                        <p className="text-[8px] text-brand-green font-black tracking-widest mb-1">Consistencia</p>
                        <p className="text-xl font-bold text-brand-green-bright leading-none">99%</p>
                    </div>
                </div>
            </div>

            <div className="bg-bg-card border border-white/5 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                {/* Background Spectral Gradient */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-red-500 via-orange-500 to-yellow-500 opacity-50"></div>

                {/* Simulated Heat Signature Overlay */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-green/5 blur-[120px] rounded-full"></div>

                <div className="flex flex-wrap justify-between gap-8 mb-10 relative z-10">
                    <div className="flex gap-12">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tiempo de Tueste</p>
                            <p className="text-4xl font-bold text-white tracking-tighter">09:12<span className="text-xs text-gray-500 ml-2">min</span></p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Temp. Grano</p>
                            <p className="text-4xl font-bold text-brand-green-bright tracking-tighter">202.4<span className="text-xs text-gray-500 ml-2">°C</span></p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">RoR Actual</p>
                            <p className="text-4xl font-bold text-orange-500 tracking-tighter">8.4<span className="text-xs text-gray-500 ml-2">Δ/min</span></p>
                        </div>
                    </div>
                </div>

                <div className="h-[450px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={roastData.slice(0, 10)} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="spectralGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="50%" stopColor="#ef4444" />
                                    <stop offset="100%" stopColor="#eab308" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis
                                dataKey="time"
                                stroke="#4b5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#4b5563', fontWeight: 700 }}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#4b5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[80, 240]}
                                tick={{ fill: '#4b5563', fontWeight: 700 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#4b5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[-30, 100]}
                                tick={{ fill: '#4b5563', fontWeight: 700 }}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Spectral Area Background (simulating thermal energy) */}
                            <AreaChart data={roastData.slice(0, 10)}>
                                <Area type="monotone" dataKey="temp" stroke="none" fill="url(#spectralGradient)" fillOpacity={0.05} />
                            </AreaChart>

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="airflow"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                strokeOpacity={0.4}
                                dot={false}
                            />

                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="temp"
                                stroke="#00a651"
                                strokeWidth={5}
                                strokeLinecap="round"
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.event) {
                                        return (
                                            <g key={payload.time}>
                                                <circle cx={cx} cy={cy} r={6} fill="#00a651" stroke="#fff" strokeWidth={2} className="animate-pulse" />
                                                <text x={cx} y={cy - 18} textAnchor="middle" fill="#00a651" fontSize={10} fontWeight="900" className="font-mono">
                                                    {payload.event}
                                                </text>
                                            </g>
                                        );
                                    }
                                    return <circle cx={cx} cy={cy} r={2} fill="#00a651" opacity={0} />;
                                }}
                                activeDot={{ r: 10, fill: '#00a651', stroke: '#fff', strokeWidth: 3 }}
                            />

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="ror"
                                stroke="#f97316"
                                strokeWidth={3}
                                strokeDasharray="6 4"
                                dot={false}
                                activeDot={{ r: 8, fill: '#f97316' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Live Scanning Line Simulation */}
                {isLive && (
                    <div className="absolute bottom-8 right-10 flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-brand-green-bright animate-pulse">
                        <div className="flex gap-1 items-end h-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-1 bg-brand-green-bright animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${40 + Math.random() * 60}%` }}></div>
                            ))}
                        </div>
                        Scanning Spectral Signatures
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-bg-card border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 opacity-50"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Punto de Giro (TP)</p>
                    <p className="text-2xl font-bold text-white tracking-tight">01:00 <span className="text-xs text-gray-500 ml-1">95°C</span></p>
                </div>
                <div className="bg-bg-card border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-50"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Primer Crack (FC)</p>
                    <p className="text-2xl font-bold text-orange-400 tracking-tight">09:00 <span className="text-xs text-gray-500 ml-1">202°C</span></p>
                </div>
                <div className="bg-bg-card border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-green opacity-50"></div>
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.2em] mb-2">Energy Stability</p>
                    <p className="text-2xl font-bold text-white tracking-tight">98.2<span className="text-xs text-gray-500 ml-1">%</span></p>
                </div>
                <div className="bg-brand-red/5 border border-brand-red/10 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-red opacity-50"></div>
                    <p className="text-[10px] text-brand-red font-bold uppercase tracking-[0.2em] mb-2">Development</p>
                    <p className="text-2xl font-bold text-white tracking-tight">18.5<span className="text-xs text-gray-500 ml-1">%</span></p>
                </div>
            </div>
        </div>
    );
}
