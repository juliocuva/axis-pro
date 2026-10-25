'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ShieldCheck,
    Satellite,
    FileCheck2,
    Compass,
    ArrowRight,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from 'lucide-react';
import EUDRGeoreference from '@/modules/supply/components/EUDRGeoreference';

export default function PublicCaminataDigitalPage() {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setFaqOpen(faqOpen === index ? null : index);
    };

    const faqs = [
        {
            q: '¿Qué exige el Reglamento EUDR (UE 2023/1115) para el café colombiano?',
            a: 'La Unión Europea exige que todo lote de café exportado a territorio comunitario provenga de tierras libres de deforestación posterior al 31 de diciembre de 2020 y cuente con geolocalización verificable (coordenadas WGS84 con 6 decimales según estándar RFC 7946).'
        },
        {
            q: '¿Cuándo se requiere un polígono y cuándo un punto de geolocalización?',
            a: 'Para parcelas menores a 4 hectáreas, la normativa permite declarar un punto de coordenadas centrales (latitud y longitud). Para fincas o parcelas iguales o mayores a 4 hectáreas, es obligatorio registrar el polígono completo con todos sus vértices perimetrales.'
        },
        {
            q: '¿Cómo funciona la validación inercial anti-spoofing (IMU)?',
            a: 'Durante la caminata, axisONE registra micro-oscilaciones del acelerómetro y giroscopio del dispositivo móvil. Esto genera una firma inercial de paso humano que certifica que el operador recorrió físicamente el terreno y no utilizó un emulador o falseador de GPS.'
        },
        {
            q: '¿Cómo se integra este archivo con la plataforma EU TRACES NT?',
            a: 'Al finalizar la caminata, el botón "Descargar GeoJSON Oficial" genera un archivo con la estructura CRS84 y propiedades reconocidas por el sistema aduanero europeo TRACES NT, listo para anexar a la Declaración de Diligencia Debida (DDS).'
        }
    ];

    return (
        <div className="min-h-screen bg-[#FAF2CA]/25 text-[#0C3C60] flex flex-col justify-between">
            {/* Header */}
            <header className="bg-[#FAF2CA] border-b border-[#0C3C60]/15 py-3.5 px-6 sticky top-0 z-50 shadow-sm backdrop-blur-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3.5 group">
                        <img src="/logo.png" alt="AXISONE" className="h-10 w-auto object-contain hover:scale-105 transition-transform" />
                        <div className="h-5 w-px bg-[#0C3C60]/20"></div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black tracking-widest text-[#0C3C60] uppercase">
                                DIGITAL WALK (EUDR)
                            </span>
                            <span className="text-[9px] text-[#0C3C60]/60 font-bold uppercase tracking-wider">
                                Mapeo &amp; Georreferenciación Sensorial
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/commercial/evidence"
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0C3C60] hover:bg-[#0C3C60] hover:text-[#FAF2CA] transition-colors bg-[#0C3C60]/10 border border-[#0C3C60]/15 px-3.5 py-1.5 rounded-full"
                        >
                            <span>Evidence Dashboard</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link
                            href="/"
                            className="text-xs font-black uppercase text-[#0C3C60]/70 hover:text-[#0C3C60] transition-colors bg-[#0C3C60]/10 hover:bg-[#0C3C60]/20 px-3 py-1.5 rounded-full"
                        >
                            Cerrar ✕
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 flex-1 w-full space-y-10">
                {/* Hero Title & Description */}
                <div className="text-center max-w-3xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 bg-[#0C3C60] px-4 py-1.5 rounded-full shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[#83DF9C] animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-widest text-[#FAF2CA] uppercase">
                            MODULAR FIELD TOOL // REGLAMENTO UE 2023/1115
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-[#0C3C60] tracking-tight uppercase">
                        Digital Walk <span className="text-[#0C3C60]/50 font-light">/</span> Caminata Digital
                    </h1>

                    <p className="text-[#0C3C60]/80 text-sm md:text-base leading-relaxed font-medium">
                        Mapea el perímetro de tus lotes desde tu celular con validación inercial humana (IMU), cálculo instantáneo de hectáreas y verificación satelital contra Global Forest Watch.
                    </p>
                </div>

                {/* 4 Steps Visual Guide */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
                    <div className="bg-white p-4 rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            01
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-[#0C3C60]">Recorrido en Campo</p>
                            <p className="text-[11px] text-[#0C3C60]/70 mt-0.5">Captura vértices GPS caminando o ingresa datos SICA.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            02
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-[#0C3C60]">Firma Inercial IMU</p>
                            <p className="text-[11px] text-[#0C3C60]/70 mt-0.5">Auditoría de movimiento que previene falsificación de GPS.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            03
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-[#0C3C60]">Cruce Satelital</p>
                            <p className="text-[11px] text-[#0C3C60]/70 mt-0.5">Verificación contra Copernicus L2A y Global Forest Watch.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            04
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-[#0C3C60]">EU TRACES NT</p>
                            <p className="text-[11px] text-[#0C3C60]/70 mt-0.5">Descarga GeoJSON con estándar oficial listo para aduanas.</p>
                        </div>
                    </div>
                </div>

                {/* THE CORE DIGITAL WALK APPLICATION */}
                <div className="max-w-5xl mx-auto">
                    <EUDRGeoreference />
                </div>

                {/* Technical Specs & Regulation FAQs Accordion */}
                <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-[#0C3C60]/15 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-[#0C3C60]/10">
                        <div className="w-9 h-9 rounded-2xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase text-[#0C3C60] tracking-wider">
                                Cumplimiento Regulatorio &amp; Especificaciones Técnicas
                            </h3>
                            <p className="text-xs text-[#0C3C60]/70">
                                Lineamientos del Reglamento (UE) 2023/1115 y estándares OGC WGS84
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="border border-[#0C3C60]/10 rounded-2xl overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full text-left p-4 flex justify-between items-center gap-4 bg-[#FAF2CA]/20 hover:bg-[#FAF2CA]/40 cursor-pointer transition-colors"
                                >
                                    <span className="text-xs md:text-sm font-bold text-[#0C3C60]">
                                        {faq.q}
                                    </span>
                                    {faqOpen === idx ? (
                                        <ChevronUp className="w-4 h-4 text-[#0C3C60] flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-[#0C3C60]/60 flex-shrink-0" />
                                    )}
                                </button>
                                {faqOpen === idx && (
                                    <div className="p-4 bg-white text-xs leading-relaxed text-[#0C3C60]/80 border-t border-[#0C3C60]/10 font-medium animate-in fade-in">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0C3C60] text-[#FAF2CA] py-8 px-6 mt-16 border-t border-white/10 text-center text-xs">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-azonix">AXIS</span>
                        <span className="font-montserrat-black">one</span>
                        <span className="text-white/40">|</span>
                        <span className="text-white/70 text-[11px]">EUDR Coffee Intelligence Layer</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#FAF2CA]/80">
                        <Link href="/commercial/evidence" className="hover:text-[#83DF9C] transition-colors">
                            Evidence Dashboard
                        </Link>
                        <span>•</span>
                        <Link href="/pitch" className="hover:text-[#83DF9C] transition-colors">
                            Technical Pitch
                        </Link>
                        <span>•</span>
                        <Link href="/" className="hover:text-[#83DF9C] transition-colors">
                            Ecosystem Hub
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
