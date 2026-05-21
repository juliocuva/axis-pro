'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import LotCertificate from '@/modules/supply/components/analysis/LotCertificate';

export default function PublicLotVerification() {
    const params = useParams();
    const id = params.id as string;

    if (!id) return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-black-bright"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-12 w-full overflow-y-auto pb-[150px]">
            <div className="w-full">
                <header className="mb-8 text-center">
                    <h1 className="text-xl font-bold text-brand-navy  uppercase">AXISONE <span className="text-brand-navy-bright">VERIFY</span></h1>

                    <p className="text-[11px] text-brand-navy uppercase  mt-2">Protocolo de Trazabilidad Pública</p>
                </header>

                <div className="w-full max-w-5xl">
                    <LotCertificate
                        inventoryId={id}
                        onClose={() => window.location.href = '/'}
                        user={null}
                    />
                </div>

                <footer className="mt-12 text-center pb-20 w-full">
                    <p className="text-[9px] text-gray-600 uppercase ">© {new Date().getFullYear()} AXISONE COFFEE | Inteligencia de Origen</p>
                </footer>

                {/* Barra de Activación de Profit Sharing (Flotante) */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-brand-green p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,223,154,0.3)] flex flex-col md:flex-row items-center justify-between gap-4 z-50 animate-in slide-in-from-bottom-10 duration-1000">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-brand-navy shadow-inner">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <div className="text-brand-navy">
                            <h4 className="text-sm font-black uppercase er leading-none">Bono de Excelencia Disponible</h4>
                            <p className="text-[11px] font-bold uppercase  opacity-70">Activación de Profit Sharing (Axis Foundation)</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            alert('¡GRACIAS! Has activado el bono de 3.00 USD para el productor. AxisOne Coffee realizará la transferencia vía Axis Foundation Protocol.');
                        }}
                        className="bg-black text-brand-navy px-8 py-3 rounded-2xl font-black text-xs uppercase  hover:scale-105 transition-transform active:scale-95 shadow-xl"
                    >
                        Activar +3.00 USD
                    </button>
                </div>
            </div>
        </div>
    );
}
