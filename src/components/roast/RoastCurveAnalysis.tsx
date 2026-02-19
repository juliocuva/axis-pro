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
    { time: '00:00', temp: 200, ror: 0, event: 'CHARGE' },
    { time: '01:00', temp: 95, ror: -25, event: 'TP' }, // Turning Point
    { time: '02:00', temp: 110, ror: 15 },
    { time: '03:00', temp: 125, ror: 15 },
    { time: '04:00', temp: 140, ror: 14 },
    { time: '05:00', temp: 155, ror: 13, event: 'DRY' }, // Dry End
    { time: '06:00', temp: 168, ror: 12 },
    { time: '07:00', temp: 180, ror: 10 },
    { time: '08:00', temp: 190, ror: 9 },
    { time: '09:00', temp: 202, ror: 8, event: 'FC' }, // First Crack
    { time: '10:00', temp: 210, ror: 6 },
    { time: '11:00', temp: 218, ror: 4 },
    { time: '12:00', temp: 225, ror: 3, event: 'DROP' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-bg-card border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-xs font-mono text-gray-500 mb-2">{`TIEMPO: ${label}`}</p>
                <p className="text-sm font-bold text-brand-green-bright">
                    Temp: <span className="text-white">{payload[0].value}°C</span>
                </p>
                {payload[1] && (
                    <p className="text-sm font-bold text-orange-400">
                        RoR: <span className="text-white">{payload[1].value} Δ/m</span>
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function RoastCurveAnalysis() {
    return (
        <div className="space-y-6 animate-in fade-in duration-1000">
            <div className="bg-bg-card border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full"></div>

                <div className="flex flex-wrap justify-between items-end gap-6 mb-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-bold flex items-center gap-3">
                            Análisis Espectral de Tostión
                            <span className="text-[10px] bg-brand-green/20 text-brand-green-bright px-2 py-1 rounded-md font-mono">LIVE_TELEMETRY</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">
                            Lote: AX-9432 • Variedad: Pink Bourbon • Máquina: Probat G45
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-bg-main/50 border border-white/5 px-4 py-2 rounded-2xl">
                            <p className="text-[10px] text-gray-500 uppercase font-mono">Tiempo Total</p>
                            <p className="text-lg font-bold text-white">12:00 <span className="text-[10px] text-gray-400 font-normal">min</span></p>
                        </div>
                        <div className="bg-bg-main/50 border border-white/5 px-4 py-2 rounded-2xl">
                            <p className="text-[10px] text-gray-500 uppercase font-mono">Desarrollo</p>
                            <p className="text-lg font-bold text-brand-green-bright">18.5 <span className="text-[10px] text-gray-400 font-normal">%</span></p>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-6 mb-6 text-[10px] font-mono uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-brand-green-bright shadow-[0_0_8px_rgba(0,166,81,0.8)]"></div>
                        <span className="text-gray-300">Temp. Grano (BT)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                        <span className="text-gray-300">Rate of Rise (RoR)</span>
                    </div>
                </div>

                <div className="h-[400px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={roastData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis
                                dataKey="time"
                                stroke="#4b5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#4b5563' }}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#4b5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[80, 240]}
                                tick={{ fill: '#4b5563' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#4b5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[-30, 30]}
                                tick={{ fill: '#4b5563' }}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Roast Curve (BT) */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="temp"
                                stroke="#00a651"
                                strokeWidth={4}
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    if (payload.event) {
                                        return (
                                            <g key={payload.time}>
                                                <circle cx={cx} cy={cy} r={6} fill="#00a651" stroke="#fff" strokeWidth={2} />
                                                <text x={cx} y={cy - 15} textAnchor="middle" fill="#00a651" fontSize={10} fontWeight="bold" className="font-mono">
                                                    {payload.event}
                                                </text>
                                            </g>
                                        );
                                    }
                                    return <circle cx={cx} cy={cy} r={2} fill="#00a651" opacity={0} />;
                                }}
                                activeDot={{ r: 8, fill: '#00a651', stroke: '#fff', strokeWidth: 2 }}
                            />

                            {/* RoR Curve */}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="ror"
                                stroke="#f97316"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={{ r: 6, fill: '#f97316' }}
                            />

                            {/* Events Landmarks */}
                            {roastData.filter(d => d.event).map((event, idx) => (
                                <ReferenceLine
                                    key={idx}
                                    x={event.time}
                                    stroke="#ffffff10"
                                    strokeDasharray="3 3"
                                    yAxisId="left"
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-bg-card border border-white/5 p-6 rounded-3xl">
                    <p className="text-[10px] text-brand-green-bright font-mono uppercase tracking-[0.2em] mb-2">Punto de Giro (TP)</p>
                    <p className="text-xl font-bold">01:00 <span className="text-xs text-gray-500 ml-1">95°C</span></p>
                </div>
                <div className="bg-bg-card border border-white/5 p-6 rounded-3xl">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mb-2">Primer Crack (FC)</p>
                    <p className="text-xl font-bold text-orange-400">09:00 <span className="text-xs text-gray-500 ml-1">202°C</span></p>
                </div>
                <div className="bg-bg-card border border-white/5 p-6 rounded-3xl border-l-brand-red">
                    <p className="text-[10px] text-brand-red-bright font-mono uppercase tracking-[0.2em] mb-2">Tiempo de Desarrollo</p>
                    <p className="text-xl font-bold">03:00 <span className="text-xs text-gray-500 ml-1">225°C Final</span></p>
                </div>
            </div>
        </div>
    );
}
