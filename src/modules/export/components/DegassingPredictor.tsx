'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { calculateAdvancedDegassing, AdvancedDegassingResult, DegassingConfig } from '@/shared/lib/engine/degassing';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function DegassingPredictor() {
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [config, setConfig] = useState<DegassingConfig>({
        process: 'washed',
        roastDevelopment: 'medium',
        packagingType: 'valve',
        routeTemperature: 'temperate'
    });
    const [result, setResult] = useState<AdvancedDegassingResult | null>(null);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        const { data } = await supabase
            .from('roast_batches')
            .select('*')
            .order('roast_date', { ascending: false })
            .limit(10);
        if (data) {
            setBatches(data);
            if (data.length > 0) setSelectedBatchId(data[0].id);
        }
    };

    useEffect(() => {
        const batch = batches.find(b => b.id === selectedBatchId);
        if (batch) {
            const res = calculateAdvancedDegassing(
                { id: batch.batch_id_label, roastDate: batch.roast_date },
                { ...config, process: batch.process }
            );
            setResult(res);
        }
    }, [selectedBatchId, config, batches]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Control Panel */}
            <div className="bg-bg-card border border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                        Simulador de Estabilización
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Motor Predictivo de $CO_2$</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seleccionar Lote de Producción</label>
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="w-full bg-bg-main border border-white/10 rounded-2xl px-4 py-4 text-xs font-bold focus:border-orange-500 outline-none transition-all uppercase"
                        >
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.batch_id_label} - {b.process} ({b.roast_date})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Desarrollo (Roast)</label>
                            <select
                                value={config.roastDevelopment}
                                onChange={(e) => setConfig({ ...config, roastDevelopment: e.target.value as any })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:border-orange-500 outline-none uppercase"
                            >
                                <option value="light">Light (Canela)</option>
                                <option value="medium">Medium (City)</option>
                                <option value="dark">Dark (Italian)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empaque</label>
                            <select
                                value={config.packagingType}
                                onChange={(e) => setConfig({ ...config, packagingType: e.target.value as any })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold focus:border-orange-500 outline-none uppercase"
                            >
                                <option value="valve">Válvula 1-Way</option>
                                <option value="no-valve">Sin Válvula</option>
                                <option value="sealed-tin">Lata Sellada</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            Condición de Ruta (Clima)
                        </h4>
                        <div className="flex gap-2">
                            {(['arctic', 'temperate', 'tropical'] as const).map(temp => (
                                <button
                                    key={temp}
                                    onClick={() => setConfig({ ...config, routeTemperature: temp })}
                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border ${config.routeTemperature === temp ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/5 text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {temp}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {result && (
                    <div className="pt-6 border-t border-white/5 space-y-6">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Días de Estabilización</p>
                            <p className="text-6xl font-black text-white tracking-tighter">{result.daysToSafety} <span className="text-lg text-orange-500">DÍAS</span></p>
                        </div>

                        <div className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 ${result.riskLevel === 'critical' ? 'bg-brand-red/10 border-brand-red/30' : result.riskLevel === 'medium' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-brand-green/10 border-brand-green/30'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">Status de Despacho</span>
                            <span className={`text-sm font-bold uppercase ${result.riskLevel === 'critical' ? 'text-brand-red-bright' : result.riskLevel === 'medium' ? 'text-orange-500' : 'text-brand-green-bright'}`}>
                                {result.riskLevel === 'critical' ? 'DESPACHO BLOQUEADO' : 'PENDIENTE DE REPOSO'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Visualizer Panel */}
            <div className="xl:col-span-2 bg-bg-card border border-white/5 p-8 rounded-[2.5rem] shadow-2xl space-y-8 flex flex-col">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Curva de Presión Interna vs Tiempo</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">$CO_2$ Pressure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-px bg-brand-red-bright"></span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Limit Safety</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result?.pressureCurve || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} label={{ value: 'Días Post-Tostión', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#444' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} label={{ value: 'PSI (Bar)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#444' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f1411', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                itemStyle={{ color: '#f97316', fontSize: '12px', fontWeight: 'bold' }}
                                labelStyle={{ color: '#666', fontSize: '10px', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="pressure" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPressure)" />
                            <ReferenceLine y={result?.pressureCurve[0]?.limit} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                            <ReferenceLine x={result?.daysToSafety} stroke="#ffffff20" strokeWidth={1} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
                    <div className="p-6 bg-bg-main rounded-3xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Fecha Recomendada</p>
                        <p className="text-lg font-black text-white">{result?.recommendedShipDate}</p>
                        <p className="text-[9px] text-brand-green-bright font-bold uppercase mt-1">✓ Optimizada para la ruta</p>
                    </div>
                    <div className="p-6 bg-bg-main rounded-3xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Factor de Seguridad</p>
                        <p className="text-lg font-black text-white">{result?.safetyFactor}%</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Margen vs Ruptura</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-bg-main to-orange-500/10 rounded-3xl border border-orange-500/10 flex items-center justify-center">
                        <button className="w-full h-full text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 hover:text-white transition-all flex items-center justify-center gap-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                            Exportar Plan Logístico
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
