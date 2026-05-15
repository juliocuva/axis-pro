'use client';

import React, { useState } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface AuthScreenProps {
    onLogin: (userData: { email: string, name: string, companyId: string, role?: string }) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
    const [language, setLanguage] = useState<'en' | 'es'>('en');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const content = {
        en: {
            nav: { infra: "Infrastructure", vision: "Vision", login: "Validate Asset" },
            hero: {
                tag: "AOC v3.0 DIGITAL WALK PROTOCOL",
                headline: "The Operating System for Coffee DNA.",
                subheadline: "AxisOne Coffee centralizes the technical knowledge behind every coffee lot — manual logs, cupping notes, lab data and operational history — into one structured system driven by precise data entry.",
                cta: "Request Early Access"
            },
            problem: {
                headline: "Most coffee knowledge disappears after harvest.",
                intro: "Specialty coffee operations generate extraordinary technical knowledge every season.",
                outro: "But most of it remains lost in fragmented formats:",
                list: ["spreadsheets", "scattered PDFs", "handwritten notebooks", "WhatsApp chats", "disconnected files", "human memory"],
                conclusion: "AxisOne replaces these fragmented sources with a single point of structured manual entry."
            },
            concept: {
                headline: "Every coffee lot has a technical DNA.",
                list: ["Fermentation variables.", "Drying behavior.", "Water activity.", "Cupping notes.", "Lab reports."],
                conclusion: "AxisOne Coffee structures that intelligence through precise, manual data logging."
            },
            features: {
                headline: "One structured memory system for specialty coffee.",
                items: [
                    { title: "Technical Lot Profiles", desc: "Build a complete digital identity for every coffee lot through structured data entry." },
                    { title: "Protocol Digitization", desc: "Map your fermentation and drying processes directly into our high-precision fields." },
                    { title: "Lab & Cupping Records", desc: "Convert sensory and laboratory findings into structured, searchable digital data." },
                    { title: "Keyboard-Driven Logging", desc: "Eliminate external spreadsheets by capturing all technical parameters directly into the system." },
                    { title: "Historical Traceability", desc: "Access years of operational memory built from your manual logs across harvests." }
                ]
            },
            target: {
                headline: "Built for quality-driven coffee operations.",
                list: ["Specialty farms", "Coffee labs", "Premium exporters", "Experimental processing operations", "Roasters focused on traceability", "Competition coffee producers"]
            },
            pricing: {
                headline: "Early Adopter Program",
                tiers: [
                    { name: "Starter", price: "USD 29/month", desc: "For small specialty farms and microlots.", features: ["Up to 25 lot profiles", "Structured data logging", "Real-time technical vaults", "Mobile data entry"] },
                    { name: "Professional", price: "USD 99/month", desc: "For exporters, labs and advanced operations.", features: ["Unlimited lot profiles", "Multi-user access", "Technical dashboards", "Historical analytics", "Advanced data architecture"] },
                    { name: "Enterprise", price: "Custom Pricing", desc: "For premium exporters and multi-farm operations.", features: ["API integrations", "Infrastructure customization", "Dedicated onboarding", "Advanced workflows"] }
                ]
            },
            vision: {
                headline: "The future of specialty coffee will depend on structured intelligence.",
                copy1: "The industry already produces exceptional coffee.",
                copy2: "The next step is capturing and preserving the technical knowledge behind it.",
                copy3: "AxisOne Coffee is the infrastructure where that manual intelligence lives."
            },
            footer: {
                headline: "Technical coffee knowledge should not die inside spreadsheets.",
                cta: "Become an Early Adopter"
            },
            login: {
                title: "Infrastructure Access",
                subtitle: "Master Control Terminal",
                labelId: "Identifier (Email or ID)",
                labelPass: "Access Key",
                button: "Enter System",
                verifying: "Verifying..."
            }
        },
        es: {
            nav: { infra: "Infraestructura", vision: "Visión", login: "Validar Activo" },
            hero: {
                tag: "PROTOCOLO DIGITAL WALK AOC v3.0",
                headline: "El Sistema Operativo para el ADN del Café.",
                subheadline: "AxisOne Coffee centraliza el conocimiento técnico detrás de cada lote — registros manuales, notas de cata, datos de laboratorio e historial operativo — en un solo sistema estructurado basado en entrada de datos precisa.",
                cta: "Solicitar Acceso"
            },
            problem: {
                headline: "La mayoría del conocimiento del café desaparece tras la cosecha.",
                intro: "Las operaciones de café de especialidad generan un conocimiento técnico extraordinario cada temporada.",
                outro: "Pero la mayor parte permanece perdida en formatos fragmentados:",
                list: ["hojas de cálculo", "PDFs dispersos", "cuadernos escritos a mano", "chats de WhatsApp", "archivos desconectados", "memoria humana"],
                conclusion: "AxisOne reemplaza estas fuentes fragmentadas con un punto único de entrada manual estructurada."
            },
            concept: {
                headline: "Cada lote de café tiene un ADN técnico.",
                list: ["Variables de fermentación.", "Comportamiento de secado.", "Actividad de agua.", "Notas de cata.", "Reportes de laboratorio."],
                conclusion: "AxisOne Coffee estructura esa inteligencia mediante el registro manual preciso de datos."
            },
            features: {
                headline: "Un sistema de memoria estructurado para café de especialidad.",
                items: [
                    { title: "Perfiles Técnicos de Lote", desc: "Construye una identidad digital completa para cada lote mediante entrada de datos estructurada." },
                    { title: "Digitalización de Protocolos", desc: "Mapea tus procesos de fermentación y secado directamente en nuestros campos de alta precisión." },
                    { title: "Registros de Lab y Cata", desc: "Convierte hallazgos sensoriales y de laboratorio en datos digitales estructurados." },
                    { title: "Registro por Teclado", desc: "Elimina Excels externos capturando todos los parámetros técnicos directamente en el sistema." },
                    { title: "Trazabilidad Histórica", desc: "Accede a años de memoria operativa construida desde tus registros manuales." }
                ]
            },
            target: {
                headline: "Construido para operaciones enfocadas en la calidad.",
                list: ["Fincas de especialidad", "Laboratorios de café", "Exportadores premium", "Procesamiento experimental", "Tostadores con foco en trazabilidad", "Productores de competencia"]
            },
            pricing: {
                headline: "Programa de Adoptantes Tempranos",
                tiers: [
                    { name: "Starter", price: "USD 29/mes", desc: "Para fincas de especialidad pequeñas y microlotes.", features: ["Hasta 25 perfiles de lote", "Registro de datos estructurado", "Bóvedas técnicas en tiempo real", "Entrada de datos móvil"] },
                    { name: "Professional", price: "USD 99/mes", desc: "Para exportadores, laboratorios y operaciones avanzadas.", features: ["Lotes ilimitados", "Acceso multi-usuario", "Dashboards técnicos", "Analítica histórica", "Arquitectura de datos avanzada"] },
                    { name: "Enterprise", price: "Precio Personalizado", desc: "Para exportadores premium y operaciones multi-finca.", features: ["Integraciones API", "Personalización de infraestructura", "Onboarding dedicado", "Flujos de trabajo avanzados"] }
                ]
            },
            vision: {
                headline: "El futuro del café de especialidad dependerá de la inteligencia estructurada.",
                copy1: "La industria ya produce café excepcional.",
                copy2: "El siguiente paso es capturar y preservar el conocimiento técnico detrás de él.",
                copy3: "AxisOne Coffee es la infraestructura donde vive esa inteligencia manual."
            },
            footer: {
                headline: "El conocimiento técnico no debería morir en hojas de cálculo.",
                cta: "Sé un Adoptante Temprano"
            },
            login: {
                title: "Acceso a Infraestructura",
                subtitle: "Terminal de Control Maestro",
                labelId: "Identificador (Email o Cédula)",
                labelPass: "Clave de Acceso",
                button: "Entrar al Sistema",
                verifying: "Verificando..."
            }
        }
    };

    const t = content[language];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const isNumeric = /^\d+$/.test(identifier);
        const email = isNumeric ? `${identifier}@cedula.axisone.pro` : identifier.toLowerCase();
        const isTatama = email.includes('tatama');
        const rawDomain = email.split('@')[1] || 'independent.com';
        const publicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'cedula.axisone.pro'];
        const isPublicDomain = publicDomains.includes(rawDomain.toLowerCase());
        const companyId = isTatama ? 'TATAMA-SANTUARIO' : (isPublicDomain ? identifier.toUpperCase() : rawDomain.toUpperCase());
        const userName = identifier.split('@')[0].toUpperCase();
        const isMasterAuditor = email === 'juliocuva@axisonecoffee.pro';
        const role = isMasterAuditor ? 'auditor' : (isNumeric ? 'producer' : ((email.includes('julio') || isTatama) ? 'gerente' : 'visitante'));

        const loadAndPersistProfile = async () => {
            try {
                const { data: existingProfile } = await supabase.from('profiles').select('company_id, role, full_name').eq('email', email).single();
                let finalCompanyId = companyId, finalRole = role, finalName = userName;
                if (existingProfile) {
                    finalCompanyId = existingProfile.company_id || companyId;
                    finalRole = existingProfile.role || role;
                    finalName = existingProfile.full_name || userName;
                }
                await supabase.from('profiles').upsert({ email: email.toLowerCase(), full_name: finalName, company_id: finalCompanyId, role: finalRole, last_active: new Date().toISOString(), status: 'active' }, { onConflict: 'email' });
                return { companyId: finalCompanyId, role: finalRole, name: finalName };
            } catch (e) {
                return { companyId, role, name: userName };
            }
        };

        loadAndPersistProfile().then((finalIdentity) => {
            onLogin({ email, name: finalIdentity.name, companyId: finalIdentity.companyId, role: finalIdentity.role });
            setIsLoading(false);
        });
    };

    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        { id: 'step-01', label: '01', title: language === 'en' ? 'The Leak' : 'La Fuga' },
        { id: 'step-02', label: '02', title: language === 'en' ? 'Technical DNA' : 'ADN Técnico' },
        { id: 'step-03', label: '03', title: language === 'en' ? 'The Engine' : 'El Motor' },
        { id: 'step-04', label: '04', title: language === 'en' ? 'Ecosystem' : 'Ecosistema' },
        { id: 'step-05', label: '05', title: language === 'en' ? 'Commitment' : 'Compromiso' },
        { id: 'step-06', label: '06', title: language === 'en' ? 'Vision' : 'Visión' },
        { id: 'step-07', label: '07', title: language === 'en' ? 'Join' : 'Unirse' },
    ];

    React.useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            steps.forEach((step, index) => {
                const element = document.getElementById(step.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveStep(index + 1);
                    }
                }
            });
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [language]);

    return (
        <div className="min-h-screen bg-soft-white text-carbon selection:bg-brand-green selection:text-white font-sans font-medium">
            {/* INTELLIGENT SCROLL NAVIGATOR */}
            <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-[100] hidden xl:flex flex-col gap-6 items-end group">
                {steps.map((step, i) => (
                    <button
                        key={step.id}
                        onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center gap-4 group/item"
                    >
                        <span className={`text-[10px] font-semibold uppercase tracking-widest transition-all duration-500 opacity-0 group-hover:opacity-100 ${activeStep === i + 1 ? 'text-brand-green translate-x-0' : 'text-black/20 translate-x-4'}`}>
                            {step.title}
                        </span>
                        <div className={`w-1 h-8 transition-all duration-500 ${activeStep === i + 1 ? 'bg-brand-green scale-y-125' : 'bg-black/10 group-hover/item:bg-black/20'}`}></div>
                        <span className={`text-[10px] font-semibold transition-all duration-500 ${activeStep === i + 1 ? 'text-brand-green' : 'text-black/20'}`}>
                            {step.label}
                        </span>
                    </button>
                ))}
            </nav>
            {/* 1. HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-black/5">
                <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-6 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <img src="/logo.png" alt="AXISONE" className="h-20 w-auto transition-transform group-hover:scale-105" />
                            <div className="h-10 w-px bg-black/10 hidden md:block"></div>
                            <span className="text-xl font-black tracking-widest text-brand-green uppercase">COLOMBIA</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-black/5 rounded-industrial-sm hover:border-brand-green transition-all shadow-sm"
                        >
                            <span className="text-xs font-black uppercase tracking-widest">{language === 'en' ? 'ES' : 'EN'}</span>
                        </button>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-brand-green text-white px-6 py-3 rounded-industrial-sm text-xs font-black uppercase hover:bg-brand-green/90 transition-all shadow-xl shadow-brand-green/10"
                        >
                            {t.nav.login}
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. HERO SECTION */}
            <main className="relative pt-32 pb-16 px-8 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/hero-bg.png" alt="Background" className="w-full h-full object-cover opacity-10 grayscale" />
                    <div className="absolute inset-0 bg-gradient-to-b from-soft-white via-transparent to-soft-white"></div>
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                </div>
                <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <img src="/logo.png" alt="AXISONE" className="h-48 mx-auto mb-4" />
                        <h1 className="text-6xl lg:text-7xl font-black leading-[0.95] max-w-4xl mx-auto text-black tracking-tighter uppercase">
                            {t.hero.headline.split(' ').map((word, i) => i === t.hero.headline.split(' ').length - 1 ? <span key={i} className="text-brand-green">{word}</span> : word + ' ')}
                        </h1>
                        <p className="text-base text-gray-900 font-medium max-w-3xl mx-auto leading-relaxed">
                            {t.hero.subheadline}
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                        <a 
                            href="https://wa.me/573013970002?text=Hola,%20me%20interesa%20solicitar%20acceso%20a%20AxisOne%20Coffee" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full md:w-auto bg-brand-green text-white px-12 py-5 rounded-industrial-sm text-xs font-black uppercase hover:scale-105 transition-all shadow-2xl shadow-brand-green/30 text-center"
                        >
                            {t.hero.cta}
                        </a>
                    </div>
                </div>
            </main>

            {/* 3. EL PROBLEMA - START OF THE GUIDED JOURNEY */}
            <section id="step-01" className="relative py-32 my-12 bg-white border-y border-black/5 overflow-hidden">
                {/* Visual Connector Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-20 space-y-4 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">01</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">{language === 'en' ? 'The Leak' : 'La Fuga'}</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-black tracking-tighter leading-none">
                            {t.problem.headline}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                        <div className="space-y-12">
                            <div className="space-y-8">
                                <p className="text-base font-bold text-gray-900 leading-relaxed uppercase tracking-tight">{t.problem.intro}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest leading-loose">{t.problem.outro}</p>
                                <div className="flex flex-col gap-4">
                                    {t.problem.list.map((item, i) => (
                                        <div key={i} className="flex items-center gap-6 group">
                                            <div className="w-2 h-px bg-black/20 group-hover:w-8 group-hover:bg-brand-green transition-all duration-500"></div>
                                            <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-black/30 group-hover:text-black transition-colors duration-500">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative group aspect-square max-w-md mx-auto">
                            <div className="absolute -inset-4 bg-brand-green/5 rounded-full blur-2xl group-hover:bg-brand-green/10 transition-all duration-1000"></div>
                            <div className="relative aspect-square bg-white border border-black/5 rounded-full shadow-2xl shadow-black/5 overflow-hidden">
                                <img 
                                    src="/caos-document.png" 
                                    alt="Knowledge Chaos" 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-125" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-2 border-r-2 border-brand-green/20 rounded-full hidden lg:block"></div>
                        </div>
                    </div>

                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="mt-32 pt-16 border-t border-black/5 text-center">
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {t.problem.conclusion}
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. EL CONCEPTO */}
            <section id="step-02" className="relative py-32 my-12 bg-soft-white overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 text-center relative z-10">
                    <div className="flex flex-col items-center gap-2 mb-20">
                        <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                        <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">02</span>
                        <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">The Solution</span>
                    </div>
                    <h2 className="text-[50px] font-black uppercase text-black tracking-tighter mb-12 leading-none">{t.concept.headline}</h2>
                    
                    {/* DIGITAL GRAINS IMAGE */}
                    <div className="relative py-4 group mb-12 max-w-sm mx-auto aspect-square">
                        <div className="absolute inset-0 bg-brand-green/5 blur-3xl rounded-full scale-90 group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="relative w-full h-full rounded-full overflow-hidden border border-black/5 shadow-2xl">
                            <img 
                                src="/granos-digital.png" 
                                alt="Digital Coffee DNA" 
                                className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-125" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-24">
                        {t.concept.list.map((item, i) => (
                            <div key={i} className="group p-10 bg-white border border-black/5 rounded-industrial-sm flex flex-col items-center justify-center text-center hover:border-brand-green/30 transition-all hover:shadow-xl hover:shadow-brand-green/5 space-y-6">
                                <div className="text-brand-green group-hover:scale-110 transition-transform duration-500">
                                    {i === 0 && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3v12a2 2 0 002 2h8a2 2 0 002-2V3M9 7h6M9 11h6M12 17v4m-3 0h6"/></svg>}
                                    {i === 1 && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v2m0 16v2m8-10h2M2 12h2m15.071-7.071l-1.414 1.414M6.343 17.657l-1.414 1.414M17.657 17.657l1.414 1.414M6.343 6.343L4.929 4.929M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>}
                                    {i === 2 && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21a9 9 0 110-18 9 9 0 010 18zM12 7v5l3 3"/></svg>}
                                    {i === 3 && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>}
                                    {i === 4 && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                                </div>
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-black/40 group-hover:text-black transition-colors">{item}</span>
                            </div>
                        ))}
                    </div>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-16 border-t border-black/5">
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {t.concept.conclusion}
                        </p>
                    </div>
                </div>
            </section>

            {/* 5. QUÉ HACE (FEATURES) */}
            <section id="step-03" className="relative py-32 my-12 bg-white border-y border-black/5">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-24 space-y-4 text-center">
                        <div className="flex flex-col items-center gap-2 mb-8">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">03</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">The Engine</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-black tracking-tighter leading-none">{t.features.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-32">
                        {t.features.items.map((item, i) => (
                            <div key={i} className="group p-8 bg-white border border-black/5 rounded-industrial-sm hover:border-brand-green transition-all hover:shadow-2xl hover:shadow-brand-green/5">
                                <div className="text-brand-green mb-8 group-hover:scale-110 transition-transform duration-500">
                                    {i === 0 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg>}
                                    {i === 1 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>}
                                    {i === 2 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1v22M5 5h14M5 19h14M2 12h4M18 12h4"/></svg>}
                                    {i === 3 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/></svg>}
                                    {i === 4 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                                </div>
                                <h3 className="text-base font-black uppercase text-black mb-4 tracking-tight">{item.title}</h3>
                                <p className="text-base text-gray-500 leading-relaxed font-light">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-16 border-t border-black/5 text-center">
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "Total structural memory for high-stakes coffee operations." : "Memoria estructural total para operaciones de café de alta complejidad."}
                        </p>
                    </div>
                </div>
            </section>

            {/* 6. PARA QUIÉN */}
            <section id="step-04" className="relative py-32 my-12 bg-soft-white border-y border-black/5">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
                    <div className="mb-24 space-y-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">04</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">The Ecosystem</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-black tracking-tighter max-w-4xl mx-auto leading-none">{t.target.headline}</h2>
                        <div className="w-24 h-1 bg-brand-green mx-auto mt-8"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                        {/* GLOBAL MAP LEFT */}
                        <div className="relative group aspect-square max-w-md mx-auto">
                            <div className="absolute inset-0 bg-brand-green/5 blur-3xl rounded-full scale-90 group-hover:scale-110 transition-transform duration-1000"></div>
                            <div className="relative w-full h-full rounded-full overflow-hidden border border-black/5 bg-white shadow-2xl">
                                <img 
                                    src="/mapa-mundi.png" 
                                    alt="Global Ecosystem Map" 
                                    className="w-full h-full object-contain p-8 grayscale group-hover:grayscale-0 transition-all duration-700 ease-out scale-100 group-hover:scale-115" 
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-soft-white via-transparent to-soft-white pointer-events-none opacity-10"></div>
                        </div>

                        {/* CLIENT PROFILES RIGHT */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            {t.target.list.map((item, i) => (
                                <div key={i} className="group p-6 bg-white border border-black/5 rounded-industrial-sm hover:border-brand-green/30 transition-all hover:shadow-lg hover:shadow-brand-green/5 flex flex-col gap-4">
                                    <div className="text-brand-green">
                                        {i === 0 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
                                        {i === 1 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>}
                                        {i === 2 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>}
                                        {i === 3 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                                        {i === 4 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                                        {i === 5 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>}
                                    </div>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-black/40 group-hover:text-black transition-colors">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-16 border-t border-black/5 text-center">
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "A unified standard for the entire specialty value chain." : "Un estándar unificado para toda la cadena de valor de especialidad."}
                        </p>
                    </div>
                </div>
            </section>

            {/* 7. PROPUESTA ECONÓMICA */}
            <section id="step-05" className="relative py-32 my-12 bg-white border-y border-black/5">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 text-center relative z-10">
                    <div className="space-y-4 mb-20">
                        <div className="flex flex-col items-center gap-2 mb-8">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">05</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">The Commitment</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-black tracking-tighter leading-none">{t.pricing.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
                        {t.pricing.tiers.map((tier, i) => (
                            <div key={i} className={`p-12 rounded-industrial border transition-all duration-500 text-left space-y-8 group ${i === 1 ? 'border-brand-green shadow-2xl shadow-brand-green/10 bg-soft-white scale-105 z-10' : 'border-black/5 bg-white hover:-translate-y-4 hover:shadow-2xl hover:shadow-black/5'}`}>
                                <div className="space-y-2">
                                    <h3 className="text-base font-black uppercase text-black group-hover:text-brand-green transition-colors">{tier.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{tier.desc}</p>
                                </div>
                                <div className="text-2xl font-black text-brand-green tracking-tighter">{tier.price}</div>
                                <ul className="space-y-4 pt-8 border-t border-black/5">
                                    {tier.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-3 text-[10px] font-semibold uppercase text-black/60 tracking-widest group-hover:text-black transition-colors">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-brand-green"><polyline points="20 6 9 17 4 12"/></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-4 rounded-industrial-sm text-xs font-semibold uppercase transition-all duration-500 ${i === 1 ? 'bg-brand-green text-white hover:bg-black' : 'border border-brand-green text-brand-green hover:bg-brand-green hover:text-white hover:shadow-lg hover:shadow-brand-green/20'}`}>Join Program</button>
                            </div>
                        ))}
                    </div>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-16 border-t border-black/5 text-center">
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "Scalable infrastructure for sovereign digital operations." : "Infraestructura escalable para operaciones digitales soberanas."}
                        </p>
                    </div>
                </div>
            </section>
            
            {/* 8. VISIÓN */}
            <section id="step-06" className="py-48 bg-soft-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-8 text-center space-y-12 relative z-10">
                    <h2 className="text-2xl md:text-6xl font-black uppercase text-black tracking-tighter leading-[0.95]">{t.vision.headline}</h2>
                    <div className="w-32 h-1 bg-brand-green mx-auto"></div>
                    <div className="space-y-8 pt-12">
                        <p className="text-base font-bold text-gray-900 uppercase tracking-tight">{t.vision.copy1}</p>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-widest">{t.vision.copy2}</p>
                        <p className="text-2xl font-black text-brand-green uppercase tracking-tighter">{t.vision.copy3}</p>
                    </div>
                </div>
            </section>

            {/* 9. FOOTER CTA */}
            <footer id="step-07" className="py-48 bg-soft-white text-black px-8 text-center space-y-12 border-t border-black/5">
                <h2 className="text-2xl md:text-6xl font-black uppercase tracking-tighter leading-none max-w-5xl mx-auto">{t.footer.headline}</h2>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-12">
                    <button onClick={() => setShowLoginModal(true)} className="px-12 py-6 bg-brand-green text-white text-xs font-black uppercase rounded-industrial-sm hover:scale-105 transition-all shadow-2xl shadow-brand-green/30">{t.footer.cta}</button>
                    <a 
                        href="https://wa.me/573013970002?text=Hola,%20me%20interesa%20una%20demo%20de%20AxisOne%20Coffee" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-12 py-6 border border-brand-green text-brand-green text-xs font-black uppercase rounded-industrial-sm hover:bg-brand-green hover:text-white transition-all inline-block"
                    >
                        {language === 'en' ? 'Request Private Demo' : 'Solicitar Demo Privada'}
                    </a>
                </div>
                <div className="pt-24 flex flex-col items-center gap-8 border-t border-black/5">
                    <img src="/logo.png" alt="AXISONE" className="h-12 opacity-20" />
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-ultra-wide text-brand-green">© 2026 AXISONE COFFEE INFRASTRUCTURE COLOMBIA</p>
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-2 flex items-center gap-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            +57 301 397 0002
                        </p>
                    </div>
                </div>
            </footer>

            {/* LOGIN MODAL */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-industrial p-10 shadow-2xl border border-black/5 relative">
                        <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-black hover:text-brand-green transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        <div className="mb-10 text-center">
                            <img src="/logo.png" alt="AXISONE" className="h-20 mx-auto mb-6" />
                            <h2 className="text-2xl font-black uppercase text-black tracking-tighter">{t.login.title}</h2>
                            <p className="text-xs text-brand-green font-black uppercase tracking-widest mt-2">{t.login.subtitle}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-black/40 uppercase tracking-widest ml-1">{t.login.labelId}</label>
                                <input type="text" required placeholder="user@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full border-b border-black/10 px-1 py-3 text-base focus:border-brand-green outline-none transition-all font-bold text-black bg-transparent" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-black/40 uppercase tracking-widest ml-1">{t.login.labelPass}</label>
                                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b border-black/10 px-1 py-3 text-base focus:border-brand-green outline-none transition-all font-bold text-black bg-transparent" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-brand-green text-white font-black py-4 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 uppercase text-xs tracking-widest mt-8">{isLoading ? t.login.verifying : t.login.button}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
