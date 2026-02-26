'use client';

import React, { useState } from 'react';
import CoffeePassport from './CoffeePassport';
import { NumericInput } from '@/shared/components/ui/NumericInput';

export default function GreenExportForm({ user }: { user: { companyId: string } | null }) {
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
    const [showPassport, setShowPassport] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const { supabase } = await import('@/shared/lib/supabase');

            const { error } = await supabase
                .from('green_exports')
                .insert([{
                    lot_id: formData.lotId,
                    moisture_content: formData.moistureContent,
                    stabilization_days: formData.stabilizationDays,
                    destination: formData.destination,
                    transport_type: formData.transportType,
                    export_date: formData.exportDate,
                    company_id: user?.companyId
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {showPassport && (
                <CoffeePassport
                    lotData={{ batch_id: formData.lotId }}
                    onClose={() => setShowPassport(false)}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {status && (
                    <div className={`p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border ${status.type === 'success' ? 'bg-brand-green/5 border-brand-green/20 text-brand-green-bright' : 'bg-brand-red/5 border-brand-red/20 text-brand-red-bright'}`}>
                        <div className="font-bold uppercase text-[10px] tracking-widest">{status.message}</div>
                        {status.type === 'success' && (
                            <button
                                type="button"
                                onClick={() => setShowPassport(true)}
                                className="bg-brand-green text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-green-bright transition-all"
                            >
                                Ver Pasaporte Digital
                            </button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="bg-bg-card border border-white/5 p-8 rounded-3xl">
                        <h3 className="text-brand-green-bright text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="w-1 h-4 bg-brand-green rounded-full"></span>
                            Control de Calidad (Verde)
                        </h3>

                        <div className="space-y-4">
                            <NumericInput
                                label="Humedad (%)"
                                value={formData.moistureContent}
                                onChange={(val) => setFormData({ ...formData, moistureContent: val })}
                                step={0.1}
                                unit="%"
                                disabled={isSubmitting}
                                variant={formData.moistureContent > 12 ? 'red' : 'industrial'}
                                inputClassName="text-sm py-3"
                            />

                            <NumericInput
                                label="Días de Estabilización (Reposo)"
                                value={formData.stabilizationDays}
                                onChange={(val) => setFormData({ ...formData, stabilizationDays: val })}
                                step={1}
                                unit="D"
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-sm py-3"
                            />

                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Fecha de Exportación</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.exportDate}
                                    onChange={(e) => setFormData({ ...formData, exportDate: e.target.value })}
                                    className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all text-sm font-bold"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-bg-card border border-white/5 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-[80px] rounded-full"></div>
                        <div>
                            <h3 className="text-brand-green-bright text-[10px] font-bold uppercase tracking-widest mb-6">Predicción de Exportación</h3>

                            <div className="p-6 rounded-2xl bg-bg-main border border-white/5 space-y-4">
                                <div>
                                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Status de Estabilidad</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${formData.moistureContent > 12 ? 'bg-brand-red animate-pulse' : 'bg-brand-green-bright shadow-[0_0_8px_rgba(0,255,136,0.3)]'}`}></div>
                                        <span className="text-xl font-bold uppercase tracking-tighter">{formData.moistureContent > 12 ? 'Riesgo Crítico' : 'Estabilizado'}</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed tracking-wider">
                                    {formData.moistureContent > 12
                                        ? 'ALERTA: Humedad por encima del estándar exportable (12.5%). Riesgo de actividad enzimática.'
                                        : 'Apto para tránsito internacional prolongado. El CO2 se mantendrá en niveles seguros.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <div className="flex-1 p-3 bg-white/2 rounded-xl border border-white/5 text-center">
                                <p className="text-[8px] text-gray-600 uppercase font-bold">Transporte</p>
                                <p className="text-[10px] text-white font-bold uppercase">{formData.transportType}</p>
                            </div>
                            <div className="flex-1 p-3 bg-white/2 rounded-xl border border-white/5 text-center">
                                <p className="text-[8px] text-gray-600 uppercase font-bold">Certificado</p>
                                <p className="text-[10px] text-brand-green font-bold uppercase">Axis A-1</p>
                            </div>
                        </div>
                    </section>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-3 group disabled:opacity-50 text-[10px] uppercase tracking-widest"
                >
                    {isSubmitting ? 'GENERANDO EN LA NUBE...' : 'EJECUTAR Y GENERAR PASAPORTE DE EXPORTACIÓN'}
                    {!isSubmitting && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
