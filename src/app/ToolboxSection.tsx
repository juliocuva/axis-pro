'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/shared/lib/supabase';

const activeTools = [
    {
        title: 'BeCoffee.pro',
        href: 'https://www.becoffee.pro',
        image: '/becoffee_pro_phone.png',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
        ),
        description: 'Create your digital catalog and sell more coffee.',
        status: 'Online'
    },
    {
        title: 'Milling',
        href: '/trilla',
        image: '/optical_coffee_sorter.png',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"></path><path d="M9 8h1"></path><path d="M9 12h1"></path><path d="M9 16h1"></path><path d="M14 8h1"></path><path d="M14 12h1"></path><path d="M14 16h1"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
            </svg>
        ),
        description: 'Calculate yield, loss, and efficiency of your milling process.',
        status: 'Online'
    },
    {
        title: 'CVA Cupping',
        href: '/cva',
        image: '/cva_cupping_topdown.png',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line>
            </svg>
        ),
        description: 'Evaluate, log, and compare cuppings with CVA standards.',
        status: 'Online'
    },
    {
        title: 'Digital Walk (EUDR)',
        href: '/caminata-digital',
        image: '/digital_walk_coffee_mountain.png',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>
            </svg>
        ),
        description: 'Map your lots and comply with EUDR easily.',
        status: 'Online'
    }
];

const upcomingTools = [
    {
        title: 'Fermentation',
        tag: 'Brix & pH Control',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 22 12 12"></path>
            </svg>
        ),
        description: 'Log, compare, and analyze anaerobic & aerobic fermentation curves in real time.',
        status: 'In Development'
    },
    {
        title: 'Laboratory',
        tag: 'Physical & Defect Metrics',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path>
            </svg>
        ),
        description: 'Automate green coffee analysis, moisture content, and physical defect grading.',
        status: 'Q3 Release'
    },
    {
        title: 'Roasting',
        tag: 'RoR & Curve Intelligence',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
        ),
        description: 'Roast profile logging, Rate of Rise (RoR) monitoring, and roast batch consistency.',
        status: 'In Beta'
    },
    {
        title: 'Coffee Map',
        tag: 'Origin & Terroir GIS',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>
            </svg>
        ),
        description: 'Interactive global map tracing coffee lots from farm coordinates to final consumer.',
        status: 'Coming Soon'
    }
];

