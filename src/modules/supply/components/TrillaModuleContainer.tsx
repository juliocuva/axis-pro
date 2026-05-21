'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import ThrashingForm from './thrashing/ThrashingForm';

export default function TrillaModuleContainer({ user }: { user: any }) {
    const [availableLots, setAvailableLots] = useState<any[]>([]);
    const [selectedLotId, setSelectedLotId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchInventory = async () => {
        if (!user?.companyId) return;
        setIsLoading(true);
        // Traer lotes de acopio que no han sido trillados
        let { data, error } = await supabase
            .from('coffee_purchase_inventory')
            .select('*')
            .eq('company_id', user.companyId)
            // .or('status.eq.purchased,status.is.null,status.eq.stored')
            .order('created_at', { ascending: false })
            .limit(20);

        if (!data || data.length === 0) {
            console.warn("No lots found for companyId. Falling back to all recent lots...");
            const fallback = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            data = fallback.data;
            error = fallback.error;
        }

        console.log("ALL LOTS FETCHED:", data);

        if (!error && data) {
            setAvailableLots(data);

            // Auto seleccionar primero pendiente
            const pendingLot = data.find(r =>
                r.coffee_type !== 'excelso' && (
                    r.status === 'purchased' ||
                    r.status === null ||
                    r.status === 'stored' ||
                    !r.status
                )
            );

            if (pendingLot) {
                setSelectedLotId(pendingLot.id);
            } else if (data.length > 0) {
                setSelectedLotId(data[0].id);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInventory();
    }, [user]);

    const handleThrashingComplete = async () => {
        await fetchInventory();
    };

    const handleLotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLotId(e.target.value);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ENCABEZADO */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-gray-400 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black uppercase er text-brand-navy">Planta & Trilla</h2>
                    <p className="text-[11px] text-brand-navy font-bold uppercase  mt-1">Control de Mermas y Rendimiento</p>
                </div>

                {/* SELECTOR DE LOTE */}
                <div className="w-full sm:w-auto min-w-[300px]">
                    <label className="text-[9px] text-brand-navy font-bold uppercase  mb-1.5 block">Lote en Línea de Proceso</label>
                    <div className="relative group/select">
                        <select
                            value={selectedLotId}
                            onChange={handleLotChange}
                            disabled={isLoading}
                            className="w-full bg-white border border-gray-400 shadow-sm text-brand-navy text-xs py-3.5 px-4 rounded-industrial appearance-none focus:outline-none focus:border-black cursor-pointer font-bold uppercase  transition-all hover:bg-white"
                        >
                            {isLoading ? (
                                <option>Cargando Lotes...</option>
                            ) : availableLots.length === 0 ? (
                                <option>Sin Lotes en Bodega</option>
                            ) : (
                                availableLots.map(lot => {
                                    const isThrashed = lot.status === 'thrashed' || lot.status === 'completed' || lot.coffee_type === 'excelso';
                                    return (
                                        <option key={lot.id} value={lot.id} className="bg-bg-card text-brand-navy">
                                            {isThrashed ? '[TRILLADO / ORO] ' : '[PERGAMINO PENDIENTE] '} - {lot.lot_number || 'LOTE'} ({lot.purchase_weight}kg)
                                        </option>
                                    );
                                })
                            )}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy group-hover/select:text-brand-navy transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>
            </header>

            {selectedLotId ? (
                availableLots.find(l => l.id === selectedLotId)?.coffee_type === 'excelso' ? (
                    <div className="h-64 bg-white border border-gray-400 shadow-sm rounded-industrial flex flex-col items-center justify-center gap-4 text-brand-navy p-6 text-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                        <div>
                            <p className="text-xl uppercase font-bold  text-brand-navy-bright mb-2">Ingreso Finalizado (Café Oro)</p>
                            <p className="text-[11px] text-brand-navy/70 font-bold uppercase  max-w-md">Este lote fue registrado originalmente como Café Excelso (Oro). No requiere pasar por el proceso industrial de trilla ni cálculo de mermas.</p>
                        </div>
                    </div>
                ) : (
                    <ThrashingForm
                        inventoryId={selectedLotId}
                        parchmentWeight={availableLots.find(l => l.id === selectedLotId)?.purchase_weight || 0}
                        onThrashingComplete={handleThrashingComplete}
                        user={user}
                    />
                )
            ) : (
                <div className="h-64 border border-dashed border-gray-400 shadow-sm rounded-industrial flex flex-col items-center justify-center gap-4 text-brand-navy">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    <p className="text-xs uppercase font-bold ">Selecciona un lote para iniciar la trilla</p>
                </div>
            )}
        </div>
    );
}

