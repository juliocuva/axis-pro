'use client';

import React, { useState, useEffect } from 'react';
import CoffeePassport from './CoffeePassport';
import { NumericInput } from '@/shared/components/ui/NumericInput';

export default function GreenExportForm({ user }: { user: { companyId: string } | null }) {
    const [availableLots, setAvailableLots] = useState<any[]>([]);
    const [selectedLotId, setSelectedLotId] = useState<string>('');
    const [isLoadingLots, setIsLoadingLots] = useState(true);

    const [formData, setFormData] = useState({
        moistureContent: 11.5,
        targetMarket: 'europa' as 'europa' | 'usa' | 'asia' | 'otros',
        destinationCity: 'Rotterdam',
        transportType: 'sea' as 'air' | 'sea',
        exportDate: new Date().toISOString().split('T')[0]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showPassport, setShowPassport] = useState(false);

    useEffect(() => {
        const fetchReadyLots = async () => {
            if (!user?.companyId) return;
            setIsLoadingLots(true);
            const { supabase } = await import('@/shared/lib/supabase');

            let { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .eq('company_id', user.companyId)
                .order('created_at', { ascending: false })
                .limit(30);

            if (!data || data.length === 0) {
                const fallback = await supabase
                    .from('coffee_purchase_inventory')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(30);
                data = fallback.data;
            }

            if (data) {
                // Lots ready for export: Thrashed, Completed, or Excelso
                const readyLots = data.filter(r =>
                    r.status === 'thrashed' ||
                    r.status === 'completed' ||
                    r.coffee_type === 'excelso'
                );
                setAvailableLots(readyLots);
                if (readyLots.length > 0) {
                    setSelectedLotId(readyLots[0].id);
                }
            }
            setIsLoadingLots(false);
        };
        fetchReadyLots();
    }, [user?.companyId]);

    const selectedLot = availableLots.find(l => l.id === selectedLotId);

    // EUDR Validation Logic
    const isEudrNonCompliant = () => {
        if (!selectedLot) return false;
        if (formData.targetMarket !== 'europa') return false;

        const size = selectedLot.farm_size_hectares || 0;
        const eudrPolygon = selectedLot.process_data?.eudr_polygon;
        // Límite EUDR es 4 hectáreas para polígono obligatorio
        if (size > 4 && !eudrPolygon) {
            return true;
        }
        return false;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEudrNonCompliant()) {
            setStatus({ type: 'error', message: 'ERROR EUDR: Lote > 4ha sin georeferenciación poligonal.' });
            return;
        }

        setIsSubmitting(true);
        setStatus(null);

        try {
            const { supabase } = await import('@/shared/lib/supabase');

            const { error } = await supabase
                .from('green_exports')
                .insert([{
                    lot_id: selectedLot?.lot_number || 'LOT-CUSTOM',
                    moisture_content: formData.moistureContent,
                    destination: formData.destinationCity,
                    transport_type: formData.transportType,
                    export_date: formData.exportDate,
                    company_id: user?.companyId,
                    stabilization_days: 0
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
            {showPassport && selectedLot && (
                <CoffeePassport
                    lotData={{ batch_id: selectedLot.lot_number, targetMarket: formData.targetMarket, moisture: formData.moistureContent, destinationCity: formData.destinationCity }}
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
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Lote a Exportar</label>
                                <select
                                    className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all text-sm font-bold uppercase"
                                    value={selectedLotId}
                                    onChange={(e) => setSelectedLotId(e.target.value)}
                                    disabled={isLoadingLots}
                                >
                                    {isLoadingLots ? (
                                        <option>Cargando lotes disponibles...</option>
                                    ) : availableLots.length === 0 ? (
                                        <option>No hay lotes listos para exportar</option>
                                    ) : (
                                        availableLots.map(lot => (
                                            <option key={lot.id} value={lot.id}>
                                                {lot.lot_number} - {lot.farmer_name} ({lot.coffee_type === 'excelso' ? 'EXCELSO' : 'TRILLADO'})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Mercado Destino (Continente)</label>
                                <select
                                    className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all text-sm font-bold uppercase"
                                    value={formData.targetMarket}
                                    onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value as any })}
                                >
                                    <option value="europa">Europa (UE)</option>
                                    <option value="usa">Estados Unidos / Norteamérica</option>
                                    <option value="asia">Asia / Medio Oriente</option>
                                    <option value="otros">Otros Mercados</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Puerto / Ciudad Destino</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.destinationCity}
                                    onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                                    className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none transition-all text-sm font-bold uppercase"
                                    placeholder="Ej: ROTTERDAM"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <NumericInput
                                label="Humedad Final de Embarque (%)"
                                value={formData.moistureContent}
                                onChange={(val) => setFormData({ ...formData, moistureContent: val })}
                                step={0.1}
                                unit="%"
                                disabled={isSubmitting}
                                variant={formData.moistureContent > 12.5 ? 'red' : 'industrial'}
                                inputClassName="text-sm py-3"
                            />

                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Fecha Programada de Exportación</label>
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

                    <section className="bg-bg-card border border-white/5 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-start">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-[80px] rounded-full"></div>
                        <div>
                            <h3 className="text-brand-green-bright text-[10px] font-bold uppercase tracking-widest mb-6 border-b border-brand-green/20 pb-2">Asistente Aduanero Inmutable</h3>

                            {formData.targetMarket === 'europa' && (
                                <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-3 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                                            </div>
                                            <span className="text-sm font-bold text-orange-400 uppercase tracking-tighter">ALERTA LEGAL: EUROPA (EUDR)</span>
                                        </div>
                                        {isEudrNonCompliant() && (
                                            <span className="bg-brand-red text-white text-[9px] font-bold px-2 py-1 rounded-md animate-pulse uppercase">
                                                RECHAZO ADUANA
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-orange-200/70 font-bold uppercase leading-relaxed tracking-wider">
                                        Detectado destino dentro de la UE. El Reglamento 2023/1115 exige comprobación estricta de deforestación cero. El pasaporte generado <strong>incluirá obligatoriamente los Polígonos WGS84 de las fincas de origen</strong> y censurará datos irrelevantes de calidad sensorial para agilizar la entrada aduanera.
                                    </p>

                                    {isEudrNonCompliant() && (
                                        <div className="mt-3 p-3 bg-brand-red/20 border border-brand-red/40 rounded-lg">
                                            <p className="text-[10px] text-brand-red-bright font-bold uppercase">
                                                Bloqueo de Emisión: El área de la finca ({selectedLot?.farm_size_hectares} ha) supera el límite de 4 hectáreas y carece de Polígono Geoespacial.
                                                Regrese al registro de ingreso para actualizar datos.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.targetMarket === 'usa' && (
                                <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                                        </div>
                                        <span className="text-sm font-bold text-blue-400 uppercase tracking-tighter">NORMATIVA FDA / FSMA</span>
                                    </div>
                                    <p className="text-[10px] text-blue-200/70 font-bold uppercase leading-relaxed tracking-wider">
                                        Destino Norteamérica. El pasaporte priorizará el registro inmutable de Eventos de Custodia y los controles de bioseguridad (humedad) para evitar retenciones de la FDA por riesgo biológico o Bioterrorismo.
                                    </p>
                                </div>
                            )}

                            {(formData.targetMarket === 'asia' || formData.targetMarket === 'otros') && (
                                <div className="p-5 rounded-2xl bg-brand-green/10 border border-brand-green/30 space-y-3 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center">
                                            <span className="w-2.5 h-2.5 rounded-full bg-brand-green-bright"></span>
                                        </div>
                                        <span className="text-sm font-bold text-brand-green-bright uppercase tracking-tighter">PROTOCOLO ESTÁNDAR GLOBAL</span>
                                    </div>
                                    <p className="text-[10px] text-brand-green/70 font-bold uppercase leading-relaxed tracking-wider">
                                        Destino con regulaciones mixtas. El pasaporte emitirá el certificado base inmutable garantizando autenticidad de origen WGS84 y trazabilidad física unificada.
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5">
                                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-2">Bioseguridad del Lote</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-white uppercase">{formData.moistureContent}% Humedad</span>
                                    <span className={`text-[8px] font-bold uppercase px-2 py-1 rounded-md ${formData.moistureContent > 12.5 ? 'bg-brand-red border-brand-red text-white' : 'bg-brand-green/10 text-brand-green border border-brand-green/30'}`}>
                                        {formData.moistureContent > 12.5 ? 'Riesgo Biológico Aduana' : 'Límite Seguro (Transporte Marítimo)'}
                                    </span>
                                </div>
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
                    disabled={isSubmitting || isEudrNonCompliant() || !selectedLotId}
                    className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:bg-gray-700 disabled:shadow-none text-[10px] uppercase tracking-widest"
                >
                    {isSubmitting ? 'GENERANDO EN LA NUBE...' :
                        isEudrNonCompliant() ? 'REVISIÓN EUDR OBLIGATORIA' :
                            !selectedLotId ? 'SELECCIONE UN LOTE VÁLIDO' :
                                'EJECUTAR Y GENERAR PASAPORTE DE EXPORTACIÓN'}
                    {!isSubmitting && !isEudrNonCompliant() && selectedLotId && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
