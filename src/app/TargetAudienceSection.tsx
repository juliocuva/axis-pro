import React from 'react';

const audiences = [
    {
        title: 'Producers',
        description: 'Improve your processes and make better decisions at the farm level.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 2v20" />
                <path d="M12 12c-3-3-6-3-6-3" />
                <path d="M12 12c3-3 6-3 6-3" />
            </svg>
        ),
        stat: 'Origin & Farm',
    },
    {
        title: 'Cooperatives',
        description: 'Centralize information and strengthen your management across operations.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M9 8h1" /><path d="M9 12h1" /><path d="M9 16h1" />
                <path d="M14 8h1" /><path d="M14 12h1" /><path d="M14 16h1" />
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
            </svg>
        ),
        stat: 'Management',
    },
    {
        title: 'Exporters',
        description: 'Complete traceability and trust for your international clients.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31" /><path d="M14 9.3V1.99" />
                <path d="M8.5 2h7" />
                <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
                <path d="M5.52 16h12.96" />
            </svg>
        ),
        stat: 'Logistics & Trade',
    },
    {
        title: 'Roasters',
        description: 'Consistency, quality, and transparency in every roast batch.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
            </svg>
        ),
        stat: 'Production',
    },
    {
        title: 'Cuppers',
        description: 'Evaluate and standardize your cuppings effortlessly with SCA protocols.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line>
            </svg>
        ),
        stat: 'Sensory & Quality',
    },
    {
        title: 'Baristas',
        description: 'Access full traceability and origin stories behind every cup you serve.',
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><path d="M6 2l1 2"></path><path d="M10 2v2"></path><path d="M14 2l-1 2"></path>
            </svg>
        ),
        stat: 'Service & Story',
    },
];

export default function TargetAudienceSection() {
    return (
        <section className="py-24 bg-brand-navy relative z-20 overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-green/3 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 px-3.5 py-1.5 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-widest text-brand-green uppercase">Who Is It For</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-4">
                        Designed for those who make<br />
                        <span className="text-brand-green">great coffee possible.</span>
                    </h2>
                    <p className="text-white/50 text-sm md:text-base font-medium max-w-xl mx-auto">
                        From farm to cup, every role in the supply chain has a tool built for their workflow.
                    </p>
                </div>

                {/* Cards Grid: 3 top + 2 bottom centered */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {audiences.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="group relative bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-brand-green/40 rounded-2xl p-8 transition-all duration-500 cursor-default hover:-translate-y-1.5"
                        >
                            {/* Glow effect on hover */}
                            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-brand-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className="w-14 h-14 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green mb-6 group-hover:bg-brand-green group-hover:text-white group-hover:border-brand-green group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(0,96,86,0.4)] transition-all duration-500">
                                    {item.icon}
                                </div>

                                {/* Tag */}
                                <span className="text-[9px] font-black text-brand-green/70 uppercase tracking-[0.15em] mb-3 block group-hover:text-brand-green transition-colors">
                                    {item.stat}
                                </span>

                                {/* Title */}
                                <h3 className="text-xl font-black text-white mb-3 tracking-tight group-hover:text-brand-green transition-colors duration-300">
                                    {item.title}
                                </h3>

                                {/* Description */}
                                <p className="text-white/50 text-sm leading-relaxed font-medium group-hover:text-white/70 transition-colors duration-300">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
