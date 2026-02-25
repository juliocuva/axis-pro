'use client';

import React, { useState, useEffect } from 'react';
import { registerRetailInventory, getRetailInventory, getBatchStory } from '../actions/retailActions';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';
import { supabase } from '@/shared/lib/supabase';

type RetailView = 'inventory' | 'labels' | 'traceability' | 'sales' | 'archive';

interface RetailModuleContainerProps {
    user: { email: string, name: string, companyId: string } | null;
}

export default function RetailModuleContainer({ user }: RetailModuleContainerProps) {
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

                <nav className="flex bg-bg-card p-1 rounded-industrial-sm border border-white/5 shadow-2xl overflow-hidden">
                    {(['inventory', 'labels', 'traceability', 'sales', 'archive'] as RetailView[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest flex items-center gap-2 ${activeTab === tab
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {tab === 'archive' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>}
                            {tab === 'inventory' ? 'Inventario' :
                                tab === 'labels' ? 'Etiquetas QR' :
                                    tab === 'traceability' ? 'Trazabilidad' :
                                        tab === 'sales' ? 'Ventas' : 'Archivo Cloud'}
                        </button>
                    ))}
                </nav>
            </header>

            <main className="min-h-[600px]">
                {activeTab === 'inventory' && <InventoryManager user={user} />}
                {activeTab === 'labels' && <LabelGenerator />}
                {activeTab === 'traceability' && <TraceabilityPreview user={user} />}
                {activeTab === 'sales' && <SalesDashboard />}
                {activeTab === 'archive' && <GlobalHistoryArchive user={user} />}
            </main>
        </div>
    );
}

// --- Sub-componentes Temporales (Se moverán a archivos propios) ---

