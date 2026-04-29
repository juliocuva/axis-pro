'use client';

import React from 'react';

interface ModuleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    status: 'active' | 'locked';
    onClick?: () => void;
    color: string;
    isOptional?: boolean;
    isRecommended?: boolean;
}

export default function ModuleCard({ title, description, icon, status, onClick, color, isOptional, isRecommended }: ModuleCardProps) {
    const isLocked = status === 'locked';

    // Map for Tailwind dynamic classes
    const colorStyles: Record<string, { border: string, bg: string, text: string, shadow: string, glow: string }> = {
        'brand-green': {
            border: 'hover:border-brand-green/30',
            bg: 'group-hover:bg-brand-green/10',
            text: 'text-brand-green-bright',
            shadow: 'hover:shadow-brand-green/20',
            glow: 'bg-brand-green-bright shadow-[0_0_25px_rgba(0,255,136,0.6)]'
        },
        'gray-500': {
            border: 'hover:border-gray-500/30',
            bg: 'group-hover:bg-gray-500/10',
            text: 'text-gray-400',
            shadow: 'hover:shadow-gray-500/20',
            glow: 'bg-gray-500 shadow-[0_0_25px_rgba(156,163,175,0.6)]'
        }
    };

    const currentStyle = colorStyles[color] || colorStyles['brand-green'];

    return (
        <div
            onClick={onClick}
            className={`h-full relative group bg-bg-card border border-border-main rounded-industrial p-8 transition-all duration-500 cursor-pointer ${currentStyle.border} hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] ${currentStyle.shadow} hover:-translate-y-1 ${isLocked ? 'opacity-70 grayscale-[0.5]' : ''}`}
        >
            {/* Decorative Hover Line */}
            <div className={`absolute top-0 left-0 w-full h-[2px] rounded-full transition-all duration-700 opacity-0 group-hover:opacity-100 ${currentStyle.glow} z-20`} />

            {isLocked && (
                <div className="absolute top-6 right-6 flex items-center gap-2">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-bg-offset px-2 py-1 rounded-md">Activación Requerida</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>
            )}



            {isOptional && (
                <div className="absolute top-6 right-6">
                    <span className="bg-white/5 text-gray-500 text-[9px] px-2 py-1 rounded-full border border-white/5 font-bold tracking-widest uppercase">
                        Opcional (Flujo B)
                    </span>
                </div>
            )}

            {isRecommended && (
                <div className="absolute top-6 right-6">
                    <span className="bg-brand-green/20 text-brand-green-bright text-[9px] px-2 py-1 rounded-full border border-brand-green/20 font-bold tracking-widest uppercase animate-pulse">
                        Sugerido para Exp.
                    </span>
                </div>
            )}

            <div className={`w-14 h-14 rounded-industrial-sm bg-bg-offset flex items-center justify-center mb-6 transition-all duration-500 ${!isLocked ? `${currentStyle.bg} ${currentStyle.text}` : 'text-gray-500'}`}>
                {icon}
            </div>

            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
    );
}
