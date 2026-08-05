'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicCuppingForm from '@/modules/production/components/PublicCuppingForm';
import { supabase } from '@/shared/lib/supabase';
import PublicLeadModal, { PublicLeadData } from '@/shared/components/ui/PublicLeadModal';
import ExportReportButton from '@/shared/components/ui/ExportReportButton';

export default function PublicCVACuppingPage() {
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [cvaData, setCvaData] = useState<any>(null);
    const [finalLeadData, setFinalLeadData] = useState<PublicLeadData | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successLotId, setSuccessLotId] = useState<string | null>(null);

    const handlePublicSubmit = (data: any) => {
        setCvaData(data);
        setShowLeadModal(true);
    };

    const handleGenerateLot = async (leadData: PublicLeadData) => {
        setIsSubmitting(true);

        try {
            // Generate a unique Lot ID
            const dateStr = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const lotId = `CVA-${dateStr}-${randomCode}`;

            // Save to coffee_purchase_inventory as a public lead
            const { error: invError } = await supabase.from('coffee_purchase_inventory').insert({
                company_id: 'PUBLIC_LEAD',
                lot_number: lotId,
                purchase_date: new Date().toISOString().split('T')[0],
                farm_name: leadData.company || 'Público',
                farmer_name: leadData.name,
                purchase_weight: 0,
                thrashed_weight: 0,
                pasilla_weight: 0,
                cisco_weight: 0,
                process: cvaData?.cva_descriptive?.process || 'Sin Especificar',
                region: 'Sin Especificar',
                country: 'Colombia',
                variety: cvaData?.cva_descriptive?.variety || 'Sin Especificar',
                altitude: 0,
                purchase_value: 0,
                harvest_date: new Date().toISOString().split('T')[0],
                status: 'completed',
                process_data: {
                    lead_phone: leadData.phone,
                    lead_email: leadData.email,
                    source: 'public_cva_cupping'
                }
            });

            if (invError) throw invError;

            // Save to sca_cupping for the report view
            const { error: cuppingError } = await supabase.from('sca_cupping').insert({
                inventory_id: lotId,
                company_id: 'PUBLIC_LEAD',
                cva_descriptive: cvaData.cva_descriptive,
                cva_affective: cvaData.cva_affective,
                notes: cvaData.notes,
                taster_name: cvaData.taster_name
            });

            if (cuppingError) throw cuppingError;

            setFinalLeadData(leadData);
            setSuccessLotId(lotId);
        } catch (err: any) {
            console.error("Error generating public lot:", err);
            const msg = err?.message || err?.details || err?.hint || err?.code || JSON.stringify(err);
            alert(`Hubo un error generando el reporte: ${msg}`);
        } finally {
            setIsSubmitting(false);
            setShowLeadModal(false);
        }
    };

    if (successLotId && finalLeadData) {
        return (
            <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-start p-6 text-white text-center pb-20">
                <div className="max-w-4xl mx-auto mb-8 mt-4 text-center">
                    <div className="w-16 h-16 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-green">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 uppercase">Report Secured</h2>
                    <p className="text-white/70 mb-2 font-medium">
                        Your data has been processed. You have been assigned lot code: <strong className="text-brand-green">{successLotId}</strong>
                    </p>
                    <p className="text-sm text-white/40 max-w-2xl mx-auto mb-6">
                        Save this ID. You will use it later to connect with Axis One Coffee and attach cupping information.
                    </p>
                    
                    <div className="flex justify-center gap-4">
                        <Link href="/" className="px-6 py-4 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors uppercase text-[11px] tracking-wider flex items-center">
                            Back to Home
                        </Link>
                        <ExportReportButton elementId="public-cupping-report" fileName={successLotId} />
                    </div>
                </div>

                <div className="scale-[0.8] md:scale-100 origin-top bg-white rounded-3xl overflow-hidden p-6 text-brand-navy shadow-xl w-full max-w-5xl" id="public-cupping-report">
                    <div className="mb-6 flex flex-col items-center justify-center text-center pb-6 border-b border-gray-200">
                        <img src="/logo.png" alt="AXISONE" className="h-10 w-auto mb-4" />
                        <h2 className="text-2xl font-black uppercase text-brand-navy">CVA Cupping Report</h2>
                        <p className="text-xs uppercase font-bold text-gray-500">ID: {successLotId}</p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Produced for: {finalLeadData.name} ({finalLeadData.company})</p>
                    </div>
                    <PublicCuppingForm 
                        inventoryId={successLotId} 
                        isReadOnly={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-white text-brand-navy">
            {/* Simple Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-4 group">
                        <img src="/logo.png" alt="AXISONE" className="h-10 w-auto" />
                        <div className="h-6 w-px bg-black/10"></div>
                        <span className="text-sm font-black tracking-widest text-brand-green uppercase">TOOLBOX / CVA CUPPING</span>
                    </Link>
                    <Link href="/" className="text-xs font-bold uppercase text-gray-500 hover:text-brand-navy transition-colors">
                        Cerrar ✕
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-12 max-w-4xl mx-auto text-center">
                    <div className="inline-block mb-6">
                        <h1 className="text-2xl md:text-4xl font-black text-white bg-brand-navy px-8 py-4 rounded-2xl shadow-xl border border-white/10 uppercase tracking-tight flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
                            CVA Cupping Protocol
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-white/20 border border-white/40 text-[10px] font-black text-white uppercase tracking-widest shadow-inner">Free Tool</span>
                        </h1>
                    </div>
                    <p className="text-gray-600 font-medium max-w-xl mx-auto text-sm md:text-base">
                        Perform a professional Coffee Value Assessment (CVA) sensory evaluation. Complete the form to generate a certified report.
                    </p>
                    <div className="mt-10 max-w-4xl mx-auto border-t-[3px] border-gray-300 w-11/12 rounded-full"></div>
                </div>

                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100">
                    <PublicCuppingForm
                        isPublic={true}
                        onPublicSubmit={handlePublicSubmit}
                    />
                </div>
            </main>

            {/* Lead Capture Modal */}
            <PublicLeadModal 
                isOpen={showLeadModal}
                onClose={() => setShowLeadModal(false)}
                onSubmit={handleGenerateLot}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
