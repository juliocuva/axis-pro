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
            nav: { infra: "Infrastructure", vision: "Vision", login: "Validate Asset" },
            hero: {
                tag: "AOC v3.0 DIGITAL WALK PROTOCOL",
                headline: "Sensory certainty<br/>from origin to <span class='text-brand-green'>roastery.</span>",
                subheadline: "AxisOne Coffee eliminates sensory surprises and quality variance in specialty coffee imports. By securing unalterable origin logs, CVA cupping data, and industrial stabilization records into structured digital certificates.<br/><strong class='text-brand-green font-black block mt-4 text-lg md:text-xl tracking-tight'>We give you absolute quality control before containers set sail.</strong>",
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
                list: [
                    "Sourcing & Identification", 
                    "Industrial Thrashing", 
                    "Storage & Stabilization", 
                    "Roast Intelligence", 
                    "Cupping Protocol (CVA)", 
                    "Digital Certification"
                ],
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
                headline: "Founding Partner Program",
                tiers: [
                    { name: "Pilot", price: "USD 100", desc: "Technical validation of trust.", features: ["Setup: USD 0 (one-time)", "Full audit of 4 coffee lots", "Demonstrate data inmutability", "No subscription commitment"] },
                    { name: "Starter", price: "USD 450/month", desc: "For single-origin specialty operations.", features: ["Setup: USD 2,500 (one-time)", "Single Country Focus (Colombia/etc.)", "Up to 3 Connected Associations", "20 Free QR Certificates / month", "Private 'Alchemy' Farmer Portal"] },
                    { name: "Professional", price: "USD 750/month", desc: "For global specialty importers.", features: ["Setup: USD 2,500 (one-time)", "Up to 3 Active Origin Countries", "Up to 10 Connected Associations", "50 Free QR Certificates / month", "Coffee Radar Module Included", "Grateful Ledger Enabled"] },
                    { name: "Enterprise", price: "Custom Pricing", desc: "For global multi-origin scale.", features: ["Setup: Customized Onboarding", "Unlimited Origin Countries", "Unlimited Associations", "Custom Lot Certificate Volume", "24/7 Dedicated Priority Support", "Advanced API & ERP Integrations"] }
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
            },
            contact: {
                headline: "Get in Touch",
                subheadline: "Let's digitize your specialty coffee operations. Request a demo or drop us a line.",
                name: "Your Name",
                email: "Email Address",
                company: "Company / Farm Name",
                phone: "WhatsApp / Phone Number",
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
                button: "Submit Inquiry",
                successTitle: "Inquiry Submitted Successfully!",
                successSubtitle: "Thank you for reaching out. We will analyze your operation and get in touch via email or WhatsApp within 24 hours.",
                successCta: "Chat directly on WhatsApp",
                submitting: "Submitting Inquiry...",
                directContact: "Direct Channels",
                directContactDesc: "Want to bypass the form? Reach out directly via our secure messaging lines or email.",
            }
        },
        es: {
            nav: { infra: "Infraestructura", vision: "Visión", login: "Validar Activo" },
            hero: {
                tag: "PROTOCOLO DIGITAL WALK AOC v3.0",
                headline: "Certeza sensorial<br/>desde el origen hasta la <span class='text-brand-green'>tostadora.</span>",
                subheadline: "AxisOne Coffee elimina las sorpresas sensoriales y la variabilidad de calidad en las importaciones de especialidad. Al asegurar registros inalterables de origen, cataciones CVA y protocolos de estabilización en certificados digitales estructurados.<br/><strong class='text-brand-green font-black block mt-4 text-lg md:text-xl tracking-tight'>Te damos control absoluto de la calidad antes de que los contenedores zarpen.</strong>",
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
                list: [
                    "Identificación y Compra", 
                    "Trilla Industrial", 
                    "Almacenamiento", 
                    "Tostión Predictiva", 
                    "Protocolo de Catación (CVA)", 
                    "Certificación Digital"
                ],
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
                headline: "Programa de Socios Fundadores",
                tiers: [
                    { name: "Piloto", price: "USD 100", desc: "Validación técnica de confianza.", features: ["Setup: USD 0 (único)", "Auditoría completa de 4 lotes", "Demostrar inmutabilidad de datos", "Sin compromiso de suscripción"] },
                    { name: "Starter", price: "USD 450/mes", desc: "Para importadores de especialidad mono-origen.", features: ["Setup: USD 2,500 (único)", "Foco en un Solo País (Colombia/etc.)", "Hasta 3 Asociaciones Conectadas", "20 Certificados QR gratis / mes", "Portal Privado de 'Alquimia'"] },
                    { name: "Professional", price: "USD 750/mes", desc: "Para importadores globales de especialidad.", features: ["Setup: USD 2,500 (único)", "Hasta 3 Países de Origen Activos", "Hasta 10 Asociaciones Conectadas", "50 Certificados QR gratis / mes", "Módulo Coffee Radar Incluido", "Grateful Ledger Habilitado"] },
                    { name: "Enterprise", price: "Precio Personalizado", desc: "Para escala global multi-origen.", features: ["Setup: Onboarding Personalizado", "Países de Origen Ilimitados", "Asociaciones Conectadas Ilimitadas", "Volumen de Certificados a Medida", "Soporte Prioritario Dedicado 24/7", "Integraciones API y ERP Avanzadas"] }
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
            },
            contact: {
                headline: "Ponte en Contacto",
                subheadline: "Digitalicemos juntos tus operaciones de café de especialidad. Solicita una demo o envíanos un mensaje.",
                name: "Tu Nombre",
                email: "Correo Electrónico",
                company: "Nombre de Finca / Empresa",
                phone: "WhatsApp / Teléfono",
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
                button: "Enviar Consulta",
                successTitle: "¡Consulta Enviada Exitosamente!",
                successSubtitle: "Gracias por contactarnos. Analizaremos tu operación y nos comunicaremos contigo vía email o WhatsApp en menos de 24 horas.",
                successCta: "Chatear directamente por WhatsApp",
                submitting: "Enviando Consulta...",
                directContact: "Canales Directos",
                directContactDesc: "¿Prefieres saltarte el formulario? Escríbenos directamente a través de nuestras líneas seguras o correo.",
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
        { id: 'step-02', label: '02', title: language === 'en' ? 'The Leak' : 'La Fuga' },
        { id: 'step-03', label: '03', title: language === 'en' ? 'Technical DNA' : 'ADN Técnico' },
        { id: 'step-04', label: '04', title: language === 'en' ? 'The Engine' : 'El Motor' },
        { id: 'step-05', label: '05', title: language === 'en' ? 'Ecosystem' : 'Ecosistema' },
        { id: 'step-06', label: '06', title: language === 'en' ? 'Commitment' : 'Compromiso' },
        { id: 'step-07', label: '07', title: language === 'en' ? 'Get in Touch' : 'Contacto' },
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
                            className="text-6xl lg:text-7xl font-black leading-[1.05] max-w-4xl mx-auto text-brand-navy tracking-tighter uppercase"
                            dangerouslySetInnerHTML={{ __html: t.hero.headline }}
                        />
                        <p 
                            className="text-base text-brand-navy/80 font-medium max-w-3xl mx-auto leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: t.hero.subheadline }}
                        />
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
            <section id="step-02" className="relative py-32 my-12 bg-white border-y border-brand-gray/50 overflow-hidden">
                {/* Visual Connector Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-20 space-y-4 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">02</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">{language === 'en' ? 'The Leak' : 'La Fuga'}</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-brand-navy tracking-tighter leading-none">
                            {t.problem.headline}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                        <div className="space-y-12">
                            <div className="space-y-8">
                                <p className="text-base font-bold text-brand-navy/80 leading-relaxed uppercase tracking-tight">{t.problem.intro}</p>
                                <p className="text-xs text-brand-navy/60 font-medium uppercase tracking-widest leading-loose">{t.problem.outro}</p>
                                <div className="flex flex-col gap-4">
                                    {t.problem.list.map((item, i) => (
                                        <div key={i} className="flex items-center gap-6 group">
                                            <div className="w-2 h-px bg-brand-green/45 group-hover:w-8 group-hover:bg-brand-green transition-all duration-500"></div>
                                            <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-brand-navy/75 group-hover:text-brand-navy group-hover:translate-x-2 transition-all duration-500">{item}</span>
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
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {t.problem.conclusion}
                        </p>
                    </div>
                </div>
            </section>

            {/* 4. EL CONCEPTO */}
            <section id="step-03" className="relative py-16 my-6 bg-soft-white border-y border-brand-gray/50 overflow-hidden">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
                    <div className="mb-12 space-y-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-green mb-1"></div>
                            <span className="text-[80px] font-thin text-brand-green leading-none tracking-tighter">03</span>
                            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-ultra-wide">The Solution</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-brand-navy tracking-tighter max-w-4xl mx-auto leading-none">{t.concept.headline}</h2>
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
                                    <span className="text-[11px] font-black uppercase tracking-wider text-brand-navy/60 group-hover:text-brand-navy transition-colors leading-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-8 border-t border-brand-gray/50 text-center">
                        <p className="text-xl md:text-2xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {t.concept.conclusion}
                        </p>
                    </div>
                </div>
            </section>

            {/* 5. QUÉ HACE (FEATURES) */}
            <section id="step-04" className="relative py-32 my-12 bg-white border-y border-brand-gray/50">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-24 space-y-4 text-center">
                        <div className="flex flex-col items-center gap-2 mb-8">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">04</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">The Engine</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-brand-navy tracking-tighter leading-none">{t.features.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-32">
                        {t.features.items.map((item, i) => (
                            <div key={i} className="group p-8 bg-white border border-brand-gray/50 rounded-industrial-sm hover:border-brand-green transition-all hover:shadow-2xl hover:shadow-brand-green/5">
                                <div className="text-brand-green mb-8 group-hover:scale-110 transition-transform duration-500">
                                    {i === 0 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg>}
                                    {i === 1 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>}
                                    {i === 2 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1v22M5 5h14M5 19h14M2 12h4M18 12h4"/></svg>}
                                    {i === 3 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/></svg>}
                                    {i === 4 && <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                                </div>
                                <h3 className="text-base font-black uppercase text-brand-navy mb-4 tracking-tight">{item.title}</h3>
                                <p className="text-base text-brand-navy/60 leading-relaxed font-light">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-16 border-t border-brand-gray/50 text-center">
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "Total structural memory for high-stakes coffee operations." : "Memoria estructural total para operaciones de café de alta complejidad."}
                        </p>
                    </div>
                </div>
            </section>

            {/* 6. PARA QUIÉN */}
            <section id="step-05" className="relative py-16 my-6 bg-soft-white border-y border-brand-gray/50">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
                    <div className="mb-12 space-y-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-green mb-1"></div>
                            <span className="text-[80px] font-thin text-brand-green leading-none tracking-tighter">05</span>
                            <span className="text-[10px] font-semibold text-brand-green uppercase tracking-ultra-wide">The Ecosystem</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black uppercase text-brand-navy tracking-tighter max-w-4xl mx-auto leading-none">{t.target.headline}</h2>
                        <div className="w-16 h-1 bg-brand-green mx-auto mt-4"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
                        {/* GLOBAL MAP LEFT */}
                        <div className="relative group aspect-square max-w-sm mx-auto">
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

                        {/* CLIENT PROFILES RIGHT */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            {t.target.list.map((item, i) => (
                                <div key={i} className="group p-4 bg-white border border-brand-gray/50 rounded-industrial-sm hover:border-brand-green/30 transition-all hover:shadow-md hover:shadow-brand-green/5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0 group-hover:bg-brand-green group-hover:text-white transition-all duration-500">
                                        {i === 0 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
                                        {i === 1 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>}
                                        {i === 2 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>}
                                        {i === 3 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                                        {i === 4 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                                        {i === 5 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>}
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-brand-navy/60 group-hover:text-brand-navy transition-colors leading-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* SOLUTION PHRASE - CENTERED BOTTOM */}
                    <div className="pt-8 border-t border-brand-gray/50 text-center">
                        <p className="text-xl md:text-2xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "A unified standard for the entire specialty value chain." : "Un estándar unificado para toda la cadena de valor de especialidad."}
                        </p>
                    </div>
                </div>
            </section>

            {/* 7. PROPUESTA ECONÓMICA */}
            <section id="step-06" className="relative py-32 my-12 bg-white border-y border-brand-gray/50">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 text-center relative z-10">
                    <div className="space-y-4 mb-20">
                        <div className="flex flex-col items-center gap-2 mb-8">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">06</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">The Commitment</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-brand-navy tracking-tighter leading-none">{t.pricing.headline}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
                        {t.pricing.tiers.map((tier, i) => (
                            <div key={i} className={`p-6 md:p-8 rounded-industrial border transition-all duration-500 text-left space-y-6 group ${i === 2 ? 'border-brand-green shadow-2xl shadow-brand-green/10 bg-soft-white lg:scale-105 z-10' : 'border-brand-gray/50 bg-white hover:-translate-y-4 hover:shadow-2xl hover:shadow-black/5'}`}>
                                <div className="space-y-2">
                                    <h3 className="text-base font-black uppercase text-brand-navy group-hover:text-brand-green transition-colors">{tier.name}</h3>
                                    <p className="text-[10px] text-brand-navy/60 font-medium uppercase tracking-widest leading-snug">{tier.desc}</p>
                                </div>
                                <div className="text-xl font-black text-brand-green tracking-tighter">{tier.price}</div>
                                <ul className="space-y-3 pt-6 border-t border-brand-gray/50">
                                    {tier.features.map((f, j) => (
                                        <li key={j} className="flex items-start gap-2.5 text-[11px] font-normal normal-case text-brand-navy leading-relaxed">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-brand-green shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-3.5 rounded-industrial-sm text-[10px] font-bold uppercase transition-all duration-500 ${i === 2 ? 'bg-brand-green text-white hover:bg-black' : 'border border-brand-green text-brand-green hover:bg-brand-green hover:text-white hover:shadow-lg hover:shadow-brand-green/20'}`}>Join Program</button>
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
                        <p className="text-2xl md:text-3xl font-black text-brand-green uppercase tracking-tighter max-w-4xl mx-auto leading-none">
                            {language === 'en' ? "Scalable infrastructure for sovereign digital operations." : "Infraestructura escalable para operaciones digitales soberanas."}
                        </p>
                    </div>
                </div>
            </section>

            {/* 7. CONTACTO / GET IN TOUCH */}
            <section id="step-07" className="relative py-32 bg-brand-navy border-t border-white/10 overflow-hidden">
                {/* Visual Connector Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-green/20 hidden lg:block -translate-x-1/2 z-0"></div>
                
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="mb-20 space-y-4 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-green mb-2"></div>
                            <span className="text-[120px] font-thin text-brand-green leading-none tracking-tighter">07</span>
                            <span className="text-xs font-semibold text-brand-green uppercase tracking-ultra-wide">{language === 'en' ? 'Get In Touch' : 'Contacto'}</span>
                        </div>
                        <h2 className="text-[50px] font-black uppercase text-white tracking-tighter leading-none">
                            {t.contact.headline}
                        </h2>
                        <p className="text-base text-white/60 font-medium max-w-2xl mx-auto leading-relaxed mt-4">
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
            </section>

            {/* LOGIN MODAL */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-industrial p-10 shadow-2xl border border-brand-gray/50 relative">
                        <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-brand-navy hover:text-brand-green transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        <div className="mb-10 text-center">
                            <img src="/logo.png" alt="AXISONE" className="h-20 mx-auto mb-6" />
                            <h2 className="text-2xl font-black uppercase text-brand-navy tracking-tighter">{t.login.title}</h2>
                            <p className="text-xs text-brand-green font-black uppercase tracking-widest mt-2">{t.login.subtitle}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-brand-navy/40 uppercase tracking-widest ml-1">{t.login.labelId}</label>
                                <input type="text" required placeholder="user@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full border-b border-black/10 px-1 py-3 text-base focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-brand-navy/40 uppercase tracking-widest ml-1">{t.login.labelPass}</label>
                                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-b border-black/10 px-1 py-3 text-base focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-brand-green text-white font-black py-4 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 uppercase text-xs tracking-widest mt-8">{isLoading ? t.login.verifying : t.login.button}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