export default function ToolboxSection() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);
        try {
            await supabase.from('profiles').insert([{ email, status: 'newsletter_subscriber', role: 'subscriber' }]);
        } catch (err) {
            console.error('Subscription error:', err);
        } finally {
            setSubmitting(false);
            setSubscribed(true);
        }
    };

    return (
        <section id="toolbox" className="bg-slate-200 relative z-20 pt-16 pb-20 overflow-hidden border-t border-[#0C3C60]/10">
            {/* Header Area */}
            <div className="relative mb-12">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-[#0C3C60] px-3.5 py-1.5 rounded-full mb-4">
                        <span className="w-2 h-2 rounded-full bg-[#83DF9C] animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-widest text-[#FAF2CA] uppercase">
                            Modular Coffee Tools
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-[#0C3C60] mb-4">
                        Explore the <br className="hidden sm:inline" />
                        <span>
                            <span className="font-azonix text-[#0C3C60]">AXIS</span>
                            <span className="font-montserrat-black text-[#0C3C60]">one</span>
                            <span className="text-[#0C3C60]"> Toolbox</span>
                        </span>
                    </h2>

                    <p className="text-[#0C3C60]/75 text-sm md:text-base leading-relaxed font-medium max-w-xl">
                        Select the independent digital tool you need for your coffee process today.
                    </p>
                </div>
            </div>

            {/* Active Tools Grid - 2 per row */}
            <div className="relative max-w-7xl mx-auto mb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
                    {activeTools.map((tool, idx) => {
                        const isOnline = tool.status === 'Online';
                        const cardClasses = "bg-[#FAF2CA] rounded-3xl border border-[#0C3C60]/15 shadow-lg overflow-hidden flex flex-col group hover:border-[#0C3C60]/40 hover:ring-2 hover:ring-[#69CCC2]/40 transition-all cursor-pointer hover:-translate-y-2 duration-300 relative";
                        const CardContent = (
                            <>
                                {/* Image Area */}
                                <div className="w-full h-48 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-[#0C3C60]/15 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img 
                                        src={tool.image} 
                                        alt={tool.title} 
                                        className={`w-full h-full object-cover transition-transform duration-700 ${isOnline ? 'group-hover:scale-105' : 'grayscale opacity-80 group-hover:scale-100'}`}
                                    />
                                </div>
                                {/* Icon Overlapping */}
                                <div className="absolute top-[170px] left-6 w-14 h-14 bg-[#0C3C60] rounded-2xl shadow-lg flex items-center justify-center text-[#FAF2CA] border border-white/10 z-20 group-hover:scale-110 group-hover:bg-[#83DF9C] group-hover:text-[#0C3C60] transition-all duration-300">
                                    {tool.icon}
                                </div>
                                {/* Text Content */}
                                <div className="pt-10 pb-8 px-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0C3C60] mb-2">{tool.title}</h3>
                                        <p className="text-sm text-[#0C3C60]/75 leading-relaxed font-medium">
                                            {tool.description}
                                        </p>
                                    </div>
                                    <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#0C3C60]/15">
                                        <div className="flex items-center gap-2">
                                            {isOnline ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#83DF9C]/45 border border-[#83DF9C] text-[#0C3C60] text-[10px] font-black uppercase tracking-widest">
                                                    <span className="w-2 h-2 rounded-full bg-[#0C3C60]"></span>
                                                    {tool.status}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF7E7E]/30 border border-[#FF7E7E] text-[#0C3C60] text-[10px] font-black uppercase tracking-widest">
                                                    {tool.status}
                                                </span>
                                            )}
                                        </div>

                                        <span className={`inline-flex items-center gap-1.5 ${isOnline ? 'bg-[#0C3C60] group-hover:bg-[#83DF9C] group-hover:text-[#0C3C60] text-[#FAF2CA]' : 'bg-[#0C3C60]/10 text-[#0C3C60]/60 border border-[#0C3C60]/20'} text-xs font-black py-2 px-4 rounded-xl transition-all duration-300 shadow-sm`}>
                                            <span>{isOnline ? 'LAUNCH' : 'COMING SOON'}</span>
                                            {isOnline && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                                                    <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                                                </svg>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </>
                        );

                        return isOnline ? (
                            <Link key={idx} href={tool.href} className={cardClasses} {...(tool.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                                {CardContent}
                            </Link>
                        ) : (
                            <div key={idx} className={cardClasses}>
                                {CardContent}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Tools Section (#FAF2CA Beige Background with #0C3C60 Navy Blue Cards) */}
            <div id="roadmap" className="bg-[#FAF2CA] w-full py-20 mt-16 relative overflow-hidden border-y border-[#0C3C60]/15">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-[#0C3C60] px-3.5 py-1.5 rounded-full mb-3 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-[#69CCC2] animate-ping"></span>
                                <span className="text-[10px] font-black tracking-widest text-[#FAF2CA] uppercase">ECOSYSTEM ROADMAP</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0C3C60] tracking-tight leading-tight flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span>Coming Soon to </span>
                                <span className="inline-block">
                                    <span className="font-azonix text-[#0C3C60]">AXIS</span>
                                    <span className="font-montserrat-black text-[#0C3C60]">one</span>
                                </span>
                            </h3>
                        </div>
                        <p className="text-[#0C3C60]/75 text-xs sm:text-sm font-medium max-w-md">
                            We are expanding our modular suite. Upcoming tools seamlessly integrate with your existing lots.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {upcomingTools.map((tool, idx) => (
                            <div key={idx} className="bg-[#0C3C60] border border-[#0C3C60] hover:border-[#69CCC2] rounded-3xl p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group shadow-xl relative overflow-hidden">
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-[#69CCC2]/15 border border-[#69CCC2]/30 flex items-center justify-center text-[#69CCC2] group-hover:scale-110 group-hover:bg-[#83DF9C] group-hover:text-[#0C3C60] transition-all duration-300 shadow-sm">
                                            {tool.icon}
                                        </div>
                                        <span className="text-[9px] font-black text-[#69CCC2] bg-[#69CCC2]/15 border border-[#69CCC2]/30 py-1 px-2.5 rounded-full uppercase tracking-wider">
                                            {tool.tag}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-[#FAF2CA] text-lg mb-2">{tool.title}</h4>
                                    <p className="text-xs text-[#FAF2CA]/75 leading-relaxed mb-6 font-medium">
                                        {tool.description}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <span className="text-[10px] font-black text-[#FAF2CA] uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#69CCC2] animate-pulse"></span>
                                        {tool.status}
                                    </span>
                                    <span className="text-[#69CCC2] group-hover:translate-x-1 transition-all text-xs">→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Subscribe Banner */}
            <div className="bg-slate-200 w-full py-20 relative overflow-hidden z-10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative">
                    <div className="lg:col-span-7 flex flex-col justify-between text-[#0C3C60]">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-[#0C3C60] px-3.5 py-1.5 rounded-full mb-6">
                                <span className="w-2 h-2 rounded-full bg-[#83DF9C] animate-pulse"></span>
                                <span className="text-[10px] font-black tracking-widest text-[#FAF2CA] uppercase">
                                    Global Logistics &amp; Traceability
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4 text-[#0C3C60]">
                                Discover the Complete <br />
                                <span>
                                    <span className="font-azonix text-[#0C3C60]">AXIS</span>
                                    <span className="font-montserrat-black text-[#0C3C60]">one</span>
                                    <span className="text-[#0C3C60]"> Ecosystem</span>
                                </span>
                            </h3>

                            <p className="text-[#0C3C60]/75 text-sm md:text-base leading-relaxed font-medium mb-8 max-w-xl">
                                Every container carries a digital history validated in real time — eliminating uncertainty and protecting batch value from farm to destination port.
                            </p>
                        </div>

                        {subscribed ? (
                            <div className="bg-[#83DF9C]/40 border border-[#83DF9C] text-[#0C3C60] p-4 rounded-2xl font-bold text-sm text-center max-w-md shadow-sm">
                                ✓ Thank you for subscribing! We&apos;ll keep you posted with exclusive updates.
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email for early access..."
                                    className="w-full sm:flex-1 bg-[#FAF2CA] border border-[#0C3C60]/20 rounded-2xl px-5 py-4 text-sm font-semibold text-[#0C3C60] placeholder:text-[#0C3C60]/50 outline-none focus:border-[#0C3C60] focus:ring-2 focus:ring-[#69CCC2]/40 transition-all shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto bg-[#0C3C60] hover:bg-[#83DF9C] text-[#FAF2CA] hover:text-[#0C3C60] font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg disabled:opacity-50 flex-shrink-0 cursor-pointer"
                                >
                                    {submitting ? 'Subscribing...' : 'Subscribe'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Right Image Column */}
                    <div className="lg:col-span-5 relative min-h-[350px] rounded-3xl overflow-hidden shadow-2xl border border-[#0C3C60]/20">
                        <img 
                            src="/subscribe_coffee_bg.png" 
                            alt="Axis Coffee Logistics" 
                            className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C3C60]/70 via-transparent to-transparent"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
