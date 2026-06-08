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
        <div className="min-h-screen bg-bg-main p-4 md:p-12 w-full overflow-y-auto pb-12">
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
            </div>
        </div>
    );
}
