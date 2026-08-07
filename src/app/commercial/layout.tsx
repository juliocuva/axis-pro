'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isEvidence = pathname === '/commercial/evidence';

    if (isEvidence) {
        return <div className="w-full h-full flex flex-col flex-1">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-white text-brand-navy font-sans">
            {/* Top Navbar from Screenshot */}
            <header className="flex justify-between items-center px-10 py-6 border-b border-gray-100">
                {/* Logo */}
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-2">
                        {/* Placeholder Logo matching AxisOne */}
                        <div className="w-8 h-8 text-brand-navy">
                            <svg viewBox="0 0 100 100" fill="currentColor">
                                <path d="M50 10 L10 80 L90 80 Z" />
                                {/* Quick simplified logo placeholder */}
                            </svg>
                        </div>
                        <div className="font-black text-xl tracking-tight leading-none">
                            AXIS<span className="text-brand-green">one</span><br/>
                            <span className="text-[8px] text-gray-400 tracking-[0.3em] font-normal">COFFEE</span>
                        </div>
                    </Link>
                </div>

                {/* Central Action Pills */}
                <div className="flex bg-white rounded-full border border-gray-200 p-1 shadow-sm">
                    <button className="bg-brand-navy text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        Operaciones
                    </button>
                    <button className="bg-transparent text-gray-500 hover:text-brand-navy px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-3.23 2.75"></path></svg>
                        Sincronizar Lotes
                    </button>
                </div>

                {/* Right Side Info */}
                <div className="flex items-center gap-6">
                    {/* Language Switch */}
                    <div className="flex bg-white border border-gray-200 rounded-full overflow-hidden text-[10px] font-bold">
                        <button className="px-3 py-1.5 bg-gray-50 text-gray-400 border-r border-gray-200">EN</button>
                        <button className="px-3 py-1.5 bg-white text-brand-navy">ES</button>
                    </div>

                    {/* Profile Pill */}
                    <div className="flex items-center gap-3 border border-gray-200 rounded-full pl-6 pr-2 py-1.5 bg-white shadow-sm cursor-pointer hover:border-gray-300 transition-colors">
                        <div className="text-right">
                            <div className="text-[9px] font-black uppercase text-brand-navy">Invitado Auditor (FNC)</div>
                            <div className="text-[8px] font-bold text-gray-400 uppercase">Super Administrador</div>
                        </div>
                        <div className="w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            IA
                        </div>
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </header>

            {/* Stepper matching screenshot */}
            <div className="border-b border-gray-100 flex justify-center mb-8 pt-8">
                <div className="flex items-end max-w-5xl w-full mx-auto px-8 gap-12">
                    {/* Step 1 */}
                    <div className="pb-4 text-center cursor-not-allowed opacity-50 relative flex-1">
                        <div className="text-3xl font-light text-gray-300 mb-1">01</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Origin</div>
                    </div>
                    {/* Step 2 (Active) */}
                    <div className="pb-4 text-center relative flex-1 cursor-default">
                        <div className="text-3xl font-light text-brand-green mb-1 relative inline-block">
                            02
                            <div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-brand-green rounded-full"></div>
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-brand-navy">Consolidation</div>
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-brand-green"></div>
                    </div>
                    {/* Step 3 */}
                    <div className="pb-4 text-center cursor-not-allowed opacity-50 relative flex-1">
                        <div className="text-3xl font-light text-gray-300 mb-1">03</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Physical Lab</div>
                    </div>
                    {/* Step 4 */}
                    <div className="pb-4 text-center cursor-not-allowed opacity-50 relative flex-1">
                        <div className="text-3xl font-light text-gray-300 mb-1">04</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Roast Intelligence</div>
                    </div>
                    {/* Step 5 */}
                    <div className="pb-4 text-center cursor-not-allowed opacity-50 relative flex-1">
                        <div className="text-3xl font-light text-gray-300 mb-1">05</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">CVA Cupping</div>
                    </div>
                </div>
            </div>

            {/* Page Content */}
            <main className="max-w-6xl mx-auto px-8 pb-24">
                {children}
            </main>
        </div>
    );
}
