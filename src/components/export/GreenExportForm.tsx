'use client';

import React, { useState } from 'react';

export default function GreenExportForm() {
    const [formData, setFormData] = useState({
        lotId: 'LOT-' + Math.floor(Math.random() * 9000 + 1000),
        moistureContent: 11.5,
        stabilizationDays: 15,
        destination: 'DXB - Dubai',
        transportType: 'air' as 'air' | 'sea',
        exportDate: new Date().toISOString().split('T')[0]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const { supabase } = await import('@/lib/supabase');

            const { error } = await supabase
                .from('green_exports')
                .insert([{
                    lot_id: formData.lotId,
                    moisture_content: formData.moistureContent,
                    stabilization_days: formData.stabilizationDays,
                    destination: formData.destination,
                    transport_type: formData.transportType,
                    export_date: formData.exportDate,
                    company_id: '99999999-9999-9999-9999-999999999999' // ID Temporal
                }]);

            if (error) throw error;
            setStatus({ type: 'success', message: '¡Manifiesto de exportación guardado en la nube!' });
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', message: 'Error al conectar con Supabase.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {status && (
                <div className={`p-4 rounded-xl text-sm font-bold border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                    {status.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-bg-card border border-white/5 p-8 rounded-3xl">
                    <h3 className="text-brand-green-bright font-bold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                        Control de Calidad (Verde)
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Humedad (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.moistureContent}
                                onChange={(e) => setFormData({ ...formData, moistureContent: parseFloat(e.target.value) })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Días de Estabilización (Reposo)</label>
                            <input
                                type="number"
                                value={formData.stabilizationDays}
                                onChange={(e) => setFormData({ ...formData, stabilizationDays: parseInt(e.target.value) })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Exportación</label>
                            <input
                                type="date"
                                required
                                value={formData.exportDate}
                                onChange={(e) => setFormData({ ...formData, exportDate: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-bg-card border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                    <h3 className="text-brand-green-bright font-bold mb-6">Predicción de Exportación</h3>

                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-bg-main border border-white/5">
                            <span className="text-[10px] text-gray-500 uppercase font-mono">Status de Estabilidad</span>
                            <div className="flex items-center gap-3 mt-1">
                                <div className={`w-3 h-3 rounded-full ${formData.moistureContent > 12 ? 'bg-brand-red animate-pulse' : 'bg-brand-green-bright'}`}></div>
                                <span className="text-xl font-bold uppercase">{formData.moistureContent > 12 ? 'Riesgo Crítico' : 'Estabilizado'}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">
                                {formData.moistureContent > 12
                                    ? 'ALERTA: Humedad por encima del estándar exportable (12.5%). Riesgo de actividad enzimática.'
                                    : 'Apto para tránsito internacional prolongado.'}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
                {isSubmitting ? 'GENERANDO EN LA NUBE...' : 'GENERAR MANIFIESTO DE EXPORTACIÓN'}
                {!isSubmitting && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                        <path d="M12 2l3.5 3.5L12 9M19 12l-14 0" stroke="white" strokeWidth="2.5" />
                    </svg>
                )}
            </button>
        </form>
    );
}
