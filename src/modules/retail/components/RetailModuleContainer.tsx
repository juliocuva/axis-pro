'use client';

import React, { useState } from 'react';

type RetailView = 'inventory' | 'labels' | 'traceability' | 'sales';

export default function RetailModuleContainer() {
    const [activeTab, setActiveTab] = useState<RetailView>('inventory');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight uppercase">Módulo 4: Retail Connect</h2>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-2 opacity-70">
                        "De la Tostia a la Taza: El Cierre del Círculo Comercial"
                    </p>
                </div>

                <nav className="flex bg-bg-card p-1 rounded-2xl border border-white/5 shadow-2xl">
                    {(['inventory', 'labels', 'traceability', 'sales'] as RetailView[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === tab
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {tab === 'inventory' ? 'Inventario' :
                                tab === 'labels' ? 'Etiquetas QR' :
                                    tab === 'traceability' ? 'Trazabilidad' : 'Ventas'}
                        </button>
                    ))}
                </nav>
            </header>

            <main className="min-h-[600px]">
                {activeTab === 'inventory' && <InventoryManager />}
                {activeTab === 'labels' && <LabelGenerator />}
                {activeTab === 'traceability' && <TraceabilityPreview />}
                {activeTab === 'sales' && <SalesDashboard />}
            </main>
        </div>
    );
}

// --- Sub-componentes Temporales (Se moverán a archivos propios) ---

