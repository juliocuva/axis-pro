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
    MapPin,
    BookOpen,
    Share2
} from 'lucide-react';
import EUDRGeoreference from '@/modules/supply/components/EUDRGeoreference';

export default function PublicCaminataDigitalPage() {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const [mobileView, setMobileView] = useState<'map' | 'guide'>('map');

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
        },
        {
            q: '¿Por qué es inmutable este registro y cómo protege contra fraude?',
            a: 'Al sellar la caminata, axisONE calcula una huella criptográfica SHA-256 única que vincula matemáticamente las coordenadas del polígono, el área, la firma del sensor y la fecha/hora exacta. Si alguien intenta alterar un solo decimal de las coordenadas, el hash se invalida ante aduanas y compradores, garantizando la inmutabilidad física del origen.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#FAF2CA]/25 text-[#0C3C60] flex flex-col justify-between">
            {/* Header (Responsive Height & Touch Targets) */}
            <header className="bg-[#FAF2CA] border-b border-[#0C3C60]/15 py-2.5 sm:py-3.5 px-3 sm:px-6 sticky top-0 z-50 shadow-sm backdrop-blur-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group min-w-0">
                        <img
                            src="/logo.png"
                            alt="AXISONE"
                            className="h-8 sm:h-10 w-auto object-contain hover:scale-105 transition-transform flex-shrink-0"
                        />
                        <div className="h-4 sm:h-5 w-px bg-[#0C3C60]/20 flex-shrink-0"></div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] sm:text-xs font-black tracking-widest text-[#0C3C60] uppercase truncate">
                                DIGITAL WALK (EUDR)
                            </span>
                            <span className="hidden sm:inline-block text-[9px] text-[#0C3C60]/60 font-bold uppercase tracking-wider truncate">
                                Mapeo &amp; Georreferenciación Sensorial
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <Link
                            href="/commercial/evidence"
                            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0C3C60] hover:bg-[#0C3C60] hover:text-[#FAF2CA] transition-colors bg-[#0C3C60]/10 border border-[#0C3C60]/15 px-3.5 py-1.5 rounded-full"
                        >
                            <span>Evidence Dashboard</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link
                            href="/"
                            className="text-[11px] sm:text-xs font-black uppercase text-[#0C3C60]/70 hover:text-[#0C3C60] transition-colors bg-[#0C3C60]/10 hover:bg-[#0C3C60]/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full"
                        >
                            Cerrar ✕
                        </Link>
                    </div>
                </div>
            </header>

            {/* Mobile View Switcher (Visible only on mobile screens < md) */}
            <div className="md:hidden bg-[#0C3C60] px-4 py-2 border-b border-white/10 flex justify-center">
                <div className="inline-flex bg-white/10 p-1 rounded-full border border-white/15 w-full max-w-sm">
                    <button
                        onClick={() => setMobileView('map')}
                        className={`flex-1 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            mobileView === 'map'
                                ? 'bg-[#83DF9C] text-[#0C3C60] shadow-sm'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Mapeo en Campo</span>
                    </button>
                    <button
                        onClick={() => setMobileView('guide')}
                        className={`flex-1 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            mobileView === 'guide'
                                ? 'bg-[#FAF2CA] text-[#0C3C60] shadow-sm'
                                : 'text-white/80 hover:text-white'
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Guía &amp; Normas</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-8 md:py-12 flex-1 w-full space-y-6 sm:space-y-10">
                {/* Desktop Hero Title (Hidden on Mobile Map View to prioritize the screen real estate) */}
                <div className={`${mobileView === 'map' ? 'hidden md:block' : 'block'} text-center max-w-3xl mx-auto space-y-2 sm:space-y-3`}>
                    <div className="inline-flex items-center gap-2 bg-[#0C3C60] px-3.5 py-1 rounded-full shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[#83DF9C] animate-pulse"></span>
                        <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#FAF2CA] uppercase">
                            MODULAR FIELD TOOL // REGLAMENTO UE 2023/1115
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-[#0C3C60] tracking-tight uppercase">
                        Digital Walk <span className="text-[#0C3C60]/50 font-light">/</span> Caminata Digital
                    </h1>

                    <p className="text-[#0C3C60]/80 text-xs sm:text-sm md:text-base leading-relaxed font-medium px-2">
                        Mapea el perímetro de tus lotes desde tu celular con validación inercial humana (IMU), cálculo instantáneo de hectáreas y verificación satelital contra Global Forest Watch.
                    </p>
                </div>

                {/* 4 Steps Visual Guide (Visible on Desktop OR when mobileView === 'guide') */}
                <div className={`${mobileView === 'map' ? 'hidden md:grid' : 'grid'} grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 max-w-5xl mx-auto`}>
                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            01
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs font-black uppercase text-[#0C3C60]">Recorrido en Campo</p>
                            <p className="text-[10px] text-[#0C3C60]/70 mt-0.5 leading-tight">Captura vértices GPS caminando alrededor del perímetro.</p>
                        </div>
                    </div>

                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            02
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs font-black uppercase text-[#0C3C60]">Firma Inercial IMU</p>
                            <p className="text-[10px] text-[#0C3C60]/70 mt-0.5 leading-tight">Auditoría de movimiento que previene falsificación de GPS.</p>
                        </div>
                    </div>

                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            03
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs font-black uppercase text-[#0C3C60]">Cruce Satelital</p>
                            <p className="text-[10px] text-[#0C3C60]/70 mt-0.5 leading-tight">Verificación contra Copernicus L2A y Global Forest Watch.</p>
                        </div>
                    </div>

                    <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#0C3C60]/10 shadow-sm flex flex-col justify-between">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center font-black text-xs mb-2">
                            04
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs font-black uppercase text-[#0C3C60]">Sello Inmutable &amp; TRACES</p>
                            <p className="text-[10px] text-[#0C3C60]/70 mt-0.5 leading-tight">Huella SHA-256 inalterable y GeoJSON listo para aduanas UE.</p>
                        </div>
                    </div>
                </div>

                {/* THE CORE DIGITAL WALK FIELD APPLICATION (Always visible on Desktop or when mobileView === 'map') */}
                <div className={`${mobileView === 'guide' ? 'hidden md:block' : 'block'} max-w-5xl mx-auto`}>
                    <EUDRGeoreference />
                </div>

                {/* Technical Specs & Regulation FAQs Accordion (Visible on Desktop or when mobileView === 'guide') */}
                <div className={`${mobileView === 'map' ? 'hidden md:block' : 'block'} max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-[#0C3C60]/15 shadow-sm space-y-4 sm:space-y-6`}>
                    <div className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-[#0C3C60]/10">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#0C3C60] text-[#83DF9C] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                            <h3 className="text-xs sm:text-base font-black uppercase text-[#0C3C60] tracking-wider">
                                Cumplimiento Regulatorio &amp; Especificaciones
                            </h3>
                            <p className="text-[10px] sm:text-xs text-[#0C3C60]/70">
                                Lineamientos del Reglamento (UE) 2023/1115 y estándares OGC WGS84
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="border border-[#0C3C60]/10 rounded-xl sm:rounded-2xl overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full text-left p-3.5 sm:p-4 flex justify-between items-center gap-3 bg-[#FAF2CA]/20 hover:bg-[#FAF2CA]/40 cursor-pointer transition-colors"
                                >
                                    <span className="text-xs sm:text-sm font-bold text-[#0C3C60]">
                                        {faq.q}
                                    </span>
                                    {faqOpen === idx ? (
                                        <ChevronUp className="w-4 h-4 text-[#0C3C60] flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-[#0C3C60]/60 flex-shrink-0" />
                                    )}
                                </button>
                                {faqOpen === idx && (
                                    <div className="p-3.5 sm:p-4 bg-white text-[11px] sm:text-xs leading-relaxed text-[#0C3C60]/80 border-t border-[#0C3C60]/10 font-medium animate-in fade-in">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0C3C60] text-[#FAF2CA] py-6 sm:py-8 px-4 sm:px-6 mt-8 sm:mt-16 border-t border-white/10 text-center text-xs">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-azonix">AXIS</span>
                        <span className="font-montserrat-black">one</span>
                        <span className="text-white/40">|</span>
                        <span className="text-white/70 text-[10px] sm:text-[11px]">EUDR Coffee Intelligence Layer</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-[#FAF2CA]/80">
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
