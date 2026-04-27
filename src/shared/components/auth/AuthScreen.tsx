'use client';

import React, { useState } from 'react';
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

        const isTatama = email.toLowerCase().includes('tatama');
        const rawDomain = email.split('@')[1] || 'independent.com';
        
        const publicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
        const isPublicDomain = publicDomains.includes(rawDomain.toLowerCase());
        
        const companyId = isTatama ? 'TATAMA-SANTUARIO' : (isPublicDomain ? email.toUpperCase() : rawDomain.toUpperCase());
        const userName = isSignUp ? name : (isTatama ? 'TATAMA SANTUARIO' : email.split('@')[0].toUpperCase());
        const isMasterAuditor = email.toLowerCase() === 'juliocuva@axisonecoffee.pro';
        const role = isMasterAuditor ? 'auditor' : ((email.toLowerCase().includes('julio') || isTatama) ? 'gerente' : 'visitante');

        const loadAndPersistProfile = async () => {
            try {
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('company_id, role, full_name')
                    .eq('email', email.toLowerCase())
                    .single();

                let finalCompanyId = companyId;
                let finalRole = role;
                let finalName = userName;

                if (existingProfile) {
                    finalCompanyId = existingProfile.company_id || companyId;
                    finalRole = existingProfile.role || role;
                    finalName = existingProfile.full_name || userName;
                }

                await supabase.from('profiles').upsert({
                    email: email.toLowerCase(),
                    full_name: finalName,
                    company_id: finalCompanyId,
                    role: finalRole,
                    last_active: new Date().toISOString(),
                    status: 'active'
                }, { onConflict: 'email' });

                return { companyId: finalCompanyId, role: finalRole, name: finalName };
            } catch (e) {
                return { companyId, role, name: userName };
            }
        };

        loadAndPersistProfile().then((finalIdentity) => {
            onLogin({
                email,
                name: finalIdentity.name,
                companyId: finalIdentity.companyId,
                role: finalIdentity.role
            });
            setIsLoading(false);
        });
    };

    return (
        <div className="min-h-screen bg-soft-white text-carbon selection:bg-brand-green selection:text-white font-sans">
            {/* 1. HEADER - Minimalista High Ticket */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-brand-green-soft">

                <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="AXISONE" className="h-12 w-auto" />
                        </div>

                        <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            <a href="#core" className="hover:text-brand-green transition-colors">Infraestructura</a>
                            <a href="#roadmap" className="hover:text-brand-green transition-colors">Visión</a>
                        </nav>
                    </div>
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-brand-green text-white px-8 py-3 rounded-industrial-sm text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-green-bright transition-all shadow-xl shadow-brand-green/10"
                        >
                            Validar Activo Digital
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. HERO SECTION - Impacto Inmediato */}
            <main className="pt-40 pb-32 px-8">
                <div className="max-w-6xl mx-auto text-center space-y-12">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] max-w-5xl mx-auto text-brand-green">
                            Certeza absoluta para el comercio de café de especialidad.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
                            Transformamos la trazabilidad técnica en activos digitales inmutables. <br className="hidden md:block" />
                            <span className="text-carbon font-bold">El estándar de confianza que viaja más rápido que el origen.</span>
                        </p>

                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="w-full md:w-auto bg-brand-green text-white px-10 py-5 rounded-industrial-sm text-xs font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl shadow-brand-green/20"
                        >
                            Validar Activo Digital
                        </button>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="w-full md:w-auto border-2 border-brand-green text-brand-green px-10 py-5 rounded-industrial-sm text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-green/5 transition-all"
                        >
                            Solicitar Acceso a Infraestructura
                        </button>
                    </div>
                </div>
            </main>

            {/* 3. THE CORE - El Registro de Nacimiento */}
            <section id="core" className="py-32 bg-soft-white border-y border-brand-green-soft">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="text-center mb-24 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-carbon">El Registro de Nacimiento Digital.</h2>
                        <p className="text-gray-500 font-medium uppercase tracking-widest text-sm">Un folio único e inalterable que acompaña cada grano.</p>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        {[
                            {
                                title: "Inmutabilidad Sensorial",
                                desc: "Registro permanente de puntajes de taza y protocolos de tueste con validación técnica.",
                                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            },
                            {
                                title: "Blindaje de Proceso",
                                desc: "Captura de datos de fermentación, pH y Grados Brix mediante protocolos industriales.",
                                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            },
                            {
                                title: "Identidad de Origen",
                                desc: "Certificación de procedencia 1:1 y cumplimiento EUDR, eliminando el beneficio de la duda.",
                                icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-6 text-center md:text-left">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-brand-green-soft flex items-center justify-center text-brand-green mx-auto md:mx-0">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-tight text-carbon">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))}

                    </div>
                </div>
            </section>

            {/* 4. LA ECUACIÓN DE CONFIANZA */}
            <section className="py-40 bg-white">
                <div className="max-w-4xl mx-auto text-center space-y-8 px-8">
                    <div className="inline-block px-8 py-4 bg-brand-green-soft/10 rounded-full border border-brand-green-soft/30">
                        <p className="text-2xl md:text-4xl font-black text-brand-green tracking-[0.2em]">
                            CERTEZA = 100% = CONFIANZA
                        </p>
                    </div>

                    <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-xs">
                        La infraestructura que elimina la incertidumbre en el mercado global.
                    </p>
                </div>
            </section>

            {/* 5. ROADMAP - Panamá */}
            <section id="roadmap" className="py-32 bg-black text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-5xl mx-auto px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">Visión Global.</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Estamos integrando protocolos de cumplimiento internacional para la próxima generación de exportaciones. 
                                <span className="text-brand-green font-bold block mt-4">Próximo hito: World of Coffee Panama, Octubre 2026.</span>
                            </p>
                        </div>
                        <div className="bg-white/5 border border-brand-green-muted/30 rounded-industrial p-12 text-center">
                            <div className="text-6xl font-black mb-4">2026</div>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-green-muted">Global Expansion Phase</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* 6. FOOTER */}
            <footer className="bg-brand-green py-20 px-8 text-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="space-y-6 text-center md:text-left">
                        <img src="/logo.png" alt="AXISONE" className="h-12 w-auto brightness-0 invert mx-auto md:mx-0" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80">
                            * AXISONE COFFEE | La Fuente Única de Verdad.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
                        <div className="text-center md:text-right">
                            <p>Pereira, Risaralda, Colombia.</p>
                            <a href="https://www.linkedin.com/in/julio-uva-b7a124163/" target="_blank" rel="noopener noreferrer" className="hover:underline mt-2 block">LinkedIn Professional Profile</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* LOGIN MODAL */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-carbon/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-industrial p-10 shadow-2xl border border-brand-green-soft relative">
                        <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-carbon transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="mb-10 text-center">
                            <img src="/logo.png" alt="AXISONE" className="h-12 mx-auto mb-6" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-carbon">Acceso a Infraestructura</h2>

                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Terminal de Control Maestro</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="usuario@axisonecoffee.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border-b-2 border-brand-green-soft/30 px-1 py-3 text-sm focus:border-brand-green outline-none transition-all font-bold text-carbon"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Clave de Acceso</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border-b-2 border-brand-green-soft/30 px-1 py-3 text-sm focus:border-brand-green outline-none transition-all font-bold text-carbon"
                                />
                            </div>


                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-brand-green text-white font-black py-4 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
                            >
                                {isLoading ? "Verificando..." : "Entrar al Sistema"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
