'use client';

import React, { useState, useEffect } from 'react';
import ModuleCard from '@/shared/components/layout/ModuleCard';
import { supabase } from '@/shared/lib/supabase';
import ThemeToggle from '@/shared/components/layout/ThemeToggle';

interface AuthScreenProps {
    onLogin: (userData: { email: string, name: string, companyId: string, role?: string }) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // 1. Generar metadatos del usuario
        // 2. UNIVERSALIDAD: Cualquier correo es bienvenido y rastreado
        const isTatama = email.toLowerCase().includes('tatama');
        const rawDomain = email.split('@')[1] || 'independent.com';
        
        // SEGURIDAD CRÍTICA: Si el dominio es genérico (gmail, etc.), el ID de empresa debe ser el correo completo
        const publicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
        const isPublicDomain = publicDomains.includes(rawDomain.toLowerCase());
        
        const companyId = isTatama ? 'TATAMA-SANTUARIO' : (isPublicDomain ? email.toUpperCase() : rawDomain.toUpperCase());
        const userName = isSignUp ? name : (isTatama ? 'TATAMA SANTUARIO' : email.split('@')[0].toUpperCase());
        const isMasterAuditor = email.toLowerCase() === 'juliocuva@axiscoffee.pro';
        const role = isMasterAuditor ? 'auditor' : ((email.toLowerCase().includes('julio') || isTatama) ? 'gerente' : 'visitante');

