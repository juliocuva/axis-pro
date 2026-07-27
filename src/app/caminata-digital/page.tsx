'use client';

import React from 'react';
import Link from 'next/link';
import EUDRGeoreference from '@/modules/supply/components/EUDRGeoreference';

export default function PublicCaminataDigitalPage() {
    return (
        <div className="min-h-screen bg-soft-white text-brand-navy">
            {/* Simple Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-4 group">
                        <img src="/logo.png" alt="AXISONE" className="h-10 w-auto" />
                        <div className="h-6 w-px bg-black/10"></div>
                        <span className="text-sm font-black tracking-widest text-brand-green uppercase">TOOLBOX / CAMINATA DIGITAL</span>
                    </Link>
                    <Link href="/" className="text-xs font-bold uppercase text-gray-500 hover:text-brand-navy transition-colors">
                        Cerrar ✕
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-black text-brand-navy uppercase tracking-tight mb-4">
                        Caminata Digital EUDR
                    </h1>
                    <p className="text-gray-600 font-medium">
                        Mapea tus lotes, captura vértices y cumple con la normativa europea (EUDR) validando en tiempo real contra Global Forest Watch.
                    </p>
                </div>

                <div className="bg-white p-1 md:p-6 rounded-3xl shadow-xl border border-gray-100 flex justify-center">
                    <EUDRGeoreference />
                </div>
            </main>
        </div>
    );
}
