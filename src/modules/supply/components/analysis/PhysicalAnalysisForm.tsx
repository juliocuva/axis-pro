'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { submitPhysicalAnalysis } from '../../actions/analysis';

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
            size15: 10
        },
        defects: {
            primary: 0,
            secondary: 0
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
                            size15: 0
                        },
                        defects: record.defects_count || {
                            primary: 0,
                            secondary: 0
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                            Humedad (%) {lotDestination.startsWith('export') && <span className="text-blue-400 font-black ml-1">[NORMA EXPORT]</span>}
                        </label>
                        <div className="relative">
                            <input
                                type="number" step="0.01" value={formData.moisture}
                                className={`w-full bg-bg-main border rounded-industrial-sm px-5 py-4 text-2xl font-bold outline-none transition-all pr-20 ${lotDestination.startsWith('export')
                                    ? (formData.moisture > 12 || formData.moisture < 10 ? 'border-brand-red/50 text-brand-red' : 'border-blue-500/50 text-blue-400 focus:border-blue-400')
                                    : (formData.moisture > 13 || formData.moisture < 9 ? 'border-brand-red/50 text-brand-red' : 'border-white/10 text-white focus:border-brand-green')
                                    }`}
                                onChange={(e) => setFormData({ ...formData, moisture: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="absolute right-8 top-5 text-gray-600 font-mono font-bold opacity-60">%</span>
                        </div>
                        <p className={`text-[9px] uppercase font-bold transition-colors ${lotDestination.startsWith('export')
                            ? (formData.moisture > 12 || formData.moisture < 10 ? 'text-brand-red' : 'text-blue-400 opacity-70')
                            : (formData.moisture > 13 || formData.moisture < 9 ? 'text-brand-red' : 'text-gray-500 opacity-70')
                            }`}>
                            {lotDestination.startsWith('export')
                                ? (formData.moisture > 12 || formData.moisture < 10 ? '⚠️ No cumple estándar exportación (10-12%)' : 'Rango Exportación: 10.0% - 12.0%')
                                : (formData.moisture > 13 || formData.moisture < 9 ? '⚠️ No apto para proceso industrial' : 'Rango: 9.0% - 13.0%')
                            }
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Actividad de Agua ($a_w$)</label>
                        <input
                            type="number" step="0.001" value={formData.waterActivity}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 text-2xl font-bold outline-none focus:border-blue-500"
                            onChange={(e) => setFormData({ ...formData, waterActivity: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70">Límite seguridad: &lt; 0.60 $a_w$</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Densidad (g/L)</label>
                        <input
                            type="number" value={formData.density}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 text-2xl font-bold outline-none focus:border-brand-green"
                            onChange={(e) => setFormData({ ...formData, density: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70">Promedio: 680 - 740 g/L</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Color del Grano</label>
                        <select
                            value={formData.grainColor}
                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 text-xs font-bold text-white outline-none focus:border-brand-green uppercase"
                            onChange={(e) => setFormData({ ...formData, grainColor: e.target.value })}
                        >
                            <option value="VERDE OLIVA">Verde Oliva (Estándar)</option>
                            <option value="VERDE AZULADO">Verde Azulado (Fresco)</option>
                            <option value="VERDE PALIDO">Verde Pálido / Blanqueado</option>
                            <option value="AMARILLENTO">Amarillento (Envejecido)</option>
                            <option value="MARRON">Marrón (Sobresecado / Dañado)</option>
                        </select>
                        <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70">Descriptor Visual SCA</p>
                    </div>
                </div>

                <section className="bg-bg-main/50 p-6 rounded-industrial space-y-8 border border-white/5">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Distribución de Mallas (Screen Analysis)</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[18, 17, 16, 15].map(size => (
                            <div key={size} className="space-y-2">
                                <label className="text-[10px] text-gray-600 uppercase font-mono">Malla {size}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(formData.screenSize as any)[`size${size}`]}
                                        className="w-full bg-bg-card border border-white/10 rounded-industrial-sm px-3 py-2 text-sm font-bold outline-none focus:border-brand-green pr-10"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            screenSize: { ...formData.screenSize, [`size${size}`]: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                    <span className="absolute right-4 top-2.5 text-[10px] text-gray-500 opacity-60">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-brand-red/5 p-6 rounded-industrial border border-brand-red/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-bold text-brand-red-bright uppercase tracking-widest">Defectos Primarios</h4>
                            <span className="text-[8px] bg-brand-red/20 text-brand-red-bright px-2 py-0.5 rounded font-bold">MUESTRA 350G</span>
                        </div>
                        <input
                            type="number"
                            value={formData.defects.primary}
                            className="w-full bg-bg-main border border-brand-red/20 rounded-industrial-sm px-5 py-4 text-2xl font-bold text-brand-red-bright outline-none"
                            onChange={(e) => setFormData({ ...formData, defects: { ...formData.defects, primary: parseInt(e.target.value) || 0 } })}
                        />
                        <p className="text-[9px] text-gray-600 uppercase font-bold">Grano Negro, Agrio, Hongo, Materia Extraña.</p>
                    </div>

                    <div className="bg-orange-500/5 p-6 rounded-industrial border border-orange-500/10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Defectos Secundarios</h4>
                            <span className="text-[8px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold">MUESTRA 350G</span>
                        </div>
                        <input
                            type="number"
                            value={formData.defects.secondary}
                            className="w-full bg-bg-main border border-orange-500/20 rounded-industrial-sm px-5 py-4 text-2xl font-bold text-orange-400 outline-none"
                            onChange={(e) => setFormData({ ...formData, defects: { ...formData.defects, secondary: parseInt(e.target.value) || 0 } })}
                        />
                        <p className="text-[9px] text-gray-600 uppercase font-bold">Quebrados, Inmaduros, Conchas, Mordidos por broca.</p>
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
