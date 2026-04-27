'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import RoastCurveVisualizer from './RoastCurveVisualizer';

export default function RoastEntryForm({ user, lotData, initialTelemetry }: { user: { companyId: string } | null, lotData?: any, initialTelemetry?: any[] }) {
    const [formData, setFormData] = useState({
        batchId: 'AX-TOST-' + Math.floor(Math.random() * 9000 + 1000),
        roastDate: new Date().toISOString().split('T')[0],
        greenWeight: 0,
        roastedWeight: 0,
        selectedWeight: 0,
        quakersGrams: 0,
    });

    const [curveFile, setCurveFile] = useState<File | null>(null);
    const [curveStatus, setCurveStatus] = useState<{ type: 'idle' | 'processing' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

    const [stats, setStats] = useState({ roastLoss: 0, netYield: 0 });
    const [curveData, setCurveData] = useState<any[]>(initialTelemetry || []); // Almacena los puntos reales
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    useEffect(() => {
        if (initialTelemetry && initialTelemetry.length > 0) {
            setCurveStatus({ type: 'success', message: '¡Telemetría de sesión capturada y sincronizada!' });
        }
    }, [initialTelemetry]);

    // Initial load from lotData
    useEffect(() => {
        if (lotData) {
            setFormData(prev => ({
                ...prev,
                greenWeight: lotData.thrashed_weight || lotData.purchase_weight || 0
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
            if (formData.roastedWeight <= 0) throw new Error("El peso tostado debe ser mayor a 0.");
            if (formData.greenWeight <= 0) throw new Error("Debe ingresar el peso verde (carga).");

            const { error } = await supabase
                .from('roast_batches')
                .insert([
                    {
                        inventory_id: lotData?.id || null,
                        batch_id_label: formData.batchId,
                        process: lotData?.process || 'Lavado',
                        roast_date: formData.roastDate,
                        green_weight: formData.greenWeight,
                        roasted_weight: formData.roastedWeight,
                        selected_weight: formData.selectedWeight || formData.roastedWeight,
                        quakers_grams: formData.quakersGrams,
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
            console.error(err);
            setStatus({ type: 'error', message: err.message || 'Error al guardar el lote.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCurveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCurveFile(file);
        setCurveStatus({ type: 'processing', message: 'Analizando telemetría de la curva...' });

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
                
                // Parseo simple para Artisan/CSV (Tiempo, BT, ET)
                const points = lines.slice(1).map((line, index) => {
                    const parts = line.split(/[;,]/);
                    if (parts.length >= 2) {
                        return {
                            t: parseFloat(parts[0]) || index,
                            bt: parseFloat(parts[1]) || 0,
                            et: parseFloat(parts[2]) || 0
                        };
                    }
                    return null;
                }).filter(p => p !== null);

                if (points.length > 0) {
                    setCurveData(points);
                    setCurveStatus({ 
                        type: 'success', 
                        message: `¡Telemetría cargada! ${points.length} puntos detectados. T-Max: ${Math.max(...points.map(p => p!.bt))}°C.` 
                    });
                } else {
                    throw new Error("No se detectaron puntos válidos.");
                }
            } catch (err) {
                setCurveStatus({ type: 'error', message: 'Error al parsear el log térmico.' });
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

            <div className="text-center mb-10">
                <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Ingreso Rápido Industrial</p>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter">Registro de Tostión</h2>
                <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                    Formulario simplificado para registrar un tueste realizado en máquina (Artisan / Cropster) y calcular automáticamente el rendimiento.
                </p>
            </div>

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
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-orange-500 font-bold uppercase tracking-widest animate-pulse">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all font-mono text-lg text-white font-bold"
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
                    />
                    <NumericInput
                        label="Café Tostado (OUT)"
                        value={formData.roastedWeight}
                        onChange={(val) => setFormData({ ...formData, roastedWeight: val })}
                        step={0.1}
                        unit="KG"
                        required
                        disabled={isSubmitting}
                        variant="industrial"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <NumericInput
                        label="Selección / Limpio (Opcional)"
                        value={formData.selectedWeight}
                        onChange={(val) => setFormData({ ...formData, selectedWeight: val })}
                        step={0.1}
                        unit="KG"
                        disabled={isSubmitting}
                    />
                    <NumericInput
                        label="Quakers / Defectos (Gramos)"
                        value={formData.quakersGrams}
                        onChange={(val) => setFormData({ ...formData, quakersGrams: val })}
                        step={1}
                        unit="G"
                        disabled={isSubmitting}
                        variant="orange"
                    />
                </div>

                {/* Dashboard en vivo */}
                {(formData.greenWeight > 0 && formData.roastedWeight > 0) && (
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center text-center md:text-left pt-6 border-t border-white/5 gap-6">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Merma (Pérdida por Evaporación)</p>
                            <p className={`text-2xl font-bold ${stats.roastLoss > 16.5 || stats.roastLoss < 12 ? 'text-brand-red' : 'text-orange-500'}`}>{stats.roastLoss.toFixed(2)}%</p>
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
                        className="bg-brand-green text-black px-12 py-5 rounded-industrial-sm font-bold uppercase tracking-widest hover:bg-brand-green-bright transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Registrando...' : 'Sellar Tueste (Guardar)'}
                    </button>
                </div>
            </form>
        </div>
    );
}
