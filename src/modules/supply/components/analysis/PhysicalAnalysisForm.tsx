'use client';

import React, { useState } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface PhysicalAnalysisFormProps {
    inventoryId: string;
    onAnalysisComplete: () => void;
}

export default function PhysicalAnalysisForm({ inventoryId, onAnalysisComplete }: PhysicalAnalysisFormProps) {
    const [formData, setFormData] = useState({
        moisture: 11.5,
        waterActivity: 0.58,
        density: 720,
        screenSize: {
            size18: 20,
            size17: 45,
            size16: 25,
            size15: 10
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('physical_analysis')
                .insert([{
                    inventory_id: inventoryId,
                    moisture_pct: formData.moisture,
                    water_activity: formData.waterActivity,
                    density_gl: formData.density,
                    screen_size_distribution: formData.screenSize,
                    company_id: '99999999-9999-9999-9999-999999999999'
                }]);

            if (error) throw error;
            onAnalysisComplete();
        } catch (err) {
            console.error("Error en análisis físico:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-bg-card border border-white/5 p-8 rounded-3xl space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight">Análisis Físico de Laboratorio</h3>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Evaluación de Muestra de Oro</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Humedad (%)</label>
                        <div className="relative">
                            <input
                                type="number" step="0.01" value={formData.moisture}
                                className={`w-full bg-bg-main border rounded-2xl px-5 py-4 text-2xl font-bold outline-none transition-all ${formData.moisture > 12.5 || formData.moisture < 10 ? 'border-brand-red/50 text-brand-red' : 'border-white/10 text-white focus:border-brand-green'}`}
                                onChange={(e) => setFormData({ ...formData, moisture: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="absolute right-5 top-5 text-gray-600 font-mono font-bold">%</span>
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70">Ideal: 10.0% - 12.0%</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Actividad de Agua ($a_w$)</label>
                        <input
                            type="number" step="0.001" value={formData.waterActivity}
                            className="w-full bg-bg-main border border-white/10 rounded-2xl px-5 py-4 text-2xl font-bold outline-none focus:border-blue-500"
                            onChange={(e) => setFormData({ ...formData, waterActivity: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70">Límite seguridad: &lt; 0.60 $a_w$</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Densidad (g/L)</label>
                        <input
                            type="number" value={formData.density}
                            className="w-full bg-bg-main border border-white/10 rounded-2xl px-5 py-4 text-2xl font-bold outline-none focus:border-brand-green"
                            onChange={(e) => setFormData({ ...formData, density: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70">Promedio: 680 - 740 g/L</p>
                    </div>
                </div>

                <section className="bg-bg-main/50 p-6 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Distribución de Mallas (Screen Analysis)</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[18, 17, 16, 15].map(size => (
                            <div key={size} className="space-y-2">
                                <label className="text-[10px] text-gray-600 uppercase font-mono">Malla {size}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(formData.screenSize as any)[`size${size}`]}
                                        className="w-full bg-bg-card border border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-brand-green"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            screenSize: { ...formData.screenSize, [`size${size}`]: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                    <span className="absolute right-3 top-2.5 text-[10px] text-gray-700">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs"
                >
                    {isSubmitting ? 'SINCRONIZANDO LABORATORIO...' : 'GUARDAR ANÁLISIS FÍSICO Y CONTINUAR A CATACIÓN'}
                </button>
            </form>
        </div>
    );
}
