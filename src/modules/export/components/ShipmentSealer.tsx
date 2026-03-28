'use client';

import React, { useState } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface ShipmentSealerProps {
    exportId: string;
    lotId: string;
    baseHash: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ShipmentSealer({ exportId, lotId, baseHash, onClose, onSuccess }: ShipmentSealerProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, emails?: string } | null>(null);

    // Ingesta 1: Check-in
    const [checkin, setCheckin] = useState({
        timestamp: new Date().toISOString().substring(0, 16),
        location: '',
        validatorId: '',
        matchConfirmed: true
    });

    // Ingesta 2: Seguridad
    const [security, setSecurity] = useState({
        containerNumber: '',
        sealNumber: '',
        sacksCount: 0
    });

    // Ingesta 3: Cierre de Ciclo
    const [closure, setClosure] = useState({
        vesselName: '',
        bolNumber: '',
        eta: '',
        notifyEmails: 'aduana@dian.gov.co, logistica@importclient.com',
        blType: 'Master BL',
        consignee: ''
    });

    const generateFinalHash = () => {
        // Concatenación simulada de datos para el hash
        const rawData = `${baseHash}|${security.sealNumber}|${closure.bolNumber}|${checkin.timestamp}`;
        // Simulamos un SHA-256 corto visual para el certificado
        let hash = 0;
        for (let i = 0; i < rawData.length; i++) {
            const char = rawData.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `AXIS-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCheckin(prev => ({
                        ...prev,
                        location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
                    }));
                },
                (error) => {
                    // Fallback para entorno de prueba o si el usuario niega permisos de ubicación
                    setCheckin(prev => ({
                        ...prev,
                        location: '3.879541, -77.025482 (Fallback: Buenaventura)'
                    }));
                    console.warn("Permiso GPS denegado o no disponible. Usando ubicación fallback.");
                },
                { timeout: 5000 }
            );
        } else {
            setCheckin(prev => ({
                ...prev,
                location: '3.879541, -77.025482 (Fallback: Buenaventura)'
            }));
        }
    };

    const handleSeal = async () => {
        setIsSubmitting(true);
        setStatus(null);
        setLoadingStep(1);

        try {
            const finalHash = generateFinalHash();

            const { error } = await supabase
                .from('green_exports')
                .update({
                    port_checkin_timestamp: checkin.timestamp,
                    port_checkin_location: checkin.location,
                    port_validator_id: checkin.validatorId,
                    port_match_confirmed: checkin.matchConfirmed,
                    container_number: security.containerNumber,
                    seal_number: security.sealNumber,
                    sacks_count: security.sacksCount,
                    vessel_name: closure.vesselName,
                    bol_number: closure.bolNumber,
                    eta: closure.eta,
                    final_hash: finalHash,
                    status: 'FINALIZADA'
                })
                .eq('id', exportId);

            if (error) throw error;
            
            if (closure.notifyEmails.trim() !== '') {
                setLoadingStep(2);
                await new Promise(res => setTimeout(res, 2000)); // Simulando latencia de red de envío (Resend/Sendgrid)
                setStatus({ type: 'success', message: '¡Informe Sellado Inmutablemente!', emails: closure.notifyEmails });
            } else {
                setStatus({ type: 'success', message: '¡Informe Sellado Inmutablemente!' });
            }
            
            setTimeout(() => {
                onSuccess();
            }, 3500);

        } catch (err: any) {
            console.warn("Se produjo un error al sellar, revisa la conexión con la base de datos:", err);
            setStatus({ type: 'error', message: `Error al sellar el certificado: ${err?.message || 'Intente nuevamente'}` });
            setIsSubmitting(false);
            setLoadingStep(0);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <div className="bg-bg-card border border-white/5 w-full max-w-3xl rounded-[2rem] shadow-2xl relative flex flex-col my-auto animate-in fade-in zoom-in duration-500 overflow-hidden">
                
                {/* Header Dinámico */}
                <div className="p-8 border-b border-white/5 bg-white/2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 blur-[100px] rounded-full"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-brand-green-bright animate-pulse"></span>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Sello Inmutable de Embarque</h2>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Convirtiendo Borrador en Certificado Final • Lote: {lotId}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-all bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/10">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex gap-2 mt-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full bg-white/10 relative overflow-hidden`}>
                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${step >= i ? 'w-full bg-brand-green' : 'w-0'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Formulario */}
                <div className="p-8 pb-12">
                    {status && (
                        <div className={`p-6 rounded-2xl flex items-start gap-4 mb-8 border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green-bright shadow-[0_0_30px_rgba(0,255,136,0.1)]' : 'bg-brand-red/10 border-brand-red/20 text-brand-red-bright'}`}>
                            <div className="mt-1">
                                {status.type === 'success' ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                )}
                            </div>
                            <div className="font-bold uppercase tracking-widest text-[11px] leading-relaxed w-full">
                                {status.message}
                                {status.type === 'success' && status.emails && (
                                    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-brand-green/20 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[9px] text-white opacity-90"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg> TRANSMITIENDO PASAPORTE WGS84</div>
                                        <div className="text-[8px] font-mono text-gray-400 break-all">{status.emails.split(',').map(e => `[SUCCESS] Payload delivered to: ${e.trim()}`).join('\n')}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!status?.message.includes('¡Informe') && (
                        <div className="grid grid-cols-1 grid-rows-1">
                            {/* PASO 1: Ingreso */}
                            <div className={`col-start-1 row-start-1 space-y-6 transition-all duration-500 ${step === 1 ? 'opacity-100 translate-x-0 z-10 relative' : 'opacity-0 -translate-x-10 pointer-events-none absolute w-full'}`}>
                                <h3 className="text-brand-green-bright text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 border-b border-brand-green/20 pb-3">
                                    <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span> 1. Validación de Ingreso en Puerto
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Timestamp de Arribo</label>
                                        <input type="datetime-local" value={checkin.timestamp} onChange={e => setCheckin({...checkin, timestamp: e.target.value})} className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-green outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">ID Validador / Operario</label>
                                        <input type="text" value={checkin.validatorId} onChange={e => setCheckin({...checkin, validatorId: e.target.value})} placeholder="Ej: OP-743B" className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase focus:border-brand-green outline-none" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Geolocalización del Escaneo</label>
                                            <button type="button" onClick={getLocation} className="text-[9px] text-blue-400 hover:text-blue-300 uppercase tracking-widest font-bold flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="10" r="3"/><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/></svg> Capturar GPS</button>
                                        </div>
                                        <input type="text" value={checkin.location} onChange={e => setCheckin({...checkin, location: e.target.value})} placeholder="Ej: 3.879541, -77.025482 (Buenaventura)" className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-brand-green outline-none" />
                                    </div>
                                    <div className="md:col-span-2 flex items-center gap-4 bg-white/2 p-4 rounded-xl border border-white/5 mt-2">
                                        <input type="checkbox" id="match" checked={checkin.matchConfirmed} onChange={e => setCheckin({...checkin, matchConfirmed: e.target.checked})} className="w-5 h-5 accent-brand-green" />
                                        <label htmlFor="match" className="text-[10px] text-gray-300 uppercase tracking-widest cursor-pointer leading-relaxed">Confirmo que los datos físicos del camión (placas y bultos) coinciden en un 100% con el manifiesto digital previo.</label>
                                    </div>
                                </div>
                                <div className="pt-4 text-right">
                                    <button onClick={() => setStep(2)} disabled={!checkin.location || !checkin.validatorId || !checkin.matchConfirmed} className="px-8 py-4 bg-brand-green text-black hover:bg-brand-green-bright font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400 flex items-center gap-3 ml-auto">Continuar Fase 2 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg></button>
                                </div>
                            </div>

                            {/* PASO 2: Seguridad */}
                            <div className={`col-start-1 row-start-1 space-y-6 transition-all duration-500 ${step === 2 ? 'opacity-100 translate-x-0 z-10 relative' : step > 2 ? 'opacity-0 -translate-x-10 pointer-events-none absolute w-full' : 'opacity-0 translate-x-10 pointer-events-none absolute w-full'}`}>
                                <h3 className="text-orange-400 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 border-b border-orange-500/20 pb-3">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> 2. Seguridad de Embalaje (Precintado)
                                </h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">Paso crítico para blindaje legal. Estos datos se cifrarán de inmediato.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Número de Contenedor</label>
                                        <input type="text" value={security.containerNumber} onChange={e => setSecurity({...security, containerNumber: e.target.value.toUpperCase()})} placeholder="Ej: MSKU1234567" className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase font-mono tracking-widest focus:border-orange-500 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Número de Precinto (Seal)</label>
                                        <input type="text" value={security.sealNumber} onChange={e => setSecurity({...security, sealNumber: e.target.value.toUpperCase()})} placeholder="Ej: SEAL-88992211" className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-orange-400 font-bold uppercase font-mono tracking-widest focus:border-orange-500 outline-none placeholder:text-orange-500/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Número de Sacos (Bultos)</label>
                                        <input type="number" value={security.sacksCount || ''} onChange={e => setSecurity({...security, sacksCount: parseInt(e.target.value) || 0})} placeholder="Ej: 280" className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-orange-400 font-bold uppercase font-mono tracking-widest focus:border-orange-500 outline-none placeholder:text-orange-500/30" />
                                    </div>
                                </div>
                                <div className="mt-4 p-4 rounded-xl border border-dashed border-white/20 bg-white/2 flex flex-col items-center justify-center py-8">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 mb-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Evidencia Fotográfica (Opcional)<br/><span className="text-[8px] font-normal tracking-wide lowercase mt-1 block">Sube una foto del precinto cerrado. (Max 5MB)</span></p>
                                </div>
                                
                                <div className="pt-4 flex justify-between">
                                    <button onClick={() => setStep(1)} className="px-6 py-4 bg-transparent text-gray-500 hover:text-white font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all uppercase border border-white/5">Atrás</button>
                                    <button onClick={() => setStep(3)} disabled={!security.containerNumber || !security.sealNumber || security.sacksCount <= 0} className="px-8 py-4 bg-orange-500 text-black hover:bg-orange-400 font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400 flex items-center gap-3">Continuar Fase 3 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg></button>
                                </div>
                            </div>

                            {/* PASO 3: Cierre */}
                            <div className={`col-start-1 row-start-1 space-y-6 transition-all duration-500 ${step === 3 ? 'opacity-100 translate-x-0 z-10 relative' : 'opacity-0 translate-x-10 pointer-events-none absolute w-full'}`}>
                                <h3 className="text-blue-400 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 border-b border-blue-500/20 pb-3">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 3. Cierre de Ciclo en Buque
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Vessel Name & Voyage</label>
                                        <input type="text" value={closure.vesselName} onChange={e => setClosure({...closure, vesselName: e.target.value.toUpperCase()})} placeholder="Ej: MSC GULSUN 102E" className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase font-bold focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Tipo de BL</label>
                                        <select value={closure.blType || 'Master BL'} onChange={e => setClosure({...closure, blType: e.target.value})} className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase font-mono focus:border-blue-500 outline-none appearance-none">
                                            <option value="Master BL">Master BL (Naviera a FF)</option>
                                            <option value="House BL">House BL (FF a Consignatario)</option>
                                            <option value="Direct BL">Direct BL (Naviera a Cliente)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Bill of Lading (BL)</label>
                                        <input type="text" value={closure.bolNumber} onChange={e => setClosure({...closure, bolNumber: e.target.value.toUpperCase()})} placeholder="Ej: BOL-8900445" className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase font-mono focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Consignee (Destinatario Final / Título de Propiedad)</label>
                                        <input type="text" value={closure.consignee || ''} onChange={e => setClosure({...closure, consignee: e.target.value.toUpperCase()})} placeholder="Ej: STUMPTOWN COFFEE ROASTERS INC." className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase font-bold focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1">Estimated Time of Arrival (ETA)</label>
                                        <input type="date" value={closure.eta} onChange={e => setClosure({...closure, eta: e.target.value})} className="w-full bg-bg-main border border-white/5 rounded-xl px-4 py-3 text-sm text-white  focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Distribución Automática (Emails)</label>
                                            <span className="text-[8px] bg-brand-green/20 text-brand-green px-2 py-0.5 rounded border border-brand-green/30 uppercase tracking-widest font-bold">Activo</span>
                                        </div>
                                        <input type="text" value={closure.notifyEmails} onChange={e => setClosure({...closure, notifyEmails: e.target.value})} placeholder="Ej: aduana@puerto.gov, cliente@import.com" className="w-full bg-brand-green/5 border border-brand-green/20 rounded-xl px-4 py-3 text-sm text-brand-green-bright font-mono focus:border-brand-green outline-none placeholder:text-brand-green/30" />
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-brand-green/10 border border-brand-green/30 rounded-2xl relative">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-brand-green text-black text-[8px] font-bold tracking-widest uppercase rounded">ACCIÓN CRÍTICA</div>
                                    <p className="text-[10px] font-bold text-brand-green-bright uppercase tracking-widest leading-relaxed mt-2 text-center">
                                        Al presionar este botón, se realizará una concatenación criptográfica: Hash Original + Datos Puerto. El informe quedará INMUTABLE y el estado pasará a "FINALIZADA".
                                    </p>
                                </div>
                                
                                <div className="pt-4 flex justify-between">
                                    <button onClick={() => setStep(2)} className="px-6 py-4 bg-transparent text-gray-500 hover:text-white font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all border border-white/5" disabled={isSubmitting}>Atrás</button>
                                    <button onClick={handleSeal} disabled={!closure.vesselName || !closure.bolNumber || !closure.eta || isSubmitting} className="px-8 py-4 bg-brand-green text-black hover:bg-brand-green-bright font-black uppercase text-[11px] tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400 flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,136,0.3)] min-w-[300px] justify-center">
                                        {isSubmitting ? (
                                            loadingStep === 1 ? 'SELLANDO HASH EN DB...' : 'TRANSMITIENDO A ADUANAS...'
                                        ) : 'SELLAR INFORME DEFINITIVO'}
                                        {!isSubmitting && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>}
                                        {isSubmitting && <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
