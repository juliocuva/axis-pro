'use client';

import React, { useState, useEffect } from 'react';

interface AuthScreenProps {
    onLogin: (userData: { email: string, name: string, companyId: string }) => void;
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

        // Simulamos un delay de autenticación/registro
        setTimeout(() => {
            // Generar un companyId basado en el dominio o email para separar historiales
            // En producción esto vendría del campo 'company_id' en la tabla de usuarios
            const domain = email.split('@')[1] || 'generic.com';

            // Mapeo simple de dominios a IDs fijos para pruebas consistentes
            // Si es un email de test conocido, asignamos IDs fijos
            let companyId = '99999999-9999-9999-9999-999999999999'; // Default AXIS

            const publicDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];

            if (domain === 'axiscoffee.pro') {
                companyId = '99999999-9999-9999-9999-999999999999';
            } else if (domain === 'sagradocorazon.com') {
                companyId = '11111111-1111-1111-1111-111111111111';
            } else if (publicDomains.includes(domain)) {
                // Para dominios públicos, generamos un ID basado en el EMAIL completo para separarlos
                // Usamos un hash simple o la longitud combinada
                companyId = '33333333-3333-3333-3333-' + email.length.toString().padStart(6, '0') + domain.length.toString().padStart(6, '0');
            } else {
                // Otros dominios corporativos comparten historial por defecto
                companyId = '22222222-2222-2222-2222-' + domain.length.toString().padStart(12, '0');
            }

            onLogin({
                email,
                name: isSignUp ? name : email.split('@')[0],
                companyId
            });
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#03000d] text-white selection:bg-brand-green selection:text-black">
            {/* 1. TOP UTILITY HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 bg-[#03000d]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/5 rounded-md flex items-center justify-center p-1 border border-white/10">
                                <img src="/logo.png" alt="AXIS" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm font-bold tracking-tighter uppercase">AXIS COFFEE <span className="text-brand-green">PRO</span></span>
                        </div>
                        <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <a href="#features" className="hover:text-white transition-colors">Tecnología</a>
                            <a href="#plans" className="hover:text-white transition-colors">Planes</a>
                            <a href="#contact" className="hover:text-white transition-colors">Contacto</a>
                        </nav>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-r border-white/10 pr-6">
                            <span>Email: support@axiscoffee.pro</span>
                            <div className="w-1 h-1 bg-brand-green rounded-full"></div>
                            <span>T: +57 321 000 0000</span>
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
            <main className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Background FX */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-green/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-12">
                    <div className="mx-auto w-48 h-48 bg-white/5 rounded-industrial flex items-center justify-center p-6 shadow-3xl border border-white/10 animate-in fade-in zoom-in duration-1000">
                        <img src="/logo.png" alt="AXIS Logo" className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <h1 className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase leading-[0.95] selection:bg-brand-green/30">
                            Capa de <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-green via-brand-green-bright to-blue-500">Inteligencia Industrial</span> para el Control Total del café
                        </h1>
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10"></div>
                                <p className="text-[11px] md:text-xs text-gray-400 font-bold uppercase tracking-[0.5em] leading-relaxed">
                                    Trazabilidad de la Cadena de Valor • TRL 7
                                </p>
                                <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 pt-10">
                        <button className="px-10 py-5 bg-white text-black font-bold uppercase text-xs tracking-[0.2em] rounded-industrial-sm hover:scale-105 transition-all">
                            VER DEMO OPERATIVA
                        </button>
                        <button className="px-10 py-5 bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-[0.2em] rounded-industrial-sm hover:bg-white/10 transition-all">
                            CONOCER PLANES
                        </button>
                    </div>
                </div>
            </main>

            {/* 3. MODULE ARCHITECTURE (Marketing Features) */}
            <section id="features" className="py-24 bg-black/40 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div className="space-y-4">
                            <span className="text-[10px] text-brand-green font-bold uppercase tracking-[0.5em]">ECOSISTEMA MODULAR</span>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">ARQUITECTURA DE CONTROL</h2>
                        </div>
                        <p className="max-w-md text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Diseñado bajo estándares TRL-7 para integrarse en operaciones que exigen precisión milimétrica y trazabilidad inmutable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Supply & Quality', desc: 'Factor de rendimiento, laboratorios físicos y catación SCA automatizada.', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
                            { title: 'Roast Intelligence', desc: 'IA predictiva de curvas, monitoreo ROR y perfiles de referencia blindados.', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
                            { title: 'Global Trade', desc: 'Pasaportes digitales QR y motores predictivos de desgasificación logística.', icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
                            { title: 'Retail Connect', desc: 'Trazabilidad B2C directa con historias de origen generadas por datos.', icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0' }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-bg-card p-10 rounded-industrial border border-white/5 hover:border-brand-green/30 transition-all group">
                                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-brand-green mb-8 group-hover:bg-brand-green group-hover:text-black transition-all">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={item.icon} /></svg>
                                </div>
                                <h3 className="text-lg font-bold uppercase mb-4">{item.title}</h3>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3.5 CLIENT CAROUSEL (Social Proof) */}
            <section className="py-20 bg-black/20 border-b border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-10">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.5em] text-center">Con la confianza de tostadores líderes</p>
                </div>
                <div className="flex gap-20 animate-marquee whitespace-nowrap opacity-40 hover:opacity-100 transition-opacity">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex items-center gap-4 grayscale">
                            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                            <span className="text-sm font-bold uppercase tracking-tighter">PARTNER COFFEE {i}</span>
                        </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={`dup-${i}`} className="flex items-center gap-4 grayscale">
                            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                            <span className="text-sm font-bold uppercase tracking-tighter">PARTNER COFFEE {i}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. FOOTER */}
            <footer className="py-20 bg-black">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/5 pb-20">
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/5 rounded-md flex items-center justify-center border border-white/10">
                                <img src="/logo.png" alt="AXIS" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold tracking-tighter uppercase">AXIS COFFEE <span className="text-brand-green">PRO</span></span>
                        </div>
                        <p className="max-w-md text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Infraestructura digital masiva para la industria cafetera. 100% cloud, 100% trazable, 100% industrial.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Legal</h4>
                        <nav className="flex flex-col gap-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            <a href="#" className="hover:text-white transition-colors">Términos</a>
                            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-white transition-colors">SLA</a>
                        </nav>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Social</h4>
                        <nav className="flex flex-col gap-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            <a href="#" className="hover:text-white transition-colors">Instagram</a>
                            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                            <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        </nav>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.2em]">© 2026 AXIS COFFEE ROASTERS • TODOS LOS DERECHOS RESERVADOS</p>
                    <div className="flex gap-8 text-[9px] text-gray-700 font-bold uppercase tracking-[0.2em]">
                        <span>Versión 2.0.4 PRO</span>
                        <span>Hosting en Bóveda Global</span>
                    </div>
                </div>
            </footer>

            {/* 5. LOGIN MODAL OVERLAY */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="w-full max-w-md relative">
                        <button
                            onClick={() => setShowLoginModal(false)}
                            className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cerrar
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>

                        <div className="bg-bg-card border border-white/10 p-10 rounded-industrial shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>

                            <div className="mb-8 text-center relative z-10">
                                <h2 className="text-3xl font-bold text-white tracking-tighter uppercase mb-2">
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
                                            className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-700 font-bold text-white shadow-inner"
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
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-700 text-white font-bold shadow-inner"
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
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-4 text-sm focus:border-brand-green outline-none transition-all placeholder:text-gray-700 text-white shadow-inner"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-3 group overflow-hidden relative"
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

