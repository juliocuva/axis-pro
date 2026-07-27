'use client';

import React, { useState } from 'react';

interface ToolboxLandingProps {
    onSelectTool: (toolName: string) => void;
    onLoginClick: () => void;
}

export default function ToolboxLanding({ onSelectTool, onLoginClick }: ToolboxLandingProps) {
    return (
        <div className="min-h-screen bg-brand-navy text-white font-sans selection:bg-brand-green selection:text-white">
            {/* HERO SECTION */}
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-green/10 blur-[120px] rounded-full pointer-events-none"></div>
                <img src="/logo.png" alt="AXISONE" className="h-20 md:h-28 mb-12 brightness-0 invert opacity-90 relative z-10" />
                
                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black uppercase tracking-tighter mb-8 relative z-10 leading-[1.05]">
                    <span className="text-brand-green">Tu caja de herramientas</span><br />
                    para cada proceso del café.
                </h1>
                
                <p className="text-lg md:text-xl text-white/70 font-medium max-w-3xl mb-10 relative z-10 leading-relaxed">
                    Herramientas digitales simples e independientes que resuelven problemas reales<br className="hidden md:block"/>
                    en finca, beneficio, laboratorio, tostión y exportación.
                </p>

                <div className="flex items-center gap-3 text-white/80 relative z-10 mb-12">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-white/40 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <p className="font-bold text-sm md:text-base tracking-wide">
                        Úsalas por separado o conéctalas en <span className="text-brand-green">Axis One.</span>
                    </p>
                </div>

                <div className="flex gap-4 relative z-10">
                    <button onClick={() => {
                        document.getElementById('toolbox-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }} className="bg-brand-green text-brand-navy px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,255,136,0.3)]">
                        Explorar herramientas
                    </button>
                    <button onClick={onLoginClick} className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
                        Ingresar
                    </button>
                </div>
            </div>

            {/* HERRAMIENTAS DESTACADAS */}
            <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-[0.3em] mb-12 text-center">Herramientas Destacadas</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Destacada 1 */}
                    <ToolCard 
                        icon="🧮"
                        title="Calculadora de Trilla"
                        description="Calcula rendimiento, merma y eficiencia en tiempo real."
                        status="Disponible"
                        statusColor="bg-brand-green text-brand-navy"
                        hoverText="Registra el peso pergamino, calcula las mermas exactas por criba y obtén el rendimiento de exportación al instante."
                        actionText="Pruébalo ahora"
                        onClick={() => onSelectTool('trilla')}
                    />
                    {/* Destacada 2 */}
                    <ToolCard 
                        icon="📱"
                        title="Caminata Digital"
                        description="Delimita tu lote desde el celular en origen."
                        status="Disponible"
                        statusColor="bg-brand-green text-brand-navy"
                        hoverText="Registra el polígono GPS, añade fotos del lote y genera un identificador único en minutos."
                        actionText="Pruébalo ahora"
                        onClick={() => onSelectTool('caminata')}
                    />
                    {/* Destacada 3 */}
                    <ToolCard 
                        icon="🌐"
                        title="BeCoffee.pro"
                        description="Catálogo digital para vender café directo."
                        status="Disponible"
                        statusColor="bg-brand-green text-brand-navy"
                        hoverText="Crea tu perfil público de exportador, muestra tu oferta y recibe solicitudes de compra directas."
                        actionText="Pruébalo ahora"
                        onClick={() => onSelectTool('becoffee')}
                    />
                </div>
            </div>

            {/* APP STORE / TOOLBOX GRID */}
            <div id="toolbox-grid" className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                <div className="flex flex-col items-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white text-center">Toolbox</h2>
                    <p className="text-white/50 mt-4 text-center max-w-xl">Encuentra la herramienta específica que necesitas. Sin configuraciones complejas.</p>
                </div>

                {/* Categoría: Producción */}
                <CategorySection title="Producción">
                    <ToolCard icon="🌱" title="Trilla" description="Rendimiento y eficiencia." status="Disponible" statusColor="bg-brand-green text-brand-navy" hoverText="Módulo completo de trilla y análisis físico." actionText="Pruébalo ahora" onClick={() => onSelectTool('trilla')} />
                    <ToolCard icon="🫧" title="Fermentación" description="Registra cada fermentación." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Compara procesos y analiza resultados." actionText="Notifícame" onClick={() => {}} />
                    <ToolCard icon="☀️" title="Secado" description="Control de humedad y tiempo." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Curvas de secado y métricas de estabilidad." actionText="Notifícame" onClick={() => {}} />
                    <ToolCard icon="🍒" title="Recolección" description="Control de brix y recolección." status="Próximamente" statusColor="bg-white/20 text-white" hoverText="Gestión de cuadrillas y calidades de cereza." actionText="Notifícame" onClick={() => {}} />
                </CategorySection>

                {/* Categoría: Calidad */}
                <CategorySection title="Calidad">
                    <ToolCard icon="☕" title="CVA Cupping" description="Catación formato SCA/CVA." status="Disponible" statusColor="bg-brand-green text-brand-navy" hoverText="App móvil para catadores, radar dinámico y puntajes." actionText="Pruébalo ahora" onClick={() => onSelectTool('cupping')} />
                    <ToolCard icon="🧪" title="Laboratorio" description="Análisis físico y defectos." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Control de calidad avanzado e inventario de muestras." actionText="Notifícame" onClick={() => {}} />
                    <ToolCard icon="🔥" title="Tostión" description="Gestión de baches de tueste." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Curvas de tueste, mermas e inventario tostado." actionText="Notifícame" onClick={() => {}} />
                </CategorySection>

                {/* Categoría: Trazabilidad */}
                <CategorySection title="Trazabilidad">
                    <ToolCard icon="📱" title="Caminata Digital" description="GPS y origen." status="Disponible" statusColor="bg-brand-green text-brand-navy" hoverText="Geolocalización y registro de fincas." actionText="Pruébalo ahora" onClick={() => onSelectTool('caminata')} />
                    <ToolCard icon="🗺️" title="Coffee Map" description="Mapa de proveedores." status="Disponible" statusColor="bg-brand-green text-brand-navy" hoverText="Visualiza toda tu red de suministro en un mapa interactivo." actionText="Pruébalo ahora" onClick={() => onSelectTool('coffeemap')} />
                    <ToolCard icon="🛂" title="Pasaporte Digital" description="QR de trazabilidad pública." status="Disponible" statusColor="bg-brand-green text-brand-navy" hoverText="Genera un portal público para cada lote." actionText="Pruébalo ahora" onClick={() => onSelectTool('pasaporte')} />
                    <ToolCard icon="📜" title="Certificados" description="Gestión de sellos." status="Disponible" statusColor="bg-brand-green text-brand-navy" hoverText="Almacenamiento y vinculación de certificaciones." actionText="Pruébalo ahora" onClick={() => onSelectTool('certificados')} />
                    <ToolCard icon="🇪🇺" title="EUDR+" description="Cumplimiento Europeo." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Validación automática de deforestación." actionText="Notifícame" onClick={() => {}} />
                </CategorySection>

                {/* Categoría: Comercial */}
                <CategorySection title="Comercial">
                    <ToolCard icon="🌐" title="BeCoffee.pro" description="Portal B2B." status="Disponible" statusColor="bg-brand-green text-brand-navy" hoverText="Tu catálogo en línea para compradores globales." actionText="Pruébalo ahora" onClick={() => onSelectTool('becoffee')} />
                    <ToolCard icon="📦" title="Inventario" description="Gestión de existencias." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Control de sacos, posiciones y movimientos." actionText="Notifícame" onClick={() => {}} />
                    <ToolCard icon="🛒" title="Marketplace" description="Mercado interno." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Compra y venta dentro de la comunidad Axis One." actionText="Notifícame" onClick={() => {}} />
                </CategorySection>

                {/* Categoría: Comunidad */}
                <CategorySection title="Comunidad">
                    <ToolCard icon="🤝" title="Grateful Ledger" description="Propinas y transparencia." status="Próximamente" statusColor="bg-yellow-500 text-brand-navy" hoverText="Conecta tostadores con productores financieramente." actionText="Notifícame" onClick={() => {}} />
                </CategorySection>
            </div>

            {/* CÓMO FUNCIONA */}
            <div className="bg-white text-brand-navy py-24">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-16">Cómo funciona</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-brand-green text-brand-navy flex items-center justify-center text-2xl font-black mb-6">1</div>
                            <h3 className="text-xl font-black uppercase mb-2">Elige una herramienta</h3>
                            <p className="text-brand-navy/60">Encuentra la app específica para tu proceso actual.</p>
                        </div>
                        <div className="flex flex-col items-center relative">
                            <div className="hidden md:block absolute top-8 -left-1/2 w-full h-[2px] bg-brand-green/20"></div>
                            <div className="w-16 h-16 rounded-full bg-brand-green text-brand-navy flex items-center justify-center text-2xl font-black mb-6 relative z-10">2</div>
                            <h3 className="text-xl font-black uppercase mb-2">Resuelve un problema</h3>
                            <p className="text-brand-navy/60">Úsala de inmediato sin configuraciones complejas.</p>
                        </div>
                        <div className="flex flex-col items-center relative">
                            <div className="hidden md:block absolute top-8 -left-1/2 w-full h-[2px] bg-brand-green/20"></div>
                            <div className="w-16 h-16 rounded-full bg-brand-green text-brand-navy flex items-center justify-center text-2xl font-black mb-6 relative z-10">3</div>
                            <h3 className="text-xl font-black uppercase mb-2">Todo queda conectado</h3>
                            <p className="text-brand-navy/60">Los datos fluyen al ecosistema central Axis One.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ¿POR QUÉ HERRAMIENTAS? */}
            <div className="py-24 max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8">¿Por qué herramientas?</h2>
                <p className="text-xl text-white/70 leading-relaxed mb-6">
                    En lugar de explicar el ERP y obligarte a aprender un sistema enorme, queremos que solo te enfoques en resolver tu problema actual.
                </p>
                <p className="text-xl text-white/70 leading-relaxed">
                    Cuando quieras crecer, <span className="text-brand-green font-bold">Axis One crecerá contigo.</span>
                </p>
            </div>

            {/* AXIS ONE COMPLETE (EL ERP) */}
            <div className="bg-[#0a1118] border-y border-white/10 py-24">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="md:w-1/2 text-left">
                        <h2 className="text-sm font-bold text-brand-green uppercase tracking-[0.3em] mb-4">Axis One Complete</h2>
                        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">¿Necesitas conectar todas las herramientas?</h3>
                        <p className="text-lg text-white/60 mb-8 max-w-md">
                            Para exportadores, cooperativas y empresas que requieren el ERP completo gestionando producción, calidad, trazabilidad y logística bajo una misma plataforma corporativa.
                        </p>
                        <button onClick={() => onSelectTool('erp-demo')} className="bg-white text-brand-navy px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors">
                            Ver Ecosistema Completo
                        </button>
                    </div>
                    <div className="md:w-1/2 grid grid-cols-2 gap-4">
                        {['Producción', 'Calidad', 'Laboratorio', 'Exportación', 'Trazabilidad', 'Empresas', 'Cooperativas'].map(item => (
                            <div key={item} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                                <span className="font-bold uppercase text-sm tracking-wider text-white/80">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ROADMAP & CONSTRUIMOS EN PÚBLICO */}
            <div className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">Roadmap</h2>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-brand-green uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2">Lanzamientos</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-white/80"><span className="text-brand-green">✅</span> Trilla</li>
                                <li className="flex items-center gap-3 text-white/80"><span className="text-brand-green">✅</span> Caminata Digital</li>
                                <li className="flex items-center gap-3 text-white/80"><span className="text-brand-green">✅</span> BeCoffee.pro</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2">Próximamente</h3>
                            <ul className="space-y-3">
                                <li className="flex justify-between items-center text-white/60"><span>🌱 Fermentación</span> <span className="text-[10px] bg-white/10 px-2 py-1 rounded uppercase">Coming Soon</span></li>
                                <li className="flex justify-between items-center text-white/60"><span>🧪 Laboratorio</span> <span className="text-[10px] bg-white/10 px-2 py-1 rounded uppercase">Coming Soon</span></li>
                                <li className="flex justify-between items-center text-white/60"><span>☕ CVA Cupping</span> <span className="text-[10px] bg-white/10 px-2 py-1 rounded uppercase">Coming Soon</span></li>
                                <li className="flex justify-between items-center text-white/60"><span>🔥 Tostión</span> <span className="text-[10px] bg-white/10 px-2 py-1 rounded uppercase">Coming Soon</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-10 rounded-3xl flex flex-col justify-center items-start">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-brand-green">Construimos en Público</h2>
                    <p className="text-lg text-white/70 mb-8 leading-relaxed">
                        Estamos liberando una nueva herramienta cada pocas semanas. Queremos construir lo que realmente necesitas. Ayúdanos a decidir qué sigue.
                    </p>
                    <button className="bg-brand-green text-brand-navy px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform">
                        Votar siguiente lanzamiento
                    </button>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="border-t border-white/10 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-16">
                        <div>
                            <img src="/logo.png" alt="AXISONE" className="h-10 mb-6 brightness-0 invert opacity-50" />
                            <p className="text-sm text-white/40">The Coffee Toolbox.</p>
                        </div>
                        <div>
                            <h4 className="font-bold uppercase tracking-widest text-sm mb-4">Ecosistema</h4>
                            <ul className="space-y-2 text-white/50 text-sm">
                                <li><a href="#" className="hover:text-brand-green">Axis One Toolbox</a></li>
                                <li><a href="#" className="hover:text-brand-green">Herramientas</a></li>
                                <li><a href="#" className="hover:text-brand-green">Empresas</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold uppercase tracking-widest text-sm mb-4">Developers</h4>
                            <ul className="space-y-2 text-white/50 text-sm">
                                <li><a href="#" className="hover:text-brand-green">API (Próximamente)</a></li>
                                <li><a href="#" className="hover:text-brand-green">Desarrolladores</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold uppercase tracking-widest text-sm mb-4">Comunidad</h4>
                            <ul className="space-y-2 text-white/50 text-sm">
                                <li><a href="#" className="hover:text-brand-green">Instagram</a></li>
                                <li><a href="#" className="hover:text-brand-green">LinkedIn</a></li>
                                <li><a href="#" className="hover:text-brand-green">Newsletter</a></li>
                                <li><a href="#" className="hover:text-brand-green">Blog</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 text-xs text-white/30">
                        <p>© 2026 Axis One Coffee.</p>
                        <button onClick={onLoginClick} className="font-bold uppercase tracking-widest hover:text-white transition-colors mt-4 md:mt-0">Ingresar</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Subcomponents

function CategorySection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-12">
            <h3 className="text-xs font-bold text-brand-green uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-3">
                {title}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {children}
            </div>
        </div>
    );
}

function ToolCard({ icon, title, description, status, statusColor, hoverText, actionText, onClick }: any) {
    const isAvailable = status === 'Disponible';
    return (
        <div 
            onClick={isAvailable ? onClick : undefined}
            className={`group relative bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden transition-all duration-300 ${isAvailable ? 'cursor-pointer hover:border-brand-green/50 hover:bg-white/10' : 'opacity-80'}`}
        >
            {/* Contenido Normal */}
            <div className="relative z-10 transition-opacity duration-300 group-hover:opacity-0 flex flex-col h-full">
                <div className="text-4xl mb-4">{icon}</div>
                <h4 className="text-xl font-black uppercase tracking-wider mb-2">{title}</h4>
                <p className="text-sm text-white/50 flex-grow">{description}</p>
                <div className={`mt-6 inline-flex self-start px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                    {status}
                </div>
            </div>

            {/* Hover State */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-[#0d1620]">
                <div>
                    <h4 className="text-lg font-black uppercase tracking-wider mb-3 text-brand-green">{title}</h4>
                    <p className="text-sm text-white/80 leading-relaxed">
                        {hoverText}
                    </p>
                </div>
                <button 
                    className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${isAvailable ? 'bg-brand-green text-brand-navy hover:bg-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {actionText}
                </button>
            </div>
        </div>
    );
}
