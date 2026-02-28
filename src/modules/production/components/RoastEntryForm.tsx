'use client';

import React, { useState, useEffect } from 'react';
import { ProcessType } from '@/shared/types';
import RoastCurveAnalysis from './RoastCurveAnalysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';

export default function RoastEntryForm({ user }: { user: { companyId: string } | null }) {
    const [formData, setFormData] = useState({
        batchId: 'AX-' + Math.floor(Math.random() * 9000 + 1000),
        process: 'washed' as ProcessType,
        greenWeight: 24.5, // Default for 30kg machine (80% load)
        roastedWeight: 0,
        selectedWeight: 0, // Peso final tras selección
        quakersGrams: 0,    // Peso de quakers en gramos
        profileId: 'SUPREMO-DXB-01',
        developmentPct: 18.5,
        roastDate: new Date().toISOString().split('T')[0],
        roastCurve: [] as any[]
    });

    const [stats, setStats] = useState({
        roastLoss: 0,      // % evap
        selectionLoss: 0,  // % defect removed
        netYield: 0,       // % total real
        quakerPct: 0       // % quakers
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (formData.greenWeight > 0 && formData.roastedWeight > 0) {
            const rLoss = ((formData.greenWeight - formData.roastedWeight) / formData.greenWeight) * 100;
            const sLoss = formData.selectedWeight > 0 ? ((formData.roastedWeight - formData.selectedWeight) / formData.roastedWeight) * 100 : 0;
            const nYield = formData.selectedWeight > 0 ? (formData.selectedWeight / formData.greenWeight) * 100 : (formData.roastedWeight / formData.greenWeight) * 100;
            const qPct = formData.roastedWeight > 0 ? (formData.quakersGrams / (formData.roastedWeight * 1000)) * 100 : 0;

            setStats({
                roastLoss: rLoss,
                selectionLoss: sLoss,
                netYield: nYield,
                quakerPct: qPct
            });
        }
    }, [formData.greenWeight, formData.roastedWeight, formData.selectedWeight, formData.quakersGrams]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            let points: any[] = [];

            if (file.name.endsWith('.csv')) {
                // Robust Parser for Artisan (Tab or Comma)
                const isTab = text.includes('\t');
                const delimiter = isTab ? '\t' : ',';
                const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                // Detect Units (Artisan specific)
                const isFahrenheit = lines[0].includes('Unit:F');

                // Find Header Line (In Artisan it might be line 2)
                let headerIdx = lines.findIndex(l => l.includes('BT') && (l.includes('Time') || l.includes('Time2')));
                if (headerIdx === -1) headerIdx = 0;

                const headers = lines[headerIdx].split(delimiter).map(h => h.trim().replace(/"/g, ''));
                const btIdx = headers.indexOf('BT');
                const etIdx = headers.indexOf('ET');
                const timeIdx = headers.indexOf('Time2') !== -1 ? headers.indexOf('Time2') : (headers.indexOf('Time1') !== -1 ? headers.indexOf('Time1') : 0);
                const eventIdx = headers.indexOf('Event');

                const rawData = lines.slice(headerIdx + 1);
                let lastBT = -1;
                let lastTime = -1;

                points = rawData.map((line, i) => {
                    const cols = line.split(delimiter);
                    const timeStr = cols[timeIdx] || '00:00';
                    let bt = parseFloat(cols[btIdx]) || 0;
                    let et = parseFloat(cols[etIdx]) || 0;
                    const event = eventIdx !== -1 ? cols[eventIdx] : '';

                    if (isFahrenheit) {
                        bt = (bt - 32) * 5 / 9;
                        et = (et - 32) * 5 / 9;
                    }

                    // Airflow mapping (common Artisan gas/air channels)
                    const gasVal = parseFloat(cols[5]) || 0;

                    // Convert HH:MM:SS or MM:SS to seconds
                    const timeParts = timeStr.split(':').map(Number);
                    let totalSecs = 0;
                    if (timeParts.length === 3) {
                        totalSecs = (timeParts[0] * 3600) + (timeParts[1] * 60) + timeParts[2];
                    } else if (timeParts.length === 2) {
                        totalSecs = (timeParts[0] * 60) + timeParts[1];
                    }

                    // Calculate RoR (Rate of Rise per minute)
                    let ror = 0;
                    if (lastTime !== -1 && totalSecs > lastTime) {
                        const timeDiffMin = (totalSecs - lastTime) / 60;
                        ror = (bt - lastBT) / timeDiffMin;
                    }

                    // Cap RoR to prevent chart spikes (standard range is usually 0-25 C/min)
                    if (ror < -50) ror = -50;
                    if (ror > 50) ror = 50;

                    lastBT = bt;
                    lastTime = totalSecs;

                    return {
                        time: timeStr,
                        temp: parseFloat(bt.toFixed(1)),
                        et: parseFloat(et.toFixed(1)),
                        ror: parseFloat(ror.toFixed(2)),
                        gas: gasVal,
                        pressure: parseFloat(cols[7]) || 0,
                        event: event
                    };
                }).filter(p => !isNaN(p.temp) && p.temp > 0);

                // For Artisan Costa Rica logs, we filter between Charge and Drop
                const chargeIdx = points.findIndex(p => p.event === 'Charge');
                if (chargeIdx !== -1) points = points.slice(chargeIdx);
                const dropIdx = points.findIndex(p => p.event === 'Drop');
                if (dropIdx !== -1) points = points.slice(0, dropIdx + 1);

            } else if (file.name.endsWith('.json')) {
                try {
                    const json = JSON.parse(text);
                    points = Array.isArray(json) ? json : (json.points || []);
                } catch (e) {
                    console.error("JSON Error");
                }
            }

            if (points.length > 0) {
                setFormData(prev => ({ ...prev, roastCurve: points }));
                setStatus({ type: 'success', message: `AXIS Bridge: ${points.length} puntos de curva sincronizados.` });
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const { supabase } = await import('@/shared/lib/supabase');
            const { error } = await supabase
                .from('roast_batches')
                .insert([
                    {
                        inventory_id: formData.profileId === 'SUPREMO-DXB-01' ? null : formData.profileId, // Basic check
                        batch_id_label: formData.batchId,
                        process: formData.process,
                        roast_date: formData.roastDate,
                        green_weight: formData.greenWeight,
                        roasted_weight: formData.roastedWeight,
                        selected_weight: formData.selectedWeight || formData.roastedWeight,
                        quakers_grams: formData.quakersGrams,
                        roast_curve_json: formData.roastCurve.length > 0 ? formData.roastCurve : null,
                        profile_id: null, // Evitar error de foreign key hasta que el maestro esté listo
                        company_id: user?.companyId
                    }
                ]);

            if (error) throw error;

            setStatus({ type: 'success', message: '¡Lote guardado exitosamente!' });
            setShowResult(true);
        } catch (err: any) {
            console.error("DEBUG ROAST:", err);
            setStatus({
                type: 'error',
                message: `Error de Conexión: ${err.message || 'No se pudo contactar con Supabase'}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showResult) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-in zoom-in duration-500">
                <div className="bg-brand-green/10 border border-brand-green/30 p-10 rounded-industrial text-center">
                    <h2 className="text-3xl font-bold text-brand-green-bright mb-4">Certificación de Tostión AXIS PRO</h2>
                    <p className="text-gray-400 text-sm italic">El lote <span className="text-white font-mono">{formData.batchId}</span> ha sido registrado con un rendimiento neto del {stats.netYield.toFixed(1)}%.</p>
                </div>

                <RoastCurveAnalysis batchId={formData.batchId} />

                <div className="flex justify-center">
                    <button
                        onClick={() => {
                            setShowResult(false);
                            setFormData({
                                ...formData,
                                batchId: 'AX-' + Math.floor(Math.random() * 9000 + 1000),
                                greenWeight: 24.5,
                                roastedWeight: 0,
                                selectedWeight: 0,
                                quakersGrams: 0,
                                roastCurve: []
                            });
                            setStatus(null);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-white px-12 py-5 rounded-industrial-sm font-bold transition-all border border-white/10 uppercase tracking-widest text-xs shadow-2xl"
                    >
                        REGISTRAR OTRO LOTE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('change-view', { detail: 'live' }))}
                className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400 hover:text-white transition-all mb-4"
            >
                <div className="p-2 bg-white/5 rounded-full">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </div>
                Volver a Estrategia AXIS
            </button>
            <div className="text-center mb-10">
                <div className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Etapa 2: Auditoría de Salida</p>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter">Registro de Rendimiento</h2>
                <p className="text-gray-500 text-sm">Ingresa los pesos finales tras selección para auditar la eficiencia del proceso.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {status && (
                    <div className={`p-5 rounded-industrial-sm text-xs font-bold border flex items-center gap-3 ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                        <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-brand-green-bright' : 'bg-brand-red-bright'} animate-pulse`}></div>
                        {status.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-bg-card border border-white/10 p-10 rounded-industrial space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-3 text-[10px] uppercase tracking-[0.4em]">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Identificación de Operación
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Batch Identifier</label>
                                <input
                                    type="text"
                                    value={formData.batchId}
                                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all font-mono text-xl text-white font-bold"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Fecha Tostión</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.roastDate}
                                        onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all text-xs font-bold text-gray-300 scheme-dark"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Proceso de Lote</label>
                                    <select
                                        value={formData.process}
                                        onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all uppercase text-[10px] font-bold appearance-none text-gray-300"
                                    >
                                        <option value="washed">Lavado (Estándar)</option>
                                        <option value="honey">Honey (Semi)</option>
                                        <option value="natural">Natural (Seco)</option>
                                    </select>
                                </div>
                            </div>

                            {/* CURVE IMPORT AREA */}
                            <div className="pt-6 border-t border-white/5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-4">Análisis de Curva (Artisan/Cropster)</label>
                                <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-industrial-sm p-8 transition-all cursor-pointer group ${formData.roastCurve.length > 0 ? 'bg-brand-green/5 border-brand-green/40' : 'bg-white/2 border-white/10 hover:border-brand-green/30 hover:bg-white/5'}`}>
                                    <input
                                        type="file"
                                        accept=".csv,.json,.kcl"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    {formData.roastCurve.length > 0 ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                            </div>
                                            <p className="text-[10px] font-bold text-brand-green-bright uppercase tracking-widest">Firma Espectral Cargada</p>
                                            <p className="text-[8px] text-gray-500 uppercase">{formData.roastCurve.length} puntos detectados</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500 group-hover:text-brand-green transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white">Importar Data Final de Tueste</p>
                                            <p className="text-[8px] text-gray-600 uppercase">Soporta CSV / JSON</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="bg-bg-card border border-white/10 p-10 rounded-industrial space-y-8">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-3 text-[10px] uppercase tracking-[0.4em]">
                            <span className="w-1.5 h-6 bg-cyan-400 rounded-full"></span>
                            Auditoría de Masas
                        </h3>

                        <div className="space-y-6">
                            <NumericInput
                                label="Pesaje 1: Masa Verde (Carga)"
                                value={formData.greenWeight}
                                onChange={(val) => setFormData({ ...formData, greenWeight: val })}
                                step={0.1}
                                unit="KG"
                                required
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-4xl py-6 font-bold"
                            />

                            <div className="grid grid-cols-1 gap-4">
                                <NumericInput
                                    label="Pesaje 2: Masa Tostada (Salida)"
                                    value={formData.roastedWeight}
                                    onChange={(val) => setFormData({ ...formData, roastedWeight: val })}
                                    step={0.1}
                                    unit="KG"
                                    required
                                    disabled={isSubmitting}
                                    variant="industrial"
                                    inputClassName="text-2xl py-4"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <NumericInput
                                        label="Masa Seleccionada"
                                        value={formData.selectedWeight}
                                        onChange={(val) => setFormData({ ...formData, selectedWeight: val })}
                                        step={0.1}
                                        unit="KG"
                                        disabled={isSubmitting}
                                        variant="industrial"
                                        inputClassName="text-xl py-4"
                                    />
                                    <NumericInput
                                        label="Quakers Detectados"
                                        value={formData.quakersGrams}
                                        onChange={(val) => setFormData({ ...formData, quakersGrams: val })}
                                        step={1}
                                        unit="G"
                                        disabled={isSubmitting}
                                        variant="orange"
                                        inputClassName="text-xl py-4"
                                    />
                                </div>
                            </div>

                            {/* Performance Dashboard */}
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-500">Merma de Tostión (Evaporación)</span>
                                    <span className={`text-sm ${stats.roastLoss > 16.5 ? 'text-brand-red-bright' : 'text-brand-green-bright'}`}>{stats.roastLoss.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-500">Merma de Selección (Mantenimiento)</span>
                                    <span className="text-sm text-gray-300">{stats.selectionLoss.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest bg-white/[0.03] p-4 rounded-xl border border-white/10">
                                    <span className="text-white">Rendimiento Neto de Operación</span>
                                    <span className="text-2xl font-black text-brand-green-bright tracking-tighter">{stats.netYield.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || formData.roastedWeight === 0}
                    className="w-full bg-white hover:bg-brand-green-bright text-black hover:text-white font-bold py-6 rounded-industrial-sm transition-all shadow-2xl flex items-center justify-center gap-4 group uppercase tracking-[0.4em] text-xs disabled:opacity-30"
                >
                    {isSubmitting ? 'SINCRONIZANDO AUDITORÍA...' : 'EMITIR Y SELLAR REPORTE DE TOSTIÓN'}
                    <div className="p-1 bg-black/10 rounded group-hover:bg-white/20 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>
            </form>
        </div>
    );
}

