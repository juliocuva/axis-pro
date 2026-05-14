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
            greenWeight: demoGreen,
            roastedWeight: demoRoasted,
            selectedWeight: 20.72,
            quakersGrams: 8,
            roastTime: '10:45',
            developmentTime: '2:15',
            developmentPct: 18.5,
            dropTemp: 204,
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
            const d = Number(lotData.physical_analysis?.[0]?.density_gl) || 710;
            const p = (lotData.process || 'washed').toLowerCase();
            const s = Number(lotData.sca_cupping?.[0]?.total_score) || 84;
            
            let min = 14;
            let max = 16;
            let predDrop = 204;
            let predDevPct = 16;
            
            if (d >= 750) { min = 15.0; max = 16.0; }
            else if (d <= 680) { min = 13.5; max = 14.5; }
            
            if (p.includes('natural') || p.includes('honey') || p.includes('anaerobico')) {
                min -= 1.0;
                max -= 1.0;
            }

            if (s >= 87) { predDrop = 201; predDevPct = 14; }
            else if (s < 83 && s > 0) { predDrop = 208; predDevPct = 20; }
            
            const greenW = lotData.thrashed_weight || lotData.purchase_weight || 0;
            const avgLoss = (min + max) / 2;
            const predRoasted = greenW > 0 ? (greenW * (1 - (avgLoss / 100))) : 0;

            setFormData(prev => ({
                ...prev,
                greenWeight: greenW,
                roastedWeight: prev.roastedWeight || parseFloat(predRoasted.toFixed(2)),
                selectedWeight: prev.selectedWeight || parseFloat(predRoasted.toFixed(2)),
                quakersGrams: prev.quakersGrams || 0,
                dropTemp: prev.dropTemp || predDrop,
                developmentPct: prev.developmentPct || predDevPct,
                roastTime: prev.roastTime || '11:00',
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
                        roast_curve: curveData, // Guardamos la telemetría real
                        company_id: user?.companyId
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
            const errorMsg = err?.message || err?.details || (typeof err === 'string' ? err : JSON.stringify(err));
            setStatus({ type: 'error', message: `Fallo en Base de Datos: ${errorMsg}` });
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'live' }))}
                className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400 hover:text-white transition-all mb-4"
            >
                <div className="p-2 bg-white/5 rounded-full">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </div>
                Volver al Panel Principal
            </button>

            <div className="text-center mb-10 relative">
                <div className="absolute top-0 right-0">
                    <button
                        onClick={loadDemoData}
                        className="group flex items-center gap-2 bg-brand-green/10 hover:bg-brand-green text-brand-green hover:text-black border border-brand-green/30 px-4 py-2 rounded-full transition-all duration-500 shadow-lg shadow-brand-green/5"
                        title="Cargar Datos de Demostración"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:animate-bounce"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">Auto-Fill Demo</span>
                    </button>
                </div>
                <div className="inline-block px-3 py-1 bg-brand-green/10 border border-brand-green/20 rounded-full mb-4">
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-widest">Ingreso Rápido Industrial</p>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter">Registro de Tostión</h2>
                <p className="text-gray-500 text-sm max-w-2xl mx-auto uppercase font-bold tracking-wider text-[10px]">
                    Sincronización algorítmica de curvas térmicas y balance de masas industrial.
                </p>
            </div>

            <EUDRComplianceBadge lotData={lotData} className="mb-8" />

            {/* LOT IDENTIFICATION */}
            {lotData && (
                <div className="bg-bg-card border border-white/5 p-6 rounded-industrial-sm flex flex-col md:flex-row gap-6 justify-between items-center mb-8">
                    <div className="flex-1">
                        <p className="text-[10px] text-brand-green uppercase font-bold tracking-[0.2em] mb-1">Materia Prima Vinculada</p>
                        <p className="text-xl font-bold text-white uppercase">{lotData.farmer_name || 'Productor'} • {lotData.variety || 'Variedad Tatama'}</p>
                    </div>
                    <div className="flex gap-6 text-center">
                        <div className="bg-white/5 px-4 py-2 rounded border border-white/5">
                            <p className="text-[9px] text-gray-500 uppercase font-bold">Humedad</p>
                            <p className="text-sm font-bold text-white">{lotData.physical_analysis?.[0]?.moisture_pct || '--'}%</p>
                        </div>
                        <div className="bg-white/5 px-4 py-2 rounded border border-white/5">
                            <p className="text-[9px] text-gray-500 uppercase font-bold">Densidad</p>
                            <p className="text-sm font-bold text-white">{lotData.physical_analysis?.[0]?.density_gl || '--'} <span className="text-[10px] text-gray-400">g/L</span></p>
                        </div>
                        <div className="bg-white/5 px-4 py-2 rounded border border-white/5">
                            <p className="text-[9px] text-gray-500 uppercase font-bold">Proceso</p>
                            <p className="text-sm font-bold text-white uppercase">{lotData.process}</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-bg-card p-10 rounded-industrial border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-3xl pointer-events-none rounded-full"></div>

                {status && (
                    <div className={`p-4 rounded text-xs font-bold border flex items-center gap-3 ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                        {status.message}
                    </div>
                )}

                {/* INTEGRACIÓN DE CURVAS DE MÁQUINA (Artisan/Cropster) */}
                <div className="relative z-10 bg-white/5 border border-dashed border-white/20 p-8 rounded-industrial flex flex-col sm:flex-row items-center gap-6 group hover:border-brand-green/50 transition-colors">
                    <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center border border-brand-green/20 group-hover:scale-110 transition-transform">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green-bright"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[12px] font-bold text-white uppercase tracking-widest mb-1">Cargar Curva de Tostadora</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-relaxed">Arrastre o seleccione el log térmico generado por su máquina (Artisan / Cropster) en formato .CSV o .ALOG</p>

                        {curveStatus.type === 'processing' && (
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-brand-green font-bold uppercase tracking-widest animate-pulse">
                                <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                                {curveStatus.message}
                            </div>
                        )}
                        {curveStatus.type === 'success' && (
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-brand-green-bright font-bold uppercase tracking-widest bg-brand-green/10 px-3 py-1.5 rounded-full w-max border border-brand-green/30">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                {curveStatus.message}
                            </div>
                        )}
                        {curveStatus.type === 'error' && (
                            <div className="mt-3 text-[10px] text-red-400 font-bold uppercase tracking-widest">
                                {curveStatus.message}
                            </div>
                        )}
                    </div>
                    <div className="relative overflow-hidden cursor-pointer bg-white/10 hover:bg-white/20 transition-all text-white font-bold text-[10px] uppercase tracking-widest px-8 py-4 rounded-industrial-sm">
                        Examinar Archivo
                        <input
                            type="file"
                            accept=".csv,.alog"
                            onChange={handleCurveUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={curveStatus.type === 'processing' || isSubmitting}
                        />
                    </div>
                </div>

                {/* VISUALIZADOR DE CURVA (VISTA PREVIA) */}
                {curveData.length > 0 && (
                    <div className="relative z-10 animate-in zoom-in duration-500">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse"></div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vista Previa de Telemetría Sincronizada</h4>
                        </div>
                        <RoastCurveVisualizer data={curveData} />
                        <button 
                            type="button" 
                            onClick={() => { setCurveData([]); setCurveFile(null); setCurveStatus({ type: 'idle', message: '' }); }}
                            className="mt-4 text-[9px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                        >
                            Quitar Archivo y Limpiar Curva
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Bache de Tostión (ID)</label>
                        <input
                            type="text"
                            value={formData.batchId}
                            onChange={(e) => setFormData({ ...formData, batchId: e.target.value.toUpperCase() })}
                            placeholder="EJ: AX-TOST-7721"
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all font-mono text-lg text-white font-bold placeholder:opacity-20"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Fecha de Tueste</label>
                        <input
                            type="date"
                            required
                            value={formData.roastDate}
                            onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all font-bold text-brand-green-bright scheme-dark"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 p-6 bg-brand-green/5 rounded-xl border border-brand-green/20">
                    <div>
                        <label className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-3 block">Tiempo Total</label>
                        <input
                            type="text"
                            value={formData.roastTime}
                            onChange={(e) => setFormData({ ...formData, roastTime: e.target.value })}
                            placeholder="Ej: 11:30"
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all font-mono text-white text-sm"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-3 block">Tiempo DTR</label>
                        <input
                            type="text"
                            value={formData.developmentTime}
                            onChange={(e) => setFormData({ ...formData, developmentTime: e.target.value })}
                            placeholder="Ej: 1:45"
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all font-mono text-white text-sm"
                            disabled={isSubmitting}
                        />
                    </div>
                    <NumericInput
                        label="DTR (%)"
                        value={formData.developmentPct}
                        onChange={(val) => setFormData({ ...formData, developmentPct: val })}
                        step={0.1}
                        unit="%"
                        disabled={isSubmitting}
                        variant="industrial"
                    />
                    <NumericInput
                        label="Temp. Caída (°C)"
                        value={formData.dropTemp}
                        onChange={(val) => setFormData({ ...formData, dropTemp: val })}
                        step={0.1}
                        unit="°C"
                        disabled={isSubmitting}
                        variant="industrial"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 p-6 bg-white/5 rounded-xl border border-white/5">
                    <NumericInput
                        label="Carga Verde (IN)"
                        value={formData.greenWeight}
                        onChange={(val) => setFormData({ ...formData, greenWeight: val })}
                        step={0.1}
                        unit="KG"
                        required
                        disabled={isSubmitting}
                        variant="industrial"
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Café Tostado (OUT)"
                        value={formData.roastedWeight}
                        onChange={(val) => setFormData({ ...formData, roastedWeight: val })}
                        step={0.1}
                        unit="KG"
                        placeholder="Ej: 20.80"
                        required
                        disabled={isSubmitting}
                        variant="industrial"
                        formatThousands={true}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <NumericInput
                        label="Selección / Limpio (Opcional)"
                        value={formData.selectedWeight}
                        onChange={(val) => setFormData({ ...formData, selectedWeight: val })}
                        step={0.1}
                        unit="KG"
                        placeholder="Ej: 20.72"
                        disabled={isSubmitting}
                        formatThousands={true}
                    />
                    <NumericInput
                        label="Quakers / Defectos (Gramos)"
                        value={formData.quakersGrams}
                        onChange={(val) => setFormData({ ...formData, quakersGrams: val })}
                        step={1}
                        unit="G"
                        disabled={isSubmitting}
                        variant="orange"
                        formatThousands={true}
                    />
                </div>

                {/* Cuadro de Predicción de Merma */}
                {formData.greenWeight > 0 && (
                    <div className="relative z-10 bg-brand-green/5 border border-brand-green/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 my-6">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center border border-brand-green/30">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-1">Predicción de Merma (IA)</h4>
                                <p className="text-[10px] text-gray-400">Según densidad ({lotData?.physical_analysis?.[0]?.density_gl || '--'} g/L) y proceso ({lotData?.process || '--'})</p>
                            </div>
                        </div>
                        <div className="text-right border-l border-white/10 pl-6">
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Pérdida Esperada</p>
                            <p className="text-xl font-bold text-white">{expectedStats.minLoss.toFixed(1)}% - {expectedStats.maxLoss.toFixed(1)}%</p>
                        </div>
                        <div className="text-right border-l border-white/10 pl-6">
                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Rango OUT Proyectado</p>
                            <p className="text-xl font-bold text-brand-green-bright tracking-tight">
                                {(formData.greenWeight * (1 - expectedStats.maxLoss / 100)).toLocaleString('es-CO', {maximumFractionDigits: 1})} <span className="text-[12px] text-gray-500">KG</span>
                                <span className="text-white font-normal mx-2">-</span>
                                {(formData.greenWeight * (1 - expectedStats.minLoss / 100)).toLocaleString('es-CO', {maximumFractionDigits: 1})} <span className="text-[12px] text-gray-500">KG</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Dashboard en vivo */}
                {(formData.greenWeight > 0 && formData.roastedWeight > 0) && (
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-center md:text-left pt-6 border-t border-white/5 gap-6">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Merma (Pérdida por Evaporación)</p>
                            <p className={`text-2xl font-bold ${stats.roastLoss > 16.5 || stats.roastLoss < 12 ? 'text-brand-red' : 'text-brand-green'}`}>{stats.roastLoss.toFixed(2)}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Rendimiento Industrial</p>
                            <p className="text-3xl font-black text-brand-green-bright tracking-tighter">{stats.netYield.toFixed(2)}%</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-8 relative z-10">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-brand-green text-white px-12 py-5 rounded-industrial-sm font-black uppercase tracking-[0.2em] text-xs hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                SINCRONIZANDO CON LA NUBE...
                            </>
                        ) : (
                            <>
                                GUARDAR DATOS
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
