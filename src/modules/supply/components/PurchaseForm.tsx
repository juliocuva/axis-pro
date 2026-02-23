'use client';

import React, { useState, useEffect } from 'react';
import { CoffeeVariety, ProcessType } from '@/shared/types';

const COFFEE_VARIETIES: CoffeeVariety[] = [
    'Castillo', 'Caturra', 'Colombia', 'Tabi', 'Bourbon',
    'Geisha', 'Typica', 'Maragogype', 'Pacamara', 'Sidra',
    'Wush Wush', 'Java', 'SL28', 'Pink Bourbon', 'Laurina',
    'Mundo Novo', 'Cenicafe 1', 'Papayo', 'Chiroso'
];

const PROCESS_TYPES: ProcessType[] = ['washed', 'honey', 'natural', 'semi-washed'];

const COLOMBIAN_REGIONS = [
    'Huila', 'Antioquia', 'Tolima', 'Cauca', 'Caldas', 'Santander',
    'Valle del Cauca', 'Risaralda', 'Nariño', 'Quindío', 'Cundinamarca',
    'Sierra Nevada', 'Cesar', 'Boyacá', 'Casanare', 'Meta', 'Caquetá'
];

interface PurchaseFormProps {
    onPurchaseComplete?: (lot: any) => void;
    selectedLot?: any;
}

