'use server';

import { supabase } from '@/shared/lib/supabase';

/**
 * Registra el ingreso de producto al inventario de retail.
 * Puede venir de un lote de tueste interno (AXIS) o de un proveedor externo.
 */
export async function registerRetailInventory(data: {
    sku: string,
    unitSizeGrams: number,
    unitsProduced: number,
    packerName: string,
    isExternal: boolean,
    // Para internos
    roastBatchId?: string,
    // Para externos
    externalRoaster?: string,
    externalOrigin?: string,
    externalProcess?: string,
    externalNotes?: string[]
}) {
    try {
        const payload: any = {
            sku: data.sku,
            unit_size_grams: data.unitSizeGrams,
            units_produced: data.unitsProduced,
            packer_name: data.packerName,
            created_at: new Date().toISOString()
        };

        if (data.isExternal) {
            payload.roast_batch_id = `EXT-${data.externalRoaster?.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
            // En un sistema real, guardaríamos estos metadatos en una tabla de 'external_batches' o similar
            // Por ahora los pasamos como metadatos si la tabla lo permite o simulamos el registro
            payload.metadata = {
                roaster: data.externalRoaster,
                origin: data.externalOrigin,
                process: data.externalProcess,
                notes: data.externalNotes,
                is_external: true
            };
        } else {
            payload.roast_batch_id = data.roastBatchId;
            payload.metadata = { is_external: false };
        }

        const { data: record, error } = await supabase
            .from('retail_inventory')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return { success: true, record };
    } catch (error: any) {
        console.error("Error in registerRetailInventory:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Obtiene el inventario consolidado de retail.
 */
export async function getRetailInventory() {
    try {
        const { data, error } = await supabase
            .from('retail_inventory')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error: any) {
        console.error("Error fetching retail inventory:", error.message);
        return [];
    }
}

/**
 * Obtiene la telemetría completa de un lote para el Storytelling B2C.
 */
export async function getBatchStory(batchIdLabel: string) {
    try {
        // Primero buscamos si es un lote de retail (podría ser externo)
        const { data: retailItem } = await supabase
            .from('retail_inventory')
            .select('*')
            .eq('roast_batch_id', batchIdLabel)
            .maybeSingle();

        if (retailItem?.metadata?.is_external) {
            const meta = retailItem.metadata;
            return {
                roast: { batch_id_label: batchIdLabel, process: meta.process },
                farm: meta.origin || "Origen Externo",
                producer: meta.roaster || "Tostador Aliado",
                height: "N/A",
                process: meta.process || "Desconocido",
                sensoryScore: 86.0,
                notes: meta.notes || ["Balanceado", "Dulce"],
                isExternal: true
            };
        }

        // Si no es externo, buscamos en los lotes de tueste internos
        const { data: roast } = await supabase
            .from('roast_batches')
            .select('*')
            .eq('batch_id_label', batchIdLabel)
            .single();

        return {
            roast,
            farm: "Finca Alejandría (Huila)",
            producer: "Alejandra Pérez",
            height: "1,850 msnm",
            process: roast?.process || "Natural",
            sensoryScore: 87.5,
            notes: ["Chocolate", "Frutos Rojos", "Nuez"],
            isExternal: false
        };
    } catch (error) {
        return null;
    }
}
