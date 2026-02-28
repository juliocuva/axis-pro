'use client';

import React, { useState, useEffect } from 'react';
import { ProcessType } from '@/shared/types';
import RoastCurveAnalysis from './RoastCurveAnalysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';

export default function RoastEntryForm({ user }: { user: { companyId: string } | null }) {
    const [formData, setFormData] = useState({
        batchId: 'AX-' + Math.floor(Math.random() * 9000 + 1000),
        process: 'washed' as ProcessType,
        greenWeight: 24.5,
        roastedWeight: 0,
        selectedWeight: 0,
        quakersGrams: 0,
        profileId: 'SUPREMO-DXB-01',
        developmentPct: 18.5,
        roastDate: new Date().toISOString().split('T')[0],
        roastCurve: [] as any[]
    });

    const [stats, setStats] = useState({
        roastLoss: 0,
        selectionLoss: 0,
        netYield: 0,
        quakerPct: 0
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showResult, setShowResult] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const nextStep = () => setCurrentStep(p => (Math.min(p + 1, 2) as 1 | 2));
    const prevStep = () => setCurrentStep(p => (Math.max(p - 1, 1) as 1 | 2));

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
                const isTab = text.includes('\t');
                const delimiter = isTab ? '\t' : ',';
                const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                const isFahrenheit = lines[0].includes('Unit:F');

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

                    const gasVal = parseFloat(cols[5]) || 0;

                    const timeParts = timeStr.split(':').map(Number);
                    let totalSecs = 0;
                    if (timeParts.length === 3) {
                        totalSecs = (timeParts[0] * 3600) + (timeParts[1] * 60) + timeParts[2];
                    } else if (timeParts.length === 2) {
                        totalSecs = (timeParts[0] * 60) + timeParts[1];
                    }

                    let ror = 0;
                    if (lastTime !== -1 && totalSecs > lastTime) {
                        const timeDiffMin = (totalSecs - lastTime) / 60;
                        ror = (bt - lastBT) / timeDiffMin;
                    }

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
                        inventory_id: formData.profileId === 'SUPREMO-DXB-01' ? null : formData.profileId,
                        batch_id_label: formData.batchId,
                        process: formData.process,
                        roast_date: formData.roastDate,
                        green_weight: formData.greenWeight,
                        roasted_weight: formData.roastedWeight,
                        selected_weight: formData.selectedWeight || formData.roastedWeight,
                        quakers_grams: formData.quakersGrams,
                        roast_curve_json: formData.roastCurve.length > 0 ? formData.roastCurve : null,
                        profile_id: null,
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
                    <p className="text-gray-400 text-sm italic">El lote <span className="text-white font-mono">{formData.batchId}</span> ha sido auditado con un rendimiento neto del {stats.netYield.toFixed(1)}%.</p>
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
                            setCurrentStep(1);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-white px-12 py-5 rounded-industrial-sm font-bold transition-all border border-white/10 uppercase tracking-widest text-xs shadow-2xl"
                    >
                        AUDITAR OTRO LOTE
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
                <div className="inline-block px-3 py-1 bg-brand-green/10 border border-brand-green/20 rounded-full mb-4">
                    <p className="text-[10px] text-brand-green-bright font-bold uppercase tracking-widest">Auditoría Post-Tostión AXIS AI</p>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter">Inteligencia y Rendimiento</h2>
                <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                    AXIS COFFEE PRO no realiza la tostión. Esta herramienta procesa, audita y certifica su trabajo manual en máquina, integrando logs de Artisan/Cropster para calcular rendimiento real y predecir desgasificación.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative">
                {status && (
                    <div className={`p-5 rounded-industrial-sm text-xs font-bold border flex items-center gap-3 ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                        <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-brand-green-bright' : 'bg-brand-red-bright'} animate-pulse`}></div>
                        {status.message}
                    </div>
                )}

                {/* Stepper Wizard Header */}
                <div className="flex justify-between items-center mb-8 relative px-4 max-w-xl mx-auto">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] h-0.5 bg-white/5 z-0 mx-4">
                        <div className="h-full bg-brand-green/50 transition-all duration-500" style={{ width: `${(currentStep - 1) * 100}%` }}></div>
                    </div>

                    <button type="button" onClick={() => setCurrentStep(1)} className="relative z-10 flex flex-col items-center gap-2 group">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${currentStep >= 1 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}`}>1</div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${currentStep === 1 ? 'text-brand-green-bright' : (currentStep > 1 ? 'text-brand-green/70' : 'text-gray-500')}`}>Firma Espectral</span>
                    </button>
                    <button type="button" onClick={() => setCurrentStep(2)} className="relative z-10 flex flex-col items-center gap-2 group">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-bg-main border-2 transition-all duration-500 ${currentStep >= 2 ? 'border-brand-green shadow-[0_0_20px_rgba(0,255,136,0.5)] text-brand-green' : 'border-white/20 text-gray-600'}`}>2</div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest bg-bg-main px-3 transition-colors ${currentStep === 2 ? 'text-brand-green-bright' : 'text-gray-500'}`}>Auditoría de Masas</span>
                    </button>
                </div>

                <fieldset disabled={isSubmitting} className="border-none p-0 m-0 min-h-[400px] relative transition-all">
                    {currentStep === 1 && (
                        <section className="bg-bg-card border border-white/10 p-10 rounded-industrial space-y-8 relative overflow-hidden animate-in slide-in-from-right-4 duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                            <h3 className="text-brand-green-bright font-bold flex items-center gap-3 text-[10px] uppercase tracking-[0.4em]">
                                <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                                Identidad y Datos de Tostión
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">Identificador del Bache (Batch ID)</label>
                                    <input
                                        type="text"
                                        value={formData.batchId}
                                        onChange={(e) => setFormData({ ...formData, batchId: e.target.value.toUpperCase() })}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all font-mono text-xl text-white font-bold"
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-2">Corresponde al código de bache programado o físico.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Fecha Tostión</label>
                                        <div className="relative group/date">
                                            <input
                                                type="date"
                                                required
                                                value={formData.roastDate}
                                                onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all text-sm font-bold text-brand-green-bright scheme-dark pr-12 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-green-bright group-focus-within/date:opacity-100 opacity-60 transition-opacity">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Proceso de Lote</label>
                                        <select
                                            value={formData.process}
                                            onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 focus:border-brand-green outline-none transition-all uppercase text-[12px] font-bold appearance-none text-gray-300 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                        >
                                            <option value="washed">Lavado (Estándar)</option>
                                            <option value="honey">Honey (Semi)</option>
                                            <option value="natural">Natural (Seco)</option>
                                            <option value="anaerobico">Anaeróbico Especial</option>
                                        </select>
                                    </div>
                                </div>

                                {/* CURVE IMPORT AREA */}
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Análisis de Curva (Integración)</label>
                                    <p className="text-xs text-gray-400">AXIS procesa archivos .csv o .json exportados desde su software (Artisan / Cropster) para generar la huella espectral y el registro.</p>

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
                                                <div className="mt-2 text-[10px] text-brand-green underline cursor-pointer">Reemplazar archivo</div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500 group-hover:text-brand-green transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white">Importar Data Final de Tueste</p>
                                                <p className="text-[8px] text-gray-600 uppercase">Soporta CSV / JSON</p>
                                                <span className="mt-2 px-4 py-2 bg-white/5 border border-white/10 text-[9px] font-bold rounded-sm text-gray-300 uppercase tracking-widest group-hover:bg-white/10 transition-colors">Explorar Archivos</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </section>
                    )}

                    {currentStep === 2 && (
                        <section className="bg-bg-card border border-white/10 p-10 rounded-industrial space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <h3 className="text-cyan-400 font-bold flex items-center gap-3 text-[10px] uppercase tracking-[0.4em]">
                                <span className="w-1.5 h-6 bg-cyan-400 rounded-full"></span>
                                Auditoría Cíclica de Masas
                            </h3>

                            <p className="text-xs text-gray-400 mb-6">Registre las mermas reales post-tostión para que AXIS calcule su rendimiento final y detecte inconsistencias operativas.</p>

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
                                    inputClassName="text-3xl py-5 font-bold"
                                />

                                <div className="grid grid-cols-1 gap-4">
                                    <NumericInput
                                        label="Pesaje 2: Masa Tostada (Salida Básica)"
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
                                            label="Masa Seleccionada Limpia"
                                            value={formData.selectedWeight}
                                            onChange={(val) => setFormData({ ...formData, selectedWeight: val })}
                                            step={0.1}
                                            unit="KG"
                                            disabled={isSubmitting}
                                            variant="industrial"
                                            inputClassName="text-xl py-4"
                                        />
                                        <NumericInput
                                            label="Quakers Detectados / Defectos"
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
                    )}
                </fieldset>

                {/* Navigational Buttons */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-20">
                    {currentStep > 1 ? (
                        <button type="button" onClick={prevStep} disabled={isSubmitting} className="px-6 py-3 border border-white/10 text-white rounded-industrial-sm font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors disabled:opacity-50">
                            &larr; Volver Atrás
                        </button>
                    ) : <div></div>}

                    {currentStep < 2 ? (
                        <button type="button" onClick={nextStep} className="px-10 py-4 bg-brand-green/10 text-brand-green-bright border border-brand-green/30 rounded-industrial-sm font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-brand-green hover:text-black transition-colors shadow-[0_0_15px_rgba(0,255,136,0.1)]">
                            Siguiente Paso &rarr;
                        </button>
                    ) : (
                        <div className="flex-1 ml-4 animate-in fade-in zoom-in-95 duration-500">
                            <button
                                type="submit"
                                disabled={isSubmitting || formData.roastedWeight === 0}
                                className="w-full bg-white hover:bg-brand-green-bright text-black hover:text-white font-bold py-5 rounded-industrial-sm transition-all shadow-2xl flex items-center justify-center gap-4 group uppercase tracking-[0.4em] text-xs disabled:opacity-30"
                            >
                                {isSubmitting ? 'SINCRONIZANDO AUDITORÍA...' : 'EMITIR Y SELLAR REPORTE DE TOSTIÓN'}
                                {!isSubmitting && (
                                    <div className="p-1 bg-black/10 rounded group-hover:bg-white/20 transition-colors">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="group-hover:translate-x-1 transition-transform">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
