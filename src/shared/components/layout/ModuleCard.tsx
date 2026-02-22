'use client';

import React from 'react';

interface ModuleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    status: 'active' | 'locked' | 'trl7';
    onClick?: () => void;
    color: string;
}

export default function ModuleCard({ title, description, icon, status, onClick, color }: ModuleCardProps) {
    const isLocked = status === 'locked';

    // Map for Tailwind dynamic classes
    const colorStyles: Record<string, { border: string, bg: string, text: string, shadow: string, glow: string }> = {
        'brand-green': {
            border: 'hover:border-brand-green/30',
            bg: 'group-hover:bg-brand-green/10',
            text: 'text-brand-green-bright',
            shadow: 'hover:shadow-brand-green/10',
            glow: 'bg-brand-green-bright shadow-[0_0_15px_rgba(0,255,136,0.5)]'
        },
        'orange-500': {
            border: 'hover:border-orange-500/30',
            bg: 'group-hover:bg-orange-500/10',
            text: 'text-orange-400',
            shadow: 'hover:shadow-orange-500/10',
            glow: 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]'
        },
        'blue-500': {
            border: 'hover:border-blue-500/30',
            bg: 'group-hover:bg-blue-500/10',
            text: 'text-blue-400',
            shadow: 'hover:shadow-blue-500/10',
            glow: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
        },
        'purple-500': {
            border: 'hover:border-purple-500/30',
            bg: 'group-hover:bg-purple-500/10',
            text: 'text-purple-400',
            shadow: 'hover:shadow-purple-500/10',
            glow: 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
        }
    };

    const currentStyle = colorStyles[color] || colorStyles['brand-green'];

    return (
        <div
            onClick={onClick}
            className={`relative group bg-bg-card border border-white/5 rounded-3xl p-8 transition-all duration-500 cursor-pointer ${currentStyle.border} hover:shadow-2xl ${currentStyle.shadow} hover:-translate-y-1 ${isLocked ? 'opacity-70 grayscale-[0.5]' : ''}`}
        >
            {/* Decorative Hover Line */}
            <div className={`absolute top-0 left-0 w-full h-[2px] rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 ${currentStyle.glow} z-20`} />

            {isLocked && (
                <div className="absolute top-6 right-6 flex items-center gap-2">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Activación Requerida</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>
            )}

            {status === 'trl7' && (
                <div className="absolute top-6 right-6">
                    <span className="bg-brand-green/20 text-brand-green-bright text-[10px] px-2 py-1 rounded-full font-mono font-bold tracking-widest uppercase">
                        TRL 7
                    </span>
                </div>
            )}

            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 transition-all duration-500 ${!isLocked ? `${currentStyle.bg} ${currentStyle.text}` : 'text-gray-500'}`}>
                {icon}
            </div>

            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{description}</p>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all duration-500 group-hover:translate-x-2">
                <span className={currentStyle.text}>{isLocked ? 'Desbloquear con Activación' : 'Acceder al Módulo'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={currentStyle.text}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
}
