'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import LotCertificate from '@/modules/supply/components/analysis/LotCertificate';

export default function PublicLotVerification() {
    const params = useParams();
    const id = params.id as string;

    if (!id) return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-green-bright"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg-main p-4 md:p-12 flex flex-col items-center justify-center">
            <header className="mb-8 text-center">
                <h1 className="text-xl font-bold text-white tracking-widest uppercase">AXIS COFFEE <span className="text-brand-green-bright">VERIFY</span></h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] mt-2">Protocolo de Trazabilidad Pública</p>
            </header>

            <div className="w-full max-w-5xl">
                <LotCertificate
                    inventoryId={id}
                    onClose={() => window.location.href = '/'}
                />
            </div>

            <footer className="mt-12 text-center pb-8">
                <p className="text-[8px] text-gray-600 uppercase tracking-widest">© {new Date().getFullYear()} AXIS COFFEE PRO | Inteligencia de Origen</p>
            </footer>
        </div>
    );
}
