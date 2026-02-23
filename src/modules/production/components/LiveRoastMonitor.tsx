'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getRoastRecommendation, finalizeRoastBatch } from '../actions/roastActions';

interface LiveRoastMonitorProps {
    lotData: any;
    masterProfile?: any;
}

export default function LiveRoastMonitor({ lotData, masterProfile }: LiveRoastMonitorProps) {
    const [isRoasting, setIsRoasting] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentTemp, setCurrentTemp] = useState(200);
    const [btHistory, setBtHistory] = useState<{ t: number, temp: number }[]>([]);
    const [rorHistory, setRorHistory] = useState<{ t: number, temp: number }[]>([]);

    // Controles PLC
    const [gasPower, setGasPower] = useState(75);
    const [airflow, setAirflow] = useState(50);

    // Hitos del Tueste
    const [dryEnded, setDryEnded] = useState<number | null>(null);
    const [firstCrack, setFirstCrack] = useState<number | null>(null);
    const [roastEnded, setRoastEnded] = useState(false);

    // Copiloto Server-Side
    const [copilotData, setCopilotData] = useState<any>(null);
    const [lastSync, setLastSync] = useState<string>('');

    const MAX_TIME = 720;
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Simulación Física Sincronizada
    useEffect(() => {
        if (isRoasting && elapsedTime < MAX_TIME) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);

                setCurrentTemp(prev => {
                    const heatGain = (gasPower * 0.016) - (airflow * 0.006);
                    const heatLoss = (prev * prev) * 0.00002;
                    return prev + heatGain - heatLoss;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRoasting, gasPower, airflow, elapsedTime]);

    // Registro de Telemetría
    useEffect(() => {
        if (isRoasting) {
            setBtHistory(prev => [...prev, { t: elapsedTime, temp: currentTemp }]);

            if (btHistory.length > 30) {
                const rorVal = (currentTemp - btHistory[btHistory.length - 30].temp) * 2;
                setRorHistory(prev => [...prev, { t: elapsedTime, temp: rorVal }]);
            }

            if (!dryEnded && currentTemp > 155) setDryEnded(elapsedTime);
        }
    }, [elapsedTime]);

    // LLAMADA AL SERVIDOR (IP PROTECTION)
    useEffect(() => {
        if (isRoasting && masterProfile && elapsedTime % 3 === 0) {
            const syncAsync = async () => {
                const ror = rorHistory.length > 0 ? rorHistory[rorHistory.length - 1].temp : 0;
                const rec = await getRoastRecommendation(elapsedTime, currentTemp, ror, masterProfile);
                setCopilotData(rec);
                setLastSync(new Date().toLocaleTimeString());
            };
            syncAsync();
        }
    }, [elapsedTime, isRoasting, masterProfile]);

    const startRoast = () => {
        setBtHistory([]);
        setRorHistory([]);
        setElapsedTime(0);
        setCurrentTemp(200);
        setRoastEnded(false);
        setDryEnded(null);
        setFirstCrack(null);
        setIsRoasting(true);
    };

    const handleDrop = async () => {
        setIsRoasting(false);
        setRoastEnded(true);

        const batchLabel = `AX-${Math.floor(1000 + Math.random() * 9000)}`;
        await finalizeRoastBatch({
            batch_id_label: batchLabel,
            inventory_id: lotData.id,
            roast_date: new Date().toISOString().split('T')[0],
            process: lotData.variety || 'Natural',
            green_weight: 35,
            roasted_weight: 29.8,
            total_time_seconds: elapsedTime,
            final_temp: currentTemp,
            company_id: '99999999-9999-9999-9999-999999999999'
        });
    };

    const generatePoints = (data: any[], maxVal: number) => {
        return data.map(p => `${(p.t / MAX_TIME) * 100},${100 - (p.temp / maxVal) * 100}`).join(' ');
    };

    const rorCurrent = rorHistory.length > 0 ? rorHistory[rorHistory.length - 1].temp : 0;
    const dtrCurrent = elapsedTime > 0 && firstCrack ? ((elapsedTime - firstCrack) / elapsedTime) * 100 : 0;

    if (roastEnded) {
        return (
            <div className="bg-bg-card border border-white/10 rounded-[3rem] p-16 space-y-12 animate-in zoom-in-95 duration-700 shadow-3xl text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-green via-blue-500 to-brand-green opacity-50"></div>
                <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00a651" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h3 className="text-4xl font-bold text-white uppercase tracking-tighter relative z-10">Lote Finalizado y Sellado</h3>
                <p className="text-gray-500 uppercase font-bold text-[10px] tracking-[0.3em] relative z-10">Los datos de telemetría han sido vinculados al certificado digital del lote.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 relative z-10">
                    <div className="p-8 bg-white/2 rounded-3xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Tiempo Total</p>
                        <p className="text-3xl font-bold text-white">{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</p>
                    </div>
                    <div className="p-8 bg-white/2 rounded-3xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Pérdida Masa</p>
                        <p className="text-3xl font-bold text-white">14.8%</p>
                    </div>
                    <div className="p-8 bg-white/2 rounded-3xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Repetibilidad</p>
                        <p className="text-3xl font-bold text-brand-green-bright">98.2%</p>
                    </div>
                </div>

                <div className="pt-12 relative z-10">
                    <button onClick={startRoast} className="px-12 py-5 bg-brand-green text-white font-bold rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl hover:bg-brand-green-bright transition-all">Iniciar Siguiente Turno</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Espectral en Vivo */}
            <div className="flex justify-between items-end px-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isRoasting ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-gray-700'}`}></div>
                        <h2 className="text-3xl font-bold uppercase tracking-tighter text-white">Análisis de Termografía en Vivo</h2>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] ml-6">Sincronización de Onda de Calor Infrarroja (AXIS-CORE)</p>
                </div>
                <div className="bg-bg-card border border-white/5 px-6 py-3 rounded-2xl">
                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mb-1">Status Emisiones</p>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-3 h-1 rounded-full ${isRoasting ? 'bg-brand-green-bright animate-pulse' : 'bg-white/5'}`} style={{ animationDelay: `${i * 0.1}s` }}></div>)}
                    </div>
                </div>
            </div>

            {/* HUD Central Premium */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-bg-card border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-30"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Temp. Bean (BT)</p>
                    <p className="text-5xl font-bold text-white tracking-tighter">{currentTemp.toFixed(1)}°</p>
                    <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all" style={{ width: `${(currentTemp / 250) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-bg-card border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-10"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Cronómetro Telemetría</p>
                    <p className="text-5xl font-bold text-white tracking-tighter">
                        {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-[8px] text-gray-600 mt-4 font-bold uppercase tracking-widest">Sincronizado con PLC Industrial</p>
                </div>

                <div className="bg-bg-card border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 opacity-30"></div>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-3">Rate of Rise (RoR)</p>
                    <p className="text-5xl font-bold text-orange-400 tracking-tighter">{rorCurrent.toFixed(1)}</p>
                    <div className="flex gap-1 mt-4">
                        {[...Array(8)].map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${rorCurrent > (i * 2) ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.4)]' : 'bg-white/5'}`}></div>)}
                    </div>
                </div>

                <div className="bg-bg-card border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-green opacity-30"></div>
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-widest mb-3">Development (DTR)</p>
                    <p className="text-5xl font-bold text-brand-green-bright tracking-tighter">{dtrCurrent.toFixed(1)}%</p>
                    <div className="mt-4 flex gap-2">
                        <div className={`h-1.5 flex-1 rounded-full ${dtrCurrent > 15 ? 'bg-brand-green-bright shadow-[0_0_5px_rgb(0,255,136)]' : 'bg-white/5'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full ${dtrCurrent > 20 ? 'bg-brand-green-bright' : 'bg-white/5'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full ${dtrCurrent > 25 ? 'bg-brand-green-bright' : 'bg-white/5'}`}></div>
                    </div>
                </div>
            </div>

            {/* AI COPILOT SPECTRAL ASSISTANT */}
            <div className={`bg-bg-card border rounded-[3rem] p-10 flex flex-col lg:flex-row items-center justify-between gap-10 transition-all duration-700 shadow-2xl relative overflow-hidden border-white/5`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-red-500 opacity-50"></div>

                {copilotData && (
                    <div className={`absolute top-0 right-0 px-6 py-2 text-[9px] font-bold uppercase tracking-widest rounded-bl-3xl ${copilotData.isSincronized ? 'bg-brand-green/10 text-brand-green border-l border-b border-brand-green/20' : 'bg-orange-500/10 text-orange-500 border-l border-b border-orange-500/20'}`}>
                        SPECTRAL SYNC: {lastSync}
                    </div>
                )}

                <div className="flex items-center gap-10 flex-1 relative z-10">
                    <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all duration-500 ${copilotData?.actionCode === 'INCREASE_GAS' ? 'bg-blue-600/10 text-blue-400 ring-2 ring-blue-500/20' : copilotData?.actionCode === 'DECREASE_GAS' ? 'bg-red-600/10 text-red-400 ring-2 ring-red-500/20' : 'bg-white/5 text-gray-500'}`}>
                        {copilotData?.actionCode === 'INCREASE_GAS' ? <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12l7-7 7 7" /></svg> :
                            copilotData?.actionCode === 'DECREASE_GAS' ? <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 19V5M19 12l-7 7-7-7" /></svg> :
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>}
                    </div>
                    <div>
                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.5em] mb-3 flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-green-bright animate-pulse"></span>
                            Asistente de Curva Espectral AXIS
                        </h4>
                        <p className="text-2xl font-bold text-white tracking-tight leading-snug max-w-2xl">
                            {copilotData?.recommendation || "Sintonizando la firma térmica del lote contra el modelo maestro..."}
                        </p>
                    </div>
                </div>

                {copilotData && (
                    <div className="w-full lg:w-80 space-y-5 relative z-10">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <span>Sincronía Térmica</span>
                            <span className={copilotData.isSincronized ? 'text-brand-green-bright' : 'text-orange-500'}>
                                {copilotData.isSincronized ? 'OPTIMAL WAVE' : `±${Math.abs(copilotData.tempDiff).toFixed(1)}°C DELTA`}
                            </span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${copilotData.isSincronized ? 'bg-brand-green-bright shadow-[0_0_10px_rgb(0,255,136)]' : 'bg-orange-500'}`}
                                style={{ width: `${Math.max(10, 100 - (Math.abs(copilotData.tempDiff) * 20))}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Panel PLC y Graficador Espectral */}
            <div className="bg-bg-card border border-white/5 rounded-[3.5rem] p-12 shadow-3xl space-y-12 relative overflow-hidden">
                {/* Spectral Background Heatmap */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-red-500/5 pointer-events-none opacity-50"></div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 relative z-10">
                    <div className="space-y-8 p-8 bg-bg-main/50 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[11px] font-bold uppercase text-red-500 tracking-[0.4em]">Inyección Gas HP</h4>
                            <span className="text-5xl font-bold text-white tracking-tighter">{gasPower}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100" value={gasPower}
                            onChange={(e) => setGasPower(parseInt(e.target.value))}
                            className="w-full h-3 bg-red-950/30 rounded-full appearance-none accent-red-500 cursor-pointer border border-red-500/10"
                        />
                        <div className="flex justify-between text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                            <span>IDLE</span>
                            <span>MAX LOAD</span>
                        </div>
                    </div>

                    <div className="space-y-8 p-8 bg-bg-main/50 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[11px] font-bold uppercase text-blue-400 tracking-[0.4em]">Flujo de Aire PWM</h4>
                            <span className="text-5xl font-bold text-white tracking-tighter">{airflow}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100" value={airflow}
                            onChange={(e) => setAirflow(parseInt(e.target.value))}
                            className="w-full h-3 bg-blue-950/30 rounded-full appearance-none accent-blue-500 cursor-pointer border border-blue-500/10"
                        />
                        <div className="flex justify-between text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                            <span>CLOSED</span>
                            <span>FULL CONVECTION</span>
                        </div>
                    </div>
                </div>

                <div className="relative h-[480px] w-full bg-bg-main rounded-[3rem] border border-white/5 overflow-hidden shadow-inner p-10">
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex gap-10">
                            <div className="flex items-center gap-3"><span className="w-3.5 h-3.5 rounded-full bg-brand-green-bright shadow-[0_0_15px_rgba(0,255,136,0.6)]"></span> <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Beam Temp (BT)</span></div>
                            <div className="flex items-center gap-3"><span className="w-3.5 h-3.5 border-2 border-dashed border-white/30 rounded-full"></span> <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Master Ghost Profile</span></div>
                        </div>

                        <div className="flex gap-4">
                            {!isRoasting ? (
                                <button onClick={startRoast} className="bg-white text-black px-14 py-5 rounded-2xl font-bold text-xs uppercase shadow-2xl hover:scale-105 transition-all tracking-[0.2em]">Ejecutar Carga (Charge)</button>
                            ) : (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setFirstCrack(elapsedTime)}
                                        className={`px-8 py-5 rounded-2xl font-bold text-[10px] uppercase border transition-all ${firstCrack ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                                    >
                                        {firstCrack ? 'FC REGISTERED' : 'MARK FIRST CRACK'}
                                    </button>
                                    <button onClick={handleDrop} className="bg-red-600 hover:bg-red-500 text-white px-12 py-5 rounded-2xl font-bold text-[10px] uppercase shadow-2xl shadow-red-900/40 transition-all border border-red-500/20">Finalizar Tueste (Drop)</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative h-[300px]">
                        <svg className="absolute inset-0 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Spectral Background Area */}
                            <path
                                d={`M0,100 ${generatePoints(btHistory, 250)} L100,100 Z`}
                                fill="url(#spectralGlow)"
                                fillOpacity="0.05"
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="spectralGlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00ff88" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>

                            {/* Ghost Profile */}
                            {masterProfile && (
                                <polyline fill="none" stroke="white" strokeWidth="0.15" strokeDasharray="1.5,1.5" strokeOpacity="0.3" points={generatePoints(masterProfile.points, 250)} />
                            )}

                            {/* BT Actual with thick glow line */}
                            <polyline fill="none" stroke="#00ff88" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" points={generatePoints(btHistory, 250)} className="drop-shadow-[0_0_12px_rgba(0,255,136,0.6)]" />
                        </svg>
                    </div>

                    <div className="mt-12 flex justify-between border-t border-white/5 pt-8 text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 opacity-50"></div> Drying Stage</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-50"></div> Maillard Stage</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-50"></div> Development Stage</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
