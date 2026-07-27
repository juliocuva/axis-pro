'use client';

import React from 'react';

export default function ContactSection() {
    return (
        <section id="contact" className="bg-brand-navy py-24 relative z-20 font-sans text-white border-t border-brand-green/10">
            <div className="max-w-6xl mx-auto px-6">
                
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-white">
                        CONTACT US
                    </h2>
                    <p className="text-white/70 max-w-2xl mx-auto font-medium">
                        See it work on your actual lots. Julio will walk you through the system using real data from your operation.
                    </p>
                </div>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column - Contact Info */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* Profile Card */}
                        <div className="bg-[#0b1727] rounded-2xl p-8 border border-white/5 relative overflow-hidden shadow-xl">
                            {/* Badge */}
                            <div className="absolute top-0 right-0 bg-brand-green text-brand-navy text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-xl">
                                CEO & FOUNDER
                            </div>

                            {/* Header: Avatar + Name */}
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
                                    <span className="text-brand-green font-black text-xl">JR</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-wide text-white">JULIO CESAR UVA RAMIREZ</h3>
                                    <p className="text-brand-green text-xs font-bold uppercase tracking-widest mt-1">CEO & FOUNDER</p>
                                </div>
                            </div>

                            <hr className="border-white/10 mb-8" />

                            {/* Contact Details */}
                            <div className="space-y-5 text-sm font-medium text-white/80">
                                <div className="flex items-center gap-4">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    <span>+57 301 397 0002</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                                        <rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                    </svg>
                                    <span>juliocuva@gmail.com</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                    <span>linkedin.com/in/julio-cesar-uva-ramirez</span>
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-[#0b1727] rounded-2xl p-6 border border-white/5 shadow-xl flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0 border border-brand-green/20">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">OPERATIONS HUB</p>
                                <h4 className="font-bold text-white">Global Operations</h4>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-[#0b1727] rounded-3xl p-8 md:p-10 border border-white/5 shadow-2xl">
                            <form className="space-y-8">
                                
                                {/* 2x2 Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">YOUR NAME</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-brand-green transition-colors text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">EMAIL ADDRESS</label>
                                        <input 
                                            type="email" 
                                            className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-brand-green transition-colors text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">COMPANY NAME</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-brand-green transition-colors text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">WHATSAPP OR EMAIL</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-brand-green transition-colors text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Dropdown */}
                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">YOUR ROLE / OPERATION TYPE</label>
                                    <div className="relative">
                                        <select className="w-full bg-transparent border-b border-white/10 py-3 text-white appearance-none focus:outline-none focus:border-brand-green transition-colors text-sm cursor-pointer">
                                            <option value="" className="bg-brand-navy">Select your operation type...</option>
                                            <option value="producer" className="bg-brand-navy">Producer / Farmer</option>
                                            <option value="coop" className="bg-brand-navy">Cooperative</option>
                                            <option value="exporter" className="bg-brand-navy">Exporter / Importer</option>
                                            <option value="roaster" className="bg-brand-navy">Roaster</option>
                                            <option value="other" className="bg-brand-navy">Other</option>
                                        </select>
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Textarea */}
                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">HOW CAN WE HELP YOU?</label>
                                    <textarea 
                                        rows={2}
                                        className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:outline-none focus:border-brand-green transition-colors text-sm resize-none"
                                    ></textarea>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-6">
                                    <button 
                                        type="button"
                                        className="w-full bg-brand-green hover:bg-brand-green/90 text-brand-navy font-black tracking-widest uppercase text-sm py-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.2)] flex items-center justify-center gap-2"
                                    >
                                        REQUEST DEMO
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>
                                        </svg>
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
