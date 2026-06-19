'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [activeLangIndex, setActiveLangIndex] = useState(0);

    const slides = [
        "Eliminate uncertainty when purchasing coffee.",
        "Increase the value of your asset.",
        "Build trust with coffee farmers anywhere in the world."
    ];

    const accessWords = [
        "Access",
        "Acceso",
        "Accès",
        "Zugang",
        "Accesso"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
            setActiveLangIndex((prev) => (prev + 1) % accessWords.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [slides.length, accessWords.length]);

    const handleSubmit = async (e: React.FormEvent) => {
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

        try {
            const { data: existingProfile } = await supabase.from('profiles').select('company_id, role, full_name').eq('email', email).single();
            let finalCompanyId = companyId, finalRole = role, finalName = userName;
            if (existingProfile) {
                finalCompanyId = existingProfile.company_id || companyId;
                finalRole = existingProfile.role || role;
                finalName = existingProfile.full_name || userName;
            }
            await supabase.from('profiles').upsert({ email: email.toLowerCase(), full_name: finalName, company_id: finalCompanyId, role: finalRole, last_active: new Date().toISOString(), status: 'active' }, { onConflict: 'email' });
            
            const userData = { email, name: finalName, companyId: finalCompanyId, role: finalRole };
            localStorage.setItem('axis-user', JSON.stringify(userData));
            router.push('/');
        } catch (e) {
            const userData = { email, name: userName, companyId, role };
            localStorage.setItem('axis-user', JSON.stringify(userData));
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen flex items-stretch text-white font-sans selection:bg-brand-green selection:text-white bg-brand-navy">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-brand-navy border-r border-brand-green/20">
                {/* Background Image/Gradient */}
                <div className="absolute inset-0 z-0 bg-brand-navy">
                    {slides.map((_, idx) => (
                        <img 
                            key={idx}
                            src={`/slide_${idx + 1}.png`} 
                            alt={`Background slide ${idx + 1}`} 
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${activeSlide === idx ? 'opacity-75' : 'opacity-0'}`}
                            onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?q=80&w=2000&auto=format&fit=crop";
                            }}
                        />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/10 to-transparent"></div>
                </div>

                {/* Top Section */}
                <div className="relative z-10 flex justify-between items-start w-full">
                    {/* Placeholder to keep flex-between balanced */}
                    <div className="w-[150px]"></div>
                    
                    {/* Logo Centered */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center pt-8">
                        <img src="/logo.png" alt="AXISONE" className="h-40 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" />
                    </div>

                    <Link 
                        href="/" 
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all text-sm font-medium hover:scale-105"
                    >
                        Back to website
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                </div>

                {/* Bottom Section */}
                <div className="relative z-10 max-w-md pb-12">
                    <div className="min-h-[140px] flex flex-col justify-end">
                        <h2 
                            key={activeSlide}
                            className="text-white text-4xl font-black leading-[1.2] tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                        >
                            {slides[activeSlide].split('.').map((part, i, arr) => 
                                i === arr.length - 1 ? part : <span key={i}>{part}.<br/></span>
                            )}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        {slides.map((_, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setActiveSlide(idx)}
                                className={`h-1 rounded-full transition-all duration-500 focus:outline-none ${activeSlide === idx ? 'w-12 bg-brand-green' : 'w-8 bg-white/20 hover:bg-white/40'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-12 bg-soft-white relative overflow-hidden">
                {/* Subtle Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
                    {/* Custom Step Indicator */}
                    <div className="relative flex flex-col items-center justify-center py-4 mb-10">
                        {/* Vertical Line extended to top */}
                        <div className="absolute -top-[100vh] bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-brand-green/30"></div>
                        
                        {/* Dot */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-brand-green z-20 shadow-[0_0_10px_rgba(0,96,86,0.5)]"></div>

                        {/* Interactive Thin Text */}
                        <div 
                            className="relative z-10 text-6xl sm:text-7xl font-thin tracking-tighter text-brand-green cursor-pointer select-none"
                            onClick={() => setActiveLangIndex((prev) => (prev + 1) % accessWords.length)}
                        >
                            <div key={activeLangIndex} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {accessWords[activeLangIndex]}
                            </div>
                        </div>

                        {/* Subtitle text */}
                        <div className="relative z-10 mt-4 text-[10px] font-bold tracking-[0.3em] text-brand-navy uppercase">
                            MASTER TERMINAL
                        </div>
                    </div>

                    <p className="text-brand-navy/60 mb-6 text-xs text-center">
                        Don't have an account? <Link href="/signup" className="text-brand-green hover:text-brand-green/80 font-semibold transition-colors">Sign up</Link>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2 group">
                            <input 
                                type="text" 
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Email address or ID" 
                                className="w-full px-4 py-2.5 bg-transparent border border-brand-gray/50 rounded-xl focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all text-xs text-brand-navy placeholder-brand-navy/40 hover:border-brand-gray"
                            />
                        </div>

                        <div className="relative group">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password" 
                                className="w-full px-4 py-2.5 bg-transparent border border-brand-gray/50 rounded-xl focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all text-xs text-brand-navy placeholder-brand-navy/40 pr-12 hover:border-brand-gray"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-navy/40 hover:text-brand-navy/80 transition-colors focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 pb-2">
                            <label className="relative flex items-center cursor-pointer group gap-3">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="w-4 h-4 bg-transparent border border-brand-gray/50 rounded flex items-center justify-center peer-checked:bg-brand-green peer-checked:border-brand-green transition-all group-hover:border-brand-gray">
                                    <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                                <span className="text-xs text-brand-navy/60 select-none">Remember me</span>
                            </label>
                            <a href="#" className="text-xs font-semibold text-brand-green hover:text-brand-green/80 transition-colors">Forgot password?</a>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full mt-2 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_4px_14px_rgba(0,96,86,0.2)] hover:shadow-[0_6px_20px_rgba(0,96,86,0.3)] transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {isLoading ? 'Verifying...' : 'Enter System'}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4 opacity-80">
                        <div className="h-px bg-brand-navy/20 flex-1"></div>
                        <span className="text-[10px] text-brand-navy/70 font-semibold uppercase tracking-wider">Or log in with</span>
                        <div className="h-px bg-brand-navy/20 flex-1"></div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button className="flex items-center justify-center gap-3 py-2.5 bg-transparent hover:bg-black/5 border border-brand-gray/50 rounded-xl transition-all group hover:border-brand-gray shadow-sm hover:shadow-md w-full">
                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            <span className="text-xs font-medium text-brand-navy">Log in with Google</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
