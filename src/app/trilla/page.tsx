'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThrashingForm from '@/modules/supply/components/thrashing/ThrashingForm';
import { supabase } from '@/shared/lib/supabase';

export default function PublicTrillaPage() {
    const [publicWeight, setPublicWeight] = useState(400);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [trillaData, setTrillaData] = useState<any>(null);

    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadCompany, setLeadCompany] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successLotId, setSuccessLotId] = useState<string | null>(null);

    const handlePublicSubmit = (data: any) => {
        setTrillaData(data);
        setShowLeadModal(true);
    };

    const handleGenerateLot = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Generate a unique Lot ID
            const dateStr = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const lotId = `TRILLA-${dateStr}-${randomCode}`;

            // Save to coffee_purchase_inventory as a public lead
            const { error } = await supabase.from('coffee_purchase_inventory').insert({
                company_id: 'PUBLIC_LEAD',
                lot_number: lotId,
                purchase_date: new Date().toISOString().split('T')[0],
                farm_name: leadCompany || 'Público',
                farmer_name: leadName,
                purchase_weight: publicWeight,
                thrashed_weight: trillaData.excelsoWeight,
                pasilla_weight: trillaData.pasillaWeight,
                cisco_weight: trillaData.ciscoWeight,
                process: trillaData.processType,
                humidity: trillaData.humidity,
                status: 'trilla_completed',
                process_data: {
                    ...trillaData,
                    lead_phone: leadPhone,
                    source: 'public_landing_page'
                }
            });

            if (error) throw error;

            setSuccessLotId(lotId);
        } catch (err) {
            console.error("Error generating public lot:", err);
            alert("Hubo un error generando el lote. Por favor intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successLotId) {
        return (
            <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="bg-[#0b1727] p-10 rounded-3xl border border-brand-green/20 max-w-lg w-full shadow-2xl">
                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-green">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black mb-4">Reporte Asegurado</h2>
                    <p className="text-white/70 mb-8 font-medium">
                        Tus datos han sido procesados. Se te ha asignado el siguiente código de lote único en nuestro sistema:
                    </p>
                    <div className="bg-brand-navy border border-white/10 py-4 px-6 rounded-xl mb-8">
                        <span className="text-2xl font-mono font-black text-brand-green">{successLotId}</span>
                    </div>
                    <p className="text-sm text-white/50 mb-8">
                        Guarda este ID. Te servirá más adelante para conectarte con Axis One Coffee y anexar información de fermentación o catación a este mismo lote.
                        <br/><br/>
                        * La pasarela para descargar el certificado PDF con Hash criptográfico estará disponible muy pronto.
                    </p>
                    <Link href="/" className="inline-block bg-white text-brand-navy font-black uppercase text-sm px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors">
                        Volver al Inicio
                    </Link>
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
                        <span className="text-sm font-black tracking-widest text-brand-green uppercase">TOOLBOX / TRILLA</span>
                    </Link>
                    <Link href="/" className="text-xs font-bold uppercase text-gray-500 hover:text-brand-navy transition-colors">
                        Cerrar ✕
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-black text-brand-navy uppercase tracking-tight mb-4">
                        Calculadora de Trilla
                    </h1>
                    <p className="text-gray-600 font-medium">
                        Ingresa tus parámetros para calcular el factor de rendimiento, mermas y balances de masa de tu lote. Prueba la herramienta gratis.
                    </p>
                </div>

                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100">
                    <ThrashingForm
                        isPublic={true}
                        parchmentWeight={publicWeight}
                        onChangeParchmentWeight={setPublicWeight}
                        onPublicSubmit={handlePublicSubmit}
                        onThrashingComplete={() => {}}
                        user={null}
                    />
                </div>
            </main>

            {/* Lead Capture Modal */}
            {showLeadModal && (
                <div className="fixed inset-0 z-[100] bg-brand-navy/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setShowLeadModal(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-brand-navy"
                        >
                            ✕
                        </button>
                        
                        <h3 className="text-2xl font-black text-brand-navy mb-2 uppercase tracking-tight">Obtener Certificado</h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium">
                            Para generar tu reporte con Hash Criptográfico y asegurar estos datos, regístrate a continuación.
                        </p>

                        <form onSubmit={handleGenerateLot} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    required
                                    value={leadName}
                                    onChange={e => setLeadName(e.target.value)}
                                    className="w-full border-b-2 border-gray-200 py-2 focus:border-brand-green outline-none transition-colors font-bold text-brand-navy text-sm"
                                    placeholder="Ej: Julio César"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Empresa / Finca</label>
                                <input 
                                    type="text" 
                                    required
                                    value={leadCompany}
                                    onChange={e => setLeadCompany(e.target.value)}
                                    className="w-full border-b-2 border-gray-200 py-2 focus:border-brand-green outline-none transition-colors font-bold text-brand-navy text-sm"
                                    placeholder="Ej: Finca El Paraíso"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">WhatsApp / Teléfono</label>
                                <input 
                                    type="tel" 
                                    required
                                    value={leadPhone}
                                    onChange={e => setLeadPhone(e.target.value)}
                                    className="w-full border-b-2 border-gray-200 py-2 focus:border-brand-green outline-none transition-colors font-bold text-brand-navy text-sm"
                                    placeholder="+57 300 000 0000"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-brand-green text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl mt-4 hover:bg-brand-navy transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'GENERANDO...' : 'REGISTRAR Y CONTINUAR'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
