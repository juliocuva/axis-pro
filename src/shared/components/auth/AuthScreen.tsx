'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/shared/lib/supabase';
import DemoTourModal from '../demo/DemoTourModal';

interface AuthScreenProps {
    onLogin: (userData: { email: string, name: string, companyId: string, role?: string }) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
    const [language, setLanguage] = useState<'en' | 'es'>('en');
    const [identifier, setIdentifier] = useState('demo@axisone.coffee');
    const [password, setPassword] = useState('axisone2026');
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    React.useEffect(() => {
        const saved = localStorage.getItem('axis-remembered-user');
        if (saved) {
            setIdentifier(saved);
            setRememberMe(true);
        }
    }, []);

    // Contact Form States
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactCompany, setContactCompany] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactRole, setContactRole] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [isContactSubmitting, setIsContactSubmitting] = useState(false);
    const [isContactSubmitted, setIsContactSubmitted] = useState(false);

    const content = {
        en: {
            nav: { infra: "Infrastructure", vision: "Vision", login: "Login", demo: "Live Demo" },
            hero: {
                tag: "Reduce uncertainty before coffee leaves origin.",
                headline: "You know what the coffee tasted like<br/>at origin. <span class='text-brand-green'>Prove it.</span>",
                subheadline: "AxisOne gives international importers and roasters unalterable digital certificates — origin logs, CVA cupping data, stabilization records — before containers set sail.<br/><strong class='text-brand-green font-black block mt-4 text-base md:text-lg tracking-tight'>No more sensory surprises at the roastery.</strong><span class='text-brand-green font-black block mt-2 text-base md:text-lg tracking-tight'>Reduce uncertainty before coffee leaves origin.</span>",
                cta: "Schedule a Demo or validate first with the Pilot · USD 100"
            },
            problem: {
                headline: "The coffee you bought and the coffee that arrives are rarely the same story.",
                intro: "Every season, extraordinary technical knowledge is generated at origin — and lost before it reaches you.",
                outro: "By the time the container lands, the data that justified your purchase exists only in:",
                list: ["producer spreadsheets", "scattered PDFs", "handwritten notebooks", "WhatsApp messages", "disconnected files", "human memory"],
                conclusion: "AxisOne replaces all of that with a single, immutable, structured digital record — verifiable before you commit to the purchase."
            },
            concept: {
                headline: "Every lot gets a technical DNA before it leaves origin.",
                intro: "Six structured stages. One digital certificate. Zero ambiguity.",
                list: [
                    { title: "I. Sourcing & Identification", desc: "farm · variety · altitude" },
                    { title: "II. Industrial Thrashing", desc: "process · fermentation · drying" },
                    { title: "III. Storage & Stabilization", desc: "humidity · temperature · rest" },
                    { title: "IV. Roast Intelligence", desc: "profile · development · color" },
                    { title: "V. Cupping Protocol (CVA)", desc: "sensory · score · attributes" },
                    { title: "VI. Digital Certification", desc: "QR · immutable · shareable" }
                ],
                conclusion: "Total structural memory for high-stakes coffee operations."
            },
            features: {
                headline: "Certainty that travels with every container.",
                items: [
                    { title: "Immutable Records", desc: "Data logged at origin cannot be altered retroactively. What was entered is what you receive." },
                    { title: "QR Technical Passport", desc: "Each lot generates a scannable certificate with the full technical record attached." },
                    { title: "Pre-Shipment Visibility", desc: "Review the complete lot profile before the container sets sail. Approve or flag before it's too late." }
                ]
            },
            pricing: {
                headline: "Founding Partner Program",
                subheadline: "Start where you are. Scale as you grow.",
                intro: "Every plan includes the same core technology. The difference is scope, volume, and support.",
                tiers: [
                    { name: "Pilot", price: "USD 100", desc: "one-time · no subscription · no commitment", features: ["Setup: USD 0", "Full audit of 4 coffee lots", "Live proof of data immutability", "Decide after you see it work"], button: "Start with the Pilot", tag: "START HERE" },
                    { name: "Starter", price: "USD 450/mo", desc: "For single-origin specialty operations.", features: ["Setup: USD 2,500 one-time", "Single country focus (Colombia / etc.)", "Up to 3 connected associations", "20 free QR certificates / month", "Private 'Alchemy' Farmer Portal"], button: "Join Program" },
                    { name: "Professional", price: "USD 750/mo", desc: "For global specialty importers.", features: ["Setup: USD 2,500 one-time", "Up to 3 active origin countries", "Up to 10 connected associations", "50 free QR certificates / month", "Coffee Radar Module included", "Grateful Ledger enabled"], button: "Join Program" },
                    { name: "Enterprise", price: "Custom", desc: "For global multi-origin scale.", features: ["Customized onboarding", "Unlimited origin countries", "Unlimited associations", "Custom lot certificate volume", "24/7 dedicated priority support", "Advanced API & ERP integrations"], button: "Contact Us" }
                ]
            },
            login: {
                title: "Access",
                subtitle: "Master Control Terminal",
                labelId: "User",
                labelPass: "Password",
                button: "Enter System",
                verifying: "Verifying..."
            },
            contact: {
                headline: "Contact Us",
                subheadline: "See it work on your actual lots. Julio will walk you through the system using real data from your operation.",
                name: "Your name & company",
                email: "Email Address",
                company: "Company Name",
                phone: "WhatsApp or email",
                role: "Your Role / Operation Type",
                rolePlaceholder: "Select your operation type...",
                roles: [
                    "Specialty Coffee Farm",
                    "Coffee Lab / Cupping Room",
                    "Premium Coffee Exporter",
                    "Specialty Coffee Roaster",
                    "Experimental Coffee Processor",
                    "Competition Producer",
                    "Other"
                ],
                message: "How can we help you?",
                button: "Request Demo →",
                successTitle: "Inquiry Submitted Successfully!",
                successSubtitle: "Julio responds within 24 hours.",
                successCta: "Chat directly on WhatsApp",
                submitting: "Submitting Request...",
                directContact: "Direct Channels",
                directContactDesc: "Want to bypass the form? Reach out directly via our secure messaging lines or email.",
            }
        },
        es: {
            nav: { infra: "Infraestructura", vision: "Visión", login: "Acceso", demo: "Ver Demo" },
            hero: {
                tag: "Reduce la incertidumbre antes de que el café salga de origen.",
                headline: "Sabes a qué sabía el café<br/>en origen. <span class='text-brand-green'>Pruébalo.</span>",
                subheadline: "AxisOne brinda a importadores y tostadores internacionales certificados digitales inalterables — bitácoras de origen, catas CVA, registros de estabilización — antes de que zarpen los contenedores.<br/><strong class='text-brand-green font-black block mt-4 text-base md:text-lg tracking-tight'>No más sorpresas sensoriales en la tostaduría.</strong><span class='text-brand-green font-black block mt-2 text-base md:text-lg tracking-tight'>Reduce la incertidumbre antes de que el café salga de origen.</span>",
                cta: "Agendar Demo o valida primero con el Piloto · USD 100"
            },
            problem: {
                headline: "El café que compraste y el que llega rara vez cuentan la misma historia.",
                intro: "Cada temporada, se genera un conocimiento técnico extraordinario en origen — y se pierde antes de llegar a ti.",
                outro: "Para cuando el contenedor aterriza, los datos que justificaron tu compra existen solo en:",
                list: ["excels del productor", "PDFs dispersos", "libretas a mano", "mensajes de WhatsApp", "archivos desconectados", "memoria humana"],
                conclusion: "AxisOne reemplaza todo eso con un registro digital estructurado, único e inmutable — verificable antes de que comprometas la compra."
            },
            concept: {
                headline: "Cada lote obtiene un ADN técnico antes de salir de origen.",
                intro: "Seis etapas estructuradas. Un certificado digital. Cero ambigüedad.",
                list: [
                    { title: "I. Origen e Identificación", desc: "finca · variedad · altura" },
                    { title: "II. Trilla Industrial", desc: "proceso · fermentación · secado" },
                    { title: "III. Almacenamiento y Estabilización", desc: "humedad · temperatura · reposo" },
                    { title: "IV. Inteligencia de Tueste", desc: "perfil · desarrollo · color" },
                    { title: "V. Protocolo de Catación (CVA)", desc: "sensorial · puntaje · atributos" },
                    { title: "VI. Certificación Digital", desc: "QR · inmutable · compartible" }
                ],
                conclusion: "Memoria estructural total para operaciones de café de alta complejidad."
            },
            features: {
                headline: "Certeza que viaja con cada contenedor.",
                items: [
                    { title: "Registros Inmutables", desc: "Los datos registrados en origen no pueden ser alterados retroactivamente. Lo que se ingresó es lo que recibes." },
                    { title: "Pasaporte Técnico QR", desc: "Cada lote genera un certificado escaneable con el registro técnico completo adjunto." },
                    { title: "Visibilidad Pre-Embarque", desc: "Revisa el perfil completo del lote antes de que el contenedor zarpe. Aprueba o marca alertas a tiempo." }
                ]
            },
            pricing: {
                headline: "Programa de Socios Fundadores",
                subheadline: "Empieza donde estás. Escala a medida que creces.",
                intro: "Todos los planes incluyen la misma tecnología base. La diferencia es el alcance, volumen y soporte.",
                tiers: [
                    { name: "Piloto", price: "USD 100", desc: "pago único · sin suscripción · sin compromiso", features: ["Setup: USD 0", "Auditoría completa de 4 lotes", "Prueba en vivo de inmutabilidad", "Decide después de verlo funcionar"], button: "Iniciar Piloto", tag: "COMIENZA AQUÍ" },
                    { name: "Starter", price: "USD 450/mes", desc: "Para importadores de especialidad mono-origen.", features: ["Setup: USD 2,500 pago único", "Foco en un solo país (Colombia / etc.)", "Hasta 3 asociaciones conectadas", "20 certificados QR gratis / mes", "Portal Privado de 'Alquimia'"], button: "Unirse al Programa" },
                    { name: "Professional", price: "USD 750/mes", desc: "Para importadores globales de especialidad.", features: ["Setup: USD 2,500 pago único", "Hasta 3 países de origen activos", "Hasta 10 asociaciones conectadas", "50 certificados QR gratis / mes", "Módulo Coffee Radar incluido", "Grateful Ledger habilitado"], button: "Unirse al Programa" },
                    { name: "Enterprise", price: "Custom", desc: "Para escala global multi-origen.", features: ["Onboarding personalizado", "Países de origen ilimitados", "Asociaciones ilimitadas", "Volumen de certificados a medida", "Soporte prioritario 24/7", "Integraciones API y ERP avanzadas"], button: "Contáctanos" }
                ]
            },
            login: {
                title: "Acceso",
                subtitle: "Terminal de Control Maestro",
                labelId: "Usuario",
                labelPass: "Contraseña",
                button: "Entrar al Sistema",
                verifying: "Verificando..."
            },
            contact: {
                headline: "Contáctanos",
                subheadline: "Míralo funcionar con tus propios lotes. Julio te guiará por el sistema usando datos reales de tu operación.",
                name: "Tu nombre y empresa",
                email: "Correo Electrónico",
                company: "Nombre de Empresa",
                phone: "WhatsApp o email",
                role: "Tu Rol / Tipo de Operación",
                rolePlaceholder: "Selecciona tu tipo de operación...",
                roles: [
                    "Finca de Café de Especialidad",
                    "Laboratorio / Sala de Catación",
                    "Exportador Premium de Café",
                    "Tostadora de Café de Especialidad",
                    "Procesamiento Experimental",
                    "Productor de Competencia",
                    "Otro"
                ],
                message: "¿Cómo podemos ayudarte?",
                button: "Solicitar Demo →",
                successTitle: "¡Solicitud Enviada Exitosamente!",
                successSubtitle: "Julio te responderá en menos de 24 horas.",
                successCta: "Chatear directamente por WhatsApp",
                submitting: "Enviando Solicitud...",
                directContact: "Canales Directos",
                directContactDesc: "¿Prefieres saltarte el formulario? Escríbenos directamente a través de nuestras líneas seguras o correo.",
            }
        }
    };

    const t = content[language];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // INTERCEPT DEMO LOGIN
        if (identifier.toLowerCase() === 'demo@axisone.coffee') {
            setShowLoginModal(false);
            setShowDemoModal(true);
            return;
        }

        if (rememberMe) {
            localStorage.setItem('axis-remembered-user', identifier);
        } else {
            localStorage.removeItem('axis-remembered-user');
        }

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

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsContactSubmitting(true);
        try {
            const formattedName = `${contactName} (Empresa: ${contactCompany})`;
            const formattedRole = `Lead: ${contactRole}`;
            const formattedCompanyId = `WhatsApp: ${contactPhone} | Mensaje: ${contactMessage.substring(0, 100)}`;

            // Intentamos insertar directamente en la tabla profiles
            await supabase.from('profiles').upsert({
                email: contactEmail.toLowerCase(),
                full_name: formattedName,
                role: formattedRole,
                company_id: formattedCompanyId,
                status: 'lead',
                last_active: new Date().toISOString()
            }, { onConflict: 'email' });
        } catch (err) {
            console.warn("AXIS Lead Storage fallback warning:", err);
        } finally {
            setIsContactSubmitting(false);
            setIsContactSubmitted(true);
        }
    };

    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        { id: 'step-01', label: '01', title: language === 'en' ? 'Start' : 'Inicio' },
        { id: 'step-02', label: '02', title: language === 'en' ? 'The Problem' : 'El Problema' },
        { id: 'step-03', label: '03', title: language === 'en' ? 'The Solution' : 'La Solución' },
        { id: 'step-04', label: '04', title: language === 'en' ? 'What You Get' : 'Lo Que Obtienes' },
        { id: 'step-05', label: '05', title: language === 'en' ? 'Low-Risk Entry' : 'Entrada Bajo Riesgo' },
        { id: 'step-06', label: '06', title: language === 'en' ? 'Get in Touch' : 'Contacto' },
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
        <div className="min-h-screen bg-soft-white text-brand-navy selection:bg-brand-green selection:text-white font-sans font-medium">
            {/* INTELLIGENT SCROLL NAVIGATOR */}
            <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-[100] hidden xl:flex flex-col gap-6 items-end group">
                {steps.map((step, i) => (
                    <button
                        key={step.id}
                        onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center gap-4 group/item"
                    >
                        <span className={`text-[10px] font-semibold uppercase tracking-widest transition-all duration-500 opacity-0 group-hover:opacity-100 ${activeStep === i + 1 ? 'text-brand-green translate-x-0' : 'text-brand-navy/20 translate-x-4'}`}>
                            {step.title}
                        </span>
                        <div className={`w-1 h-8 transition-all duration-500 ${activeStep === i + 1 ? 'bg-brand-green scale-y-125' : 'bg-black/10 group-hover/item:bg-black/20'}`}></div>
                        <span className={`text-[10px] font-semibold transition-all duration-500 ${activeStep === i + 1 ? 'text-brand-green' : 'text-brand-navy/20'}`}>
                            {step.label}
                        </span>
                    </button>
                ))}
            </nav>
            {/* 1. HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-brand-gray/50">
                <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-12">
                        <div className="flex items-center gap-6 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <img src="/logo.png" alt="AXISONE" className="h-20 w-auto transition-transform group-hover:scale-105" />
                            <div className="h-10 w-px bg-black/10 hidden md:block"></div>
                            <span className="text-xl font-black tracking-widest text-brand-green uppercase">GLOBAL</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-brand-gray/50 rounded-industrial-sm hover:border-brand-green transition-all shadow-sm"
                        >
                            <span className="text-xs font-black uppercase tracking-widest">{language === 'en' ? 'ES' : 'EN'}</span>
                        </button>
                        <Link
                            href="/login"
                            className="bg-brand-green text-white px-6 py-3 rounded-industrial-sm text-xs font-black uppercase hover:bg-brand-green/90 transition-all shadow-xl shadow-brand-green/10"
                        >
                            {t.nav.login}
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. HERO SECTION */}
            <main id="step-01" className="relative pt-32 pb-16 px-8 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/hero-bg.png" alt="Background" className="w-full h-full object-cover opacity-10 grayscale" />
                    <div className="absolute inset-0 bg-gradient-to-b from-soft-white via-transparent to-soft-white"></div>
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                </div>
                <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <img src="/logo.png" alt="AXISONE" className="h-48 mx-auto mb-4" />
                        <h1 
                            className="text-5xl lg:text-6xl font-black leading-[1.05] max-w-4xl mx-auto text-brand-navy tracking-tighter uppercase"
                            dangerouslySetInnerHTML={{ __html: t.hero.headline }}
                        />
                        <p 
                            className="text-sm text-brand-navy/80 font-medium max-w-3xl mx-auto leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: t.hero.subheadline }}
                        />
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                        <Link 
                            href="/login"
                            className="w-full md:w-auto bg-brand-green text-white px-12 py-5 rounded-industrial-sm text-xs font-black uppercase hover:scale-105 transition-all shadow-2xl shadow-brand-green/30 text-center inline-block"
                        >
                            {t.hero.cta}
                        </Link>
                    </div>
                </div>
            </main>

            {/* 3. EL PROBLEMA - START OF THE GUIDED JOURNEY */}
            <section id="step-02" className="relative py-32 my-12 bg-white border-y border-brand-gray/50 overflow-hidden">
                {/* Visual Connector Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-20 space-y-6 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[80px] md:text-[100px] font-thin text-brand-green leading-none tracking-tighter">02</span>
                            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-ultra-wide">{language === 'en' ? 'The Leak' : 'La Fuga'}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-brand-navy tracking-tighter leading-none">
                            {t.problem.headline}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                        <div className="space-y-12">
                            <div className="space-y-8">
                                <p className="text-sm font-bold text-brand-navy/80 leading-relaxed uppercase tracking-tight">{t.problem.intro}</p>
                                <p className="text-[10px] text-brand-navy/60 font-medium uppercase tracking-widest leading-loose">{t.problem.outro}</p>
                                <div className="flex flex-col gap-4">
                                    {t.problem.list.map((item, i) => (
                                        <div key={i} className="flex items-center gap-6 group">
                                            <div className="w-2 h-px bg-brand-green/45 group-hover:w-8 group-hover:bg-brand-green transition-all duration-500"></div>
                                            <span className="text-xl md:text-2xl font-black uppercase tracking-tighter text-brand-navy/75 group-hover:text-brand-navy group-hover:translate-x-2 transition-all duration-500">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative group aspect-square max-w-md mx-auto">
                            <div className="absolute -inset-4 bg-brand-green/5 rounded-full blur-2xl group-hover:bg-brand-green/10 transition-all duration-1000"></div>
                            <div className="relative aspect-square bg-white border-2 border-brand-green rounded-full shadow-2xl shadow-black/5 overflow-hidden">
                                <img 
                                    src="/caos-document.png" 
                                    alt="Knowledge Chaos" 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out scale-150 group-hover:scale-155" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-2 border-r-2 border-brand-green/20 rounded-full hidden lg:block"></div>
                        </div>
                    </div>

                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="mt-32 pt-16 border-t border-brand-gray/50 text-center">
                        <p className="text-xl md:text-2xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {t.problem.conclusion}
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. EL CONCEPTO */}
            <section id="step-03" className="relative py-16 my-6 bg-soft-white border-y border-brand-gray/50 overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
                    <div className="mb-20 space-y-6 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[80px] md:text-[100px] font-thin text-brand-green leading-none tracking-tighter">03</span>
                            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-ultra-wide">The Solution</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-brand-navy tracking-tighter max-w-4xl mx-auto leading-none">{t.concept.headline}</h2>
                        <p className="text-sm md:text-base font-bold text-brand-navy/60 uppercase tracking-widest mt-4">{t.concept.intro}</p>
                        <div className="w-16 h-1 bg-brand-green mx-auto mt-4"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
                        {/* DIGITAL GRAINS IMAGE */}
                        <div className="relative group aspect-square max-w-sm mx-auto">
                            <div className="absolute inset-0 bg-brand-green/5 blur-3xl rounded-full scale-90 group-hover:scale-110 transition-transform duration-1000"></div>
                            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-brand-green bg-white shadow-2xl flex items-center justify-center">
                                <img 
                                    src="/granos-digital.png" 
                                    alt="Digital Coffee DNA" 
                                    className="w-full h-full object-cover rounded-full transition-transform duration-700 ease-out scale-150 group-hover:scale-155" 
                                />
                            </div>
                        </div>

                        {/* CONCEPT STEPS RIGHT */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            {t.concept.list.map((item, i) => (
                                <div key={i} className="group p-4 bg-white border border-brand-gray/50 rounded-industrial-sm hover:border-brand-green/30 transition-all hover:shadow-md hover:shadow-brand-green/5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0 group-hover:bg-brand-green group-hover:text-white transition-all duration-500">
                                        {i === 0 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3v12a2 2 0 002 2h8a2 2 0 002-2V3M9 7h6M9 11h6M12 17v4m-3 0h6"/></svg>}
                                        {i === 1 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v2m0 16v2m8-10h2M2 12h2m15.071-7.071l-1.414 1.414M6.343 17.657l-1.414 1.414M17.657 17.657l1.414 1.414M6.343 6.343L4.929 4.929M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>}
                                        {i === 2 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21a9 9 0 110-18 9 9 0 010 18zM12 7v5l3 3"/></svg>}
                                        {i === 3 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v2m0 16v2m8-10h2M2 12h2m15.071-7.071l-1.414 1.414M6.343 17.657l-1.414 1.414M17.657 17.657l1.414 1.414M6.343 6.343L4.929 4.929M12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>}
                                        {i === 4 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>}
                                        {i === 5 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-navy/60 group-hover:text-brand-navy transition-colors leading-tight">{item.title}</span>
                                        <span className="text-[8px] text-brand-navy/40 uppercase tracking-widest">{item.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-8 border-t border-brand-gray/50 text-center">
                        <p className="text-lg md:text-xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {t.concept.conclusion}
                        </p>
                    </div>
                </div>
            </section>

            {/* 5. QUÉ HACE (FEATURES) */}
            <section id="step-04" className="relative py-32 my-12 bg-white border-y border-brand-gray/50">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-20 space-y-6 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[80px] md:text-[100px] font-thin text-brand-green leading-none tracking-tighter">04</span>
                            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-ultra-wide">The Engine</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-brand-navy tracking-tighter leading-none">{t.features.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-32 max-w-6xl mx-auto">
                        {/* FEATURES LIST LEFT */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            {t.features.items.map((item, i) => (
                                <div key={i} className="group p-8 bg-white border border-brand-gray/50 rounded-industrial-sm hover:border-brand-green transition-all hover:shadow-2xl hover:shadow-brand-green/5 flex gap-6 items-start">
                                    <div className="text-brand-green shrink-0 group-hover:scale-110 transition-transform duration-500">
                                        {i === 0 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg>}
                                        {i === 1 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>}
                                        {i === 2 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1v22M5 5h14M5 19h14M2 12h4M18 12h4"/></svg>}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase text-brand-navy mb-2 tracking-tight">{item.title}</h3>
                                        <p className="text-xs text-brand-navy/60 leading-relaxed font-light">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* GLOBAL MAP RIGHT */}
                        <div className="lg:col-span-5 relative group aspect-square max-w-sm mx-auto w-full hidden lg:block">
                            <div className="absolute inset-0 bg-brand-green/5 blur-3xl rounded-full scale-90 group-hover:scale-110 transition-transform duration-1000"></div>
                            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-brand-green bg-white shadow-2xl flex items-center justify-center">
                                <img 
                                    src="/mapa-mundi.png" 
                                    alt="Global Ecosystem Map" 
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out scale-150 group-hover:scale-155" 
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-soft-white via-transparent to-soft-white pointer-events-none opacity-10"></div>
                        </div>
                    </div>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-16 border-t border-brand-gray/50 text-center">
                        <p className="text-xl md:text-2xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "Total structural memory for high-stakes coffee operations." : "Memoria estructural total para operaciones de café de alta complejidad."}
                        </p>
                    </div>
                </div>
            </section>



            {/* 5. PROPUESTA ECONÓMICA */}
            <section id="step-05" className="relative py-32 my-12 bg-white border-y border-brand-gray/50">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 text-center relative z-10">
                    <div className="mb-20 space-y-6 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[80px] md:text-[100px] font-thin text-brand-green leading-none tracking-tighter">05</span>
                            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-ultra-wide">The Commitment</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-brand-navy tracking-tighter leading-none">{t.pricing.headline}</h2>
                        <p className="text-lg md:text-xl font-bold text-brand-navy/60 leading-relaxed whitespace-pre-line">{t.pricing.subheadline}</p>
                        <p className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest mt-4">{t.pricing.intro}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32 max-w-7xl mx-auto">
                        {t.pricing.tiers.map((tier, i) => (
                            <div key={i} className={`p-6 md:p-8 rounded-industrial border transition-all duration-500 text-left space-y-6 flex flex-col relative group ${i === 0 ? 'border-brand-green shadow-2xl shadow-brand-green/10 bg-soft-white lg:scale-105 z-10' : 'border-brand-gray/50 bg-white hover:-translate-y-4 hover:shadow-2xl hover:shadow-black/5'}`}>
                                {tier.tag && (
                                    <div className="absolute -top-3 left-6 bg-brand-green text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                        {tier.tag}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-black uppercase text-brand-navy group-hover:text-brand-green transition-colors">{tier.name}</h3>
                                    <p className="text-[9px] text-brand-navy/60 font-medium uppercase tracking-widest leading-snug">{tier.desc}</p>
                                </div>
                                <div className="text-lg font-black text-brand-green tracking-tighter">{tier.price}</div>
                                <ul className="space-y-3 pt-6 border-t border-brand-gray/50">
                                    {tier.features.map((f, j) => (
                                        <li key={j} className="flex items-start gap-2.5 text-[10px] font-normal normal-case text-brand-navy leading-relaxed">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-brand-green shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full mt-auto py-3.5 rounded-industrial-sm text-[9px] font-bold uppercase transition-all duration-500 bg-brand-green text-white hover:bg-black`}>{tier.button}</button>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-brand-navy/50 font-black uppercase tracking-widest text-center -mt-20 mb-20">
                        {language === 'en' 
                            ? "* Additional certificates: USD 20 for each generated QR technical passport." 
                            : "* Certificados adicionales: USD 20 por cada pasaporte técnico QR generado."}
                    </p>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-16 border-t border-brand-gray/50 text-center">
                        <p className="text-xl md:text-2xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "Scalable infrastructure for sovereign digital operations." : "Infraestructura escalable para operaciones digitales soberanas."}
                        </p>
                    </div>
                </div>
            </section>

            {/* 6. CONTACTO / GET IN TOUCH */}
            <section id="step-06" className="relative py-32 bg-brand-navy border-t border-white/10 overflow-hidden">
                {/* Visual Connector Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-20 space-y-6 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[80px] md:text-[100px] font-thin text-brand-green leading-none tracking-tighter">06</span>
                            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-ultra-wide">{language === 'en' ? 'Get In Touch' : 'Contacto'}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tighter leading-none">
                            {t.contact.headline}
                        </h2>
                        <p className="text-sm text-white/60 font-medium max-w-2xl mx-auto leading-relaxed mt-4">
                            {t.contact.subheadline}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        <div className="lg:col-span-5 space-y-6">
                            {/* Professional Profile Card */}
                            <div className="p-6 bg-white/5 border border-white/10 rounded-industrial-sm shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-brand-green text-white px-3 py-1 text-[8px] font-black uppercase rounded-bl-xl tracking-widest">
                                    {language === 'en' ? 'CEO & Founder' : 'CEO & Fundador'}
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green font-black text-lg select-none shrink-0 border border-brand-green/30">
                                        JR
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase leading-tight">Julio Cesar Uva Ramirez</h4>
                                        <p className="text-[10px] text-brand-green font-black uppercase tracking-wider mt-0.5">
                                            {language === 'en' ? 'CEO & Founder' : 'CEO & Fundador'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
                                    <a 
                                        href="https://wa.me/573013970002?text=Hola%20Julio,%20me%20gustaria%20agendar%20una%20demo%20de%20AxisOne%20Coffee" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-3 text-white/70 hover:text-brand-green transition-colors font-bold"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                        +57 301 397 0002
                                    </a>
                                    <a 
                                        href="mailto:juliocuva@gmail.com" 
                                        className="flex items-center gap-3 text-white/70 hover:text-brand-green transition-colors font-bold"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        juliocuva@gmail.com
                                    </a>
                                    <a 
                                        href="https://www.linkedin.com/in/julio-cesar-uva-ram%C3%ADrez" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-3 text-white/70 hover:text-brand-green transition-colors font-bold break-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                                        linkedin.com/in/julio-cesar-uva-ramírez
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-industrial-sm hover:border-brand-green/30 transition-all duration-300">
                                <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green shrink-0 border border-brand-green/30">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black uppercase text-white/40 tracking-wider">Operations Hub</h4>
                                    <span className="text-base font-bold text-white">Global Operations</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form card */}
                        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-industrial p-8 md:p-12 shadow-2xl">
                            {isContactSubmitted ? (
                                <div className="text-center py-8 space-y-6 animate-in fade-in duration-500">
                                    <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-green/20 animate-bounce">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black uppercase text-white tracking-tight">{t.contact.successTitle}</h3>
                                        <p className="text-base text-white/60 font-light leading-relaxed max-w-md mx-auto">{t.contact.successSubtitle}</p>
                                    </div>
                                    <div className="pt-6">
                                        <a 
                                            href={`https://wa.me/573013970002?text=Hola,%20mi%20nombre%20es%20${encodeURIComponent(contactName)}.%20Acabo%20de%20enviar%20una%20solicitud%20de%20contacto%20para%20mi%20operacion%20${encodeURIComponent(contactCompany)}.%20Me%20gustaria%20agendar%20una%20demo.`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 bg-brand-green text-white px-8 py-4 rounded-industrial-sm text-xs font-black uppercase hover:scale-105 transition-all shadow-xl shadow-brand-green/20"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                            {t.contact.successCta}
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t.contact.name}</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={contactName} 
                                                onChange={(e) => setContactName(e.target.value)}
                                                className="w-full border-b border-white/10 px-1 py-3 text-sm focus:border-brand-green outline-none transition-all font-bold text-white bg-transparent" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t.contact.email}</label>
                                            <input 
                                                type="email" 
                                                required 
                                                value={contactEmail} 
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                className="w-full border-b border-white/10 px-1 py-3 text-sm focus:border-brand-green outline-none transition-all font-bold text-white bg-transparent" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t.contact.company}</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={contactCompany} 
                                                onChange={(e) => setContactCompany(e.target.value)}
                                                className="w-full border-b border-white/10 px-1 py-3 text-sm focus:border-brand-green outline-none transition-all font-bold text-white bg-transparent" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t.contact.phone}</label>
                                            <input 
                                                type="tel" 
                                                required 
                                                value={contactPhone} 
                                                onChange={(e) => setContactPhone(e.target.value)}
                                                className="w-full border-b border-white/10 px-1 py-3 text-sm focus:border-brand-green outline-none transition-all font-bold text-white bg-transparent" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t.contact.role}</label>
                                        <select 
                                            required
                                            value={contactRole}
                                            onChange={(e) => setContactRole(e.target.value)}
                                            className="w-full border-b border-white/10 px-1 py-3 text-sm focus:border-brand-green outline-none transition-all font-bold text-white bg-transparent cursor-pointer"
                                        >
                                            <option value="" disabled className="text-white/40 bg-brand-navy">{t.contact.rolePlaceholder}</option>
                                            {t.contact.roles.map((r: string, idx: number) => (
                                                <option key={idx} value={r} className="text-brand-navy bg-white font-bold">{r}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">{t.contact.message}</label>
                                        <textarea 
                                            required 
                                            rows={4}
                                            value={contactMessage} 
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            className="w-full border-b border-white/10 px-1 py-2 text-sm focus:border-brand-green outline-none transition-all font-bold text-white bg-transparent resize-none" 
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isContactSubmitting}
                                        className="w-full bg-brand-green text-white font-black py-4 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 uppercase text-xs tracking-widest mt-8 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-55"
                                    >
                                        {isContactSubmitting ? t.contact.submitting : t.contact.button}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER TEXT */}
                <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-white/10 text-center relative z-10 pb-12">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        © 2026 Mouselab — AXISONE COFFEE is a trademark of Mouselab. <br className="md:hidden" />
                        <span className="text-brand-green/50 ml-2">IP Protected · OMPI / WIPO</span>
                    </p>
                </div>
            </section>

            {/* LOGIN MODAL */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2rem] p-10 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative">
                        <button onClick={() => setShowLoginModal(false)} className="absolute top-8 right-8 text-brand-navy hover:text-brand-green transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        <div className="mb-10 text-center">
                            <img src="/logo.png" alt="AXISONE" className="h-32 mx-auto mb-8" />
                            <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.2em]">{t.login.subtitle}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">{t.login.labelId}</label>
                                <input type="text" required placeholder="user@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full border-b border-black/10 px-0 py-3 text-sm focus:border-brand-green outline-none transition-all font-semibold text-brand-navy bg-transparent" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">{t.login.labelPass}</label>
                                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b border-black/10 px-0 py-3 text-sm focus:border-brand-green outline-none transition-all font-semibold text-brand-navy bg-transparent" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-brand-green text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-brand-green/20 hover:shadow-brand-green/30 uppercase text-xs tracking-widest mt-10 hover:scale-[1.02] active:scale-[0.98]">{isLoading ? t.login.verifying : t.login.button}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* DEMO TOUR MODAL */}
            {showDemoModal && (
                <DemoTourModal onClose={() => setShowDemoModal(false)} />
            )}

            {/* FLOATING WHATSAPP BUTTON */}
            <a 
                href="https://api.whatsapp.com/send?phone=573013970002&text=Hi!%20I%20have%20some%20questions%20about%20AxisOne%20and%20would%20like%20to%20chat." 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-8 right-8 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:shadow-brand-green/30 transition-all duration-300 group flex items-center justify-center"
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                {/* Tooltip */}
                <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-brand-navy text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-industrial-sm opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none translate-x-2 group-hover:translate-x-0 shadow-lg hidden md:block">
                    {language === 'en' ? 'Chat with us' : 'Chatea con nosotros'}
                </span>
            </a>
        </div>
    );
}
