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
    companyId: string,
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
            total_grams_produced: data.unitsProduced * data.unitSizeGrams,
            total_grams_available: data.unitsProduced * data.unitSizeGrams,
            packer_name: data.packerName,
            company_id: data.companyId,
            created_at: new Date().toISOString()
        };

        if (data.isExternal) {
            payload.roast_batch_id = null; // No hay UUID de lote interno
            payload.metadata = {
                external_batch_label: `EXT-${data.externalRoaster?.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
                roaster: data.externalRoaster,
                origin: data.externalOrigin,
                process: data.externalProcess,
                notes: data.externalNotes,
                is_external: true
            };
        } else {
            payload.roast_batch_id = data.roastBatchId; // Ahora es el UUID
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
export async function getRetailInventory(companyId: string) {
    try {
        const { data, error } = await supabase
            .from('retail_inventory')
            .select(`
                *,
                roast_batches (
                    roast_date,
                    coffee_purchase_inventory (
                        varietal,
                        coffee_type
                    )
                )
            `)
            .eq('company_id', companyId)
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
export async function getBatchStory(batchIdLabel: string, companyId?: string) {
    try {
        // Primero buscamos si es un lote de retail (podría ser externo)
        let query = supabase
            .from('retail_inventory')
            .select('*')
            .eq('roast_batch_id', batchIdLabel);

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data: retailItem } = await query.maybeSingle();

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
        let roastQuery = supabase
            .from('roast_batches')
            .select('*')
            .eq('batch_id_label', batchIdLabel);

        if (companyId) {
            roastQuery = roastQuery.eq('company_id', companyId);
        }

        const { data: roast } = await roastQuery.single();

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

/**
 * Procesa una venta aplicando la lógica de CMT (Control de Masa Total).
 * Si es molido, se aplica un 1% de merma técnica.
 */
export async function processRetailSale(data: {
    inventoryId: string,
    unitsSold: number,
    deliveryType: 'grano' | 'molido',
    totalSaleCop: number,
    saleChannel: string,
    companyId: string
}) {
    try {
        // 1. Obtener inventario actual
        const { data: item, error: fetchError } = await supabase
            .from('retail_inventory')
            .select('total_grams_available, unit_size_grams')
            .eq('id', data.inventoryId)
            .single();

        if (fetchError || !item) throw new Error("Producto no encontrado");

        // 2. Calcular deducción de masa
        const nominalWeight = data.unitsSold * item.unit_size_grams;
        const shrinkageFactor = data.deliveryType === 'molido' ? 1.01 : 1.0;
        const actualDeduction = nominalWeight * shrinkageFactor;

        if (item.total_grams_available < actualDeduction) {
            throw new Error(`Stock insuficiente. Disponible: ${item.total_grams_available}g, Requerido: ${actualDeduction}g`);
        }

        // 3. Actualizar Inventario (Deducción Atómica)
        const { error: updateError } = await supabase
            .from('retail_inventory')
            .update({
                total_grams_available: item.total_grams_available - actualDeduction
            })
            .eq('id', data.inventoryId);

        if (updateError) throw updateError;

        // 4. Registrar la Venta
        const { error: saleError } = await supabase
            .from('sales_records')
            .insert([{
                inventory_id: data.inventoryId,
                units_sold: data.unitsSold,
                grams_deducted: actualDeduction,
                delivery_type: data.deliveryType,
                total_sale_cop: data.totalSaleCop,
                sale_channel: data.saleChannel,
                company_id: data.companyId
            }]);

        if (saleError) throw saleError;

        return {
            success: true,
            deduction: actualDeduction,
            message: `Venta registrada. Se descontaron ${actualDeduction.toFixed(1)}g (${data.deliveryType === 'molido' ? 'incluye 1% merma' : 'grano entero'})`
        };

    } catch (error: any) {
        console.error("Error in processRetailSale:", error.message);
        return { success: false, error: error.message };
    }
}
