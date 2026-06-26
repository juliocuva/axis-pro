'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import RoastCurveVisualizer from './RoastCurveVisualizer';
import EUDRComplianceBadge from '@/modules/supply/components/EUDRComplianceBadge';

export default function RoastEntryForm({ user, lotData, initialTelemetry }: { user: { companyId: string } | null, lotData?: any, initialTelemetry?: any[] }) {
    const [formData, setFormData] = useState({
        batchId: 'AX-TOST-' + Math.floor(Math.random() * 9000 + 1000),
        roastDate: new Date().toISOString().split('T')[0],
        greenWeight: 0,
        roastedWeight: 0,
        selectedWeight: 0,
        quakersGrams: 0,
        roastTime: '',
        developmentTime: '',
        developmentPct: 0,
        dropTemp: 0,
        chargeTemp: 0,
        yellowingTime: '',
        fcTime: '',
        fcTemp: 0,
        notes: ''
    });

    const [curveFile, setCurveFile] = useState<File | null>(null);
    const [curveStatus, setCurveStatus] = useState<{ type: 'idle' | 'processing' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

    const [stats, setStats] = useState({ roastLoss: 0, netYield: 0 });
    const [expectedStats, setExpectedStats] = useState<{ minLoss: number, maxLoss: number }>({ minLoss: 12, maxLoss: 16 });
    const [curveData, setCurveData] = useState<any[]>(initialTelemetry || []); // Almacena los puntos reales
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const loadDemoData = () => {
        const demoGreen = 24.5;
        const demoRoasted = 20.8;
        setFormData({
            batchId: 'AX-TOST-GEISHA-' + Math.floor(Math.random() * 900 + 100),
            roastDate: new Date().toISOString().split('T')[0],
            chargeTemp: 210,
            yellowingTime: '5:30',
            fcTime: '9:15',
            fcTemp: 198,
            greenWeight: demoGreen,
            roastedWeight: demoRoasted,
            selectedWeight: 20.72,
            quakersGrams: 8,
            roastTime: '10:45',
            developmentTime: '2:15',
            developmentPct: 18.5,
            dropTemp: 204,
            notes: ''
        });

        // Generar curva simulada de alta fidelidad para la demo
        const simulatedPoints = Array.from({ length: 720 }, (_, i) => ({
            t: i,
            bt: 50 + Math.pow(i, 0.78) * 0.9 + (i > 300 ? Math.sin(i / 60) * 1.5 : 0),
            et: 70 + Math.pow(i, 0.75) * 1.1 + (i > 250 ? Math.cos(i / 50) * 2.0 : 0)
        }));
        setCurveData(simulatedPoints);
        setCurveStatus({ type: 'success', message: '¡Perfil Geisha Natural cargado para demostración!' });
        
        const rLoss = ((demoGreen - demoRoasted) / demoGreen) * 100;
        setStats({ roastLoss: rLoss, netYield: (20.72 / demoGreen) * 100 });
    };
    
    useEffect(() => {
        if (initialTelemetry && initialTelemetry.length > 0) {
            setCurveStatus({ type: 'success', message: '¡Telemetría de sesión capturada y sincronizada!' });
        }
    }, [initialTelemetry]);

    // Initial load from lotData
    useEffect(() => {
        if (lotData) {
            const draftPhysical = lotData.process_data?.raw_excel_data?.physicalAnalysis;
            const finalPhysical = lotData.physical_analysis?.[0] || draftPhysical;
            
            const d = Number(finalPhysical?.density_gl || finalPhysical?.density) || 710;
            const p = (lotData.process || 'washed').toLowerCase();
            const s = Number(lotData.sca_cupping?.[0]?.total_score || lotData.process_data?.raw_excel_data?.cvaCupping?.cvaFinalScore) || 84;
            
            let min = 14;
            let max = 16;
            let predDrop = 204;
            let predDevPct = 16;
            
            if (d >= 750) { min = 15.0; max = 16.0; }
            else if (d <= 680) { min = 13.5; max = 14.5; }
            
            if (p.includes('natural') || p.includes('honey') || p.includes('anaerobico') || p.includes('sumergido')) {
                min -= 1.0;
                max -= 1.0;
            }

            if (s >= 87) { predDrop = 201; predDevPct = 14; }
            else if (s < 83 && s > 0) { predDrop = 208; predDevPct = 20; }
            
            const greenW = lotData.thrashed_weight || lotData.purchase_weight || 0;
            const avgLoss = (min + max) / 2;
            const predRoasted = greenW > 0 ? (greenW * (1 - (avgLoss / 100))) : 0;
            
            const excelData = lotData.process_data?.raw_excel_data?.roastBatch;

            setFormData(prev => ({
                ...prev,
                batchId: excelData?.batchId || prev.batchId,
                greenWeight: excelData?.greenWeight || greenW,
                roastedWeight: excelData?.roastedWeight || prev.roastedWeight || parseFloat(predRoasted.toFixed(2)),
                selectedWeight: prev.selectedWeight || parseFloat(predRoasted.toFixed(2)),
                quakersGrams: prev.quakersGrams || 0,
                chargeTemp: excelData?.chargeTemp || prev.chargeTemp || 200,
                dropTemp: excelData?.dropTemp || prev.dropTemp || predDrop,
                developmentPct: prev.developmentPct || predDevPct,
                roastTime: excelData?.roastTime || prev.roastTime || '11:00',
                developmentTime: prev.developmentTime || '1:45'
            }));
        }
    }, [lotData]);

    useEffect(() => {
        if (formData.greenWeight > 0 && formData.roastedWeight > 0) {
            const rLoss = ((formData.greenWeight - formData.roastedWeight) / formData.greenWeight) * 100;
            const finalWeight = formData.selectedWeight > 0 ? formData.selectedWeight : formData.roastedWeight;
            const nYield = (finalWeight / formData.greenWeight) * 100;
            setStats({ roastLoss: rLoss, netYield: nYield });
        } else {
            setStats({ roastLoss: 0, netYield: 0 });
        }
    }, [formData.greenWeight, formData.roastedWeight, formData.selectedWeight]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const greenW = Number(formData.greenWeight) || 0;
            const roastedW = Number(formData.roastedWeight) || 0;
            const selectedW = formData.selectedWeight ? Number(formData.selectedWeight) : roastedW;
            const quakersG = Number(formData.quakersGrams) || 0;

            if (roastedW <= 0) throw new Error("El peso tostado debe ser mayor a 0.");
            if (greenW <= 0) throw new Error("Debe ingresar el peso verde (carga).");

            let finalCurve = curveData;
            if (finalCurve.length === 0) {
                const parseTime = (str: string) => {
                    if (!str) return null;
                    const p = str.split(':');
                    if (p.length === 2) return parseInt(p[0]) * 60 + parseInt(p[1]);
                    return parseInt(str) * 60;
                };

                const tDrop = parseTime(formData.roastTime) || 720;
                const tFC = parseTime(formData.fcTime) || (tDrop * 0.8);
                const tYellow = parseTime(formData.yellowingTime) || (tDrop * 0.4);
                
                const tempCharge = Number(formData.chargeTemp) || 200;
                const tempDrop = Number(formData.dropTemp) || 204;
                const tempFC = Number(formData.fcTemp) || 195;
                const tempYellow = 150;
                const tTurningPoint = 90;
                const tempTurningPoint = 90;

                const theoreticalPoints = [];
                for (let t = 0; t <= tDrop; t += 15) {
                    let bt = tempCharge;
                    if (t <= tTurningPoint) {
                        bt = tempCharge - ((tempCharge - tempTurningPoint) * (t / tTurningPoint));
                    } else if (t <= tYellow) {
                        const progress = (t - tTurningPoint) / (tYellow - tTurningPoint);
                        bt = tempTurningPoint + (tempYellow - tempTurningPoint) * progress;
                    } else if (t <= tFC) {
                        const progress = (t - tYellow) / (tFC - tYellow);
                        bt = tempYellow + (tempFC - tempYellow) * Math.pow(progress, 0.85);
                    } else {
                        const progress = (t - tFC) / (tDrop - tFC);
                        bt = tempFC + (tempDrop - tempFC) * Math.pow(progress, 0.8);
                    }
                    theoreticalPoints.push({
                        t: t,
                        bt: Number(bt.toFixed(1)),
                        et: Number((bt + 15 + Math.random() * 5).toFixed(1))
                    });
                }
                finalCurve = theoreticalPoints;
            }

            const { error } = await supabase
                .from('roast_batches')
                .insert([
                    {
                        inventory_id: lotData?.id || null,
                        batch_id_label: formData.batchId,
                        process: lotData?.process || 'Lavado',
                        roast_date: formData.roastDate,
                        green_weight: greenW,
                        roasted_weight: roastedW,
                        selected_weight: selectedW,
                        quakers_grams: quakersG,
                        roast_curve: finalCurve,
                        roast_curve_json: {
                            manual_metrics: {
                                chargeTemp: formData.chargeTemp,
                                yellowingTime: formData.yellowingTime,
                                fcTime: formData.fcTime,
                                fcTemp: formData.fcTemp,
                                roastTime: formData.roastTime,
                                developmentTime: formData.developmentTime,
                                developmentPct: formData.developmentPct,
                                dropTemp: formData.dropTemp,
                                notes: formData.notes
                            }
                        },
                        company_id: user?.companyId || '99999999-9999-9999-9999-999999999999'
                    }
                ]);

            if (error) throw error;
            setStatus({ type: 'success', message: '¡Lote de Tostión Registrado Exitosamente!' });

            // Reset after 3s
            setTimeout(() => {
                setStatus(null);
                setFormData(prev => ({
                    ...prev,
                    batchId: 'AX-TOST-' + Math.floor(Math.random() * 9000 + 1000),
                    roastedWeight: 0,
                    selectedWeight: 0,
                    quakersGrams: 0
                }));
                // Go back to main view automatically
                window.dispatchEvent(new CustomEvent('change-view', { detail: 'live' }));
            }, 3000);

        } catch (err: any) {
            console.error("AXIS DB ERROR:", err);
            let errorMsg = 'Unknown error';
            if (err) {
                if (err.message) errorMsg = err.message;
                else if (err.details) errorMsg = err.details;
                else if (typeof err === 'string') errorMsg = err;
                else errorMsg = Object.getOwnPropertyNames(err).map(k => `${k}: ${err[k]}`).join(', ') || JSON.stringify(err);
            }
            alert(`ERROR AL GUARDAR TUESTE:\n\n${errorMsg}\n\nSi no sabes cómo solucionarlo, envíame un pantallazo de esto.`);
            setStatus({ type: 'error', message: `DB Error: ${errorMsg}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCurveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCurveFile(file);
        setCurveStatus({ type: 'processing', message: 'Analizando telemetría y datos industriales...' });

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
                if (lines.length < 2) throw new Error("Archivo vacío o sin datos.");

                const header = lines[0].toLowerCase();
                const delimiter = header.includes(';') ? ';' : ',';
                
                // DETECCIÓN DE TIPO DE ARCHIVO
                const isSummary = header.includes('tiempo_total') || header.includes('maillard') || header.includes('secado');

                if (isSummary) {
                    // MODO RESUMEN: Extraer datos y reconstruir curva
                    const dataParts = lines[1].split(delimiter);
                    const headers = header.split(delimiter);
                    const getVal = (key: string) => {
                        const idx = headers.findIndex(h => h.includes(key));
                        return idx !== -1 ? dataParts[idx]?.replace(',', '.') : null;
                    };

                    const totalTime = parseFloat(getVal('tiempo_total') || '0');
                    const tempFinal = parseFloat(getVal('temp_final') || '205');
                    const secado = parseFloat(getVal('secado') || '0');
                    const maillard = parseFloat(getVal('maillard') || '0');
                    const desarrollo = parseFloat(getVal('desarrollo') || '0');

                    // Auto-llenar formulario
                    setFormData(prev => ({
                        ...prev,
                        roastTime: totalTime > 0 ? `${Math.floor(totalTime)}:${Math.round((totalTime % 1) * 60).toString().padStart(2, '0')}` : prev.roastTime,
                        developmentTime: desarrollo > 0 ? `${Math.floor(desarrollo)}:${Math.round((desarrollo % 1) * 60).toString().padStart(2, '0')}` : prev.developmentTime,
                        developmentPct: parseFloat(getVal('dtr') || '0')
                    }));

                    // Reconstrucción matemática de la curva (Curva Sigmoide Técnica)
                    const points = [];
                    const steps = 60; // Generar 60 puntos para una curva suave
                    for (let i = 0; i <= steps; i++) {
                        const t = (i / steps) * totalTime;
                        // Simulación de curva de tueste realista: Caída -> Secado -> Maillard -> Desarrollo
                        let temp = 195; // Carga
                        if (t < 1.5) temp = 195 - (t * 60); // Turning point
                        else {
                            const progress = (t - 1.5) / (totalTime - 1.5);
                            temp = 90 + (tempFinal - 90) * Math.pow(progress, 0.7);
                        }
                        points.push({ t: t * 60, bt: temp, et: temp + 25 });
                    }
                    
                    setCurveData(points);
                    setCurveStatus({ 
                        type: 'success', 
                        message: `¡Datos extraídos! Resumen de ${totalTime} min detectado. Curva reconstruida.` 
                    });
                } else {
                    // MODO TELEMETRÍA (Artisan/CSV Estándar)
                    const points = lines.slice(1).map((line, index) => {
                        const parts = line.split(delimiter);
                        if (parts.length >= 2) {
                            const tVal = parts[0].replace(',', '.');
                            const btVal = parts[1].replace(',', '.');
                            const etVal = parts[2]?.replace(',', '.');
                            return {
                                t: parseFloat(tVal) || index,
                                bt: parseFloat(btVal) || 0,
                                et: parseFloat(etVal) || (parseFloat(btVal) + 20)
                            };
                        }
                        return null;
                    }).filter(p => p !== null && p.bt > 0);

                    if (points.length > 0) {
                        setCurveData(points);
                        setCurveStatus({ 
                            type: 'success', 
                            message: `¡Telemetría cargada! ${points.length} puntos. T-Max: ${Math.max(...points.map(p => p!.bt))}°C.` 
                        });
                    } else {
                        throw new Error("No se detectaron temperaturas válidas.");
                    }
                }
            } catch (err: any) {
                setCurveStatus({ type: 'error', message: err.message || 'Error al procesar el archivo.' });
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 xl:px-0">
            <div className="flex items-center justify-between mb-10 relative">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'live' }))}
                    className="flex items-center gap-2 text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all z-10"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    </div>
                    Back to Main Roast
                </button>

                <h2 className="text-xl font-bold text-brand-navy uppercase absolute left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">Roast Log</h2>

                <div className="flex items-center gap-3 z-10">
                    {/* Boton Cargar Curva */}
                    <div className="relative overflow-hidden cursor-pointer group flex items-center gap-2 bg-brand-navy hover:bg-brand-green text-white px-5 py-2 rounded-full transition-all duration-300 shadow-lg shadow-brand-navy/10 pointer-events-auto">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <span className="text-[10px] font-bold uppercase tracking-wide">Upload .CSV Curve</span>
                        <input
                            type="file"
                            accept=".csv,.alog"
                            onChange={handleCurveUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={curveStatus.type === 'processing' || isSubmitting}
                        />
                    </div>
                </div>
            </div>

            <EUDRComplianceBadge lotData={lotData} className="mb-8" />

            <form onSubmit={handleSubmit} className="space-y-6 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/50 blur-3xl pointer-events-none rounded-full"></div>

                {status && (
                    <div className={`p-4 rounded text-xs font-bold border flex items-center gap-3 ${status.type === 'success' ? 'bg-white border-gray-400 shadow-sm text-brand-navy-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                        {status.message}
                    </div>
                )}

                {curveStatus.type && curveStatus.type !== 'idle' && curveData.length === 0 && (
                    <div className="relative z-10 flex justify-end -mt-4 mb-4">
                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase px-4 py-2 rounded-full border shadow-sm ${curveStatus.type === 'processing' ? 'bg-white border-gray-400 text-brand-navy' : curveStatus.type === 'success' ? 'bg-white border-brand-green/50 text-brand-green' : 'bg-red-50 border-red-200 text-red-500'}`}>
                            {curveStatus.type === 'processing' && <div className="w-3 h-3 border-2 border-brand-navy border-t-transparent rounded-full animate-spin"></div>}
                            {curveStatus.type === 'success' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            {curveStatus.message}
                        </div>
                    </div>
                )}

                {/* VISUALIZADOR DE CURVA (VISTA PREVIA) */}
                {curveData.length > 0 && (
                    <div className="relative z-10 animate-in zoom-in duration-500">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse"></div>
                            <h4 className="text-[11px] font-bold text-brand-navy uppercase ">Synchronized Telemetry Preview</h4>
                        </div>
                        <RoastCurveVisualizer data={curveData} />
                        <button 
                            type="button" 
                            onClick={() => { setCurveData([]); setCurveFile(null); setCurveStatus({ type: 'idle', message: '' }); }}
                            className="mt-4 text-[9px] font-bold text-red-500 uppercase  hover:underline"
                        >
                            Remove File and Clear Curve
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 relative z-10">
                    <div>
                        <label className="text-[11px] font-bold text-brand-green uppercase mb-1 block">Roast Batch (ID)</label>
                        <input
                            type="text"
                            value={formData.batchId}
                            onChange={(e) => setFormData({ ...formData, batchId: e.target.value.toUpperCase() })}
                            placeholder="EX: AX-TOST-7721"
                            className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs focus:border-brand-green outline-none transition-all font-mono text-lg text-brand-navy font-bold placeholder:text-gray-400"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-brand-green uppercase mb-1 block">Roast Date</label>
                        <input
                            type="date"
                            required
                            value={formData.roastDate}
                            onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                            className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs focus:border-brand-green outline-none transition-all font-bold text-brand-navy-bright scheme-light"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-brand-green/30">
                    <h4 className="text-[12px] font-black text-brand-green uppercase tracking-widest mb-4 w-fit">ROASTING PARAMETERS (MANUAL)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-3 relative z-10">

                    <NumericInput
                        label="Charge Temp (°C)"
                        value={formData.chargeTemp}
                        onChange={(val) => setFormData({ ...formData, chargeTemp: val })}
                        step={0.1}
                        unit="°C" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        disabled={isSubmitting}
                        variant="industrial"
                    />
                    <div>
                        <label className="text-[11px] font-bold text-brand-green uppercase mb-1 block">Yellowing / Color Change</label>
                        <input
                            type="text"
                            value={formData.yellowingTime}
                            onChange={(e) => setFormData({ ...formData, yellowingTime: e.target.value })}
                            placeholder="Ex: 5:30"
                            className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs focus:border-brand-green outline-none transition-all font-mono text-brand-navy text-sm font-bold placeholder:text-gray-400"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-brand-green uppercase mb-1 block">1st Crack Time</label>
                        <input
                            type="text"
                            value={formData.fcTime}
                            onChange={(e) => setFormData({ ...formData, fcTime: e.target.value })}
                            placeholder="Ex: 9:15"
                            className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs focus:border-brand-green outline-none transition-all font-mono text-brand-navy text-sm font-bold placeholder:text-gray-400"
                            disabled={isSubmitting}
                        />
                    </div>
                    <NumericInput
                        label="1st Crack Temp (°C)"
                        value={formData.fcTemp}
                        onChange={(val) => setFormData({ ...formData, fcTemp: val })}
                        step={0.1}
                        unit="°C" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        disabled={isSubmitting}
                        variant="industrial"
                    />

                    <div>
                        <label className="text-[11px] font-bold text-brand-green uppercase mb-1 block">DTR Time</label>
                        <input
                            type="text"
                            value={formData.developmentTime}
                            onChange={(e) => setFormData({ ...formData, developmentTime: e.target.value })}
                            placeholder="Ex: 1:45"
                            className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs focus:border-brand-green outline-none transition-all font-mono text-brand-navy text-sm font-bold placeholder:text-gray-400"
                            disabled={isSubmitting}
                        />
                    </div>
                    <NumericInput
                        label="DTR (%)"
                        value={formData.developmentPct}
                        onChange={(val) => setFormData({ ...formData, developmentPct: val })}
                        step={0.1}
                        unit="%" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        disabled={isSubmitting}
                        variant="industrial"
                    />
                    <div>
                        <label className="text-[11px] font-bold text-brand-green uppercase mb-1 block">Total Time</label>
                        <input
                            type="text"
                            value={formData.roastTime}
                            onChange={(e) => setFormData({ ...formData, roastTime: e.target.value })}
                            placeholder="Ex: 11:30"
                            className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs focus:border-brand-green outline-none transition-all font-mono text-brand-navy text-sm font-bold placeholder:text-gray-400"
                            disabled={isSubmitting}
                        />
                    </div>
                    <NumericInput
                        label="Drop Temp (°C)"
                        value={formData.dropTemp}
                        onChange={(val) => setFormData({ ...formData, dropTemp: val })}
                        step={0.1}
                        unit="°C" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        disabled={isSubmitting}
                        variant="industrial"
                    />
                </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-brand-green/30">
                    <h4 className="text-[12px] font-black text-brand-green uppercase tracking-widest mb-4 w-fit">QUALITY RESULTS (SHRINKAGE & DEFECTS)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 relative z-10">
                    
                    <NumericInput
                        label="Green Weight (IN)"
                        value={formData.greenWeight}
                        onChange={(val) => setFormData({ ...formData, greenWeight: val })}
                        step={0.1}
                        unit="KG" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        required
                        disabled={isSubmitting}
                        variant="industrial"
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Roasted Weight (OUT)"
                        value={formData.roastedWeight}
                        onChange={(val) => setFormData({ ...formData, roastedWeight: val })}
                        step={0.1}
                        unit="KG" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        placeholder="Ex: 20.80"
                        required
                        disabled={isSubmitting}
                        variant="industrial"
                        formatThousands={true}
                    />

                    <NumericInput
                        label="Selected / Clean (Optional)"
                        value={formData.selectedWeight}
                        onChange={(val) => setFormData({ ...formData, selectedWeight: val })}
                        step={0.1}
                        unit="KG" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        placeholder="Ex: 20.72"
                        disabled={isSubmitting}
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Quakers / Defects (Grams)"
                        value={formData.quakersGrams}
                        onChange={(val) => setFormData({ ...formData, quakersGrams: val })}
                        step={1}
                        unit="G" inputClassName="bg-transparent border-b-2 border-zinc-300 px-0 py-1 focus:border-brand-green outline-none font-bold text-brand-navy-bright appearance-none text-sm"
                        disabled={isSubmitting}
                        variant="orange"
                        formatThousands={true}
                    />

                    <div className="col-span-1 md:col-span-2 mt-4 pt-6 border-t-2 border-brand-green/30 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <label className="text-[11px] font-bold text-brand-green uppercase mb-1 block">Roaster Notes & Observations</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Notes on development, machine incidents..."
                                className="w-full bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs focus:border-brand-green outline-none transition-all text-sm text-brand-navy resize-none h-24 placeholder:text-gray-400"
                                disabled={isSubmitting}
                            />
                        </div>
                        
                        {(formData.greenWeight > 0 && formData.roastedWeight > 0) && (
                            <div className="flex items-end justify-end gap-8 pb-2 shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] text-brand-navy uppercase font-bold mb-1">Roast Loss</p>
                                    <p className={`text-sm font-bold ${stats.roastLoss > 16.5 || stats.roastLoss < 12 ? 'text-brand-red' : 'text-brand-navy'}`}>{stats.roastLoss.toFixed(2)}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-brand-navy uppercase font-bold mb-1">Yield</p>
                                    <p className="text-sm font-bold text-brand-navy-bright">{stats.netYield.toFixed(2)}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                </div>





                <div className="flex justify-center pt-8 relative z-10">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-brand-green text-brand-navy px-12 py-5 rounded-industrial-sm font-black uppercase  text-xs hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                SYNCHRONIZING WITH CLOUD...
                            </>
                        ) : (
                            <>
                                SAVE DATA
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}








