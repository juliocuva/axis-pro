'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getRoastRecommendation, finalizeRoastBatch } from '../actions/roastActions';

interface LiveRoastMonitorProps {
    lotData: any;
    masterProfile?: any;
    user: { companyId: string } | null;
}

export default function LiveRoastMonitor({ lotData, masterProfile, user }: LiveRoastMonitorProps) {
    const [isRoasting, setIsRoasting] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentTemp, setCurrentTemp] = useState(200);
    const [btHistory, setBtHistory] = useState<{ t: number, temp: number }[]>([]);
    const [rorHistory, setRorHistory] = useState<{ t: number, temp: number }[]>([]);
    const [alert, setAlert] = useState<{ type: 'warning' | 'critical', message: string } | null>(null);

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
            // VELOCIDAD 10X PARA DEMOSTRACIÓN (100ms = 1s simulado)
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);

                setCurrentTemp(prev => {
                    const heatGain = (gasPower * 0.016) - (airflow * 0.006);
                    const heatLoss = (prev * prev) * 0.00002;
                    const nextTemp = prev + heatGain - heatLoss;

                    // Cálculo de ROR para alertas (usamos rorHistory del estado)
                    const currentRor = rorHistory.length > 0 ? rorHistory[rorHistory.length - 1].temp : 0;

                    // Lógica de Alertas de Seguridad Industrial
                    if (nextTemp > 245) {
                        setAlert({ type: 'critical', message: '¡EMERGENCIA! INCENDIO EN CÁMARA - DESCARGA INMEDIATA' });
                    } else if (nextTemp > 230) {
                        setAlert({ type: 'warning', message: 'ADVERTENCIA: TEMPERATURA CRÍTICA - RIESGO DE CARBONIZACIÓN' });
                    } else if (nextTemp > 220 && currentRor > 10) {
                        setAlert({ type: 'warning', message: 'AVISO: ROR EXCESIVO EN FINALIZACIÓN - POSIBLE ARREBATADO' });
                    } else {
                        setAlert(null);
                    }

                    return nextTemp;
                });
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRoasting, gasPower, airflow, elapsedTime, rorHistory]);

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

    const prepareNextBatch = () => {
        setBtHistory([]);
        setRorHistory([]);
        setElapsedTime(0);
        setCurrentTemp(200);
        setRoastEnded(false);
        setDryEnded(null);
        setFirstCrack(null);
        setAlert(null);
        setIsRoasting(false);
        setCopilotData(null);
    };

    const handleCharge = () => {
        setIsRoasting(true);
    };

    const handleDrop = async () => {
        setIsRoasting(false);
        setRoastEnded(true);

        // ENVIAMOS TELEMETRÍA REAL AL FORMULARIO DE INGRESO
        const capturedTelemetry = btHistory.map(p => ({
            t: p.t,
            bt: p.temp,
            et: p.temp + 20 // ET estimado si no hay sensor dual
        }));

        // Notificamos que queremos ir al registro oficial con estos datos
        window.dispatchEvent(new CustomEvent('roast-session-data', { 
            detail: { 
                telemetry: capturedTelemetry,
                time: elapsedTime,
                temp: currentTemp
            } 
        }));
    };

    const generatePoints = (data: any[], maxVal: number) => {
        return data.map(p => `${(p.t / MAX_TIME) * 100},${100 - (p.temp / maxVal) * 100}`).join(' ');
    };

    const rorCurrent = rorHistory.length > 0 ? rorHistory[rorHistory.length - 1].temp : 0;
    const dtrCurrent = elapsedTime > 0 && firstCrack ? ((elapsedTime - firstCrack) / elapsedTime) * 100 : 0;

    if (roastEnded) {
        return (
            <div className="bg-white border border-gray-400 shadow-sm rounded-3xl p-8 space-y-6 animate-in zoom-in-95 duration-700 shadow-3xl text-center relative overflow-hidden max-w-2xl mx-auto">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-green via-blue-500 to-brand-green opacity-40"></div>

                <div className="flex items-center justify-between gap-6 relative z-10 px-4">
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-400 shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-brand-navy uppercase ">Lote Sellado</h3>
                            <p className="text-[9px] text-brand-navy uppercase font-bold ">VINCULADO A BLOCKCHAIN DE ORIGEN</p>
                        </div>
                    </div>
                    <button onClick={prepareNextBatch} className="px-6 py-2.5 bg-brand-green text-brand-navy font-bold rounded-xl uppercase  text-[9px] shadow-lg hover:bg-brand-green-bright transition-all">Siguiente Turno</button>
                </div>

                {/* Mini Summary Graph */}
                <div className="h-24 bg-white rounded-2xl border border-gray-400 shadow-sm relative overflow-hidden group">
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline fill="none" stroke="#22c55e" strokeWidth="1" points={generatePoints(btHistory, 250)} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-[7px] text-brand-navy font-bold uppercase  group-hover:text-brand-navy transition-colors">Spectral Signature Archive</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 relative z-10">
                    <div className="p-4 bg-white rounded-2xl border border-gray-400 shadow-sm">
                        <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Tiempo</p>
                        <p className="text-xl font-bold text-brand-navy">{Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-gray-400 shadow-sm">
                        <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Masa</p>
                        <p className="text-xl font-bold text-brand-navy">14.8%</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-gray-400 shadow-sm">
                        <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Repetibilidad</p>
                        <p className="text-xl font-bold text-brand-navy-bright">98.2%</p>
                    </div>
                </div>

                <div className="border-t border-gray-400 shadow-sm pt-4">
                    <p className="text-[9px] text-brand-navy font-bold uppercase  leading-relaxed">
                        ID DE SEGURIDAD: {Math.random().toString(36).substring(2, 12).toUpperCase()} • OPERADOR CLASE A
                    </p>
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
                        <div className={`w-2 h-2 rounded-full ${isRoasting ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-white'}`}></div>
                        <h2 className="text-xl font-bold uppercase  text-brand-navy">Análisis de Termografía en Vivo</h2>
                    </div>
                    <p className="text-[9px] text-brand-navy font-bold uppercase  ml-5">Sincronización de Onda de Calor Infrarroja (AXIS-CORE)</p>
                </div>
                <div className="bg-white border border-gray-400 shadow-sm px-6 py-3 rounded-2xl flex items-center gap-6">
                    {alert && (
                        <div className={`flex items-center gap-2 animate-pulse`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={alert.type === 'critical' ? '#ef4444' : '#f97316'} strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                            <span className={`text-[9px] font-bold uppercase  ${alert.type === 'critical' ? 'text-red-500' : 'text-brand-navy'}`}>{alert.message}</span>
                        </div>
                    )}
                    <div className="border-l border-gray-400 shadow-sm pl-6">
                        <p className="text-[9px] text-brand-navy uppercase font-bold  mb-1">Status Emisiones</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-3 h-1 rounded-full ${isRoasting ? 'bg-brand-green-bright animate-pulse' : 'bg-white'}`} style={{ animationDelay: `${i * 0.1}s` }}></div>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* HUD Central Premium */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-400 shadow-sm p-6 rounded-3xl relative overflow-hidden shadow-xl group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green to-brand-green-dark opacity-30"></div>
                    <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2">Temp. Bean (BT)</p>
                    <p className={`text-2xl font-bold er transition-colors ${alert?.type === 'critical' ? 'text-red-500' : alert?.type === 'warning' ? 'text-brand-navy' : 'text-brand-navy'}`}>{currentTemp.toFixed(1)}°</p>
                    <div className="mt-3 h-1 bg-white rounded-full overflow-hidden">
                        <div className={`h-full shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all ${alert?.type === 'critical' ? 'bg-red-500' : alert?.type === 'warning' ? 'bg-brand-green' : 'bg-brand-green/80'}`} style={{ width: `${(currentTemp / 250) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white border border-gray-400 shadow-sm p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-10"></div>
                    <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2">Cronómetro Telemetría</p>
                    <p className="text-2xl font-bold text-brand-navy er">
                        {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </p>
                    <p className="text-[7px] text-brand-navy mt-3 font-bold uppercase ">Sincronizado con PLC Industrial</p>
                </div>

                <div className="bg-white border border-gray-400 shadow-sm p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-green opacity-30"></div>
                    <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2">Rate of Rise (RoR)</p>
                    <p className="text-2xl font-bold text-brand-navy-bright er">{rorCurrent.toFixed(1)}</p>
                    <div className="flex gap-1 mt-3">
                        {[...Array(8)].map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${rorCurrent > (i * 2) ? 'bg-brand-green shadow-[0_0_5px_rgba(249,115,22,0.4)]' : 'bg-white'}`}></div>)}
                    </div>
                </div>

                <div className="bg-white border border-gray-400 shadow-sm p-6 rounded-3xl relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-green opacity-30"></div>
                    <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2">Development (DTR)</p>
                    <p className="text-2xl font-bold text-brand-navy-bright er">{dtrCurrent.toFixed(1)}%</p>
                    <div className="mt-3 flex gap-1.5">
                        <div className={`h-1 flex-1 rounded-full ${dtrCurrent > 15 ? 'bg-brand-green-bright shadow-[0_0_5px_rgb(0,255,136)]' : 'bg-white'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${dtrCurrent > 20 ? 'bg-brand-green-bright' : 'bg-white'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${dtrCurrent > 25 ? 'bg-brand-green-bright' : 'bg-white'}`}></div>
                    </div>
                </div>
            </div>

            {/* AI COPILOT SPECTRAL ASSISTANT */}
            <div className={`bg-white border rounded-3xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-700 shadow-2xl relative overflow-hidden border-gray-400 shadow-sm`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-green via-purple-500 to-red-500 opacity-40"></div>

                {copilotData && (
                    <div className={`absolute top-0 right-0 px-4 py-1.5 text-[9px] font-bold uppercase  rounded-bl-2xl ${copilotData.isSincronized ? 'bg-white text-brand-navy border-l border-b border-gray-400 shadow-sm' : 'bg-white text-brand-navy border-l border-b border-gray-400 shadow-sm'}`}>
                        SPECTRAL SYNC: {lastSync}
                    </div>
                )}

                <div className="flex items-center gap-6 flex-1 relative z-10 w-full">
                    {!isRoasting && !roastEnded ? (
                        <div className="flex-1 flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-gray-400 shadow-sm">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[9px] font-bold text-brand-navy uppercase  mb-2 flex items-center gap-2">
                                    Pre-Roast Strategy • Lote {lotData?.variety || 'Seleccionado'}
                                </h4>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[7px] text-brand-navy uppercase font-bold">Charge Temp</p>
                                        <p className="text-sm font-bold text-brand-navy">205°C ± 2°</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[7px] text-brand-navy uppercase font-bold">Initial Gas</p>
                                        <p className="text-sm font-bold text-brand-navy">75% (HP)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[7px] text-brand-navy uppercase font-bold">Airflow P1</p>
                                        <p className="text-sm font-bold text-brand-navy">50% (PWM)</p>
                                    </div>
                                </div>
                                <p className="text-[9px] text-brand-navy mt-2">Basado en humedad del {lotData?.moisture_pct || '11.5'}% y proceso {lotData?.process || 'Lavado'}.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6 flex-1">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${copilotData?.actionCode === 'INCREASE_GAS' ? 'bg-white border border-gray-400 shadow-sm text-brand-navy-bright ring-2 ring-blue-500/40 animate-pulse' : copilotData?.actionCode === 'DECREASE_GAS' ? 'bg-red-600/20 text-red-400 ring-2 ring-red-500/40 animate-pulse' : 'bg-white text-brand-navy'}`}>
                                {copilotData?.actionCode === 'INCREASE_GAS' ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12l7-7 7 7" /></svg> :
                                    copilotData?.actionCode === 'DECREASE_GAS' ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 19V5M19 12l-7 7-7-7" /></svg> :
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>}
                            </div>
                            <div>
                                <h4 className="text-[9px] font-bold text-brand-navy uppercase  mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green-bright animate-pulse"></span>
                                    Asistente de Curva Espectral AXIS
                                </h4>
                                <p className="text-lg font-bold text-brand-navy  leading-snug max-w-2xl">
                                    {copilotData?.recommendation || "Sintonizando la firma térmica del lote..."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {copilotData && (
                    <div className="w-full lg:w-80 space-y-5 relative z-10">
                        <div className="flex justify-between items-center text-[11px] font-bold uppercase  text-brand-navy">
                            <span>Sincronía Térmica</span>
                            <span className={copilotData.isSincronized ? 'text-brand-navy-bright' : 'text-brand-navy'}>
                                {copilotData.isSincronized ? 'OPTIMAL WAVE' : `±${Math.abs(copilotData.tempDiff).toFixed(1)}°C DELTA`}
                            </span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-400 shadow-sm p-0.5">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${copilotData.isSincronized ? 'bg-brand-green-bright shadow-[0_0_10px_rgb(0,255,136)]' : 'bg-brand-green'}`}
                                style={{ width: `${Math.max(10, 100 - (Math.abs(copilotData.tempDiff) * 20))}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Panel PLC y Graficador Espectral */}
            <div className="bg-white border border-gray-400 shadow-sm rounded-3xl p-8 shadow-3xl space-y-8 relative overflow-hidden">
                {/* Spectral Background Heatmap */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 via-transparent to-red-500/5 pointer-events-none opacity-30"></div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                    <div className={`space-y-4 p-5 bg-white rounded-2xl border transition-all duration-500 backdrop-blur-sm ${copilotData?.actionCode === 'INCREASE_GAS' ? 'border-gray-400 shadow-sm shadow-[0_0_15px_rgba(59,130,246,0.2)] bg-white' : copilotData?.actionCode === 'DECREASE_GAS' ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-500/5' : 'border-gray-400 shadow-sm'}`}>
                        <div className="flex justify-between items-center text-center">
                            <h4 className="text-[9px] font-bold uppercase text-red-500  flex items-center gap-2">
                                {copilotData?.actionCode === 'DECREASE_GAS' && <svg className="animate-bounce" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 19V5M19 12l-7 7-7-7" /></svg>}
                                Inyección Gas HP
                                {copilotData?.actionCode === 'INCREASE_GAS' && <svg className="animate-bounce" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12l7-7 7 7" /></svg>}
                            </h4>
                            <span className="text-xl font-bold text-brand-navy er">{gasPower}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100" value={gasPower}
                            onChange={(e) => setGasPower(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-red-100 rounded-full appearance-none accent-red-500 cursor-pointer border border-red-500/10"
                        />
                        <div className="flex justify-between text-[7px] font-bold text-brand-navy uppercase  px-1">
                            <span>IDLE</span>
                            <span className={copilotData?.actionCode ? 'text-brand-navy animate-pulse' : ''}>{copilotData?.actionCode === 'INCREASE_GAS' ? 'SUBIR GAS ↑' : copilotData?.actionCode === 'DECREASE_GAS' ? 'BAJAR GAS ↓' : 'MAX LOAD'}</span>
                        </div>
                    </div>

                    <div className="space-y-4 p-5 bg-white rounded-2xl border border-gray-400 shadow-sm backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[9px] font-bold uppercase text-brand-navy-bright ">Flujo de Aire PWM</h4>
                            <span className="text-xl font-bold text-brand-navy er">{airflow}%</span>
                        </div>
                        <input
                            type="range" min="0" max="100" value={airflow}
                            onChange={(e) => setAirflow(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white rounded-full appearance-none accent-blue-500 cursor-pointer border border-gray-400 shadow-sm"
                        />
                        <div className="flex justify-between text-[7px] font-bold text-brand-navy uppercase ">
                            <span>CLOSED</span>
                            <span>FULL CONVECTION</span>
                        </div>
                    </div>
                </div>

                <div className="relative h-[480px] w-full bg-white rounded-2xl border border-gray-400 shadow-sm overflow-hidden shadow-inner p-4 pb-12">
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                    <div className="flex justify-between items-center mb-6 relative z-10 px-4">
                        <div className="flex gap-8">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-green-bright shadow-[0_0_10px_rgba(0,255,136,0.6)]"></span> <span className="text-[9px] font-bold uppercase  text-brand-navy">Beam Temp (BT)</span></div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 border border-dashed border-gray-400 shadow-sm rounded-full"></span> <span className="text-[9px] font-bold uppercase  text-brand-navy">Master Ghost Profile</span></div>
                        </div>

                        <div className="flex gap-3">
                            {!isRoasting ? (
                                <button onClick={handleCharge} className="bg-white text-brand-navy px-8 py-3 rounded-xl font-bold text-[11px] uppercase shadow-2xl hover:scale-105 transition-all ">Carga (Charge)</button>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setFirstCrack(elapsedTime)}
                                        className={`px-6 py-3 rounded-xl font-bold text-[9px] uppercase border transition-all ${firstCrack ? 'bg-white border border-gray-400 shadow-sm text-brand-navy-bright border-gray-400 shadow-sm shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white text-brand-navy border-gray-400 shadow-sm hover:bg-white'}`}
                                    >
                                        {firstCrack ? 'FC REG' : 'FC'}
                                    </button>
                                    <button onClick={handleDrop} className="bg-red-600 hover:bg-red-500 text-brand-navy px-8 py-3 rounded-xl font-bold text-[9px] uppercase shadow-2xl transition-all border border-red-500/20">Drop</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative h-[340px] px-10">
                        {/* Eje Y: Temperatura */}
                        <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[9px] font-bold text-brand-navy h-full py-0">
                            <span>250°C</span>
                            <span>200°C</span>
                            <span>150°C</span>
                            <span>100°C</span>
                            <span>0°C</span>
                        </div>

                        {/* Eje X: Tiempo */}
                        <div className="absolute bottom-[-24px] inset-x-10 flex justify-between text-[9px] font-bold text-brand-navy">
                            <span>0 min</span>
                            <span>3 min</span>
                            <span>6 min</span>
                            <span>9 min</span>
                            <span>12 min</span>
                        </div>

                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Spectral Background Area */}
                            <path
                                d={`M0,100 ${generatePoints(btHistory, 250)} L100,100 Z`}
                                fill="url(#spectralGlow)"
                                fillOpacity="0.03"
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="spectralGlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0C6056" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>

                            {/* Ghost Profile */}
                            {masterProfile && (
                                <polyline fill="none" stroke="white" strokeWidth="0.15" strokeDasharray="1.5,1.5" strokeOpacity="0.2" points={generatePoints(masterProfile.points, 250)} />
                            )}

                            {/* BT Actual with thick glow line */}
                            <polyline fill="none" stroke="#0C6056" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" points={generatePoints(btHistory, 250)} className="drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
                        </svg>
                    </div>

                    <div className="mt-14 flex justify-between border-t border-gray-400 shadow-sm pt-4 text-[9px] font-bold text-brand-navy uppercase  px-4">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green opacity-40"></div> Drying</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-green opacity-40"></div> Maillard</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-40"></div> Development</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