function InventoryManager() {
    const [mockConversion] = useState([
        { id: 'SKU-001', batch: 'AX-2130', size: '250g', stock: 45, freshDays: 12, status: 'fresh' },
        { id: 'SKU-002', batch: 'AX-1942', size: '500g', stock: 12, freshDays: 32, status: 'warning' },
    ]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-bg-card border border-white/10 rounded-[2.5rem] p-10">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Stock de Producto Terminado
                    </h3>
                    <div className="space-y-4">
                        {mockConversion.map((item) => (
                            <div key={item.id} className="p-6 bg-bg-main border border-white/5 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 font-bold text-xs uppercase">
                                        {item.size}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase">SKU: {item.id}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Batch: {item.batch}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold tracking-tighter">{item.stock} <span className="text-[10px] text-gray-500 font-bold">UDS</span></p>
                                    <span className={`text-[8px] px-2 py-1 rounded-full uppercase font-mono ${item.status === 'fresh' ? 'bg-brand-green/10 text-brand-green-bright' : 'bg-orange-500/10 text-orange-500'
                                        }`}>
                                        {item.status === 'fresh' ? 'Sabor Óptimo' : 'Consumo Próximo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-transparent border border-purple-500/20 rounded-3xl p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-widest">Conversión Automática</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase opacity-60 mt-1">Transformar Kgs Tostados en Unidades de Retail</p>
                        </div>
                        <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-xl shadow-purple-900/20">
                            Nuevo Empaque
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-bg-card border border-white/10 rounded-[2.5rem] p-10 space-y-8">
                <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-white/5 pb-4">Alertas de Frescura</h3>
                <div className="space-y-6">
                    <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                        <p className="text-[10px] text-orange-500 uppercase font-bold mb-2">⚠ Lote en Límite</p>
                        <p className="text-xs leading-relaxed text-gray-300">
                            El lote <strong>AX-1942</strong> cumplirá 45 días mañana. Se recomienda liquidación o cambio a Cold Brew.
                        </p>
                    </div>
                    <div className="h-px bg-white/5"></div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-4">Métricas de Empaque (Mes)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-bg-main rounded-xl border border-white/5">
                                <p className="text-2xl font-bold tracking-tighter">182</p>
                                <p className="text-[8px] text-gray-600 font-bold uppercase">Bolsas 250g</p>
                            </div>
                            <div className="p-4 bg-bg-main rounded-xl border border-white/5">
                                <p className="text-2xl font-bold tracking-tighter">54</p>
                                <p className="text-[8px] text-gray-600 font-bold uppercase">Bolsas 500g</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LabelGenerator() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-bg-card border border-white/10 rounded-[2.5rem] p-12">
                <h3 className="text-sm font-bold uppercase mb-8">Diseñador de Etiquetas Pro</h3>
                <form className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Seleccionar Lote de Tueste</label>
                        <select className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 outline-none focus:border-purple-500">
                            <option>AX-2130 - Geisha Natural</option>
                            <option>AX-1942 - Bourbon Semi-Washed</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Marca Destino</label>
                        <input type="text" placeholder="Sagrado Corazón" className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 mt-1 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase">Vista Previa</button>
                        <button type="button" className="py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase">Imprimir (Zebra/PDF)</button>
                    </div>
                </form>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-12 rounded-[2.5rem] text-black">
                <div className="w-full aspect-[3/4] border-4 border-black p-8 flex flex-col justify-between relative">
                    <div className="space-y-2">
                        <h4 className="text-4xl font-bold uppercase leading-tight">AxIs<br />CoFfeE</h4>
                        <div className="h-2 w-20 bg-black"></div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-tighter">Variedad</p>
                            <p className="text-xl font-bold uppercase">Geisha Especial</p>
                        </div>
                        <div className="flex justify-between border-t-2 border-black pt-4">
                            <div>
                                <p className="text-[8px] font-bold uppercase">Tostión</p>
                                <p className="text-sm font-bold">Omni-Roast</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-bold uppercase">Peso</p>
                                <p className="text-sm font-bold">250g / 8.8oz</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="w-24 h-24 bg-black flex items-center justify-center p-2">
                            {/* QR Placeholder */}
                            <div className="w-full h-full bg-white grid grid-cols-4 gap-1 p-1">
                                {[...Array(16)].map((_, i) => <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>)}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[7px] font-bold uppercase mb-1">Escanea para<br />Trazabilidad</p>
                            <p className="text-xs font-bold">AX-2130</p>
                        </div>
                    </div>
                </div>
                <p className="mt-6 text-[10px] text-gray-500 uppercase font-mono tracking-widest font-bold">Demo de Etiqueta Térmica de Alta Resolución</p>
            </div>
        </div>
    );
}

function TraceabilityPreview() {
    return (
        <div className="max-w-md mx-auto bg-bg-main border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-white/5 rounded-full flex items-center justify-center text-[8px] font-mono text-gray-500 uppercase">AXIS Mobile App</div>

            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=3540&auto=format&fit=crop" className="w-full h-64 object-cover grayscale" alt="Farm" />

            <div className="p-8 -mt-12 bg-bg-main rounded-t-[3rem] relative space-y-8">
                <header>
                    <div className="flex justify-between items-start">
                        <h3 className="text-3xl font-bold uppercase">Sagrado<br />Corazón</h3>
                        <span className="bg-brand-green text-white text-[10px] font-bold px-3 py-1 rounded-full">Lote AX-2130</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                        Este café fue cultivado por <strong>Alejandra Pérez</strong> en la finca <strong>Alejandría</strong> a 1.850 msnm.
                    </p>
                </header>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-[8px] text-gray-500 uppercase mb-1">Proceso</p>
                        <p className="text-xs font-bold uppercase">Natural</p>
                    </div>
                    <div className="text-center border-x border-white/10">
                        <p className="text-[8px] text-gray-500 uppercase mb-1">Puntaje</p>
                        <p className="text-xs font-bold text-brand-green-bright">87.5 SCA</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] text-gray-500 uppercase mb-1">Tueste</p>
                        <p className="text-xs font-bold uppercase">Perfil Oro</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-green-bright">Notas del Tostador</h4>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10">Chocolate Amargo</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10">Frutos Rojos</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10">Nuez</span>
                    </div>
                </div>

                <div className="p-6 bg-brand-green-bright text-black rounded-3xl space-y-2">
                    <h4 className="text-[10px] font-bold uppercase">Recomendación Sagrada</h4>
                    <p className="text-xs font-medium uppercase font-bold text-[8px]">Muele fino para V60: Ratio 1:15 con agua a 92°C para resaltar la acidez cítrica.</p>
                </div>

                <button className="w-full py-4 border-2 border-white/10 rounded-2xl text-[10px] font-bold uppercase hover:bg-white text-white hover:text-black transition-all">Ver Curva de Tueste Real</button>
            </div>
        </div>
    );
}

function SalesDashboard() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-bg-card border border-white/10 p-8 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Ingresos Retail (Hoy)</p>
                <h4 className="text-3xl font-bold tracking-tighter">$2.450.000 <span className="text-[10px] text-brand-green-bright font-bold">COP</span></h4>
            </div>
            <div className="bg-bg-card border border-white/10 p-8 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Ticket Promedio</p>
                <h4 className="text-3xl font-bold tracking-tighter">$45.000</h4>
            </div>
            <div className="bg-bg-card border border-white/10 p-8 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-mono mb-2">Conversión</p>
                <h4 className="text-3xl font-bold">12.4%</h4>
            </div>
            <div className="bg-bg-card border border-white/10 p-8 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-mono mb-2">NPS (Feedback)</p>
                <h4 className="text-3xl font-bold">4.8 <span className="text-xs text-brand-green-bright">★</span></h4>
            </div>

            <div className="md:col-span-2 lg:col-span-4 bg-bg-card border border-white/10 p-10 rounded-[2.5rem]">
                <h3 className="text-sm font-bold uppercase mb-8">Últimas Transacciones Omni-Canal</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-bg-main rounded-xl border border-white/5">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Vendido via E-commerce</p>
                                <p className="text-[8px] text-gray-500 uppercase">2x Bolsa 250g - Lote AX-2130</p>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-brand-green-bright">+$72.000</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
