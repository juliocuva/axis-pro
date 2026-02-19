'use client';

import React, { useState } from 'react';

interface AuthScreenProps {
    onLogin: (email: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulamos un delay de autenticación con el look premium
        setTimeout(() => {
            onLogin(email);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-main">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
                {/* Logo Section */}
                <div className="text-center space-y-4">
                    <div className="mx-auto w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center p-2 shadow-2xl relative overflow-hidden group">
                        <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain relative z-10" />
                        <div className="absolute inset-0 bg-brand-green/20 blur-2xl group-hover:bg-brand-green/30 transition-all"></div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tighter text-white">AXIS COFFEE PRO</h2>
                        <p className="text-xs font-mono text-brand-green-bright uppercase tracking-[0.3em] mt-1">SaaS Intelligence</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-bg-card border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Terminal de Acceso</label>
                            <input
                                type="email"
                                required
                                placeholder="usuario@axiscoffee.pro"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-bg-main border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Clave de Seguridad</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-bg-main border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-700"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-brand-green/20 flex items-center justify-center gap-3 group overflow-hidden relative"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm">VERIFICANDO CREDENCIALES...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="relative z-10">INICIAR SESIÓN INDUSTRIAL</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform relative z-10">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest leading-loose">
                    Acceso restringido a personal autorizado de AXIS COFFEE ROASTERS.<br />
                    Copyright © 2026 • Versión 2.0 PRO Enterprise
                </p>
            </div>
        </div>
    );
}
