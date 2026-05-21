'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Label } from 'recharts';

interface RoastPoint {
    t: number;
    bt: number;
    et: number;
}

interface RoastCurveVisualizerProps {
    data: RoastPoint[];
    title?: string;
}

export default function RoastCurveVisualizer({ data, title = "Telemetría Térmica de Tueste" }: RoastCurveVisualizerProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] border border-dashed border-gray-400 shadow-sm rounded-industrial flex items-center justify-center bg-white">
                <p className="text-[11px] text-brand-navy font-bold uppercase ">Sin datos de telemetría disponibles</p>
            </div>
        );
    }

    // Calcular hitos (aproximados si no vienen marcados)
    const dryEnd = data.find(p => p.bt >= 150);
    const firstCrack = data.find(p => p.bt >= 195);

    return (
        <div className="w-full bg-white border border-gray-400 shadow-sm p-8 rounded-industrial space-y-6">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xs font-bold text-brand-navy uppercase ">{title}</h3>
                    <p className="text-[11px] text-brand-navy-bright font-mono uppercase mt-1">Sincronizado vía Axis Telemetry Engine</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                        <span className="text-[9px] text-gray-900 font-bold uppercase">Bean Temp (BT)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-green/80 rounded-full"></div>
                        <span className="text-[9px] text-gray-900 font-bold uppercase">Air Temp (ET)</span>
                    </div>
                </div>
            </header>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis 
                            dataKey="t" 
                            stroke="#000" 
                            fontSize={10} 
                            tickFormatter={(tick) => `${Math.floor(tick / 60)}:${(tick % 60).toString().padStart(2, '0')}`}
                        />
                        <YAxis 
                            stroke="#000" 
                            fontSize={10} 
                            domain={['auto', 'auto']}
                            unit="°C"
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                            labelStyle={{ color: '#0C6056', marginBottom: '8px', fontSize: '10px' }}
                        />
                        
                        <Line 
                            type="monotone" 
                            dataKey="bt" 
                            stroke="#f97316" 
                            strokeWidth={3} 
                            dot={false} 
                            activeDot={{ r: 6, fill: '#f97316' }}
                            name="Temp Grano"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="et" 
                            stroke="#60a5fa" 
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={false} 
                            name="Temp Aire"
                        />

                        {dryEnd && (
                            <ReferenceLine x={dryEnd.t} stroke="#888" strokeDasharray="3 3">
                                <Label value="Secado" position="top" fill="#888" fontSize={8} fontWeight="bold" />
                            </ReferenceLine>
                        )}

                        {firstCrack && (
                            <ReferenceLine x={firstCrack.t} stroke="#f97316" strokeDasharray="3 3">
                                <Label value="FC" position="top" fill="#f97316" fontSize={8} fontWeight="bold" />
                            </ReferenceLine>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <footer className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-400 shadow-sm">
                <div className="text-center">
                    <p className="text-[9px] text-brand-navy font-bold uppercase mb-1">Máxima BT</p>
                    <p className="text-lg font-bold text-brand-navy er">{Math.max(...data.map(p => p.bt)).toFixed(1)}°C</p>
                </div>
                <div className="text-center border-x border-gray-400 shadow-sm">
                    <p className="text-[9px] text-brand-navy font-bold uppercase mb-1">Tiempo Total</p>
                    <p className="text-lg font-bold text-brand-navy er">
                        {Math.floor(data[data.length-1].t / 60)}:{(data[data.length-1].t % 60).toString().padStart(2, '0')}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] text-brand-navy font-bold uppercase mb-1">RoR Promedio</p>
                    <p className="text-lg font-bold text-brand-navy-bright er">12.5 <span className="text-[11px]">/m</span></p>
                </div>
            </footer>
        </div>
    );
}
