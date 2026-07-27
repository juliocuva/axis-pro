'use client';

import React, { useState, useEffect } from 'react';

const heroSlides = [
    {
        image: '/coffee_farm_hero_v2.png',
        tag: 'ORIGIN & HARVEST',
        title: 'Farm Traceability & Land Mapping'
    },
    {
        image: '/optical_coffee_sorter.png',
        tag: 'INDUSTRIAL MILLING',
        title: 'Yield, Loss & Mass Balance'
    },
    {
        image: '/cva_cupping_topdown.png',
        tag: 'CVA SENSORY EVALUATION',
        title: 'Standardized SCA Cupping & Quality'
    },
    {
        image: '/subscribe_coffee_bg.png',
        tag: 'GLOBAL LOGISTICS',
        title: 'Export Certification & Digital History'
    }
];

export default function HeroSection({ onLoginClick }: { onLoginClick: () => void }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [lang, setLang] = useState<'EN' | 'ES'>('EN');
    const [marketData, setMarketData] = useState({
        iceCoffee: { formatted: '$2.48', change: '+1.45%', isUp: true },
        cargaFnc: { value: '$2,180,000', change: '+0.85%', isUp: true },
        trm: { value: '$3,940.50', change: '-0.12%', isUp: false },
        isReal: false
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);

        const fetchRealPrices = async () => {
            try {
                const res = await fetch('/api/market-prices');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setMarketData({
                            iceCoffee: { formatted: data.iceCoffee.formatted, change: data.iceCoffee.change, isUp: data.iceCoffee.isUp },
                            cargaFnc: { value: data.cargaFnc.value, change: data.cargaFnc.change, isUp: data.cargaFnc.isUp },
                            trm: { value: data.trm.value, change: data.trm.change, isUp: data.trm.isUp },
                            isReal: true
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to load market prices:', e);
            }
        };

        fetchRealPrices();
        const priceInterval = setInterval(fetchRealPrices, 300000); // refresh every 5 min

        return () => {
            clearInterval(timer);
            clearInterval(priceInterval);
        };
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="relative min-h-screen bg-white flex flex-col justify-between items-center text-center p-8 md:p-16 lg:p-24 overflow-hidden font-sans pt-32 pb-12">
            {/* Header Structure: Top Utility Bar + Main Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-300">
                {/* 1. Top Utility Bar (Dark Navy #020814) */}
                <div className="w-full bg-brand-dark-navy border-b border-white/10 text-white text-[11px] py-3 px-6 md:px-12 flex items-center justify-between font-sans shadow-sm">
                    <div className="flex items-center gap-6">
                        <span className="inline-flex items-center gap-1.5 bg-brand-green/20 border border-brand-green/40 text-brand-green font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                            {marketData.isReal ? 'LIVE MARKET DATA' : 'ECOSYSTEM v2.4 LIVE'}
                        </span>
                        
                        {/* 3 Separate Real Coffee Market Price Badges */}
                        <div className="hidden xl:flex items-center gap-8 select-none">
                            {/* 1. ICE COFFEE C */}
                            <div className="flex items-center gap-2.5 bg-white/5 px-4 py-1 rounded-full border border-white/10 text-[10px]">
                                <span className="text-white/60 font-bold uppercase tracking-wider text-[9px]">ICE C:</span>
                                <span className="font-mono font-bold text-white">{marketData.iceCoffee.formatted} <span className="text-[8px] text-white/50">USD/lb</span></span>
                                <span className={`font-mono font-bold text-[9px] ${marketData.iceCoffee.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {marketData.iceCoffee.isUp ? '▲' : '▼'} {marketData.iceCoffee.change}
                                </span>
                            </div>

                            {/* 2. CARGA FNC */}
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 text-[10px]">
                                <span className="text-white/60 font-bold uppercase tracking-wider text-[9px]">CARGA FNC:</span>
                                <span className="font-mono font-bold text-white">{marketData.cargaFnc.value} <span className="text-[8px] text-white/50">COP</span></span>
                                <span className={`font-mono font-bold text-[9px] ${marketData.cargaFnc.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {marketData.cargaFnc.isUp ? '▲' : '▼'} {marketData.cargaFnc.change}
                                </span>
                            </div>

                            {/* 3. TRM */}
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 text-[10px]">
                                <span className="text-white/60 font-bold uppercase tracking-wider text-[9px]">TRM:</span>
                                <span className="font-mono font-bold text-white">{marketData.trm.value} <span className="text-[8px] text-white/50">COP</span></span>
                                <span className={`font-mono font-bold text-[9px] ${marketData.trm.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {marketData.trm.isUp ? '▲' : '▼'} {marketData.trm.change}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-5 text-white/80 font-medium">
                        <a href="https://www.becoffee.pro" target="_blank" rel="noopener noreferrer" className="hover:text-brand-green transition-colors hidden sm:inline-block text-[10px] uppercase tracking-wider">
                            BeCoffee.pro ↗
                        </a>
                        <span className="hidden sm:inline text-white/20">|</span>
                        
                        {/* Language Selector Pill */}
                        <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white select-none">
                            <span 
                                onClick={() => setLang('EN')} 
                                className={`cursor-pointer transition-all duration-200 hover:scale-110 ${lang === 'EN' ? 'text-brand-green font-black scale-105' : 'text-white/60 opacity-80 hover:opacity-100'}`}
                            >
                                EN
                            </span>
                            <span className="text-white/30">|</span>
                            <span 
                                onClick={() => setLang('ES')} 
                                className={`cursor-pointer transition-all duration-200 hover:scale-110 ${lang === 'ES' ? 'text-brand-green font-black scale-105' : 'text-white/60 opacity-80 hover:opacity-100'}`}
                            >
                                ES
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Main Navigation Header (Glassmorphism) */}
                <div className="flex items-center justify-between px-6 md:px-12 py-3 bg-white/50 backdrop-blur-md border-b border-gray-100/60 shadow-sm">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img 
                            src="/logo.png" 
                            alt="axisONE" 
                            className="h-14 md:h-16 object-contain hover:scale-105 transition-transform" 
                        />
                    </div>

                    <nav className="flex items-center gap-4 md:gap-8">
                        <button 
                            onClick={() => scrollToSection('toolbox')}
                            className="text-xs md:text-sm font-bold uppercase tracking-wider text-brand-navy hover:text-brand-green transition-colors"
                        >
                            Toolbox
                        </button>
                        <button 
                            onClick={() => scrollToSection('roadmap')}
                            className="text-xs md:text-sm font-bold uppercase tracking-wider text-brand-navy hover:text-brand-green transition-colors"
                        >
                            Roadmap
                        </button>
                        <button 
                            onClick={() => scrollToSection('contact')}
                            className="text-xs md:text-sm font-bold uppercase tracking-wider text-brand-navy hover:text-brand-green transition-colors"
                        >
                            Contact
                        </button>

                        {/* Primary CTA Button */}
                        <button 
                            onClick={onLoginClick} 
                            className="bg-brand-green hover:bg-brand-navy text-white px-5 md:px-7 py-2.5 md:py-3 rounded-full font-black uppercase tracking-widest text-[11px] md:text-xs transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <span>Access axisONE</span>
                            <span className="text-xs">→</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Background Image Slider - Sharp & Defined */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {heroSlides.map((slide, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            idx === currentSlide ? 'opacity-85 scale-100' : 'opacity-0 scale-105'
                        }`}
                        style={{
                            backgroundImage: `url("${slide.image}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transition: 'opacity 1000ms ease-in-out, transform 6000ms ease-out'
                        }}
                    />
                ))}
            </div>
            
            {/* Brand Navy Blue Overlay Mask with 100% Side Opacity */}
            <div 
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 45%, rgba(0, 20, 48, 0.15) 0%, rgba(0, 20, 48, 0.50) 50%, rgba(0, 20, 48, 1.0) 90%)'
                }}
            ></div>

            {/* Hero Main Content */}
            <div className="relative z-10 max-w-4xl flex flex-col items-center mt-32 my-auto">



                {/* Main Heading - All White */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6 w-full px-4 drop-shadow-sm">
                    Your toolbox<br />
                    for every coffee process.
                </h1>

                {/* Subheading - All White */}
                <p className="text-lg md:text-xl text-white font-medium max-w-5xl mb-6 leading-relaxed">
                    Simple, independent digital tools that solve real problems<br />
                    at the farm, dry mill, lab, roastery, and export.
                </p>

                {/* Bullet Point - All White */}
                <div className="flex items-center gap-3 text-white mb-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-white/60 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <p className="font-bold text-sm md:text-base text-white">
                        Use them independently or connect them in{' '}
                        <span className="inline-block">
                            <span className="font-azonix text-white text-[0.92em]">AXIS</span>
                            <span className="font-montserrat-black text-white">one</span>
                        </span>.
                    </p>
                </div>
            </div>

            {/* Bottom Slider Controls & Current Process Badge */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl px-6 pt-6 border-t border-white/15 gap-4">
                <div className="flex items-center gap-3 text-left">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-ping"></span>
                    <div>
                        <span className="text-[10px] font-black tracking-widest text-white/80 uppercase block mb-0.5">
                            {heroSlides[currentSlide].tag}
                        </span>
                        <span className="text-sm font-bold text-white tracking-wide">
                            {heroSlides[currentSlide].title}
                        </span>
                    </div>
                </div>

                {/* Slider Dot Indicators */}
                <div className="flex items-center gap-2">
                    {heroSlides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                                idx === currentSlide 
                                    ? 'w-8 bg-brand-green' 
                                    : 'w-2.5 bg-white/40 hover:bg-white/80'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom gradient transition into Target Audience (navy) */}
            <div className="absolute bottom-0 left-0 right-0 h-48 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 20, 48, 0.6) 40%, rgba(0, 20, 48, 1) 100%)' }}></div>
        </div>
    );
}