export default function PurchaseForm({ onPurchaseComplete, selectedLot }: PurchaseFormProps) {
    const [formData, setFormData] = useState({
        farmerName: '',
        farmName: '',
        altitude: 1600,
        region: 'Huila',
        variety: 'Castillo' as CoffeeVariety,
        process: 'washed' as ProcessType,
        purchaseWeight: 0,
        purchaseValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}`
    });

    const [isEditingLot, setIsEditingLot] = useState(false);
    const [displayValue, setDisplayValue] = useState('');
    const [expectedYield, setExpectedYield] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (selectedLot) {
            setFormData({
                farmerName: selectedLot.farmer_name || '',
                farmName: selectedLot.farm_name || '',
                altitude: selectedLot.altitude || 1600,
                region: selectedLot.region || 'Huila',
                variety: (selectedLot.variety as CoffeeVariety) || 'Castillo',
                process: (selectedLot.process as ProcessType) || 'washed',
                purchaseWeight: Number(selectedLot.purchase_weight) || 0,
                purchaseValue: Number(selectedLot.purchase_value) || 0,
                purchaseDate: selectedLot.purchase_date || new Date().toISOString().split('T')[0],
                lotNumber: selectedLot.lot_number || ''
            });
            setDisplayValue(formatCOP(String(selectedLot.purchase_value || 0)));
        }
    }, [selectedLot]);

    useEffect(() => {
        if (formData.purchaseWeight > 0) {
            setExpectedYield(formData.purchaseWeight * 0.81);
        } else {
            setExpectedYield(null);
        }
    }, [formData.purchaseWeight]);

    // Formateador de Pesos Colombianos (Punto de mil)
    const formatCOP = (val: string) => {
        const number = val.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const formatted = formatCOP(rawValue);
        setDisplayValue(formatted);
        setFormData({ ...formData, purchaseValue: parseInt(rawValue) || 0 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const { supabase } = await import('@/shared/lib/supabase');

            const { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .insert([{
                    farmer_name: formData.farmerName,
                    farm_name: formData.farmName,
                    lot_number: formData.lotNumber,
                    altitude: formData.altitude,
                    region: formData.region,
                    variety: formData.variety,
                    process: formData.process,
                    purchase_weight: formData.purchaseWeight,
                    purchase_value: formData.purchaseValue,
                    purchase_date: formData.purchaseDate,
                    company_id: '99999999-9999-9999-9999-999999999999', // ID Temporal
                    status: 'purchased'
                }])
                .select();

            if (error) throw error;
            setStatus({ type: 'success', message: '¡Compra registrada en AXIS Cloud exitosamente!' });

            if (onPurchaseComplete && data && data[0]) {
                onPurchaseComplete(data[0]);
            }
        } catch (err: any) {
            console.error("DEBUG SUPABASE:", err);
            setStatus({
                type: 'error',
                message: `Error de Conexión: ${err.message || 'Error desconocido'}.`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-2xl font-bold">Registro de Compra y Origen</h2>
                    <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-mono">Fase 01: Ingreso de Café Pergamino</p>
                </div>
                <div className="text-right flex items-center gap-4">
                    {isEditingLot ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={formData.lotNumber}
                                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                                className="bg-bg-main border border-brand-green/50 text-brand-green-bright px-3 py-1 rounded-lg text-xs font-mono outline-none w-32"
                            />
                            <button type="button" onClick={() => setIsEditingLot(false)} className="text-[10px] bg-brand-green text-white px-2 py-1 rounded">Ok</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-brand-green-bright font-mono text-xs border border-brand-green/30 px-3 py-1 rounded-lg uppercase tracking-tight">Lote: {formData.lotNumber}</span>
                            <button type="button" onClick={() => setIsEditingLot(true)} className="text-[8px] text-gray-500 hover:text-white uppercase transition-colors">Editar</button>
                        </div>
                    )}
                </div>
            </header>

            {status && (
                <div className={`p-4 rounded-xl text-sm font-bold border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                    {status.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-bg-card border border-white/5 p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Datos del Productor
                        </h3>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 bg-bg-main border border-white/5 rounded-3xl group">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Lote Generado</p>
                        <div className="flex items-center gap-4">
                            {isEditingLot ? (
                                <input
                                    type="text"
                                    value={formData.lotNumber}
                                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                                    className="bg-bg-card border border-brand-green/30 rounded-xl px-4 py-2 text-xl font-bold text-white text-center outline-none focus:border-brand-green w-40"
                                />
                            ) : (
                                <span className="text-4xl font-bold tracking-tighter text-white group-hover:text-brand-green-bright transition-colors uppercase">
                                    {formData.lotNumber}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsEditingLot(!isEditingLot)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre del Caficultor</label>
                            <input
                                type="text"
                                placeholder="Ej. Alejandra Pérez"
                                required
                                value={formData.farmerName}
                                onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre de la Finca</label>
                            <input
                                type="text"
                                placeholder="Ej. Alejandría"
                                required
                                value={formData.farmName}
                                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Altura (msnm)</label>
                                <input
                                    type="number"
                                    value={formData.altitude}
                                    onChange={(e) => setFormData({ ...formData, altitude: parseInt(e.target.value) })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fecha de Compra</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none text-white scheme-dark"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Región / Departamento</label>
                            <select
                                required
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                disabled={isSubmitting}
                            >
                                {COLOMBIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="bg-bg-card border border-white/5 p-8 rounded-3xl space-y-6">
                    <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                        Especificaciones Técnicas
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Variedad</label>
                                <select
                                    value={formData.variety}
                                    onChange={(e) => setFormData({ ...formData, variety: e.target.value as CoffeeVariety })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                    disabled={isSubmitting}
                                >
                                    {COFFEE_VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Proceso</label>
                                <select
                                    value={formData.process}
                                    onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none uppercase"
                                    disabled={isSubmitting}
                                >
                                    {PROCESS_TYPES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cantidad Pack de Compra (Kg Pergamino)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    value={formData.purchaseWeight || ''}
                                    placeholder="0.0"
                                    onChange={(e) => setFormData({ ...formData, purchaseWeight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none pr-12 text-2xl font-bold"
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-4 top-5 text-gray-600 font-bold">KG</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-white uppercase tracking-widest block border-l-2 border-brand-green pl-3">Valor Total de Compra</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={displayValue}
                                    onChange={handleValueChange}
                                    className="w-full bg-bg-main border border-white/10 rounded-2xl px-6 py-5 text-4xl font-bold tracking-tighter text-brand-green-bright outline-none focus:border-brand-green transition-all"
                                    placeholder="0"
                                />
                                <span className="absolute right-6 top-6 text-[10px] text-gray-500 font-bold tracking-widest">COP</span>
                            </div>
                        </div>
                        <p className="text-[8px] text-gray-500 mt-1 uppercase">Manejando Pesos Colombianos (COP)</p>
                    </div>

                    <div className="mt-4 p-6 bg-brand-green/5 border border-brand-green/20 rounded-2xl">
                        <div className="p-6 bg-white/2 border border-white/5 rounded-2xl mb-4">
                            <p className="text-[10px] text-gray-400 uppercase mb-3 font-bold tracking-widest">Patrón de Éxito Identificado</p>
                            <p className="text-sm font-medium leading-relaxed">
                                "Los lotes con un DTR entre <span className="text-brand-green-bright">17.5% y 18.2%</span> han producido históricamente un puntaje superior a 86.5 pts en esta variedad Castillo."
                            </p>
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70 tracking-tight">*Estimación basada en factor de rendimiento estándar (94lbs Excelso).</p>
                    </div>
                </section>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-4 group disabled:opacity-50 text-[10px] uppercase tracking-widest"
            >
                {isSubmitting ? 'REGISTRANDO EN LA NUBE...' : 'REGISTRAR INGRESO Y PREPARAR PARA TRILLA'}
                {!isSubmitting && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-12 transition-transform">
                        <path d="M4 12V4a2 2 0 0 1 2-2h10l4 4v5" />
                        <path d="M10 12l2 2 4-4" />
                        <path d="M4 18h16" />
                    </svg>
                )}
            </button>
        </form>
    );
}
