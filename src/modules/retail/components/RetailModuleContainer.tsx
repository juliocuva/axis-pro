'use client';

import React, { useState, useEffect } from 'react';
import { registerRetailInventory, getRetailInventory, getBatchStory, processRetailSale } from '../actions/retailActions';
import GlobalHistoryArchive from '@/modules/export/components/GlobalHistoryArchive';
import { supabase } from '@/shared/lib/supabase';
import { NumericInput } from '@/shared/components/ui/NumericInput';

type RetailView = 'inventory' | 'labels' | 'traceability' | 'sales' | 'archive';

interface RetailModuleContainerProps {
    user: { email: string, name: string, companyId: string, role?: string } | null;
}

export default function RetailModuleContainer({ user }: RetailModuleContainerProps) {
    const [activeTab, setActiveTab] = useState<RetailView>('inventory');
    const [inventory, setInventory] = useState<any[]>([]);
    const [isLoadingInventory, setIsLoadingInventory] = useState(true);

    const loadInventoryData = async () => {
        if (!user?.companyId) return;
        setIsLoadingInventory(true);
        const inv = await getRetailInventory(user.companyId);
        setInventory(inv);
        setIsLoadingInventory(false);
    };

    useEffect(() => {
        loadInventoryData();
    }, [user?.companyId]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-wrap items-center justify-between gap-6 border-b border-gray-400 shadow-sm pb-8">
                <div>
                    <h2 className="text-3xl font-bold  uppercase">4: Retail Connect</h2>
                    <p className="text-[11px] text-brand-navy font-bold  uppercase mt-2 opacity-70">
                        "De la Tostia a la Taza: El Cierre del Círculo Comercial"
                    </p>
                </div>

                <nav className="flex bg-bg-card p-1 rounded-industrial-sm border border-gray-400 shadow-sm shadow-2xl overflow-hidden">
                    {(['inventory', 'labels', 'traceability', 'sales', 'archive'] as RetailView[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-[11px] font-bold transition-all uppercase  flex items-center gap-2 ${activeTab === tab
                                ? 'bg-brand-green text-brand-navy shadow-lg shadow-brand-green/20'
                                : 'text-brand-navy hover:text-brand-navy'
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
                {activeTab === 'inventory' && <InventoryManager user={user} inventory={inventory} isLoading={isLoadingInventory} loadData={loadInventoryData} />}
                {activeTab === 'labels' && <LabelGenerator />}
                {activeTab === 'traceability' && <TraceabilityPreview user={user} />}
                {activeTab === 'sales' && <SalesDashboard user={user} inventory={inventory} onSaleComplete={loadInventoryData} />}
                {activeTab === 'archive' && <GlobalHistoryArchive user={user} />}
            </main>
        </div>
    );
}

// --- Sub-componentes Temporales (Se moverán a archivos propios) ---

function InventoryManager({ user, inventory, isLoading, loadData }: {
    user: { companyId: string } | null,
    inventory: any[],
    isLoading: boolean,
    loadData: () => Promise<void>
}) {
    const [roastBatches, setRoastBatches] = useState<any[]>([]);
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
        fetchRoastBatches();
    }, []);

    const fetchRoastBatches = async () => {
        if (!user?.companyId) return;
        // Cargar lotes de tueste disponibles para empacar
        const { data: batches } = await supabase
            .from('roast_batches')
            .select('*')
            .eq('company_id', user.companyId)
            .order('roast_date', { ascending: false })
            .limit(10);

        if (batches) setRoastBatches(batches);
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
                <div className="bg-bg-card border border-gray-400 shadow-sm rounded-industrial p-10">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-bold uppercase  flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                            Stock de Producto Terminado
                        </h3>
                        <button onClick={loadData} className="text-brand-navy hover:text-brand-navy transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-20 text-center text-[11px] font-bold text-brand-navy uppercase  animate-pulse">Consultando Inventario Cloud...</div>
                        ) : inventory.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-gray-400 shadow-sm rounded-industrial">
                                <p className="text-[11px] text-brand-navy font-bold uppercase ">Sin stock registrado.</p>
                            </div>
                        ) : (
                            inventory.map((item) => (
                                <div key={item.id} className="p-6 bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm flex items-center justify-between group hover:border-gray-400 shadow-sm transition-all">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-navy-bright font-bold text-xs uppercase">
                                            {item.unit_size_grams}g
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold uppercase">SKU: {item.sku}</p>
                                                {item.metadata?.is_external && <span className="text-[7px] bg-white border border-gray-400 shadow-sm text-brand-navy-bright px-1.5 py-0.5 rounded-full font-bold uppercase">Externo</span>}
                                            </div>
                                            <p className="text-[11px] text-brand-navy font-bold uppercase  flex items-center gap-2 mt-1">
                                                {item.roast_batches?.coffee_purchase_inventory?.varietal || 'Variedad'} |
                                                {item.roast_batches?.coffee_purchase_inventory?.coffee_type || item.metadata?.process || 'Proceso'} |
                                                Roasted: {item.roast_batches?.roast_date ? new Date(item.roast_batches.roast_date).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold er leading-none">{item.total_grams_available.toLocaleString()} <span className="text-[11px] text-brand-navy font-bold">G</span></p>
                                        <p className="text-[11px] font-bold text-brand-navy mt-1 uppercase ">
                                            {Math.floor(item.total_grams_available / item.unit_size_grams)} Bolsas Est.
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {showPackager ? (
                    <form onSubmit={handlePackage} className="bg-gradient-to-br from-brand-green/40 to-bg-card border border-gray-400 shadow-sm rounded-industrial p-10 space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-bold uppercase  text-brand-navy">Ingreso de Producto al Retail</h4>
                            <button type="button" onClick={() => setShowPackager(false)} className="text-brand-navy hover:text-brand-navy">✕</button>
                        </div>

                        {/* Selector de Origen */}
                        <div className="flex bg-bg-main p-1 rounded-industrial-sm border border-gray-400 shadow-sm mb-6">
                            <button
                                type="button"
                                onClick={() => setSourceType('internal')}
                                className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-lg transition-all ${sourceType === 'internal' ? 'bg-brand-green text-brand-navy' : 'text-brand-navy hover:text-brand-navy'}`}
                            >
                                Producción AXIS (Interno)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceType('external')}
                                className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-lg transition-all ${sourceType === 'external' ? 'bg-brand-green text-brand-navy' : 'text-brand-navy hover:text-brand-navy'}`}
                            >
                                Roaster Aliado (Externo)
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {sourceType === 'internal' ? (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-brand-navy uppercase  block">Lote de Tueste (Materia Prima)</label>
                                    <div className="relative group/select">
                                        <select
                                            required
                                            value={packData.roastBatchId}
                                            onChange={(e) => setPackData({ ...packData, roastBatchId: e.target.value })}
                                            className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 outline-none focus:border-black text-sm font-bold appearance-none pr-12"
                                        >
                                            <option value="">Seleccionar lote...</option>
                                            {roastBatches.map(b => (
                                                <option key={b.id} value={b.id}>{b.batch_id_label} - {b.process} ({b.roasted_weight}kg)</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-hover/select:text-brand-navy transition-colors">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-bold text-brand-navy uppercase  mb-1 block">Empresa Roaster (Marca)</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="v.g. Café Pergamino, Amor Perfecto..."
                                            value={packData.externalRoaster}
                                            onChange={(e) => setPackData({ ...packData, externalRoaster: e.target.value })}
                                            className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 outline-none focus:border-black font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-brand-navy uppercase  mb-1 block">Origen / Finca / Región</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Cauca, Tolima..."
                                            value={packData.externalOrigin}
                                            onChange={(e) => setPackData({ ...packData, externalOrigin: e.target.value })}
                                            className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 outline-none focus:border-black font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-brand-navy uppercase  block">Proceso de Beneficio</label>
                                        <div className="relative group/select">
                                            <select
                                                value={packData.externalProcess}
                                                onChange={(e) => setPackData({ ...packData, externalProcess: e.target.value })}
                                                className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 outline-none focus:border-black font-bold appearance-none pr-12"
                                            >
                                                <option value="Lavado">Lavado</option>
                                                <option value="Natural">Natural</option>
                                                <option value="Honey">Honey</option>
                                                <option value="Anaeróbico">Anaeróbico</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-hover/select:text-brand-navy transition-colors">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-bold text-brand-navy uppercase  mb-1 block">Notas de Cata (Separadas por coma)</label>
                                        <input
                                            type="text"
                                            placeholder="Vainilla, Caramelo, Lima..."
                                            value={packData.externalNotes}
                                            onChange={(e) => setPackData({ ...packData, externalNotes: e.target.value })}
                                            className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 outline-none focus:border-black font-bold font-mono text-[11px]"
                                        />
                                    </div>
                                </>
                            )}

                            <NumericInput
                                label="Unidades (Bolsas)"
                                value={packData.unitsProduced}
                                onChange={(val) => setPackData({ ...packData, unitsProduced: Math.round(val) })}
                                step={1}
                                min={1}
                                required
                                disabled={isPackaging}
                                variant="industrial"
                                inputClassName="font-bold"
                            />
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-brand-navy uppercase  block">Tamaño Unitario (g)</label>
                                <div className="relative group/select">
                                    <select
                                        value={packData.unitSizeGrams}
                                        onChange={(e) => setPackData({ ...packData, unitSizeGrams: parseInt(e.target.value) })}
                                        className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-4 py-3 outline-none focus:border-black font-bold appearance-none pr-12"
                                    >
                                        <option value="250">250g</option>
                                        <option value="340">340g (12oz)</option>
                                        <option value="500">500g</option>
                                        <option value="1000">1000g</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-hover/select:text-brand-navy transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 p-4 bg-white border border-gray-400 shadow-sm rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-[11px] font-bold text-brand-navy-bright uppercase ">Control de Masa Total (CMT)</p>
                                    <p className="text-[9px] text-brand-navy uppercase mt-1">Masa neta que ingresará al inventario global</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-brand-navy">{(packData.unitsProduced * packData.unitSizeGrams / 1000).toFixed(2)} KG</p>
                                    <p className="text-[11px] text-brand-navy font-bold">({(packData.unitsProduced * packData.unitSizeGrams).toLocaleString()} G)</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPackaging}
                            className={`w-full py-4 rounded-industrial-sm text-[11px] font-bold uppercase  transition-all shadow-xl disabled:opacity-50 ${sourceType === 'internal' ? 'bg-brand-green hover:bg-brand-green shadow-brand-green/40' : 'bg-brand-green hover:bg-brand-green shadow-brand-green/40'}`}
                        >
                            {isPackaging ? 'PROCESANDO REGISTRO...' : `REGISTRAR CAFÉ ${sourceType === 'internal' ? 'PROPIO' : 'ADQUIRIDO'}`}
                        </button>
                    </form>
                ) : (
                    <div className="bg-gradient-to-r from-brand-green/20 to-transparent border border-gray-400 shadow-sm rounded-industrial p-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-xl font-bold uppercase  text-brand-navy">Gestión Multi-Origen</h4>
                                <p className="text-[11px] text-brand-navy font-bold uppercase opacity-60 mt-1">Registra producción propia o café de aliados comerciales</p>
                            </div>
                            <button
                                onClick={() => setShowPackager(true)}
                                className="px-6 py-3 bg-brand-green hover:bg-brand-green text-brand-navy rounded-xl text-[11px] font-bold uppercase transition-all shadow-xl shadow-brand-green/20 hover:scale-105"
                            >
                                Registrar Entrada
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* HISTORIAL - ALTURA SINCRONIZADA CON SECCIONES DEL FORMULARIO */}
            <div className="bg-bg-card border border-gray-400 shadow-sm p-8 rounded-industrial flex flex-col relative overflow-hidden group h-[780px]">
                <h3 className="text-[11px] font-bold text-brand-navy-bright uppercase  border-b border-gray-400 shadow-sm pb-4">Alertas de Frescura AI</h3>
                <div className="space-y-6">
                    <div className="p-6 bg-white border border-gray-400 shadow-sm rounded-industrial-sm">
                        <p className="text-[11px] text-brand-navy uppercase font-bold mb-2">✓ Calidad Óptima</p>
                        <p className="text-xs leading-relaxed text-gray-300">
                            95% de su inventario se encuentra en la ventana de frescura ideal (7-21 días post-tueste).
                        </p>
                    </div>
                    <div className="h-px bg-white"></div>
                    <div>
                        <p className="text-[11px] text-brand-navy uppercase mb-4">Métricas de Empaque (Mes)</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-bg-main rounded-xl border border-gray-400 shadow-sm text-center">
                                <p className="text-2xl font-bold er text-brand-navy">{inventory.reduce((acc, curr) => acc + (curr.unit_size_grams === 250 ? curr.units_produced : 0), 0) || 182}</p>
                                <p className="text-[9px] text-gray-600 font-bold uppercase">Bolsas 250g</p>
                            </div>
                            <div className="p-4 bg-bg-main rounded-xl border border-gray-400 shadow-sm text-center">
                                <p className="text-2xl font-bold er text-brand-navy">{inventory.reduce((acc, curr) => acc + (curr.unit_size_grams === 500 ? curr.units_produced : 0), 0) || 54}</p>
                                <p className="text-[9px] text-gray-600 font-bold uppercase">Bolsas 500g</p>
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
            <div className="bg-bg-card border border-gray-400 shadow-sm rounded-industrial p-12">
                <h3 className="text-sm font-bold uppercase mb-8">Diseñador de Etiquetas Pro</h3>
                <form className="space-y-6">
                    <div>
                        <label className="text-[11px] font-bold text-brand-navy uppercase ">Seleccionar Lote de Tueste</label>
                        <select className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-xl px-4 py-3 mt-1 outline-none focus:border-black">
                            <option>AX-2130 - Geisha Natural</option>
                            <option>AX-1942 - Bourbon Semi-Washed</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-brand-navy uppercase ">Marca Destino</label>
                        <input type="text" placeholder="Asociación Tatama" className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-xl px-4 py-3 mt-1 outline-none font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="py-4 bg-white hover:bg-white text-brand-navy rounded-xl text-xs font-bold uppercase">Vista Previa</button>
                        <button type="button" className="py-4 bg-brand-green hover:bg-brand-green text-brand-navy rounded-xl text-xs font-bold uppercase">Imprimir (Zebra/PDF)</button>
                    </div>
                </form>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-12 rounded-industrial text-brand-navy">
                <div className="w-full aspect-[3/4] border-4 border-black p-8 flex flex-col justify-between relative">
                    <div className="space-y-2">
                        <h4 className="text-4xl font-bold uppercase leading-tight">AxIs<br />CoFfeE</h4>
                        <div className="h-2 w-20 bg-black"></div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase er">Variedad</p>
                            <p className="text-xl font-bold uppercase">Geisha Especial</p>
                        </div>
                        <div className="flex justify-between border-t-2 border-black pt-4">
                            <div>
                                <p className="text-[9px] font-bold uppercase">Tostión</p>
                                <p className="text-sm font-bold">Omni-Roast</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold uppercase">Peso</p>
                                <p className="text-sm font-bold">250g / 8.8oz</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="w-24 h-24 bg-white flex items-center justify-center p-2 rounded-lg shadow-sm border border-black">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'https://axisone.coffee' : window.location.origin) : 'https://axisone.coffee') + '/trace/AX-DEMO')}`}
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
                <p className="mt-6 text-[11px] text-brand-navy uppercase font-mono  font-bold">Demo de Etiqueta Térmica de Alta Resolución</p>
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
                    className="flex-1 bg-bg-card border border-gray-400 shadow-sm rounded-xl px-4 py-3 outline-none focus:border-black text-xs font-bold uppercase"
                />
                <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-brand-green rounded-xl text-[11px] font-bold uppercase"
                >
                    Explorar
                </button>
            </div>

            <div className="max-w-md mx-auto bg-bg-main border border-gray-400 shadow-sm rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-white rounded-full flex items-center justify-center text-[9px] font-mono text-brand-navy uppercase z-20">AXIS Mobile App</div>

                <div className="h-64 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=3540&auto=format&fit=crop" className="w-full h-full object-cover grayscale" alt="Farm" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent blur-sm"></div>
                </div>

                <div className="p-8 -mt-12 bg-bg-main rounded-t-[3rem] relative space-y-8">
                    {isLoading ? (
                        <div className="py-20 text-center text-[11px] font-bold text-brand-navy uppercase  animate-pulse">Consultando Origen...</div>
                    ) : (
                        <>
                            <header>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-3xl font-bold uppercase er leading-none">{story?.producer?.split(' ')[0] || 'Asociación'}<br />{story?.producer?.split(' ')[1] || 'Tatama'}</h3>
                                    <span className="bg-white border border-gray-400 shadow-sm text-brand-navy text-[11px] font-bold px-3 py-1 rounded-full uppercase border border-gray-400 shadow-sm">Lote {story?.roast?.batch_id_label || searchBatch}</span>
                                </div>
                                <p className="text-xs text-brand-navy mt-6 leading-relaxed font-medium">
                                    Este café fue cultivado en la finca <strong>{story?.farm || 'Alejandría'}</strong> a {story?.height || '1.850 msnm'}.
                                </p>
                            </header>

                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-gray-400 shadow-sm">
                                <div className="text-center">
                                    <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Proceso</p>
                                    <p className="text-xs font-bold uppercase text-brand-navy">{story?.process || 'Natural'}</p>
                                </div>
                                <div className="text-center border-x border-gray-400 shadow-sm">
                                    <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Puntaje</p>
                                    <p className="text-xs font-bold text-brand-navy-bright">{story?.sensoryScore || 87.5} pts (basado en estándares de la SCA)</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-brand-navy uppercase font-bold mb-1">Tueste</p>
                                    <p className="text-xs font-bold uppercase text-brand-navy">Perfil Oro</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-bold uppercase  text-brand-navy-bright">Notas Catadas</h4>
                                <div className="flex flex-wrap gap-2 text-[9px]">
                                    {story?.notes?.map((note: string) => (
                                        <span key={note} className="px-3 py-1 bg-white rounded-full border border-gray-400 shadow-sm font-bold uppercase">{note}</span>
                                    )) || (
                                            <>
                                                <span className="px-3 py-1 bg-white rounded-full border border-gray-400 shadow-sm font-bold uppercase">Chocolate</span>
                                                <span className="px-3 py-1 bg-white rounded-full border border-gray-400 shadow-sm font-bold uppercase">Frutos Rojos</span>
                                            </>
                                        )}
                                </div>
                            </div>

                            <div className="p-6 bg-white border border-gray-400 shadow-sm text-brand-navy rounded-3xl space-y-2">
                                <h4 className="text-[11px] font-bold uppercase  text-brand-navy-bright">Recomendación Tatama</h4>
                                <p className="text-[11px] font-bold uppercase leading-relaxed">Muele fino para V60: Ratio 1:15 con agua a 92°C para resaltar la acidez dinámica de este lote.</p>
                            </div>

                            <button className="w-full py-4 bg-white hover:bg-white text-brand-navy hover:text-brand-navy border border-gray-400 shadow-sm rounded-industrial-sm text-[11px] font-bold uppercase  transition-all">Ver Telemetría Roaster</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SalesDashboard({ user, inventory, onSaleComplete }: {
    user: any,
    inventory: any[],
    onSaleComplete?: () => void
}) {
    const [sales, setSales] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [saleForm, setSaleForm] = useState({
        inventoryId: '',
        unitsSold: 1,
        deliveryType: 'grano' as 'grano' | 'molido',
        totalSaleCop: 0,
        saleChannel: 'POS Físico'
    });

    useEffect(() => {
        loadSalesData();
    }, []);

    const loadSalesData = async () => {
        setIsLoading(true);

        const { data: salesData } = await supabase
            .from('sales_records')
            .select('*, retail_inventory(sku, unit_size_grams)')
            .eq('company_id', user?.companyId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (salesData) setSales(salesData);
        setIsLoading(false);
    };

    const handleSale = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await processRetailSale({
            ...saleForm,
            companyId: user?.companyId || ''
        });

        if (result.success) {
            alert(result.message);
            await loadSalesData();
            if (onSaleComplete) onSaleComplete();
        } else {
            alert("Error: " + result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="bg-bg-card border border-gray-400 shadow-sm p-8 rounded-3xl">
                    <p className="text-[11px] text-brand-navy uppercase font-bold  mb-2 font-mono">Ventas (Total Masa)</p>
                    <h4 className="text-3xl font-bold er">
                        {sales.reduce((acc, curr) => acc + (Number(curr.grams_deducted) || 0), 0).toFixed(1)}
                        <span className="text-xs text-brand-navy-bright ml-2 font-mono">G</span>
                    </h4>
                </div>
                <div className="bg-bg-card border border-gray-400 shadow-sm p-8 rounded-3xl">
                    <p className="text-[11px] text-brand-navy uppercase font-bold  mb-2 font-mono">Ingresos Netos</p>
                    <h4 className="text-3xl font-bold er">
                        ${sales.reduce((acc, curr) => acc + (Number(curr.total_sale_cop) || 0), 0).toLocaleString()}
                        <span className="text-xs text-brand-navy-bright ml-1">COP</span>
                    </h4>
                </div>
                <div className="bg-bg-card border border-gray-400 shadow-sm p-8 rounded-3xl">
                    <p className="text-[11px] text-brand-navy uppercase font-bold  mb-2 font-mono">Ticket Promedio Masa</p>
                    <h4 className="text-3xl font-bold er">
                        {sales.length > 0 ? (sales.reduce((acc, curr) => acc + (Number(curr.grams_deducted) || 0), 0) / sales.length).toFixed(0) : 0}g
                    </h4>
                </div>
                <div className="bg-bg-card border border-gray-400 shadow-sm p-8 rounded-3xl">
                    <p className="text-[11px] text-brand-navy uppercase font-bold  mb-2 font-mono">Merma Molienda</p>
                    <h4 className="text-3xl font-bold er text-brand-navy">
                        {sales.filter(s => s.delivery_type === 'molido').reduce((acc, curr) => acc + (Number(curr.grams_deducted) * 0.01), 0).toFixed(1)}g
                    </h4>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Venta Rápida */}
                <div className="bg-gradient-to-br from-bg-card to-brand-green-dark/10 border border-gray-400 shadow-sm p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white blur-3xl rounded-full"></div>
                    <h3 className="text-sm font-bold uppercase  mb-8 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                        Registrar Venta (POS)
                    </h3>

                    <form onSubmit={handleSale} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-brand-navy uppercase  block">Seleccionar Producto</label>
                            <div className="relative group/select">
                                <select
                                    required
                                    value={saleForm.inventoryId}
                                    onChange={(e) => setSaleForm({ ...saleForm, inventoryId: e.target.value })}
                                    className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-xl px-4 py-4 text-xs font-bold outline-none focus:border-black appearance-none pr-12"
                                >
                                    <option value="">Seleccionar SKU...</option>
                                    {inventory.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.sku} - {item.unit_size_grams}g ({item.total_grams_available}g disp.)
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-hover/select:text-brand-navy transition-colors">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <NumericInput
                                label="Unidades"
                                value={saleForm.unitsSold}
                                onChange={(val) => setSaleForm({ ...saleForm, unitsSold: Math.round(val) })}
                                step={1}
                                min={1}
                                required
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-sm py-4"
                            />
                            <NumericInput
                                label="Valor Venta (COP)"
                                value={saleForm.totalSaleCop}
                                onChange={(val) => setSaleForm({ ...saleForm, totalSaleCop: Math.round(val) })}
                                step={1000}
                                min={0}
                                required
                                disabled={isSubmitting}
                                variant="industrial"
                                inputClassName="text-sm py-4"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-brand-navy uppercase ">Estado de Entrega</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSaleForm({ ...saleForm, deliveryType: 'grano' })}
                                    className={`py-4 rounded-xl text-[11px] font-bold uppercase transition-all border ${saleForm.deliveryType === 'grano' ? 'bg-brand-green border-black text-brand-navy shadow-lg' : 'bg-bg-main border-gray-400 shadow-sm text-brand-navy'}`}
                                >
                                    En Grano
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSaleForm({ ...saleForm, deliveryType: 'molido' })}
                                    className={`py-4 rounded-xl text-[11px] font-bold uppercase transition-all border ${saleForm.deliveryType === 'molido' ? 'bg-brand-green border-black text-brand-navy shadow-lg' : 'bg-bg-main border-gray-400 shadow-sm text-brand-navy'}`}
                                >
                                    Molido (+1%)
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !saleForm.inventoryId}
                            className="w-full py-6 bg-white hover:bg-brand-green text-brand-navy hover:text-brand-navy font-bold rounded-xl text-xs uppercase  transition-all shadow-2xl disabled:opacity-30"
                        >
                            {isSubmitting ? 'SINCRONIZANDO VENTA...' : 'PROCEDER A DESPACHO'}
                        </button>
                    </form>
                </div>

                {/* Historial de Transacciones */}
                <div className="lg:col-span-2 bg-bg-card border border-gray-400 shadow-sm p-10 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                    <h3 className="text-sm font-bold uppercase  mb-8 border-b border-gray-400 shadow-sm pb-6">Log de Transacciones Omni-Canal</h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {isLoading ? (
                            <div className="py-20 text-center text-[11px] font-bold text-brand-navy uppercase  animate-pulse">Consultando Registro de Ventas...</div>
                        ) : sales.length === 0 ? (
                            <div className="py-20 text-center text-[11px] text-gray-600 font-bold uppercase ">Sin transacciones hoy</div>
                        ) : (
                            sales.map(sale => (
                                <div key={sale.id} className="group p-6 bg-bg-main/50 border border-gray-400 shadow-sm hover:border-gray-400 shadow-sm rounded-2xl flex items-center justify-between transition-all">
                                    <div className="flex gap-5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sale.delivery_type === 'molido' ? 'bg-white text-brand-navy-bright' : 'bg-white text-brand-navy-bright'}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-brand-navy uppercase ">SKU: {sale.retail_inventory?.sku}</p>
                                            <p className="text-[11px] text-brand-navy font-bold uppercase mt-1">
                                                Canal: {sale.sale_channel} | {sale.delivery_type === 'molido' ? 'Despacho Molido' : 'Grano Entero'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-brand-navy er leading-none">${Number(sale.total_sale_cop).toLocaleString()}</p>
                                        <p className="text-[11px] text-brand-red-bright font-bold mt-1 uppercase er">-{Number(sale.grams_deducted).toFixed(1)}g</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