function InventoryManager({ user }: { user: { companyId: string } | null }) {
    const [inventory, setInventory] = useState<any[]>([]);
    const [roastBatches, setRoastBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPackaging, setIsPackaging] = useState(false);
    const [showPackager, setShowPackager] = useState(false);
    const [sourceType, setSourceType] = useState<'internal' | 'external'>('internal');

    // Formulario de empaque
    const [packData, setPackData] = useState({
        roastBatchId: '',
        sku: 'SKU-' + Math.floor(Math.random() * 9000 + 1000),
        unitSizeGrams: 250,
        unitsProduced: 20,
        packerName: 'Retail Manager',
        externalRoaster: '',
        externalOrigin: '',
        externalProcess: '',
        externalNotes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user?.companyId) return;
        setIsLoading(true);
        const inv = await getRetailInventory(user.companyId);
        setInventory(inv);

        // Cargar lotes de tueste disponibles para empacar
        const { data: batches } = await supabase
            .from('roast_batches')
            .select('*')
            .eq('company_id', user.companyId)
            .order('roast_date', { ascending: false })
            .limit(10);

        if (batches) setRoastBatches(batches);
        setIsLoading(false);
    };

    const handlePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPackaging(true);

        const payload = {
            ...packData,
            companyId: user?.companyId || '',
            isExternal: sourceType === 'external',
            externalNotes: packData.externalNotes.split(',').map(n => n.trim())
        };

        const result = await registerRetailInventory(payload as any);
        if (result.success) {
            await loadData();
            setShowPackager(false);
        }
        setIsPackaging(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-bg-card border border-white/10 rounded-industrial p-10">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Stock de Producto Terminado
                        </h3>
                        <button onClick={loadData} className="text-gray-500 hover:text-white transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-20 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Consultando Inventario Cloud...</div>
                        ) : inventory.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-white/10 rounded-industrial">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sin stock registrado.</p>
                            </div>
                        ) : (
                            inventory.map((item) => (
                                <div key={item.id} className="p-6 bg-bg-main border border-white/5 rounded-industrial-sm flex items-center justify-between group hover:border-purple-500/30 transition-all">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 font-bold text-xs uppercase">
                                            {item.unit_size_grams}g
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold uppercase">SKU: {item.sku}</p>
                                                {item.metadata?.is_external && <span className="text-[7px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold uppercase">Externo</span>}
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                {item.metadata?.is_external ? `Roaster: ${item.metadata.roaster}` : `Batch: ${item.roast_batch_id}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold tracking-tighter">{item.units_produced} <span className="text-[10px] text-gray-500 font-bold">UDS</span></p>
                                        <span className="text-[9px] bg-brand-green/10 text-brand-green-bright px-2 py-0.5 rounded-full uppercase font-bold">Listo para Venta</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {showPackager ? (
                    <form onSubmit={handlePackage} className="bg-gradient-to-br from-purple-900/40 to-bg-card border border-purple-500/30 rounded-industrial p-10 space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-bold uppercase tracking-widest text-white">Ingreso de Producto al Retail</h4>
                            <button type="button" onClick={() => setShowPackager(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>

                        {/* Selector de Origen */}
                        <div className="flex bg-bg-main p-1 rounded-industrial-sm border border-white/10 mb-6">
                            <button
                                type="button"
                                onClick={() => setSourceType('internal')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${sourceType === 'internal' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Producción AXIS (Interno)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceType('external')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${sourceType === 'external' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Roaster Aliado (Externo)
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {sourceType === 'internal' ? (
                                <div className="col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Lote de Tueste (Materia Prima)</label>
                                    <select
                                        required
                                        value={packData.roastBatchId}
                                        onChange={(e) => setPackData({ ...packData, roastBatchId: e.target.value })}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 outline-none focus:border-purple-500 text-sm font-bold"
                                    >
                                        <option value="">Seleccionar lote...</option>
                                        {roastBatches.map(b => (
                                            <option key={b.id} value={b.id}>{b.batch_id_label} - {b.process} ({b.roasted_weight}kg)</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Empresa Roaster (Marca)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="v.g. Café Pergamino, Amor Perfecto..."
                                            value={packData.externalRoaster}
                                            onChange={(e) => setPackData({ ...packData, externalRoaster: e.target.value })}
                                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 outline-none focus:border-blue-500 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Origen / Finca / Región</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Cauca, Tolima..."
                                            value={packData.externalOrigin}
                                            onChange={(e) => setPackData({ ...packData, externalOrigin: e.target.value })}
                                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 outline-none focus:border-blue-500 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Proceso de Beneficio</label>
                                        <select
                                            value={packData.externalProcess}
                                            onChange={(e) => setPackData({ ...packData, externalProcess: e.target.value })}
                                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 outline-none focus:border-blue-500 font-bold"
                                        >
                                            <option value="Lavado">Lavado</option>
                                            <option value="Natural">Natural</option>
                                            <option value="Honey">Honey</option>
                                            <option value="Anaeróbico">Anaeróbico</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Notas de Cata (Separadas por coma)</label>
                                        <input
                                            type="text"
                                            placeholder="Vainilla, Caramelo, Lima..."
                                            value={packData.externalNotes}
                                            onChange={(e) => setPackData({ ...packData, externalNotes: e.target.value })}
                                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 outline-none focus:border-blue-500 font-bold font-mono text-[10px]"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Unidades (Bolsas)</label>
                                <input
                                    type="number"
                                    required
                                    value={packData.unitsProduced}
                                    onChange={(e) => setPackData({ ...packData, unitsProduced: parseInt(e.target.value) })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 outline-none focus:border-purple-500 font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Tamaño Unitario (g)</label>
                                <select
                                    value={packData.unitSizeGrams}
                                    onChange={(e) => setPackData({ ...packData, unitSizeGrams: parseInt(e.target.value) })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 outline-none focus:border-purple-500 font-bold"
                                >
                                    <option value="250">250g</option>
                                    <option value="340">340g (12oz)</option>
                                    <option value="500">500g</option>
                                    <option value="1000">1000g</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPackaging}
                            className={`w-full py-4 rounded-industrial-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 ${sourceType === 'internal' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'}`}
                        >
                            {isPackaging ? 'PROCESANDO REGISTRO...' : `REGISTRAR CAFÉ ${sourceType === 'internal' ? 'PROPIO' : 'ADQUIRIDO'}`}
                        </button>
                    </form>
                ) : (
                    <div className="bg-gradient-to-r from-purple-900/20 to-transparent border border-purple-500/20 rounded-industrial p-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-xl font-bold uppercase tracking-widest text-white">Gestión Multi-Origen</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase opacity-60 mt-1">Registra producción propia o café de aliados comerciales</p>
                            </div>
                            <button
                                onClick={() => setShowPackager(true)}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow-xl shadow-purple-900/20 hover:scale-105"
                            >
                                Registrar Entrada
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* HISTORIAL - ALTURA SINCRONIZADA CON SECCIONES DEL FORMULARIO */}
            <div className="bg-bg-card border border-white/10 p-8 rounded-industrial flex flex-col relative overflow-hidden group h-[780px]">
                <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-white/5 pb-4">Alertas de Frescura AI</h3>
                <div className="space-y-6">
                    <div className="p-6 bg-brand-green/5 border border-brand-green/20 rounded-industrial-sm">
                        <p className="text-[10px] text-brand-green uppercase font-bold mb-2">✓ Calidad Óptima</p>
                        <p className="text-xs leading-relaxed text-gray-300">
                            95% de su inventario se encuentra en la ventana de frescura ideal (7-21 días post-tueste).
                        </p>
                    </div>
                    <div className="h-px bg-white/5"></div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-4">Métricas de Empaque (Mes)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-bg-main rounded-xl border border-white/5 text-center">
                                <p className="text-2xl font-bold tracking-tighter text-white">{inventory.reduce((acc, curr) => acc + (curr.unit_size_grams === 250 ? curr.units_produced : 0), 0) || 182}</p>
                                <p className="text-[8px] text-gray-600 font-bold uppercase">Bolsas 250g</p>
                            </div>
                            <div className="p-4 bg-bg-main rounded-xl border border-white/5 text-center">
                                <p className="text-2xl font-bold tracking-tighter text-white">{inventory.reduce((acc, curr) => acc + (curr.unit_size_grams === 500 ? curr.units_produced : 0), 0) || 54}</p>
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
            <div className="bg-bg-card border border-white/10 rounded-industrial p-12">
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

            <div className="flex flex-col items-center justify-center bg-white p-12 rounded-industrial text-black">
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
                        <div className="w-24 h-24 bg-white flex items-center justify-center p-2 rounded-lg shadow-sm border border-black">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'https://axis-coffee.pro') + '/trace/AX-DEMO')}`}
                                alt="QR Tracking"
                                className="w-full h-full"
                            />
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

function TraceabilityPreview({ user }: { user: { companyId: string } | null }) {
    const [searchBatch, setSearchBatch] = useState('AX-2130');
    const [story, setStory] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        handleSearch();
    }, []);

    const handleSearch = async () => {
        setIsLoading(true);
        const data = await getBatchStory(searchBatch, user?.companyId || '');
        if (data) setStory(data);
        setIsLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="max-w-md mx-auto flex gap-2">
                <input
                    type="text"
                    value={searchBatch}
                    onChange={(e) => setSearchBatch(e.target.value)}
                    placeholder="Buscar Lote (v.g. AX-2130)"
                    className="flex-1 bg-bg-card border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-xs font-bold uppercase"
                />
                <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-purple-600 rounded-xl text-[10px] font-bold uppercase"
                >
                    Explorar
                </button>
            </div>

            <div className="max-w-md mx-auto bg-bg-main border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-white/5 rounded-full flex items-center justify-center text-[8px] font-mono text-gray-500 uppercase z-20">AXIS Mobile App</div>

                <div className="h-64 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=3540&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Farm" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent blur-sm"></div>
                </div>

                <div className="p-8 -mt-12 bg-bg-main rounded-t-[3rem] relative space-y-8">
                    {isLoading ? (
                        <div className="py-20 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Consultando Origen...</div>
                    ) : (
                        <>
                            <header>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-3xl font-bold uppercase tracking-tighter leading-none">{story?.producer?.split(' ')[0] || 'Sagrado'}<br />{story?.producer?.split(' ')[1] || 'Corazón'}</h3>
                                    <span className="bg-brand-green/20 text-brand-green text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-brand-green/20">Lote {story?.roast?.batch_id_label || searchBatch}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-6 leading-relaxed font-medium">
                                    Este café fue cultivado en la finca <strong>{story?.farm || 'Alejandría'}</strong> a {story?.height || '1.850 msnm'}.
                                </p>
                            </header>

                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5">
                                <div className="text-center">
                                    <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Proceso</p>
                                    <p className="text-xs font-bold uppercase text-white">{story?.process || 'Natural'}</p>
                                </div>
                                <div className="text-center border-x border-white/10">
                                    <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Puntaje</p>
                                    <p className="text-xs font-bold text-brand-green-bright">{story?.sensoryScore || 87.5} SCA</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Tueste</p>
                                    <p className="text-xs font-bold uppercase text-white">Perfil Oro</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">Notas Catadas</h4>
                                <div className="flex flex-wrap gap-2 text-[9px]">
                                    {story?.notes?.map((note: string) => (
                                        <span key={note} className="px-3 py-1 bg-white/5 rounded-full border border-white/10 font-bold uppercase">{note}</span>
                                    )) || (
                                            <>
                                                <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 font-bold uppercase">Chocolate</span>
                                                <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 font-bold uppercase">Frutos Rojos</span>
                                            </>
                                        )}
                                </div>
                            </div>

                            <div className="p-6 bg-purple-600/10 border border-purple-500/20 text-white rounded-3xl space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Recomendación Sagrada</h4>
                                <p className="text-[10px] font-bold uppercase leading-relaxed">Muele fino para V60: Ratio 1:15 con agua a 92°C para resaltar la acidez dinámica de este lote.</p>
                            </div>

                            <button className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest transition-all">Ver Telemetría Roaster</button>
                        </>
                    )}
                </div>
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
