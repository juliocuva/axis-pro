'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { submitPhysicalAnalysis } from '../../actions/analysis';
import { NumericInput } from '@/shared/components/ui/NumericInput';

interface PhysicalAnalysisFormProps {
    inventoryId: string;
    lotDestination?: 'internal' | 'export_green' | 'export_roasted';
    onAnalysisComplete: () => void;
    user: { companyId: string } | null;
}

export default function PhysicalAnalysisForm({ inventoryId, lotDestination = 'internal', onAnalysisComplete, user }: PhysicalAnalysisFormProps) {
    const [formData, setFormData] = useState({
        moisture: 11.5,
        waterActivity: 0.58,
        density: 720,
        screenSize: {
            size18: 20,
            size17: 45,
            size16: 25,
            size15: 10,
            size14: 0,
            size13: 0,
            size12: 0,
            under12: 0
        },
        defects: {
            primary: 0.0,
            secondary: 0.0
        },
        grainColor: 'VERDE OLIVA'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!inventoryId) return;
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('physical_analysis')
                    .select('*')
                    .eq('inventory_id', inventoryId.trim())
                    .eq('company_id', user?.companyId)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) {
                    console.error("AXIS DB ERROR (Physical):", error);
                    setError("Error al cargar datos de laboratorio.");
                } else if (data && data.length > 0) {
                    const record = data[0];
                    setFormData({
                        moisture: Number(record.moisture_pct) || 0,
                        waterActivity: Number(record.water_activity) || 0,
                        density: Number(record.density_gl) || 0,
                        screenSize: record.screen_size_distribution || {
                            size18: 0,
                            size17: 0,
                            size16: 0,
                            size15: 0,
                            size14: 0,
                            size13: 0,
                            size12: 0,
                            under12: 0
                        },
                        defects: record.defects_count || {
                            primary: 0.0,
                            secondary: 0.0
                        },
                        grainColor: record.grain_color || 'VERDE OLIVA'
                    });
                }
            } catch (err) {
                console.error("AXIS CRITICAL ERROR (Physical):", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [inventoryId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitPhysicalAnalysis(inventoryId, formData, user?.companyId || '');

            if (!result.success) {
                throw new Error(result.message);
            }

            onAnalysisComplete();
        } catch (err: any) {
            console.error("Error en análisis físico:", err);
            setError(err.message || "Fallo en la conexión con AXIS Cloud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-8 animate-in fade-in duration-500 relative min-h-[400px]">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-industrial">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 animate-pulse">Consultando AXIS Laboratorio...</p>
                    </div>
                </div>
            )}
            <header className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Análisis Físico de Laboratorio</h3>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Evaluación de Muestra de Oro</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
            </header>

            {error && (
                <div className="bg-brand-red/10 border border-brand-red/20 p-4 rounded-industrial-sm text-brand-red-bright text-[10px] font-bold uppercase tracking-widest">
                    ⚠️ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
                    <div className="md:col-span-2">
                        <NumericInput
                            label={`Humedad (%) ${lotDestination.startsWith('export') ? '[NORMA]' : ''}`}
                            value={formData.moisture}
                            onChange={(val) => setFormData({ ...formData, moisture: val })}
                            step={0.01}
                            variant={lotDestination.startsWith('export')
                                ? (formData.moisture > 12 || formData.moisture < 10 ? 'red' : 'blue')
                                : (formData.moisture > 13 || formData.moisture < 9 ? 'red' : 'industrial')
                            }
                            inputClassName="text-xl py-4"
                            unit="%"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <NumericInput
                            label="Agua ($a_w$)"
                            value={formData.waterActivity}
                            onChange={(val) => setFormData({ ...formData, waterActivity: val })}
                            step={0.001}
                            variant="blue"
                            inputClassName="text-xl py-4"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <NumericInput
                            label="Densidad (g/L)"
                            value={formData.density}
                            onChange={(val) => setFormData({ ...formData, density: val })}
                            step={1}
                            variant="industrial"
                            inputClassName="text-xl py-4"
                            unit="g/L"
                        />
                    </div>

                    <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block">Color del Grano</label>
                        <div className="relative group/select">
                            <select
                                value={formData.grainColor}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 pr-14 py-4 text-sm font-bold text-white outline-none focus:border-brand-green uppercase appearance-none transition-all"
                                onChange={(e) => setFormData({ ...formData, grainColor: e.target.value })}
                            >
                                <option value="VERDE OLIVA">Verde Oliva (Estándar)</option>
                                <option value="VERDE AZULADO">Verde Azulado (Fresco)</option>
                                <option value="VERDE PALIDO">Verde Pálido / Blanqueado</option>
                                <option value="AMARILLENTO">Amarillento (Envejecido)</option>
                                <option value="MARRON">Marrón (Sobresecado / Dañado)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-brand-green transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase font-medium opacity-70">Descriptor Visual SCA</p>
                    </div>
                </div>

                <section className="py-4 px-4 md:px-12 rounded-industrial space-y-4 border-y border-white/5 mt-4">
                    <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-4">GRANULOMETRÍA (SIEVE ANALYSIS)</h4>
                    <div className="space-y-4 md:w-4/5 mx-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[18, 17, 16, 15].map(size => (
                                <NumericInput
                                    key={size}
                                    label={`Malla ${size}`}
                                    value={(formData.screenSize as any)[`size${size}`]}
                                    onChange={(val) => setFormData({
                                        ...formData,
                                        screenSize: { ...formData.screenSize, [`size${size}`]: val }
                                    })}
                                    step={0.1}
                                    variant="default"
                                    inputClassName="text-base py-2"
                                    unit="%"
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[14, 13, 12].map(size => (
                                <NumericInput
                                    key={size}
                                    label={`Malla ${size}`}
                                    value={(formData.screenSize as any)[`size${size}`]}
                                    onChange={(val) => setFormData({
                                        ...formData,
                                        screenSize: { ...formData.screenSize, [`size${size}`]: val }
                                    })}
                                    step={0.1}
                                    variant="default"
                                    inputClassName="text-base py-2"
                                    unit="%"
                                />
                            ))}
                            <NumericInput
                                label="Fondo (-12)"
                                value={formData.screenSize.under12}
                                onChange={(val) => setFormData({
                                    ...formData,
                                    screenSize: { ...formData.screenSize, under12: val }
                                })}
                                step={0.1}
                                variant="default"
                                inputClassName="text-base py-2"
                                unit="%"
                            />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <NumericInput
                            label="Defectos Primarios (%)"
                            value={formData.defects.primary}
                            onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, primary: val } })}
                            step={0.01}
                            variant="red"
                            inputClassName="text-3xl font-bold py-4 !text-white"
                            unit="%"
                            className="bg-brand-red/5 p-6 rounded-industrial border border-brand-red/10"
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-medium leading-relaxed px-2">
                            Granos negros, agrios, cereza seca, materia extraña (piedras/palos), daños por hongos.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <NumericInput
                            label="Defectos Secundarios (%)"
                            value={formData.defects.secondary}
                            onChange={(val) => setFormData({ ...formData, defects: { ...formData.defects, secondary: val } })}
                            step={0.01}
                            variant="orange"
                            inputClassName="text-3xl font-bold py-4 !text-white"
                            unit="%"
                            className="bg-orange-500/5 p-6 rounded-industrial border border-orange-500/10"
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-medium leading-relaxed px-2">
                            Granos picados, quebrados, inmaduros, aplastados, conchas, flotadores, pergamino.
                        </p>
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-industrial-sm transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs"
                >
                    {isSubmitting ? 'SINCRONIZANDO LABORATORIO...' : 'GUARDAR ANÁLISIS FÍSICO Y CONTINUAR A CATACIÓN'}
                </button>
            </form>
        </div>
    );
}
