'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/shared/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CommercialDashboard() {
    const [lots, setLots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();

    const [newLot, setNewLot] = useState({
        lot_code: '',
        buyer: '',
        exporter: '',
        target_kg: '',
        variety: 'Blend',
        process: 'Lavado',
        preparation_protocol: 'Excelso EP'
    });

    useEffect(() => {
        fetchLots();
    }, []);

    const fetchLots = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('commercial_lots')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setLots(data);
        }
        setLoading(false);
    };

    const handleCreateLot = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('commercial_lots')
            .insert([{
                lot_code: newLot.lot_code,
                buyer: newLot.buyer,
                exporter: newLot.exporter,
                target_kg: parseFloat(newLot.target_kg),
                variety: newLot.variety,
                process: newLot.process,
                preparation_protocol: newLot.preparation_protocol,
                status: 'OPEN'
            }])
            .select()
            .single();
        
        if (!error && data) {
            setIsCreating(false);
            setNewLot({ lot_code: '', buyer: '', exporter: '', target_kg: '', variety: 'Blend', process: 'Lavado', preparation_protocol: 'Excelso EP' });
            router.push(`/commercial/lot/${data.id}`);
        } else {
            alert("Error creando lote. Asegúrate de haber corrido las migraciones SQL.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-xl font-bold tracking-tight text-brand-navy uppercase">Consolidación Comercial</h1>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-brand-navy text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-brand-navy/90 transition-colors flex items-center gap-2 shadow-sm"
                >
                    + NUEVO LOTE COMERCIAL
                </button>
            </div>

                <main>
                    {loading ? (
                        <div className="text-center py-20 text-brand-navy/50 font-bold uppercase text-xs tracking-widest">
                            Cargando lotes...
                        </div>
                    ) : lots.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="text-4xl mb-4">📦</div>
                            <h3 className="text-sm font-black uppercase text-brand-navy mb-2">No hay lotes activos</h3>
                            <p className="text-xs text-brand-navy/50 max-w-sm mx-auto mb-6 leading-relaxed">
                                Comienza creando un nuevo lote comercial para empezar a consolidar las entregas de tus productores.
                            </p>
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="bg-brand-navy text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-brand-navy/90 transition-colors"
                            >
                                Crear Primer Lote
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {lots.map(lot => {
                                const progress = Math.min(100, Math.round((lot.accumulated_kg / lot.target_kg) * 100)) || 0;
                                const isOpen = lot.status === 'OPEN';
                                
                                return (
                                    <Link key={lot.id} href={`/commercial/lot/${lot.id}`} className="group block bg-white p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors relative overflow-hidden">
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-100">
                                            <div className="h-full bg-brand-green transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        
                                        <div className="grid grid-cols-5 gap-6 items-center">
                                            <div className="col-span-1">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                    {isOpen ? 'EN CONSOLIDACIÓN' : 'LOTE CERRADO'}
                                                </div>
                                                <h3 className="text-sm font-bold text-brand-navy uppercase">{lot.lot_code}</h3>
                                            </div>
                                            
                                            <div className="col-span-1">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Comprador</div>
                                                <div className="text-xs font-bold text-brand-navy truncate">{lot.buyer || 'No especificado'}</div>
                                            </div>
                                            
                                            <div className="col-span-1">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Preparación / Variedad</div>
                                                <div className="text-xs font-bold text-brand-navy truncate">{lot.preparation_protocol || 'EP'} - {lot.variety || 'Blend'}</div>
                                            </div>

                                            <div className="col-span-1">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Volumen</div>
                                                <div className="text-xs font-bold text-brand-navy">
                                                    {lot.accumulated_kg} <span className="text-[10px] text-gray-400">/ {lot.target_kg} KG</span>
                                                </div>
                                            </div>

                                            <div className="col-span-1 text-right">
                                                <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase border ${isOpen ? 'border-brand-green text-brand-green bg-brand-green/5' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                                                    {progress}% Completado
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </main>
            {/* Modal Crear Lote */}
            {isCreating && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden border border-gray-200 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Crear Nuevo Lote</h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-brand-navy">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateLot} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase tracking-wide mb-1">CÓDIGO DEL LOTE</label>
                                <input required type="text" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" placeholder="Ej. AX-2026-001" value={newLot.lot_code} onChange={e => setNewLot({...newLot, lot_code: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase tracking-wide mb-1">COMPRADOR / DESTINO</label>
                                <input type="text" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" placeholder="Ej. Dubai Coffee Roasters" value={newLot.buyer} onChange={e => setNewLot({...newLot, buyer: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase tracking-wide mb-1">EXPORTADOR</label>
                                <input required type="text" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" placeholder="Ej. Cooperativa XYZ" value={newLot.exporter} onChange={e => setNewLot({...newLot, exporter: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase tracking-wide mb-1">META DE VOLUMEN (KG)</label>
                                <input required type="number" min="1" step="0.1" className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors" placeholder="Ej. 2000" value={newLot.target_kg} onChange={e => setNewLot({...newLot, target_kg: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-navy uppercase tracking-wide mb-1">VARIEDAD DEL LOTE</label>
                                    <select required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors cursor-pointer appearance-none" value={newLot.variety} onChange={e => setNewLot({...newLot, variety: e.target.value})}>
                                        <option value="Blend">Blend (Mezcla)</option>
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
                                    <label className="block text-[10px] font-bold text-brand-navy uppercase tracking-wide mb-1">PROCESO</label>
                                    <select required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors cursor-pointer appearance-none" value={newLot.process} onChange={e => setNewLot({...newLot, process: e.target.value})}>
                                        <option value="Lavado">Lavado (Washed)</option>
                                        <option value="Natural">Natural</option>
                                        <option value="Honey">Honey</option>
                                        <option value="Anaeróbico">Anaeróbico</option>
                                        <option value="Descafeinado">Descafeinado</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-brand-navy uppercase tracking-wide mb-1">PROTOCOLO DE PREPARACIÓN (TRILLA)</label>
                                <select required className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-brand-navy uppercase focus:outline-none focus:border-brand-green transition-colors cursor-pointer appearance-none" value={newLot.preparation_protocol} onChange={e => setNewLot({...newLot, preparation_protocol: e.target.value})}>
                                    <option value="Excelso EP">Excelso EP (European Preparation)</option>
                                    <option value="Excelso UGQ">Excelso UGQ (Usual Good Quality)</option>
                                    <option value="Supremo 17/18">Supremo 17/18</option>
                                    <option value="Supremo 18+">Supremo 18+</option>
                                    <option value="Premium">Premium</option>
                                    <option value="Especial">Especial / Microlote</option>
                                </select>
                            </div>
                            <div className="pt-8 text-right">
                                <button type="submit" className="bg-brand-navy text-white px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-brand-navy/90 transition-colors shadow-sm">
                                    INICIALIZAR LOTE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>);
}
