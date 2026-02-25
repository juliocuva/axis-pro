'use client';

import React, { useState, useRef, useEffect } from 'react';

interface UserDropdownProps {
    user: { name: string, email: string };
    onLogout: () => void;
    onOpenManual: () => void;
    onOpenUpdates: () => void;
}

export default function UserDropdown({ user, onLogout, onOpenManual, onOpenUpdates }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cerrar al clickear fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pl-4 pr-2 bg-bg-offset border border-border-main rounded-industrial-sm hover:border-brand-green/30 transition-all group"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-white uppercase tracking-tighter leading-none">{user.name}</p>
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Clase A Operador</p>
                </div>
                <div className="w-9 h-9 bg-brand-green/10 border border-brand-green/20 rounded-industrial-sm flex items-center justify-center text-brand-green-bright font-bold text-xs shadow-inner uppercase">
                    {initials}
                </div>
                <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                    className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-bg-card border border-white/10 rounded-industrial p-4 shadow-3xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-1">Sesión Activa</p>
                        <p className="text-[11px] font-bold text-white truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                        <button
                            onClick={() => { onOpenUpdates(); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all group"
                        >
                            <div className="relative">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-green rounded-full border border-bg-card animate-pulse"></span>
                            </div>
                            Mensajes del Sistema
                        </button>

                        <button
                            onClick={() => { onOpenManual(); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                            Manual de Operación
                        </button>

                        <div className="h-px bg-white/5 my-2"></div>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-red/10 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest text-brand-red-bright transition-all"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Cerrar Sesión Core
                        </button>
                    </div>

                    <div className="mt-4 px-4 py-3 bg-brand-green/5 rounded-industrial-sm border border-brand-green/10">
                        <p className="text-[8px] text-brand-green font-bold uppercase tracking-widest mb-1">Estado de Red</p>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                            <p className="text-[9px] text-gray-400 font-mono">AXIS-PRO Sincronizado</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
