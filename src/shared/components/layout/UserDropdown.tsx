'use client';

import React, { useState, useRef, useEffect } from 'react';

interface UserDropdownProps {
    user: { name: string, email: string, role?: string, companyId?: string };
    onLogout: () => void;
    onOpenManual: () => void;
    onOpenUpdates: () => void;
    onSelectView?: (view: 'ecosystem' | 'supply' | 'master' | 'stats' | 'radar') => void;
    onOpenCloudVault?: () => void;
}

export default function UserDropdown({ user, onLogout, onOpenManual, onOpenUpdates, onSelectView, onOpenCloudVault }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cerrar al clickear fuera
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node) === false) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = user.name
        ? user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
        : 'US';

    const isAdmin = user.email?.toLowerCase().includes('julio') || user.role === 'admin' || user.role === 'auditor';

    return (
        <div className="relative z-[9999]" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pl-4 pr-2 bg-bg-offset border border-border-main rounded-industrial-sm hover:border-gray-400 shadow-sm transition-all group animate-in fade-in duration-300"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-[11px] font-bold text-brand-navy uppercase leading-none">{user.name || 'Operador'}</p>
                    <p className="text-[9px] text-brand-navy font-bold uppercase mt-1">
                        {isAdmin ? 'Super Administrador' : 'Operador Central'}
                    </p>
                </div>
                <div className="w-9 h-9 bg-white border border-gray-400 shadow-sm rounded-industrial-sm flex items-center justify-center text-brand-navy-bright font-bold text-xs shadow-inner uppercase">
                    {initials}
                </div>
                <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                    className={`text-brand-navy transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-bg-card border border-gray-400 shadow-sm rounded-industrial p-4 shadow-3xl z-[10000] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                    <div className="px-4 py-3 border-b border-gray-400 shadow-sm mb-2">
                        <p className="text-[9px] text-brand-navy font-bold uppercase mb-1">Sesión Activa</p>
                        <p className="text-[11px] font-bold text-brand-navy truncate">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                        {/* 360 ECOSYSTEM DASHBOARD */}
                        {onSelectView && (
                            <button
                                onClick={() => { onSelectView('ecosystem'); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r hover:from-brand-green hover:to-emerald-500 rounded-industrial-sm text-[11px] font-black uppercase text-brand-navy hover:text-white transition-all duration-300"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
                                360° Ecosystem Dashboard
                            </button>
                        )}

                        {/* ACCESOS DE TRAZABILIDAD (MÓDULO PRINCIPAL DE SUPPLY) */}
                        {onSelectView && (
                            <button
                                onClick={() => { onSelectView('supply'); onOpenCloudVault && onOpenCloudVault(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-industrial-sm text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l9 4.9V17L12 22l-9-4.9V7z"/><path d="M12 22V12"/><path d="M21 7l-9 5-9-5"/></svg>
                                Traceability Operations
                            </button>
                        )}

                        {/* ACCESOS DE SUPER ADMINISTRADOR */}
                        {isAdmin && (
                            <>
                                {onSelectView && (
                                    <button
                                        onClick={() => { onSelectView('master'); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-industrial-sm text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                        Centro Gobernanza
                                    </button>
                                )}

                                {onSelectView && (
                                    <button
                                        onClick={() => { onSelectView('stats'); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-industrial-sm text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                                        Estadísticas Red
                                    </button>
                                )}

                                {onSelectView && (
                                    <button
                                        onClick={() => { onSelectView('radar'); setIsOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-industrial-sm text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20M12 12l5-5"/></svg>
                                        Coffee Radar
                                    </button>
                                )}
                            </>
                        )}

                        {onOpenCloudVault && (
                            <button
                                onClick={() => { onOpenCloudVault(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-industrial-sm text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                Portal en la Nube
                            </button>
                        )}

                        <div className="h-px bg-white my-2"></div>

                        <button
                            onClick={() => { onOpenUpdates(); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-industrial-sm text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all group"
                        >
                            <div className="relative">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-green rounded-full border border-bg-card animate-pulse"></span>
                            </div>
                            Mensajes del Sistema
                        </button>

                        <button
                            onClick={() => { onOpenManual(); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-industrial-sm text-[11px] font-bold uppercase text-brand-navy hover:text-brand-navy transition-all"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                            Manual de Operación
                        </button>

                        <div className="h-px bg-white my-2"></div>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-red/10 rounded-industrial-sm text-[11px] font-bold uppercase text-brand-red-bright transition-all"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Cerrar Sesión Core
                        </button>
                    </div>

                    <div className="mt-4 px-4 py-3 bg-white rounded-industrial-sm border border-gray-400 shadow-sm">
                        <p className="text-[9px] text-brand-navy font-bold uppercase mb-1">Estado de Red</p>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                            <p className="text-[9px] text-brand-navy font-mono">AXIS-PRO Sincronizado</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
