'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';
import CoffeePassport from '@/modules/export/components/CoffeePassport';

export default function PublicPassportVerification() {
    const params = useParams();
    const id = params.id as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchPassportData();
    }, [id]);

    const fetchPassportData = async () => {
        try {
            // El ID viene como AX-LOT-XXXX-202X o similar
            // Intentamos extraer el LOT-XXXX
            let lotId = id;
            if (id.startsWith('AX-')) {
                const parts = id.split('-');
                if (parts.length >= 3) {
                    lotId = `${parts[1]}-${parts[2]}`;
                }
            }

            // Buscamos el registro en green_exports
            const { data: exportData } = await supabase
                .from('green_exports')
                .select('*')
                .eq('lot_id', lotId)
                .maybeSingle();

            if (exportData) {
                setData({
                    export: exportData,
                    lotId: lotId
                });
            } else {
                // Si no lo encuentra como exportación, quizás es un lote de inventario directo
                const { data: lotItem } = await supabase
                    .from('coffee_purchase_inventory')
                    .select('id')
                    .eq('id', id)
                    .maybeSingle();

                if (lotItem) {
                    // Si es un UUID de inventario, redirigir a la ruta de lotes
                    window.location.href = `/verify/lot/${id}`;
                    return;
                }
            }
        } catch (err) {
            console.error("Error fetching passport:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green-bright"></div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red-bright mb-6 ring-1 ring-brand-red/20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">Activo No Verificado</h1>
            <p className="text-gray-500 uppercase text-[10px] tracking-[0.4em] max-w-xs leading-relaxed">El identificador digital <span className="text-white">{id}</span> no existe en el registro distribuido de AXIS COFFEE.</p>
            <button
                onClick={() => window.location.href = '/'}
                className="mt-12 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white border border-white/5 transition-all"
            >
                Regresar al Punto de Origen
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-4">
            <CoffeePassport
                lotData={{ batch_id: data.lotId }}
                onClose={() => window.location.href = '/'}
            />
        </div>
    );
}
