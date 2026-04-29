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

                <div className="max-w-7xl mx-auto px-8 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="AXISONE" className="h-36 w-auto" />
                        </div>
 
                        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
                            <a href="#core" className="hover:text-brand-green transition-colors">Infraestructura</a>
                            <a href="#roadmap" className="hover:text-brand-green transition-colors">Visión</a>
                        </nav>
 
                    </div>
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-brand-green text-white px-8 py-4 rounded-industrial-sm text-xs font-black uppercase hover:bg-brand-green-bright transition-all shadow-xl shadow-brand-green/10"
                        >
                            Validar Activo Digital
                        </button>

                    </div>
                </div>
            </header>

            {/* 2. HERO SECTION - Impacto Inmediato */}
            <main className="pt-64 pb-32 px-8">
                <div className="max-w-6xl mx-auto text-center space-y-12">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] max-w-5xl mx-auto text-brand-green">
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
                            className="w-full md:w-auto bg-brand-green text-white px-10 py-5 rounded-industrial-sm text-xs font-black uppercase hover:scale-105 transition-all shadow-2xl shadow-brand-green/20"
                        >
                            Validar Activo Digital
                        </button>

                        <a 
                            href="https://wa.me/573013970002?text=Hola%20Julio,%20quiero%20solicitar%20acceso%20a%20la%20infraestructura%20de%20AxisOne%20Coffee"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto border-2 border-brand-green text-brand-green px-10 py-5 rounded-industrial-sm text-xs font-black uppercase hover:bg-brand-green/5 transition-all text-center flex items-center justify-center"
                        >
                            Solicitar Acceso a Infraestructura
                        </a>

                    </div>
                </div>
            </main>

            {/* 3. THE CORE - El Registro de Nacimiento */}
            <section id="core" className="py-32 bg-soft-white border-y border-brand-green-soft">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="text-center mb-24 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-carbon">El Registro de Nacimiento Digital.</h2>
                        <p className="text-gray-500 font-medium uppercase text-sm">Un folio único e inalterable que acompaña cada grano.</p>
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
                                <h3 className="text-xl font-bold uppercase text-carbon">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium">

                                    {item.desc}
                                </p>
                            </div>
                        ))}

                    </div>
                </div>
            </section>

            {/* 4. LA ECUACIÓN DE CONFIANZA - Impacto Total */}
            <section className="py-24 bg-brand-green">
                <div className="max-w-7xl mx-auto text-center px-8">
                    <h2 className="text-xl md:text-3xl font-black text-white uppercase leading-none whitespace-nowrap">
                        CERTEZA = 100% = CONFIANZA
                    </h2>
                    <p className="text-white/80 font-bold uppercase text-[10px] mt-8">
                        La infraestructura que elimina la incertidumbre en el mercado global.
                    </p>

                </div>
            </section>

            {/* 5. ROADMAP - Panamá - Light Gray Theme */}
            <section id="roadmap" className="py-32 bg-soft-white text-carbon relative overflow-hidden border-b border-brand-green-soft">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                <div className="max-w-5xl mx-auto px-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black uppercase leading-none text-carbon">Visión Global.</h2>
                            <p className="text-gray-500 text-lg leading-relaxed font-medium">

                                Estamos integrando protocolos de cumplimiento internacional para la próxima generación de exportaciones. 
                            </p>
                        </div>
                        <div className="bg-white border border-brand-green-soft rounded-industrial p-12 text-center shadow-sm">
                            <div className="text-6xl font-black mb-4 text-carbon">2026</div>
                            <p className="text-[10px] font-black uppercase text-brand-green">Global Expansion Phase</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* 6. FOOTER - Rediseño Corporativo Refinado */}
            <footer className="bg-brand-green py-20 px-8 text-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-12">
                    
                    {/* Hito Izquierda - Reemplazando al Logo */}
                    <div className="flex justify-center md:justify-start">
                        <p className="text-[11px] font-bold text-white uppercase tracking-[0.4em] leading-relaxed max-w-[200px]">
                            Próximo hito: World of Coffee Panama, Octubre 2026
                        </p>
                    </div>

                    {/* Ubicación Centro */}
                    <div className="text-center">
                        <p className="text-lg font-bold uppercase tracking-[0.4em] whitespace-nowrap">Risaralda, Colombia</p>
                    </div>

                    {/* Contacto Derecha - Más Grande y Menos Grueso */}
                    <div className="flex flex-col items-center md:items-end gap-6">
                        <a 
                            href="https://www.linkedin.com/in/julio-cesar-uva-ram%C3%ADrez-b7a124163/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-4 hover:opacity-80 transition-opacity group"
                        >
                            <span className="text-sm font-bold uppercase tracking-widest">Julio César Uva Ramírez</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="opacity-80 group-hover:opacity-100"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        </a>
                        
                        <a 
                            href="https://wa.me/573013970002?text=Hola%20Julio,%20estoy%20interesado%20en%20AxisOne%20Coffee" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-4 hover:opacity-80 transition-opacity group"
                        >
                            <span className="text-sm font-bold uppercase tracking-widest">+57 301 397 0002</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="opacity-80 group-hover:opacity-100"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        </a>
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
                            <img src="/logo.png" alt="AXISONE" className="h-36 mx-auto mb-6" />
                            <h2 className="text-2xl font-black uppercase text-carbon">Acceso a Infraestructura</h2>


                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">Terminal de Control Maestro</p>

                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Corporativo</label>
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Clave de Acceso</label>
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
                                className="w-full bg-brand-green text-white font-black py-4 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 uppercase text-xs flex items-center justify-center gap-3"
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
