'use client';

import React, { useRef, useState } from 'react';
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
        status: 'Launches Aug 2'
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
        status: 'Launches Aug 9'
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
        <section id="toolbox" className="bg-brand-industrial-gray relative z-20 pt-16 pb-20 overflow-hidden border-t border-gray-400/60">
            {/* Header Area */}
            <div className="relative mb-12">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 px-3.5 py-1.5 rounded-full mb-4">
                        <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-widest text-brand-green uppercase">
                            Modular Coffee Tools
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-brand-navy mb-4">
                        Explore the <br className="hidden sm:inline" />
                        <span>
                            <span className="font-azonix azonix-thin-gray text-brand-green">AXIS</span>
                            <span className="font-montserrat-black text-brand-navy">one</span>
                            <span className="text-brand-green"> Toolbox</span>
                        </span>
                    </h2>

                    <p className="text-gray-700 text-sm md:text-base leading-relaxed font-medium max-w-xl">
                        Select the independent digital tool you need for your coffee process today.
                    </p>
                </div>
            </div>

            {/* Active Tools Grid - 2 per row */}
            <div className="relative max-w-7xl mx-auto mb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
                    {activeTools.map((tool, idx) => {
                        const cardClasses = "bg-white rounded-3xl border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col group hover:border-brand-green/40 transition-colors cursor-pointer hover:-translate-y-2 duration-300 relative";
                        const CardContent = (
                            <>
                                {/* Image Area */}
                                <div className="w-full h-48 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-brand-navy/10 group-hover:bg-transparent transition-colors z-10"></div>
                                    <img 
                                        src={tool.image} 
                                        alt={tool.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                                {/* Icon Overlapping */}
                                <div className="absolute top-[170px] left-6 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-brand-green border border-gray-100 z-20 group-hover:scale-110 group-hover:bg-brand-green group-hover:text-white transition-all duration-300">
                                    {tool.icon}
                                </div>
                                {/* Text Content */}
                                <div className="pt-10 pb-8 px-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-brand-navy mb-2">{tool.title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                            {tool.description}
                                        </p>
                                    </div>
                                    <div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-200/60">
                                        <div className="flex items-center gap-2">
                                            {tool.status === 'Online' ? (
                                                <>
                                                    <span className="relative flex h-2.5 w-2.5">
                                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-green"></span>
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-brand-navy transition-colors">
                                                        {tool.status}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-navy">
                                                        {tool.status}
                                                    </span>
                                                </span>
                                            )}
                                        </div>

                                        <span className={`inline-flex items-center gap-1.5 ${tool.status === 'Online' ? 'bg-brand-navy/10 group-hover:bg-brand-green group-hover:text-white text-brand-navy' : 'bg-gray-200 text-gray-600 border border-gray-300'} text-xs font-black py-2 px-4 rounded-xl transition-all duration-300 shadow-sm ${tool.status === 'Online' ? 'group-hover:shadow-md' : ''}`}>
                                            <span>{tool.status === 'Online' ? 'LAUNCH' : 'COMING SOON'}</span>
                                            {tool.status === 'Online' && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                                                    <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                                                </svg>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </>
                        );

                        return tool.status === 'Online' ? (
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

            {/* Upcoming Tools Section - Green Background with Navy Blue Cards */}
            <div id="roadmap" className="bg-brand-green w-full py-20 mt-16 relative overflow-hidden shadow-2xl">
                {/* Decorative subtle background overlay */}
                <div className="absolute -right-16 -top-16 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-16 -bottom-16 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 mb-3 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                <span className="text-[10px] font-black tracking-widest text-white uppercase">ECOSYSTEM ROADMAP</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span>Coming Soon to </span>
                                <span className="inline-block">
                                    <span className="font-azonix azonix-thin-green text-white">AXIS</span>
                                    <span className="font-montserrat-black text-brand-navy">one</span>
                                </span>
                            </h3>
                        </div>
                        <p className="text-white/80 text-xs sm:text-sm font-medium max-w-md">
                            We are expanding our modular suite. Upcoming tools seamlessly integrate with your existing lots.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {upcomingTools.map((tool, idx) => (
                            <div key={idx} className="bg-brand-navy border border-white/10 hover:border-brand-green rounded-3xl p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/10 rounded-full blur-xl pointer-events-none group-hover:bg-brand-green/20 transition-all"></div>
                                
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green group-hover:scale-110 group-hover:bg-brand-green group-hover:text-white transition-all duration-300 shadow-sm">
                                            {tool.icon}
                                        </div>
                                        <span className="text-[9px] font-black text-brand-green bg-brand-green/15 border border-brand-green/30 py-1 px-2.5 rounded-full uppercase tracking-wider group-hover:bg-brand-green group-hover:text-white group-hover:border-brand-green transition-all duration-300">
                                            {tool.tag}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-white text-lg mb-2">{tool.title}</h4>
                                    <p className="text-xs text-white/70 leading-relaxed mb-6 font-medium">
                                        {tool.description}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <span className="text-[10px] font-black text-white/90 uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                                        {tool.status}
                                    </span>
                                    <span className="text-brand-green opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-xs">→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Subscribe Banner - Full Width Gray Theme */}
            <div className="bg-brand-industrial-gray w-full py-20 relative overflow-hidden border-t border-gray-400/60 z-10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative">
                    {/* Left/Top Content Column */}
                    <div className="lg:col-span-7 flex flex-col justify-between text-brand-navy">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 px-3.5 py-1.5 rounded-full mb-6">
                                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                                <span className="text-[10px] font-black tracking-widest text-brand-green uppercase">
                                    Global Logistics & Traceability
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4 text-brand-navy">
                                Discover the Complete <br />
                                <span>
                                    <span className="font-azonix azonix-thin-gray text-brand-green">AXIS</span>
                                    <span className="font-montserrat-black text-brand-navy">one</span>
                                    <span className="text-brand-green"> Ecosystem</span>
                                </span>
                            </h3>

                            <p className="text-gray-700 text-sm md:text-base leading-relaxed font-medium mb-8 max-w-xl">
                                Every container carries a digital history validated in real time — eliminating uncertainty and protecting batch value from farm to destination port.
                            </p>
                        </div>

                        {subscribed ? (
                            <div className="bg-brand-green/10 border border-brand-green/40 text-brand-green p-4 rounded-2xl font-bold text-sm text-center max-w-md shadow-sm">
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
                                    className="w-full sm:flex-1 bg-white border border-gray-300 rounded-2xl px-5 py-4 text-sm font-semibold text-brand-navy placeholder:text-gray-400 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all shadow-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto bg-brand-navy hover:bg-brand-green text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg disabled:opacity-50 flex-shrink-0"
                                >
                                    {submitting ? 'Subscribing...' : 'Subscribe'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Right Image Column */}
                    <div className="lg:col-span-5 relative min-h-[350px] rounded-3xl overflow-hidden shadow-2xl border border-gray-300">
                        <img 
                            src="/subscribe_coffee_bg.png" 
                            alt="Axis Coffee Logistics" 
                            className="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-transparent"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
