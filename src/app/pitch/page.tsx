'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DummyPitchPage() {
    const [subTab, setSubTab] = useState<1 | 2 | 3>(1);

    return (
        <div className="min-h-screen bg-white font-sans text-brand-navy">
            {/* TOP NAVIGATION */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <img src="/logo.png" alt="AXISONE" className="h-8 w-auto invert opacity-90" />
                    </Link>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 rounded-full px-1.5 py-1.5 border border-gray-100">
                    <button className="bg-[#0C6056] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        OPERACIONES
                    </button>
                    <button className="text-gray-500 hover:text-brand-navy text-[10px] font-black uppercase tracking-widest px-4 py-2 flex items-center gap-2 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                        SINCRONIZAR LOTES
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-50 rounded-full p-1 border border-gray-100">
                        <button className="px-3 py-1 text-[9px] font-black rounded-full bg-white shadow-sm text-brand-navy">EN</button>
                        <button className="px-3 py-1 text-[9px] font-black rounded-full text-gray-400">ES</button>
                    </div>
                    <div className="flex items-center gap-3 border border-gray-200 rounded-full pl-4 pr-1 py-1 shadow-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-brand-navy uppercase tracking-widest leading-none">INVITADO AUDITOR (FNC)</span>
                            <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">SUPER ADMINISTRADOR</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-black">
                            IA
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="max-w-6xl mx-auto pt-12 px-8 pb-32 animate-in fade-in duration-500">
                
                {/* CERTIFICATE PILL */}
                <div className="flex justify-end mb-12">
                    <div className="flex items-center gap-3 border border-gray-200 rounded-full pl-6 pr-2 py-2 shadow-sm">
                        <span className="text-[10px] font-black text-brand-navy tracking-widest uppercase">
                            LUISA FERNANDA G. | DM-2024-001
                        </span>
                        <button className="bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase hover:scale-105 transition-transform">
                            CERTIFICADO
                        </button>
                    </div>
                </div>

                {/* STEPPER */}
                <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-12">
                    {[
                        { num: '01', label: 'ORIGIN', active: true },
                        { num: '02', label: 'DRY MILL', active: false },
                        { num: '03', label: 'PHYSICAL LAB', active: false },
                        { num: '04', label: 'ROAST INTELLIGENCE', active: false },
                        { num: '05', label: 'CVA CUPPING', active: false }
                    ].map((step, i) => (
                        <div key={i} className={`flex flex-col items-center flex-1 relative ${step.active ? 'opacity-100' : 'opacity-30'}`}>
                            <div className="relative mb-2">
                                <span className={`text-4xl font-light ${step.active ? 'text-[#0C6056]' : 'text-gray-400'}`}>{step.num}</span>
                                {step.active && <span className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-[#0C6056] rounded-full"></span>}
                            </div>
                            <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${step.active ? 'text-brand-navy' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                            {step.active && <div className="absolute -bottom-[17px] left-0 w-full h-[3px] bg-[#0C6056]"></div>}
                        </div>
                    ))}
                </div>

                {/* SUB-TABS */}
                <div className="flex justify-center border-b border-gray-200 mb-12">
                    <div className="flex items-center gap-2 max-w-3xl w-full justify-between px-12">
                        {[
                            { id: 1, label: 'ORIGIN DATA' },
                            { id: 2, label: 'COMMERCIALIZATION' },
                            { id: 3, label: 'PROCESSING (FARMER)' }
                        ].map((tab) => (
                            <button 
                                key={tab.id}
                                onClick={() => setSubTab(tab.id as any)}
                                className={`flex items-center gap-3 px-8 py-3 rounded-t-xl transition-all ${
                                    subTab === tab.id 
                                        ? 'bg-[#0A1A2F] text-white' 
                                        : 'bg-transparent text-gray-400 hover:text-brand-navy'
                                }`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    subTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>{tab.id}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* FORM CONTENT */}
                <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-300">
                    
                    {/* SCENE 1: ORIGIN DATA */}
                    {subTab === 1 && (
                        <div className="space-y-10">
                            {/* Autocomplete Bar */}
                            <div className="flex items-end gap-6 border-b-2 border-[#0C6056]/20 pb-8">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-2">AUTO-COMPLETE SICA / ID</label>
                                    <div className="relative">
                                        <input type="text" placeholder="E.g. Farmer ID (1109417355)" className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none focus:border-[#0C6056] bg-transparent" />
                                        <svg className="absolute right-0 top-3 text-[#0C6056]/50 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 pb-2">
                                    <button className="flex items-center gap-2 text-[10px] font-black text-[#0A1A2F] uppercase tracking-widest hover:text-[#0C6056]">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                        LOAD EXCEL FILE
                                    </button>
                                    <button className="text-[10px] font-black text-[#0A1A2F] uppercase tracking-widest hover:text-[#0C6056]">
                                        + ENTER NEW LOT
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-[10px] font-black text-[#0C6056] uppercase tracking-widest">IDENTIFICACIÓN INDIVIDUAL DE LOTE</h3>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">CÉDULA SICA</label>
                                    <input type="text" placeholder="Ej. 1081492345" className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">CAFICULTOR (PRODUCTOR)</label>
                                    <input type="text" value="LUISA FERNANDA G." readOnly className="w-full border-b border-gray-300 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">CELULAR DEL PRODUCTOR</label>
                                    <input type="text" placeholder="Ej. +57 301 000 0000" className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">NOMBRE DE LA FINCA</label>
                                        <input type="text" value="VILLA ESPERANZA" readOnly className="w-full border-b border-gray-300 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">ALTURA (MSNM)</label>
                                        <input type="text" value="1850" readOnly className="w-full border-b border-gray-300 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                        <span className="absolute right-0 bottom-3 text-[10px] font-black text-[#0A1A2F]">M</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-8 pt-4">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">UBICACIÓN WHATSAPP</label>
                                    <div className="flex items-end gap-4">
                                        <input type="text" placeholder="Pegue aquí el enlace..." className="flex-1 border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                        <button className="bg-[#0A1A2F] text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">EXTRAER GPS</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">LATITUD</label>
                                        <input type="text" placeholder="Ej. 4.570868" className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">LONGITUD</label>
                                        <input type="text" placeholder="Ej. -74.297333" className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                    </div>
                                </div>
                                <div className="col-span-2 grid grid-cols-3 gap-12">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">PAÍS</label>
                                        <select className="w-full border-b border-gray-300 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none appearance-none bg-transparent">
                                            <option>COLOMBIA</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">DEPARTAMENTO</label>
                                        <select className="w-full border-b border-gray-300 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none appearance-none bg-transparent">
                                            <option>PITALITO, HUILA</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">CIUDAD</label>
                                        <input type="text" placeholder="ESPECIFICAR MUNICIPIO" className="w-full border-b border-gray-300 py-2 text-sm text-gray-300 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-12">
                                <button onClick={() => setSubTab(2)} className="bg-[#0C6056] text-white px-8 py-4 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-[#0A1A2F] transition-colors shadow-lg shadow-[#0C6056]/20">
                                    NEXT: COMMERCIALIZATION →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCENE 2: COMMERCIALIZATION */}
                    {subTab === 2 && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1"># LOTE</label>
                                    <input type="text" value="DM-2024-001" readOnly className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">TAMAÑO DE LA FINCA (HECTÁREAS) *</label>
                                    <input type="text" placeholder="Ej. 4.5" className="w-full border-b border-[#0C6056]/30 py-2 text-sm text-gray-300 focus:outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 pt-4">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-3">INCOMING COFFEE STATE</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="border border-[#0C6056] bg-[#0C6056]/10 text-[#0C6056] rounded py-3 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest">PARCHMENT COFFEE</span>
                                            <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">(REQUIRES THRASHING)</span>
                                        </button>
                                        <button className="border border-gray-200 text-gray-400 rounded py-3 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest">GREEN COFFEE</span>
                                            <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">(SKIP TO QUALITY)</span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-3">EXCLUSIVE LOT DESTINATION</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="border border-[#0C6056] bg-[#0C6056]/10 text-[#0C6056] rounded py-3 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest">GREEN COFFEE</span>
                                            <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">(EXPORT ROUTE)</span>
                                        </button>
                                        <button className="border border-gray-200 text-gray-400 rounded py-3 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest">ROASTED COFFEE</span>
                                            <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">(FINISHED PRODUCT)</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-12 pt-8">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">HARVEST DATE</label>
                                    <input type="text" value="18/06/2026" readOnly className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                    <svg className="absolute right-0 bottom-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">COFFEE VARIETY</label>
                                    <select className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none appearance-none bg-transparent">
                                        <option>GEISHA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">BASE PROCESS</label>
                                    <select className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none appearance-none bg-transparent">
                                        <option>SELECT</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-12 pt-4">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">FECHA DE COMPRA</label>
                                    <input type="text" value="18/06/2026" readOnly className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                    <svg className="absolute right-0 bottom-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                </div>
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">PURCHASE PACK QUANTITY</label>
                                    <input type="text" value="250" readOnly className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                    <span className="absolute right-0 bottom-3 text-[8px] font-black text-gray-400">KG</span>
                                </div>
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">TOTAL PAID VALUE</label>
                                    <input type="text" value="0" readOnly className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                    <span className="absolute right-0 bottom-3 text-[8px] font-black text-gray-400">COP</span>
                                    <span className="absolute right-10 bottom-3 text-[7px] font-black text-[#0C6056] bg-[#0C6056]/10 px-1 rounded uppercase tracking-widest border border-[#0C6056]/30">FAIR TRADE</span>
                                </div>
                            </div>

                            <div className="flex justify-between pt-16">
                                <button onClick={() => setSubTab(1)} className="border border-gray-300 text-gray-500 px-8 py-3 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-gray-50 transition-colors">
                                    ← BACK
                                </button>
                                <button onClick={() => setSubTab(3)} className="bg-[#0C6056] text-white px-8 py-4 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-[#0A1A2F] transition-colors shadow-lg shadow-[#0C6056]/20">
                                    NEXT: PROCESSING →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCENE 3: PROCESSING */}
                    {subTab === 3 && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-3 gap-12">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">DETECTED VARIETY (ORIGIN)</label>
                                    <input type="text" value="GEISHA" readOnly className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">DETECTED BASE PROCESS</label>
                                    <input type="text" value="LAVADO" readOnly className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">FERMENTATION STYLE / VARIATION</label>
                                    <select className="w-full border-b border-[#0C6056]/30 py-2 text-sm font-bold text-[#0A1A2F] focus:outline-none appearance-none bg-transparent">
                                        <option>STANDARD / TRADITIONAL</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-8">
                                <div className="flex justify-between items-end border-b border-gray-200 pb-2 mb-6">
                                    <h3 className="text-[10px] font-black text-[#0A1A2F] uppercase tracking-widest">FERMENTATION ALCHEMY (PHYSICOCHEMISTRY)</h3>
                                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">CRITICAL VARIABLES CONTROL</span>
                                </div>

                                <div className="grid grid-cols-5 gap-8">
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">INITIAL PH</label>
                                        <input type="text" value="4.5" readOnly className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">FINAL PH</label>
                                        <input type="text" value="3.8" readOnly className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">BRIX DEGREES</label>
                                        <input type="text" value="18.5" readOnly className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                        <span className="absolute right-0 bottom-3 text-[8px] font-black text-[#0A1A2F]">°Bx</span>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">WATER ACTIVITY (AW)</label>
                                        <input type="text" value="0.55" readOnly className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                        <span className="absolute right-0 bottom-3 text-[8px] font-black text-[#0A1A2F]">Aw</span>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">MAX TEMP (°C)</label>
                                        <input type="text" value="35" readOnly className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                        <span className="absolute right-0 bottom-3 text-[8px] font-black text-[#0A1A2F]">°C</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-12 pt-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">CONTAINER</label>
                                        <select className="w-full border-b border-[#0C6056]/30 py-2 text-sm text-[#0A1A2F] focus:outline-none appearance-none bg-transparent font-bold">
                                            <option>SELECT CONTAINER</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">FERMENTATION HOURS</label>
                                        <input type="text" value="72" readOnly className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                        <span className="absolute right-0 bottom-3 text-[8px] font-black text-[#0A1A2F]">Hrs</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">INFUSION AGENT</label>
                                        <input type="text" placeholder="FRUITS, YEASTS, CINNAMON..." className="w-full border-b border-gray-300 py-2 text-sm text-gray-300 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 pt-8">
                                <div>
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">DRYING METHOD</label>
                                    <select className="w-full border-b border-[#0C6056]/30 py-2 text-sm text-[#0A1A2F] focus:outline-none appearance-none bg-transparent font-bold">
                                        <option>SELECT METHOD</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-[#0A1A2F] tracking-widest uppercase mb-1">DRYING HOURS</label>
                                    <input type="text" value="360" readOnly className="w-full border-b border-gray-300 py-2 text-sm text-gray-400 focus:outline-none" />
                                    <span className="absolute right-0 bottom-3 text-[8px] font-black text-[#0A1A2F]">Hrs</span>
                                </div>
                            </div>

                            <div className="flex justify-between pt-16">
                                <button onClick={() => setSubTab(2)} className="border border-gray-300 text-gray-500 px-8 py-3 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-gray-50 transition-colors">
                                    ← BACK
                                </button>
                                <button className="bg-[#0C6056] text-white px-12 py-4 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-[#0A1A2F] transition-colors shadow-lg shadow-[#0C6056]/20 flex items-center gap-2 mx-auto lg:mr-0">
                                    GUARDAR DATOS
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
