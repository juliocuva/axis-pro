'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DummyPitchPage() {
    const [stage, setStage] = useState(1);
    const [subTab, setSubTab] = useState<1 | 2 | 3>(1);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const timer = setInterval(() => {
            if (stage === 1) {
                if (subTab < 3) setSubTab(prev => prev + 1 as any);
                else { setStage(2); setSubTab(1); }
            } else if (stage < 6) {
                setStage(prev => prev + 1);
            } else {
                setIsAutoPlaying(false);
            }
        }, 2000);
        return () => clearInterval(timer);
    }, [isAutoPlaying, stage, subTab]);

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
                
                {/* AUTOPLAY CONTROLS & CERTIFICATE PILL */}
                <div className="flex justify-between items-center mb-12">
                    <button 
                        onClick={() => {
                            if (stage === 6) { setStage(1); setSubTab(1); }
                            setIsAutoPlaying(!isAutoPlaying);
                        }}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${
                            isAutoPlaying ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#0C6056] text-white shadow-lg shadow-[#0C6056]/20'
                        }`}
                    >
                        {isAutoPlaying ? '⏸ PAUSE DEMO' : '▶ PLAY DEMO AUTOMÁTICO'}
                    </button>

                    <div className="flex items-center gap-3 border border-gray-200 rounded-full pl-6 pr-2 py-2 shadow-sm bg-white">
                        <span className="text-[10px] font-black text-brand-navy tracking-widest uppercase">
                            LUISA FERNANDA G. | DM-2024-001
                        </span>
                        <button onClick={() => setStage(6)} className="bg-black text-white px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase hover:scale-105 transition-transform">
                            CERTIFICADO
                        </button>
                    </div>
                </div>

                {/* STEPPER */}
                <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-12">
                    {[
                        { num: '01', label: 'ORIGIN', id: 1 },
                        { num: '02', label: 'DRY MILL', id: 2 },
                        { num: '03', label: 'PHYSICAL LAB', id: 3 },
                        { num: '04', label: 'ROAST INTELLIGENCE', id: 4 },
                        { num: '05', label: 'CVA CUPPING', id: 5 }
                    ].map((step, i) => {
                        const isActive = stage === step.id;
                        return (
                            <div key={i} className={`flex flex-col items-center flex-1 relative ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                                <div className="relative mb-2">
                                    <span className={`text-4xl font-light ${isActive ? 'text-[#0C6056]' : 'text-gray-400'}`}>{step.num}</span>
                                    {isActive && <span className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-[#0C6056] rounded-full"></span>}
                                </div>
                                <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${isActive ? 'text-brand-navy' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                                {isActive && <div className="absolute -bottom-[17px] left-0 w-full h-[3px] bg-[#0C6056]"></div>}
                            </div>
                        )
                    })}
                </div>

                {/* SUB-TABS (Only for Stage 1) */}
                {stage === 1 && (
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
                )}

                {/* FORM CONTENT */}
                <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-300">
                    
                    {/* SCENE 1: ORIGIN DATA */}
                    {stage === 1 && subTab === 1 && (
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

                    {/* SCENE 1: COMMERCIALIZATION */}
                    {stage === 1 && subTab === 2 && (
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

                    {/* SCENE 1: PROCESSING */}
                    {stage === 1 && subTab === 3 && (
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
                                <button onClick={() => setStage(2)} className="bg-[#0C6056] text-white px-12 py-4 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-[#0A1A2F] transition-colors shadow-lg shadow-[#0C6056]/20 flex items-center gap-2 mx-auto lg:mr-0">
                                    GUARDAR Y CONTINUAR A DRY MILL
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 2: DRY MILL */}
                    {stage === 2 && (
                        <div className="space-y-10 animate-in fade-in zoom-in duration-500">
                            <h3 className="text-[14px] font-black text-[#0C6056] uppercase tracking-widest border-b border-[#0C6056]/20 pb-4">INDUSTRIAL THRASHING & YIELD</h3>
                            <div className="grid grid-cols-3 gap-8">
                                {['PARCHMENT IN', 'GREEN BEAN OUT', 'YIELD %'].map((lbl, i) => (
                                    <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                        <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">{lbl}</label>
                                        <div className="text-2xl font-light text-[#0A1A2F]">{i === 0 ? '250.00' : i === 1 ? '198.50' : '79.4%'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STAGE 3: PHYSICAL LAB */}
                    {stage === 3 && (
                        <div className="space-y-10 animate-in fade-in zoom-in duration-500">
                            <h3 className="text-[14px] font-black text-[#0C6056] uppercase tracking-widest border-b border-[#0C6056]/20 pb-4">PHYSICAL QUALITY & DEFECTS</h3>
                            <div className="grid grid-cols-4 gap-8">
                                {['MOISTURE', 'DENSITY', 'AW', 'DEFECTS'].map((lbl, i) => (
                                    <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                        <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">{lbl}</label>
                                        <div className="text-2xl font-light text-[#0A1A2F]">{['10.5%', '720 g/L', '0.58', '0 Primary'][i]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STAGE 4: ROAST INTELLIGENCE */}
                    {stage === 4 && (
                        <div className="space-y-10 animate-in fade-in zoom-in duration-500">
                            <h3 className="text-[14px] font-black text-[#0C6056] uppercase tracking-widest border-b border-[#0C6056]/20 pb-4">ROAST PROFILE METRICS</h3>
                            <div className="h-48 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-sm font-black tracking-widest uppercase">[ ROAST CURVE CHART PLACEHOLDER ]</span>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="bg-[#0A1A2F] p-6 rounded-xl text-white">
                                    <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">DEVELOPMENT TIME</label>
                                    <div className="text-2xl font-light">1m 15s (12%)</div>
                                </div>
                                <div className="bg-[#0A1A2F] p-6 rounded-xl text-white">
                                    <label className="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">COLOR (AGTRON)</label>
                                    <div className="text-2xl font-light">75 / 85</div>
                                </div>
                                <div className="bg-[#0C6056] p-6 rounded-xl text-white shadow-lg shadow-[#0C6056]/20">
                                    <label className="block text-[10px] font-black text-white/70 tracking-widest uppercase mb-2">DROP TEMP</label>
                                    <div className="text-2xl font-light">204 °C</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STAGE 5: CVA CUPPING */}
                    {stage === 5 && (
                        <div className="space-y-10 animate-in fade-in zoom-in duration-500">
                            <h3 className="text-[14px] font-black text-[#0C6056] uppercase tracking-widest border-b border-[#0C6056]/20 pb-4">SENSORY EVALUATION (CVA)</h3>
                            <div className="grid grid-cols-2 gap-12">
                                <div className="bg-[#0C6056] rounded-xl p-8 text-white shadow-lg shadow-[#0C6056]/20 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black tracking-widest uppercase mb-4 opacity-80">FINAL SCORE</span>
                                    <span className="text-7xl font-light">88.50</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">FLAVOR DESCRIPTORS</span>
                                        <div className="flex gap-2 mt-2">
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold">Jasmine</span>
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold">Peach</span>
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold">Honey</span>
                                        </div>
                                    </div>
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">ACIDITY</span>
                                        <div className="mt-1 text-sm font-bold text-[#0A1A2F]">Complex, Citric</div>
                                    </div>
                                    <div className="border-b border-gray-100 pb-2">
                                        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">BODY</span>
                                        <div className="mt-1 text-sm font-bold text-[#0A1A2F]">Silky, Coating</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STAGE 6: CERTIFICATE POPUP */}
                    {stage === 6 && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
                            <div className="bg-white max-w-2xl w-full rounded-2xl p-12 shadow-2xl relative">
                                <button onClick={() => { setIsAutoPlaying(false); setStage(1); }} className="absolute top-6 right-6 text-gray-400 hover:text-black">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                                <div className="text-center space-y-6">
                                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto text-brand-green">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    </div>
                                    <h2 className="text-3xl font-black text-brand-navy tracking-tight uppercase">CERTIFICADO GENERADO</h2>
                                    <p className="text-sm text-gray-500">El lote DM-2024-001 ha completado todas las etapas de trazabilidad y está listo para ser compartido con compradores internacionales.</p>
                                    
                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 my-8">
                                        <img src="/qr.png" alt="QR Code Placeholder" className="w-32 h-32 mx-auto mb-4 opacity-50" />
                                        <span className="text-[10px] font-black text-brand-navy tracking-widest uppercase">SCAN TO VIEW PUBLIC RECORD</span>
                                    </div>

                                    <div className="flex gap-4 justify-center">
                                        <button className="bg-[#0A1A2F] text-white px-8 py-3 rounded-full text-[10px] font-black tracking-widest uppercase hover:scale-105 transition-transform">
                                            DESCARGAR PDF
                                        </button>
                                        <button className="border border-gray-200 text-brand-navy px-8 py-3 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-gray-50 transition-colors">
                                            COMPARTIR ENLACE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
