'use client';

import React, { useState, useEffect } from 'react';
import { CoffeeVariety, ProcessType, InventoryBatch } from '@/types';

const COFFEE_VARIETIES: CoffeeVariety[] = [
    'Castillo', 'Caturra', 'Colombia', 'Tabi', 'Bourbon',
    'Geisha', 'Typica', 'Maragogype', 'Pacamara', 'Sidra',
    'Wush Wush', 'Java', 'SL28', 'Pink Bourbon', 'Laurina',
    'Mundo Novo', 'Cenicafe 1', 'Papayo', 'Chiroso'
];

const PROCESS_TYPES: ProcessType[] = ['washed', 'honey', 'natural', 'semi-washed'];

export default function PurchaseForm() {
    const [formData, setFormData] = useState({
        farmerName: '',
        farmName: '',
        altitude: 1600,
        region: 'Huila',
        variety: 'Castillo' as CoffeeVariety,
        process: 'washed' as ProcessType,
        purchaseWeight: 0,
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    const [expectedYield, setExpectedYield] = useState<number | null>(null);

    useEffect(() => {
        // Estimación industrial base: El rendimiento de trilla suele ser ~80-82% para café Excelso
        if (formData.purchaseWeight > 0) {
            setExpectedYield(formData.purchaseWeight * 0.81);
        } else {
            setExpectedYield(null);
        }
    }, [formData.purchaseWeight]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-2xl font-bold">Registro de Compra y Origen</h2>
                    <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-mono">Fase 01: Ingreso de Café Pergamino</p>
                </div>
                <div className="text-right">
                    <span className="text-brand-green-bright font-mono font-bold">Lote: INC-{Math.floor(Math.random() * 9000 + 1000)}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Origin Section */}
                <section className="bg-bg-card border border-white/5 p-8 rounded-3xl space-y-6">
                    <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                        Datos del Productor
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre del Caficultor</label>
                            <input
                                type="text"
                                placeholder="Ej. Juan Valdez"
                                value={formData.farmerName}
                                onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre de la Finca</label>
                            <input
                                type="text"
                                placeholder="Ej. El Edén"
                                value={formData.farmName}
                                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
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
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Región / Departamento</label>
                                <input
                                    type="text"
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Technical Data Section */}
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
                                >
                                    {COFFEE_VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Proceso</label>
                                <select
                                    value={formData.process}
                                    onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none"
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
                                    value={formData.purchaseWeight || ''}
                                    placeholder="0.0"
                                    onChange={(e) => setFormData({ ...formData, purchaseWeight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 focus:border-brand-green outline-none pr-12 text-2xl font-bold"
                                />
                                <span className="absolute right-4 top-5 text-gray-600 font-mono font-bold">KG</span>
                            </div>
                        </div>

                        {/* Prediction Area */}
                        <div className="mt-4 p-6 bg-brand-green/5 border border-brand-green/20 rounded-2xl">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 uppercase font-mono">Estimado post-trilla (Excelso)</span>
                                <span className="text-brand-green-bright text-xl font-bold">
                                    {expectedYield ? expectedYield.toFixed(1) : '--'} KG
                                </span>
                            </div>
                            <p className="text-[9px] text-gray-500 mt-2 italic">*Estimación basada en factor de rendimiento estándar (94lbs Excelso).</p>
                        </div>
                    </div>
                </section>
            </div>

            <button className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-4 group">
                REGISTRAR INGRESO Y PREPARAR PARA TRILLA
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:rotate-12 transition-transform">
                    <path d="M4 12V4a2 2 0 012-2h10l4 4v5" />
                    <path d="M10 12l2 2 4-4" />
                    <path d="M4 18h16" />
                </svg>
            </button>
        </div>
    );
}
