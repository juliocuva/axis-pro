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

    return (
        <div
            onClick={!isLocked ? onClick : undefined}
            className={`relative group bg-bg-card border border-white/5 rounded-3xl p-8 transition-all duration-500 ${!isLocked ? 'cursor-pointer hover:border-' + color + '/30 hover:shadow-2xl hover:shadow-' + color + '/10 hover:-translate-y-1' : 'opacity-60 grayscale'}`}
        >
            {isLocked && (
                <div className="absolute top-6 right-6">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
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

            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 transition-colors duration-500 ${!isLocked ? 'group-hover:bg-' + color + '/10 group-hover:text-' + color + '-bright' : 'text-gray-600'}`}>
                {icon}
            </div>

            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{description}</p>

            {!isLocked ? (
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all duration-500 group-hover:translate-x-2">
                    <span>Acceder al Módulo</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </div>
            ) : (
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
                    Reservado (Próxima Fase)
                </div>
            )}
        </div>
    );
}
