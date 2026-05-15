'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const slides = [
    { title: "Página 1", img: "/demo/pan1.png" },
    { title: "Página 2", img: "/demo/pan2.png" },
    { title: "Página 3", img: "/demo/pan3.png" },
    { title: "Página 4", img: "/demo/pan4.png" },
    { title: "Página 5", img: "/demo/pan5.png" },
    { title: "Página 6", img: "/demo/pan6.png" },
];

export default function ViewMaster() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showControls, setShowControls] = useState(true);

    useEffect(() => {
        setIsLoaded(true);
        slides.forEach(slide => {
            const img = new Image();
            img.src = slide.img;
        });

        const timer = setTimeout(() => setShowControls(false), 3000);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isLoaded) return null;

    return (
        <div 
            className="fixed inset-0 bg-black flex flex-col font-sans overflow-hidden z-[9999]"
            onMouseMove={() => setShowControls(true)}
            onClick={nextSlide}
        >
            {/* Header Ultra-Minimalista - Se oculta */}
            <header className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[10000] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="h-6 w-auto opacity-40" />
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-[11px] font-bold text-black/20 uppercase ">{currentIndex + 1} / {slides.length}</span>
                    <Link href="/" className="px-3 py-1 bg-white hover:bg-white rounded text-[9px] font-bold uppercase  text-black/40 transition-all">Salir</Link>
                </div>
            </header>

            {/* Contenedor de Imagen - Full Tamaño */}
            <main className="flex-1 relative w-full h-full bg-black flex items-center justify-center">
                <img 
                    key={currentIndex}
                    src={slides[currentIndex].img} 
                    alt={slides[currentIndex].title}
                    className="max-w-full max-h-full object-contain animate-in fade-in duration-500"
                />

                {/* Zonas de click para navegación */}
                <div 
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-0 top-0 w-1/4 h-full z-10 cursor-pointer"
                />
                <div 
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-0 top-0 w-1/4 h-full z-10 cursor-pointer"
                />
            </main>

            {/* Indicador de posición casi invisible */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 opacity-30 hover:opacity-100 transition-opacity duration-500 z-[10000]">
                {slides.map((_, i) => (
                    <div 
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? 'bg-brand-green w-5' : 'bg-white/50'}`}
                    />
                ))}
            </div>

            <style jsx global>{`
                /* REGLA CRITICA: Ocultar el footer global de layout.tsx */
                footer, .footer { 
                    display: none !important; 
                    visibility: hidden !important;
                    height: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                
                body { 
                    background-color: black !important; 
                    margin: 0 !important; 
                    padding: 0 !important;
                    overflow: hidden !important; 
                }
                
                .text-black { color: #0C6056; }
                .bg-brand-green { background-color: #0C6056; }
                
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
