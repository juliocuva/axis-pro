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
    Area,
    ComposedChart
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

import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-bg-card border border-white/10 p-4 rounded-industrial-sm shadow-2xl backdrop-blur-md min-w-[180px]">
                <p className="text-xs font-mono text-gray-500 mb-3 flex justify-between">
                    <span>TIEMPO</span>
                    <span>{label}</span>
                </p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => {
                        if (!entry.value) return null;
                        const labelMap: any = {
                            temp: { name: 'BT', color: 'text-brand-green-bright', unit: '°C' },
                            et: { name: 'ET', color: 'text-gray-400', unit: '°C' },
                            ror: { name: 'RoR', color: 'text-orange-400', unit: 'Δ' },
                            gas: { name: 'GAS', color: 'text-orange-600', unit: '%' },
                            pressure: { name: 'PRES', color: 'text-cyan-400', unit: 'WC' }
                        };
                        const meta = labelMap[entry.dataKey] || { name: entry.name, color: 'text-white', unit: '' };

                        return (
                            <p key={index} className={`text-sm font-bold ${meta.color} flex justify-between gap-4`}>
                                {meta.name}: <span className="text-white font-mono">{entry.value}{meta.unit}</span>
                            </p>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};

interface RoastCurveProps {
    batchId?: string;
}

export default function RoastCurveAnalysis({ isLive = false, batchId }: { isLive?: boolean, batchId?: string }) {
    const [pastRoasts, setPastRoasts] = useState<any[]>([]);
    const [selectedRoast, setSelectedRoast] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>(roastData);

    useEffect(() => {
        fetchPastRoasts();
    }, []);

    useEffect(() => {
        if (batchId && pastRoasts.length > 0) {
            handleBatchSelect(batchId);
        }
    }, [batchId, pastRoasts]);

    const fetchPastRoasts = async () => {
        const { data } = await supabase.from('roast_batches').select('*').order('roast_date', { ascending: false });
        if (data) setPastRoasts(data);
    };

    const padTimeline = (data: any[]) => {
        if (data.length === 0) return data;
        const lastPoint = data[data.length - 1];
        const timeParts = lastPoint.time.split(':').map(Number);
        const lastSecs = timeParts.length === 3
            ? timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
            : (timeParts.length === 2 ? timeParts[0] * 60 + timeParts[1] : 0);

        const targetSecs = 12 * 60; // 12 minutos
        if (lastSecs < targetSecs) {
            const padded = [...data];
            // Añadir puntos vacíos cada 30 segundos hasta llegar a 12min
            for (let t = Math.floor(lastSecs / 30) * 30 + 30; t <= targetSecs; t += 30) {
                const mm = Math.floor(t / 60).toString().padStart(2, '0');
                const ss = (t % 60).toString().padStart(2, '0');
                padded.push({ time: `${mm}:${ss}` });
            }
            return padded;
        }
        return data;
    };

    const handleBatchSelect = (id: string) => {
        const roast = pastRoasts.find(r => r.batch_id_label === id);
        if (roast) {
            setSelectedRoast(roast);

            if (roast.roast_curve_json && Array.isArray(roast.roast_curve_json)) {
                setChartData(padTimeline(roast.roast_curve_json));
            } else {
                const seed = parseInt(id.split('-')[1]) || 100;
                const newCurve = roastData.map(d => ({
                    ...d,
                    temp: d.temp + (Math.sin(seed + (parseInt(d.time.split(':')[0]) || 0)) * 2),
                    ror: d.ror + (Math.cos(seed + (parseInt(d.time.split(':')[0]) || 0)) * 0.5)
                }));
                setChartData(padTimeline(newCurve));
            }
        }
    };

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
                    <select
                        onChange={(e) => handleBatchSelect(e.target.value)}
                        className="bg-bg-card border border-white/10 rounded-industrial-sm px-4 py-2 text-[10px] font-bold text-gray-400 outline-none focus:border-brand-green uppercase tracking-widest min-w-[200px]"
                    >
                        <option value="">-- Seleccionar Lote --</option>
                        {pastRoasts.map(r => (
                            <option key={r.id} value={r.batch_id_label}>{r.batch_id_label} • {new Date(r.roast_date).toLocaleDateString()}</option>
                        ))}
                    </select>

                    <div className="bg-bg-card border border-white/5 px-6 py-3 rounded-industrial-sm flex flex-col items-center">
                        <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Carga Sensorial</p>
                        <p className="text-xl font-bold text-white leading-none">{selectedRoast?.sca_score || '88.5'}</p>
                    </div>
                    <div className="bg-brand-green/10 border border-brand-green/20 px-6 py-3 rounded-industrial-sm flex flex-col items-center">
                        <p className="text-[8px] text-brand-green font-bold tracking-widest mb-1">Consistencia</p>
                        <p className="text-xl font-bold text-brand-green-bright leading-none">{selectedRoast ? '98.4%' : '99%'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-bg-card border border-white/5 rounded-industrial p-10 relative overflow-hidden shadow-2xl">
                {/* Background Spectral Gradient */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-red-500 via-orange-500 to-yellow-500 opacity-50"></div>

                {/* Simulated Heat Signature Overlay */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-green/5 blur-[120px] rounded-full"></div>

                <div className="flex flex-wrap justify-between gap-8 mb-10 relative z-10">
                    <div className="flex gap-12">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tiempo de Tueste</p>
                            <p className="text-4xl font-bold text-white tracking-tighter">
                                {(() => {
                                    const duration = selectedRoast?.duration_seconds || (chartData.length > 0 ? (() => {
                                        const parseTime = (t: string) => {
                                            const p = t.split(':').map(Number);
                                            if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
                                            if (p.length === 2) return p[0] * 60 + p[1];
                                            return 0;
                                        };
                                        const firstSecs = parseTime(chartData[0].time);
                                        const lastSecs = parseTime(chartData[chartData.length - 1].time);
                                        const secs = lastSecs - firstSecs;
                                        return secs > 0 ? secs : 0;
                                    })() : 552);
                                    return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
                                })()}
                                <span className="text-xs text-gray-500 ml-2">min</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Temp. Final</p>
                            <p className="text-4xl font-bold text-brand-green-bright tracking-tighter">
                                {selectedRoast?.final_temp || (chartData.length > 0 ? chartData[chartData.length - 1].temp : '202.4')}
                                <span className="text-xs text-gray-500 ml-2">°C</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Masa Resultante</p>
                            <p className="text-4xl font-bold text-orange-500 tracking-tighter">
                                {selectedRoast ? selectedRoast.roasted_weight : '29.8'}
                                <span className="text-xs text-gray-500 ml-2">KG</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="h-[450px] w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                                domain={[0, 250]}
                                allowDataOverflow={true}
                                tick={{ fill: '#4b5563', fontWeight: 700 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#4b5563"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[-15, 45]}
                                allowDataOverflow={true}
                                tick={{ fill: '#4b5563', fontWeight: 700 }}
                            />
                            <ReferenceLine yAxisId="right" y={0} stroke="#ffffff20" strokeDasharray="3 3" />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Background Heat Signature */}
                            <Area yAxisId="left" type="monotone" dataKey="temp" stroke="none" fill="url(#spectralGradient)" fillOpacity={0.03} />

                            {/* Secondary Metrics (Industrial Logs) */}
                            <Line
                                yAxisId="left"
                                type="stepAfter"
                                dataKey="gas"
                                name="gas"
                                stroke="#ea580c"
                                strokeWidth={2}
                                strokeOpacity={0.3}
                                dot={false}
                            />

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="pressure"
                                name="pressure"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                strokeOpacity={0.4}
                                dot={false}
                            />

                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="et"
                                name="et"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                strokeOpacity={0.6}
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
                                                <text x={cx} y={cy - 18} textAnchor="middle" fill="#00a651" fontSize={10} fontWeight="700" className="font-mono">
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
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Live Scanning Line Simulation */}
                {isLive && (
                    <div className="absolute bottom-8 right-10 flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-brand-green-bright animate-pulse">
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
                <div className="bg-bg-card border border-white/5 p-6 rounded-industrial-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 opacity-50"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Punto de Giro (TP)</p>
                    <p className="text-2xl font-bold text-white tracking-tight">01:00 <span className="text-xs text-gray-500 ml-1">95°C</span></p>
                </div>
                <div className="bg-bg-card border border-white/5 p-6 rounded-industrial-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 opacity-50"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Primer Crack (FC)</p>
                    <p className="text-2xl font-bold text-orange-400 tracking-tight">09:00 <span className="text-xs text-gray-500 ml-1">202°C</span></p>
                </div>
                <div className="bg-bg-card border border-white/5 p-6 rounded-industrial-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-green opacity-50"></div>
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.2em] mb-2">Energy Stability</p>
                    <p className="text-2xl font-bold text-white tracking-tight">98.2<span className="text-xs text-gray-500 ml-1">%</span></p>
                </div>
                <div className="bg-brand-red/5 border border-brand-red/10 p-6 rounded-industrial-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-red opacity-50"></div>
                    <p className="text-[10px] text-brand-red font-bold uppercase tracking-[0.2em] mb-2">Development</p>
                    <p className="text-2xl font-bold text-white tracking-tight">18.5<span className="text-xs text-gray-500 ml-1">%</span></p>
                </div>
            </div>
        </div>
    );
}
