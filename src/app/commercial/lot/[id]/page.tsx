'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/shared/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LotDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [lot, setLot] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const router = useRouter();

    const [newEntry, setNewEntry] = useState({
        producer_name: '', sica_code: '', farm_name: '', municipality: '',
        variety: 'Blend / Regional', process: 'Lavado (Washed)',
        kg_received: '', c_price_day: '', premium: '', price_paid: '',
        moisture: '', density: '', yield_factor: '', defects: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch lot
        const { data: lotData } = await supabase.from('commercial_lots').select('*').eq('id', id).single();
        if (lotData) setLot(lotData);

        // Fetch entries
        const { data: entryData } = await supabase.from('commercial_entries').select('*').eq('lot_id', id).order('created_at', { ascending: false });
        if (entryData) setEntries(entryData);
        setLoading(false);
    };

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const kg = parseFloat(newEntry.kg_received);

        // 1. Insert entry
        const { error } = await supabase.from('commercial_entries').insert([{
            lot_id: id,
            ...newEntry,
            kg_received: kg,
            c_price_day: parseFloat(newEntry.c_price_day) || 0,
            premium: parseFloat(newEntry.premium) || 0,
            price_paid: parseFloat(newEntry.price_paid) || 0,
            moisture: parseFloat(newEntry.moisture) || 0,
            density: parseFloat(newEntry.density) || 0,
            yield_factor: parseFloat(newEntry.yield_factor) || 0,
            defects: parseFloat(newEntry.defects) || 0
        }]);

        if (!error) {
            // 2. Update accumulated kg
            const newTotal = (lot.accumulated_kg || 0) + kg;
            await supabase.from('commercial_lots').update({ accumulated_kg: newTotal }).eq('id', id);
            
            setIsAdding(false);
            setNewEntry({
                producer_name: '', sica_code: '', farm_name: '', municipality: '',
                variety: 'Blend / Regional', process: 'Lavado (Washed)',
                kg_received: '', c_price_day: '', premium: '', price_paid: '',
                moisture: '', density: '', yield_factor: '', defects: ''
            });
            fetchData();
        } else {
            alert("Error al registrar entrada.");
        }
    };

    const handleCloseLot = async () => {
        if (!confirm("¿Estás seguro de cerrar este lote y emitir el pasaporte? No podrás agregar más entradas.")) return;
        
        await supabase.from('commercial_lots').update({ status: 'CLOSED', closed_at: new Date().toISOString() }).eq('id', id);
        router.push(`/export/commercial-passport/${id}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-brand-navy">Cargando lote...</div>;
    if (!lot) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-red-500">Lote no encontrado</div>;

    const progress = Math.min(100, Math.round((lot.accumulated_kg / lot.target_kg) * 100)) || 0;
    const isClosed = lot.status === 'CLOSED';

    // Averages Calculation
    const totalKg = entries.reduce((acc, curr) => acc + Number(curr.kg_received), 0);
    const avgMoisture = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.moisture * curr.kg_received), 0) / totalKg : 0;
    const avgYield = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.yield_factor * curr.kg_received), 0) / totalKg : 0;
    const avgPrice = totalKg > 0 ? entries.reduce((acc, curr) => acc + (curr.price_paid * curr.kg_received), 0) / totalKg : 0;

    return (
        <div className="bg-white min-h-screen p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-8 pt-4">
                <div>
                    <Link href="/commercial" className="text-[10px] font-bold text-gray-400 hover:text-brand-green uppercase tracking-widest mb-4 inline-block">
                        &larr; VOLVER A LOTES
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-brand-navy uppercase flex items-center gap-4">
                        Lote: {lot.lot_code}
                        {isClosed && <span className="text-[9px] border border-gray-200 text-gray-500 px-3 py-1 rounded-full align-middle">CERRADO</span>}
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                        Comprador: <span className="text-brand-navy">{lot.buyer || 'N/A'}</span> <span className="mx-2 text-gray-200">|</span> 
                        Preparación: <span className="text-brand-navy">{lot.preparation_protocol || 'Excelso EP'}</span> <span className="mx-2 text-gray-200">|</span>
                        Variedad: <span className="text-brand-navy">{lot.variety || 'Blend / Regional'}</span> <span className="mx-2 text-gray-200">|</span>
                        Proceso: <span className="text-brand-navy">{lot.process || 'Lavado'}</span>
                    </p>
                </div>
                <div className="text-right flex items-center gap-4">
                    <Link href={`/export/commercial-passport/${id}`} target="_blank" className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm ${isClosed ? 'bg-brand-navy text-white hover:bg-brand-navy/90' : 'bg-gray-100 text-brand-navy hover:bg-gray-200'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        {isClosed ? 'Ver Pasaporte Emitido' : 'Vista Previa Pasaporte'}
                    </Link>
                    {!isClosed && (
                        <button onClick={handleCloseLot} className="border border-brand-green text-brand-green px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-brand-green hover:text-white transition-colors shadow-sm">
                            Cerrar Lote
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Section */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        ACUMULADO / META
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">
                        Productores <span className="text-brand-navy ml-2 text-sm">{entries.length}</span>
                    </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-light text-brand-navy">{totalKg.toFixed(1)}</span>
                    <span className="text-sm font-bold text-gray-400 uppercase">/ {lot.target_kg} KG</span>
                </div>
                <div className="w-full h-[2px] bg-gray-100 mb-2 relative">
                    <div className="h-full bg-brand-green transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Faltan {Math.max(0, lot.target_kg - totalKg).toFixed(1)} KG</span>
                    <span>{progress}% Completado</span>
                </div>
            </div>

            {/* Stats (Flat Layout) */}
            <div className="grid grid-cols-3 gap-8 mb-16 border-t border-b border-gray-100 py-6">
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Precio Promedio Pagado</div>
                    <div className="text-xl font-light text-brand-navy">${avgPrice.toFixed(2)} <span className="text-[10px] font-bold text-gray-400 ml-1">COP/KG</span></div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Humedad Promedio</div>
                    <div className="text-xl font-light text-brand-navy">{avgMoisture.toFixed(2)}<span className="text-[10px] font-bold text-gray-400 ml-1">%</span></div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rendimiento Ponderado</div>
                    <div className="text-xl font-light text-brand-navy">{avgYield.toFixed(2)}</div>
                </div>
            </div>

            {/* Entries List */}
            <div className="mb-20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                        Entradas de Café
                    </h2>
                    {!isClosed && (
                        <button onClick={() => setIsAdding(true)} className="text-[10px] font-bold uppercase tracking-wider text-brand-navy hover:text-brand-green transition-colors">
                            + Registrar Ingreso
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Productor</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Volumen</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Precio</th>
                                <th className="px-4 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Humedad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs uppercase font-bold">No hay entradas registradas</td></tr>
                                ) : (
                                    entries.map((entry) => (
                                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4 text-[10px] text-gray-400">{new Date(entry.reception_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-4">
                                                <div className="text-xs font-bold text-brand-navy uppercase">{entry.producer_name}</div>
                                                <div className="text-[10px] text-gray-400 uppercase">{entry.farm_name} ({entry.municipality})</div>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-bold text-brand-navy">{entry.kg_received} KG</td>
                                            <td className="px-4 py-4">
                                                <div className="text-xs font-bold text-brand-navy">${entry.price_paid}</div>
                                                <div className="text-[9px] text-gray-400">Base: ${entry.c_price_day}</div>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-bold text-brand-navy">{entry.moisture}%</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            {/* Modal Añadir Entrada */}
            {isAdding && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex justify-between items-center z-10">
                            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                                Nuevo Ingreso de Café
                            </h2>
                            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-brand-navy">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddEntry} className="p-8 space-y-8">
                            
                            {/* Identidad */}
                            <div>
                                <h3 className="text-xs font-black text-brand-navy uppercase border-b border-gray-200 pb-2 mb-4">1. Datos del Productor</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Nombre</label><input required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" value={newEntry.producer_name} onChange={e => setNewEntry({...newEntry, producer_name: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">SICA / ID</label><input required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" value={newEntry.sica_code} onChange={e => setNewEntry({...newEntry, sica_code: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Finca</label><input required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" value={newEntry.farm_name} onChange={e => setNewEntry({...newEntry, farm_name: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Municipio</label><input required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" value={newEntry.municipality} onChange={e => setNewEntry({...newEntry, municipality: e.target.value})} /></div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Variedad</label>
                                        <select required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors cursor-pointer appearance-none" value={newEntry.variety} onChange={e => setNewEntry({...newEntry, variety: e.target.value})}>
                                            <option value="Blend / Regional">Blend / Regional</option>
                                            <option value="Castillo">Castillo</option>
                                            <option value="Caturra">Caturra</option>
                                            <option value="Colombia">Colombia</option>
                                            <option value="Cenicafé 1">Cenicafé 1</option>
                                            <option value="Bourbon">Bourbon</option>
                                            <option value="Tabi">Tabi</option>
                                            <option value="Gesha">Gesha</option>
                                            <option value="Typica">Typica</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Proceso</label>
                                        <select required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors cursor-pointer appearance-none" value={newEntry.process} onChange={e => setNewEntry({...newEntry, process: e.target.value})}>
                                            <option value="Lavado">Lavado (Washed)</option>
                                            <option value="Natural">Natural</option>
                                            <option value="Honey">Honey</option>
                                            <option value="Anaeróbico">Anaeróbico</option>
                                            <option value="Descafeinado">Descafeinado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Transaccional */}
                            <div>
                                <h3 className="text-xs font-black text-brand-navy uppercase border-b border-gray-200 pb-2 mb-4">2. Transacción y Precios</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div><label className="block text-[10px] font-bold text-brand-green uppercase mb-1">Kilos Recibidos</label><input required type="number" step="0.1" className="w-full bg-transparent border-b border-brand-green/50 py-2 text-sm font-bold text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.kg_received} onChange={e => setNewEntry({...newEntry, kg_received: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Precio C del Día</label><input required type="number" step="0.01" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.c_price_day} onChange={e => setNewEntry({...newEntry, c_price_day: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Prima Otorgada</label><input required type="number" step="0.01" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.premium} onChange={e => setNewEntry({...newEntry, premium: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-green uppercase mb-1">Precio Total Pagado</label><input required type="number" step="0.01" className="w-full bg-transparent border-b border-brand-green/50 py-2 text-sm font-bold text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.price_paid} onChange={e => setNewEntry({...newEntry, price_paid: e.target.value})} /></div>
                                </div>
                            </div>

                            {/* Laboratorio */}
                            <div>
                                <h3 className="text-xs font-black text-brand-navy uppercase border-b border-gray-200 pb-2 mb-4">3. Laboratorio Físico</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Humedad (%)</label><input required type="number" step="0.1" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.moisture} onChange={e => setNewEntry({...newEntry, moisture: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Densidad (g/L)</label><input required type="number" step="1" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.density} onChange={e => setNewEntry({...newEntry, density: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Factor Rendimiento</label><input required type="number" step="0.1" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.yield_factor} onChange={e => setNewEntry({...newEntry, yield_factor: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-bold text-brand-navy uppercase mb-1">Defectos (%)</label><input required type="number" step="0.1" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green" value={newEntry.defects} onChange={e => setNewEntry({...newEntry, defects: e.target.value})} /></div>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end gap-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-brand-navy transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="bg-brand-navy text-white px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-brand-navy/90 transition-colors shadow-sm">
                                    Guardar Ingreso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>);
}
