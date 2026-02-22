'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LiveRoastMonitorProps {
    lotData: any;
    masterProfile?: any;
}

export default function LiveRoastMonitor({ lotData, masterProfile }: LiveRoastMonitorProps) {
    const [isRoasting, setIsRoasting] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentTemp, setCurrentTemp] = useState(205); // Temp de Carga
    const [btHistory, setBtHistory] = useState<{ t: number, temp: number }[]>([]);
    const [rorHistory, setRorHistory] = useState<{ t: number, temp: number }[]>([]);
    const [airHistory, setAirHistory] = useState<{ t: number, temp: number }[]>([]);

    // Controles PLC
    const [gasPower, setGasPower] = useState(75);
    const [airflow, setAirflow] = useState(50);

    // Hitos del Tueste
    const [dryEnded, setDryEnded] = useState<number | null>(null);
    const [firstCrack, setFirstCrack] = useState<number | null>(null);
    const [roastEnded, setRoastEnded] = useState(false);

    const [copilotSuggestion, setCopilotSuggestion] = useState<string | null>(null);

    const MAX_TIME = 720; // 12 minutos
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Simulación Física de Tueste (Simplified)
    useEffect(() => {
        if (isRoasting && elapsedTime < MAX_TIME) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);

                // Lógica de Calor: El gas sube temp, el aire la modula
                // Inercia térmica simplificada
                setCurrentTemp(prev => {
                    const heatGain = (gasPower * 0.015) - (airflow * 0.005);
                    const coolingEffect = prev > 180 ? (prev - 180) * 0.002 : 0;
                    const next = prev + heatGain - coolingEffect;
                    return next;
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
            setAirHistory(prev => [...prev, { t: elapsedTime, temp: airflow }]);

            // Cálculo de RoR (Rate of Rise) cada 30 seg o similar, aquí simplificado
            if (btHistory.length > 30) {
                const lastPoint = btHistory[btHistory.length - 1];
                const prevPoint = btHistory[btHistory.length - 30];
                const rorVal = (lastPoint.temp - prevPoint.temp) * 2; // Temp ganada en 1 min (aprox)
                setRorHistory(prev => [...prev, { t: elapsedTime, temp: rorVal }]);
            }

            // Marcador Automático de Secado (Amarilleo aprox 150-160C)
            if (!dryEnded && currentTemp > 155) {
                setDryEnded(elapsedTime);
            }
        }
    }, [elapsedTime]);

    // Lógica del Copiloto Predicativo - Algoritmo Delta T
    useEffect(() => {
        if (isRoasting && masterProfile) {
            const masterPoint = masterProfile.points.find((p: any) => p.t === elapsedTime);
            if (masterPoint) {
                const diff = currentTemp - masterPoint.temp;
                const absDiff = Math.abs(diff);

                if (absDiff > 2.0) {
                    const direction = diff > 0 ? "EXCESO" : "DÉFICIT";
                    const action = diff > 0 ? "Bajar Gas 10% | Subir Aire" : "Aumentar Gas 15% | Bajar Aire";
                    setCopilotSuggestion(`⚠️ ALERTA DE DESVIACIÓN MAESTRA: ${direction} DE ${absDiff.toFixed(1)}°C. ${action}`);
                } else if (absDiff > 0.5) {
                    setCopilotSuggestion(diff > 0 ? "⬇️ Tendencia Alta: Reducir Gas sutilmente" : "⬆️ Tendencia Baja: Incrementar Gas 5%");
                } else {
                    setCopilotSuggestion("🟢 PERFIL CALCADO: Sincronización Maestra 100%");
                }
            }
        } else {
            setCopilotSuggestion(null);
        }
    }, [elapsedTime, currentTemp, isRoasting, masterProfile]);

    const startRoast = () => {
        setBtHistory([]);
        setRorHistory([]);
        setAirHistory([]);
        setElapsedTime(0);
        setRoastEnded(false);
        setDryEnded(null);
        setFirstCrack(null);
        setIsRoasting(true);
    };

    const handleFirstCrack = () => setFirstCrack(elapsedTime);
    const handleDrop = () => {
        setIsRoasting(false);
        setRoastEnded(true);
    };

    const generatePoints = (data: any[], maxVal: number) => {
        return data.map(p => `${(p.t / MAX_TIME) * 100},${100 - (p.temp / maxVal) * 100}`).join(' ');
    };

    // Métricas para el reporte final
    const ror = rorHistory.length > 0 ? rorHistory[rorHistory.length - 1].temp : 0;
    const dryTime = dryEnded || 0;
    const maillardTime = firstCrack ? firstCrack - dryTime : (isRoasting ? elapsedTime - dryTime : 0);
    const devTime = firstCrack ? (isRoasting || roastEnded ? (roastEnded ? btHistory[btHistory.length - 1].t : elapsedTime) - firstCrack : 0) : 0;
    const dtr = elapsedTime > 0 ? (devTime / elapsedTime) * 100 : 0;

    // Cálculo de Consistencia Real
    const calculateConsistency = () => {
        if (!masterProfile || btHistory.length === 0) return 100;
        let totalError = 0;
        let pointsParsed = 0;

        btHistory.forEach(point => {
            const masterPoint = masterProfile.points.find((p: any) => p.t === point.t);
            if (masterPoint) {
                totalError += Math.abs(point.temp - masterPoint.temp);
                pointsParsed++;
            }
        });

        if (pointsParsed === 0) return 100;
        const avgError = totalError / pointsParsed;
        // 100% si error es 0, baja gradualmente (ej: 10% menos por cada 1°C de error promedio)
        return Math.max(0, Math.min(100, 100 - (avgError * 10)));
    };

    const consistencyScore = calculateConsistency();
    const maxDeviation = btHistory.reduce((max, point) => {
        if (!masterProfile) return 0;
        const masterPoint = masterProfile.points.find((p: any) => p.t === point.t);
        if (!masterPoint) return max;
        return Math.max(max, Math.abs(point.temp - masterPoint.temp));
    }, 0);

    if (roastEnded) {
        return (
            <div className="bg-bg-card border border-white/10 rounded-[3rem] p-12 space-y-12 animate-in zoom-in-95 duration-500 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/5 blur-[100px] rounded-full pointer-events-none"></div>

                <header className="flex justify-between items-center relative z-10 border-b border-white/5 pb-8">
                    <div>
                        <h3 className="text-2xl font-bold uppercase text-white tracking-tight">Correlación Sensory-Roast Finalizada</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest opacity-70">Validación de Repetibilidad Axis Trade v1.0</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl text-[10px] font-medium uppercase border border-white/5 transition-all">Exportar Logs</button>
                        <button onClick={startRoast} className="bg-brand-green hover:bg-brand-green-bright text-white px-8 py-3 rounded-xl text-[10px] font-medium uppercase border border-brand-green-bright/20 transition-all">Nueva Tostión</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                    {/* Lado A: Análisis de Tueste */}
                    <div className="space-y-8">
                        <div className="bg-bg-main/50 p-8 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-medium text-gray-500 uppercase">Análisis Espectral vs Maestro</h4>
                                <span className={`text-[8px] px-2 py-1 rounded border ${consistencyScore > 90 ? 'text-brand-green border-brand-green/20' : 'text-orange-400 border-orange-400/20'} uppercase font-bold`}>
                                    {consistencyScore > 90 ? 'Alta Repetibilidad' : 'Calibración Requerida'}
                                </span>
                            </div>

                            <div className="relative h-[200px]">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {masterProfile && <polyline fill="none" stroke="white" strokeWidth="0.1" strokeOpacity="0.1" points={generatePoints(masterProfile.points, 250)} />}
                                    <polyline fill="none" stroke="#00ff88" strokeWidth="0.4" points={generatePoints(btHistory, 250)} className="drop-shadow-[0_0_8px_rgba(0,255,136,0.1)]" />
                                </svg>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4">
                                <div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Consistencia</p>
                                    <p className="text-2xl font-bold tracking-tighter text-brand-green-bright">{consistencyScore.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Desv. Máx</p>
                                    <p className="text-2xl font-bold tracking-tighter text-brand-red">{maxDeviation.toFixed(1)}°C</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">DTR Final</p>
                                    <p className="text-2xl font-bold tracking-tighter text-white">{dtr.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lado B: Correlación Sensorial */}
                    <div className="space-y-8">
                        <div className="bg-bg-main/50 p-8 rounded-[2rem] border border-white/5 space-y-8">
                            <h4 className="text-[10px] font-medium text-gray-500 uppercase">Atributos Sensoriales SCA</h4>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Puntaje Predicho</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-5xl font-bold text-white tracking-tighter">{(84 + (consistencyScore / 10) - (maxDeviation)).toFixed(1)}</span>
                                        <span className="text-[8px] bg-brand-green/20 text-brand-green px-2 py-1 rounded font-bold uppercase tracking-[0.2em] border border-brand-green/20">Specialty</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[9px] text-gray-400 uppercase">Notas Dominantes</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Chocolate', 'Caramelo', 'Cítrico Brillante'].map(note => (
                                            <span key={note} className="text-[10px] bg-white/5 text-gray-300 px-3 py-1.5 rounded-full border border-white/5 font-medium">{note}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-brand-green/5 border border-brand-green/10 rounded-2xl">
                                <p className="text-[9px] text-brand-green font-medium uppercase mb-2">Análisis de Repetibilidad</p>
                                <p className="text-xs text-gray-400 leading-relaxed font-bold uppercase text-[9px] opacity-70">
                                    "El DTR del {dtr.toFixed(1)}% sugiere una caramelización óptima de los azúcares complejos, correlacionando positivamente con el puntaje SCA proyectado."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
            {/* Telemetría Digital */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-bg-card border border-white/10 p-5 rounded-[2rem] text-center shadow-xl">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Temperatura BT</p>
                    <p className="text-4xl font-bold text-white tracking-tighter">{currentTemp.toFixed(1)}°</p>
                </div>
                <div className="bg-bg-card border border-white/10 p-5 rounded-[2rem] text-center shadow-xl">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Tiempo (12m)</p>
                    <p className="text-4xl font-bold text-white tracking-tighter">
                        {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </p>
                </div>
                <div className="bg-bg-card border border-white/10 p-5 rounded-[2rem] text-center shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-400 opacity-5 pointer-events-none"></div>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">RoR (Inercia)</p>
                    <p className="text-4xl font-bold text-blue-400 tracking-tighter">{ror.toFixed(1)}</p>
                </div>
                <div className="bg-bg-card border border-white/10 p-5 rounded-[2rem] text-center shadow-xl">
                    <p className="text-[10px] text-brand-green-bright font-bold uppercase tracking-widest mb-1">DTR (% Desarrollo)</p>
                    <p className="text-4xl font-bold text-brand-green-bright tracking-tighter">{dtr.toFixed(1)}%</p>
                </div>
            </div>

            {copilotSuggestion && (
                <div className={`bg-bg-card border ${copilotSuggestion.includes('EXCESO') ? 'border-brand-red/40 shadow-[0_0_20px_rgba(255,0,0,0.05)]' : copilotSuggestion.includes('DÉFICIT') ? 'border-blue-400/40 shadow-[0_0_20px_rgba(0,183,255,0.05)]' : 'border-brand-green-bright/40 shadow-[0_0_20px_rgba(0,255,136,0.05)]'} p-6 rounded-[2rem] flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top duration-700`}>
                    <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${copilotSuggestion.includes('EXCESO') ? 'bg-brand-red/5 text-brand-red' : copilotSuggestion.includes('DÉFICIT') ? 'bg-blue-400/5 text-blue-400' : 'bg-brand-green/5 text-brand-green-bright'}`}>
                            {copilotSuggestion.includes('EXCESO') ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
                            ) : copilotSuggestion.includes('DÉFICIT') ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 11l-5-5-5 5M17 18l-5-5-5 5" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-medium uppercase mb-1">Copiloto Industrial AI</p>
                            <p className="text-sm font-medium uppercase text-white tracking-tight">{copilotSuggestion}</p>
                        </div>
                    </div>
                    <div className="h-1 flex-1 bg-white/5 mx-12 rounded-full overflow-hidden hidden md:block border border-white/5">
                        <div className={`h-full transition-all duration-300 ${copilotSuggestion.includes('EXCESO') ? 'bg-brand-red' : copilotSuggestion.includes('DÉFICIT') ? 'bg-blue-400' : 'bg-brand-green-bright'}`} style={{ width: `${(elapsedTime / MAX_TIME) * 100}%` }}></div>
                    </div>
                </div>
            )}

            {/* Actuadores PLC - Ahora en la parte superior horizontal */}
            <div className="bg-bg-card border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-8 md:gap-16 shadow-xl">
                <div className="flex items-center gap-4 border-r border-white/5 pr-8 hidden md:flex">
                    <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                    <h4 className="text-[10px] font-medium uppercase text-gray-500 whitespace-nowrap">Actuadores PLC</h4>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-medium text-brand-red-bright uppercase min-w-[60px]">Gas (Q)</span>
                        <div className="flex-1 flex items-center gap-4">
                            <input type="range" min="0" max="100" value={gasPower} onChange={(e) => setGasPower(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none accent-brand-red cursor-pointer" />
                            <span className="text-sm font-medium font-mono text-white min-w-[35px] text-right">{gasPower}%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-medium text-blue-400 uppercase min-w-[60px]">Aire (F)</span>
                        <div className="flex-1 flex items-center gap-4">
                            <input type="range" min="0" max="100" value={airflow} onChange={(e) => setAirflow(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-400 cursor-pointer" />
                            <span className="text-sm font-medium font-mono text-white min-w-[35px] text-right">{airflow}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estación de Visualización Full Width */}
            <div className="bg-bg-card border border-white/10 rounded-[3rem] p-10 relative overflow-hidden min-h-[600px] shadow-2xl">
                <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 mb-12 gap-6">
                    <div>
                        <h3 className="text-xl font-medium uppercase text-white flex items-center gap-4">
                            Tri-Curva Industrial
                            {isRoasting && <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.2)]"></span>}
                        </h3>
                        <div className="flex gap-6 mt-4">
                            <span className="text-[10px] font-medium text-brand-green-bright flex items-center gap-2 uppercase tracking-tight"><span className="w-3 h-0.5 bg-brand-green-bright rounded-full"></span> BT</span>
                            <span className="text-[10px] font-medium text-blue-400 flex items-center gap-2 uppercase tracking-tight"><span className="w-3 h-0.5 bg-blue-400 rounded-full border border-dashed border-white/10"></span> RoR</span>
                            <span className="text-[10px] font-medium text-gray-500 flex items-center gap-2 uppercase tracking-tight"><span className="w-3 h-0.2 bg-gray-600 opacity-20"></span> Air</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isRoasting ? (
                            <button onClick={startRoast} className="bg-brand-green hover:bg-brand-green-bright text-white px-10 py-4 rounded-2xl font-medium text-xs uppercase shadow-xl shadow-brand-green/10 border border-brand-green-bright/20 transition-all hover:scale-[1.02] active:scale-95">Iniciar Lote</button>
                        ) : (
                            <>
                                <button onClick={handleFirstCrack} className={`px-8 py-4 rounded-2xl font-medium text-[10px] uppercase border transition-all ${firstCrack ? 'bg-brand-green/20 text-brand-green border-brand-green/30' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                                    {firstCrack ? '✓ FC' : 'Marcar FC'}
                                </button>
                                <button onClick={handleDrop} className="bg-brand-red hover:bg-brand-red-bright text-white px-10 py-4 rounded-2xl font-medium text-[10px] uppercase shadow-xl shadow-brand-red/10 border border-brand-red/20 transition-all hover:scale-[1.02] active:scale-95">Finalizar</button>
                            </>
                        )}
                    </div>
                </header>

                <div className="relative h-[420px] w-full mt-6 pl-10 pb-10">
                    <div className="absolute left-0 top-0 bottom-10 w-8 flex flex-col justify-between text-[8px] font-medium text-gray-700 font-mono">
                        <span>250°C</span><span>200°C</span><span>150°C</span><span>100°C</span><span>50°C</span>
                    </div>
                    <div className="absolute left-10 right-0 bottom-0 flex justify-between text-[8px] font-medium text-gray-700 font-mono px-2">
                        <span>0 min</span><span>3 min</span><span>6 min</span><span>9 min</span><span>12 min</span>
                    </div>

                    <svg className="absolute inset-0 left-10 bottom-10 right-0 top-0 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: 'calc(100% - 40px)', height: 'calc(100% - 40px)' }}>
                        {/* Grid - Primero para que esté al fondo */}
                        <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.02" opacity="0.03" />
                        <line x1="0" y1="40" x2="100" y2="40" stroke="white" strokeWidth="0.02" opacity="0.03" />
                        <line x1="0" y1="60" x2="100" y2="60" stroke="white" strokeWidth="0.02" opacity="0.03" />
                        <line x1="0" y1="80" x2="100" y2="80" stroke="white" strokeWidth="0.02" opacity="0.03" />

                        {/* Curva Maestra - Ultra Delicada */}
                        {masterProfile && (
                            <polyline fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1,1" strokeOpacity="0.1" points={generatePoints(masterProfile.points, 250)} />
                        )}

                        {/* Airflow Curve */}
                        <polyline fill="none" stroke="#666" strokeWidth="0.1" strokeOpacity="0.05" points={generatePoints(airHistory, 100)} />

                        {/* RoR Curve */}
                        <polyline fill="none" stroke="#60a5fa" strokeWidth="0.3" strokeDasharray="2,1" points={generatePoints(rorHistory, 35)} strokeOpacity="0.4" />

                        {/* BT Curve Principal - Más fina */}
                        <polyline fill="none" stroke="#00ff88" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round" points={generatePoints(btHistory, 250)} className="drop-shadow-[0_0_4px_rgba(0,255,136,0.1)]" />

                        {/* Event Markers - Renderizados al final para evitar superposición */}
                        {dryEnded && (
                            <g>
                                <line x1={(dryEnded / MAX_TIME) * 100} y1="0" x2={(dryEnded / MAX_TIME) * 100} y2="100" stroke="orange" strokeWidth="0.1" strokeDasharray="2,2" opacity="0.3" />
                                <rect x={(dryEnded / MAX_TIME) * 100 - 4} y="-2" width="12" height="4" fill="black" fillOpacity="0.6" rx="0.5" />
                                <text x={(dryEnded / MAX_TIME) * 100} y="1" fill="orange" opacity="0.8" textAnchor="middle" style={{ fontSize: '1.2px', fontWeight: 'medium', textTransform: 'uppercase' }}>Fase Secado</text>
                            </g>
                        )}
                        {firstCrack && (
                            <g>
                                <line x1={(firstCrack / MAX_TIME) * 100} y1="0" x2={(firstCrack / MAX_TIME) * 100} y2="100" stroke="#00ff88" strokeWidth="0.1" strokeDasharray="2,2" opacity="0.3" />
                                <rect x={(firstCrack / MAX_TIME) * 100 - 4} y="-2" width="12" height="4" fill="black" fillOpacity="0.6" rx="0.5" />
                                <text x={(firstCrack / MAX_TIME) * 100} y="1" fill="#00ff88" opacity="0.8" textAnchor="middle" style={{ fontSize: '1.2px', fontWeight: 'medium', textTransform: 'uppercase' }}>First Crack</text>
                            </g>
                        )}
                    </svg>
                </div>

                <footer className="mt-16 border-t border-white/5 pt-10 grid grid-cols-3 gap-16">
                    <div className="space-y-1">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Cronómetro Secado</p>
                        <p className="text-3xl font-bold text-orange-400 tracking-tighter">{Math.floor(dryTime / 60)}:{(dryTime % 60).toString().padStart(2, '0')}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Reacción Maillard</p>
                        <p className="text-3xl font-bold text-yellow-500 tracking-tighter">{Math.floor(maillardTime / 60)}:{(maillardTime % 60).toString().padStart(2, '0')}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Tiempo Desarrollo</p>
                        <p className="text-3xl font-bold text-brand-green-bright tracking-tighter">{Math.floor(devTime / 60)}:{(devTime % 60).toString().padStart(2, '0')}</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