        // 2. PERSISTENCIA REAL: Guardamos el perfil en Supabase para que aparezca en Gobernanza
        const persistProfile = async () => {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        email: email.toLowerCase(),
                        full_name: userName,
                        company_id: companyId,
                        role: role,
                        last_active: new Date().toISOString(),
                        status: 'active'
                    }, { onConflict: 'email' });
                
                if (error) {
                    console.error("Error persistiendo perfil:", error);
                    alert("ERROR DE RED: No se pudo registrar el perfil en la Bóveda Axis. Verifica los logs.");
                }
            } catch (e) {
                console.error("Fallo crítico de red en Auth:", e);
                alert("ERROR CRÍTICO: Fallo de conexión con la red Axis.");
            }
        };

        persistProfile().then(() => {
            onLogin({
                email,
                name: userName,
                companyId,
                role: role
            });
            setIsLoading(false);
        });
    };

    return (
        <div
            className="min-h-screen bg-bg-main text-text-main selection:bg-brand-green selection:text-black cursor-pointer"
            onClick={() => {
                if (!showLoginModal) setShowLoginModal(true);
            }}
        >
            {/* 1. TOP UTILITY HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 bg-bg-main/80 backdrop-blur-md border-b border-border-main" onClick={(e) => e.stopPropagation()}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/5 rounded-md flex items-center justify-center p-1 border border-white/10">
                                <img src="/logo.png" alt="AXIS" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm font-bold tracking-tighter uppercase text-text-main">AXIS COFFEE <span className="text-brand-green">PRO</span></span>
                        </div>
                        <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <a href="#features" className="hover:text-brand-green transition-colors">Tecnología</a>
                        </nav>
                    </div>
                    <div className="flex items-center gap-6">
                        <ThemeToggle />
                        <div className="hidden lg:flex items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-r border-white/10 pr-6">
                            <span>Email: juliocuva@gmail.com</span>
                            <div className="w-1 h-1 bg-brand-green rounded-full"></div>
                            <span>T: +57 301 397 0002</span>
                            <div className="w-1 h-1 bg-brand-green rounded-full"></div>
                            <a href="https://www.linkedin.com/in/julio-uva-b7a124163/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors hover:underline">LinkedIn</a>
                        </div>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-brand-green text-black px-5 py-2 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest hover:bg-brand-green-bright transition-all shadow-lg shadow-brand-green/20"
                        >
                            ACCESO OPERADORES
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. HERO SECTION */}
            <main className="min-h-screen pt-32 pb-20 px-6 relative flex items-center justify-center overflow-hidden border-b border-white/5">
                {/* Background Image & FX */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('/hero_bg.png')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#03000d] via-[#03000d]/50 to-[#03000d]"></div>
                </div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-green/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4 z-0 pointer-events-none"></div>

                <div className="w-full max-w-5xl mx-auto text-center relative z-10 space-y-12">
                    <div className="mx-auto w-40 h-40 bg-white/5 rounded-industrial flex items-center justify-center p-6 shadow-3xl border border-white/10 animate-in fade-in zoom-in duration-1000 backdrop-blur-md">
                        <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]" />
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h1 className="max-w-4xl mx-auto text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-[1.0] selection:bg-brand-green/30 drop-shadow-2xl text-text-main">
                            Axis Coffee Pro opera en la intersección entre la <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-green via-brand-green-bright to-blue-500">cuarta y quinta ola</span> del café
                        </h1>
                        <p className="max-w-2xl mx-auto text-sm md:text-lg text-gray-400 font-normal uppercase tracking-[0.2em] leading-relaxed opacity-80">
                            Ciencia de datos de trazabilidad y certificación para cumplimiento internacional.
                        </p>
                        <div className="flex flex-col items-center gap-4 pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10"></div>
                                <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.5em] leading-none">
                                    Protocolo Industrial • BAX-7370
                                </p>
                                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10"></div>
                            </div>
                        </div>
                    </div>


                </div>
            </main>

            {/* 3. MODULE ARCHITECTURE (Marketing Features) */}
            <section id="features" className="min-h-screen py-24 bg-bg-main/90 border-y border-white/5 flex items-center justify-center">
                <div className="w-full max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div className="space-y-4">
                            <span className="text-[10px] text-brand-green font-bold uppercase tracking-[0.5em]">ECOSISTEMA MODULAR</span>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase text-text-main">ARQUITECTURA DE CONTROL</h2>
                        </div>
                        <p className="max-w-md text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Diseñado bajo estándares rigurosos para integrarse en operaciones que exigen precisión milimétrica y trazabilidad inmutable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {[
                            { title: 'Origen Inmutable', desc: 'Fijación de coordenadas GIS/WGS84 y polígonos EUDR requeridos para aduanas europeas y asiáticas.', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', color: 'brand-green' },
                            { title: 'Pasaporte Aduanero', desc: 'Emisión de Certificado de Exportación QR/Hash: Prueba irrefutable de autenticidad y cumplimiento EUDR/FDA.', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', color: 'blue-500' }
                        ].map((item, idx) => (
                            <div key={idx} className="h-full flex flex-col">
                                <ModuleCard
                                    title={item.title}
                                    description={item.desc}
                                    status="active"
                                    color={item.color}
                                    onClick={() => setShowLoginModal(true)}
                                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.icon} /></svg>}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3.5 CLIENT LOGOS (Social Proof) */}
            <section className="py-20 bg-black/20 border-b border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-10">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.5em] text-center">Con la confianza de</p>
                </div>
                <div className="flex justify-center items-center opacity-80 hover:opacity-100 transition-opacity duration-500 flex-wrap mx-auto px-6" style={{ gap: '15vw' }}>
                    <div className="flex flex-col items-center gap-4">
                        <img src="/logo.png" alt="Sagrado Corazón" className="h-16 md:h-20 object-contain" />
                        <p className="text-[9px] text-brand-green font-bold uppercase tracking-[0.3em]">Axis Coffee Pro • Powered by Mouselab</p>
                    </div>
                    <img src="/mouselab.png" alt="Mouselab" className="h-10 md:h-16 object-contain filter grayscale invert opacity-80" />
                </div>
            </section>



            {/* 5. LOGIN MODAL OVERLAY */}
            {showLoginModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-bg-main/90 backdrop-blur-md"></div>
                    </div>

                    <div className="w-full max-w-md relative z-10">
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute -top-12 right-0 text-text-main/50 hover:text-brand-green transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cerrar
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>

                        <div className="bg-bg-card border border-white/10 p-10 rounded-industrial shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>

                            <div className="mb-8 text-center relative z-10 flex flex-col items-center">
                                <div className="mx-auto w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center p-2 shadow-lg border border-white/10 mb-6 animate-in fade-in zoom-in duration-500">
                                    <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain" />
                                </div>
                                <h2 className="text-3xl font-bold text-text-main tracking-tighter uppercase mb-2">
                                    {isSignUp ? 'Crear Registro' : 'Acceso Industrial'}
                                </h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                                    {isSignUp ? 'Únete a la red Axis Coffee' : 'Terminal de Control Maestro'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                {isSignUp && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="JULIO UVA"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-bg-main border border-border-main rounded-industrial-sm px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-400 font-bold text-text-main shadow-inner"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Corporativo</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="usuario@axiscoffee.pro"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-bg-main border border-border-main rounded-industrial-sm px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-400 text-text-main font-bold shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Clave Operativa</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-bg-main border border-border-main rounded-industrial-sm px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-400 text-text-main shadow-inner"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-brand-green hover:bg-brand-green-bright text-black font-black py-5 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-3 group overflow-hidden relative"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-bold tracking-[0.2em]">VERIFICANDO RED...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="relative z-10 text-xs tracking-widest uppercase">
                                                {isSignUp ? 'REGISTRARME EN AXIS' : 'ENTRAR AL SISTEMA'}
                                            </span>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform relative z-10">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center relative z-10">
                                <button
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-[10px] font-bold text-brand-green-bright uppercase tracking-widest hover:underline"
                                >
                                    {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿Nuevo Operador? Crea tu perfil'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

