"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('demo@axisone.coffee');
    const [password, setPassword] = useState('axisone2026');
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('axis-remembered-user');
        if (saved) {
            setIdentifier(saved);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Demo fallback
        if (identifier.toLowerCase() === 'demo@axisone.coffee') {
            router.push('/hub');
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

        const finalIdentity = await loadAndPersistProfile();
        localStorage.setItem('axis-user', JSON.stringify({ email, name: finalIdentity.name, companyId: finalIdentity.companyId, role: finalIdentity.role }));
        
        setIsLoading(false);
        router.push('/hub');
    };

    return (
        <div className="min-h-screen bg-[#0C3C60] flex items-center justify-center p-6 relative overflow-hidden text-[#0C3C60]" style={{ fontFamily: "var(--font-montserrat, 'Montserrat', sans-serif)" }}>
            {/* Subtle background coffee image + Navy mask */}
            <div 
                className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: 'url("/coffee_farm_hero_v2.png")' }}
            />
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 45%, rgba(12, 60, 96, 0.75) 0%, rgba(8, 40, 64, 0.96) 85%)' }}
            />
            {/* Technical grid & ambient glow */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#FAF2CA 1px, transparent 1px), linear-gradient(90deg, #FAF2CA 1px, transparent 1px)', backgroundSize: '44px 44px' }}></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#69CCC2]/15 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#83DF9C]/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Login Card (#FAF2CA Beige on #0C3C60 Navy) */}
            <div className="w-full max-w-md bg-[#FAF2CA] rounded-[2rem] p-10 sm:p-12 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] relative z-10 border border-white/20 animate-in fade-in duration-300">
                <button
                    onClick={() => router.push('/')}
                    className="absolute top-7 right-7 w-9 h-9 rounded-full bg-[#0C3C60]/10 hover:bg-[#0C3C60] text-[#0C3C60] hover:text-[#FAF2CA] flex items-center justify-center transition-all cursor-pointer"
                    title="Volver al inicio"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>

                <div className="mb-9 text-center flex flex-col items-center">
                    <img
                        src="/logo-axisone.png"
                        alt="AXISONE"
                        className="h-24 mx-auto mb-5 object-contain"
                        style={{ filter: 'brightness(0) saturate(100%) invert(18%) sepia(51%) saturate(1656%) hue-rotate(181deg) brightness(92%) contrast(94%)' }}
                    />
                    <div className="inline-flex items-center gap-2 bg-[#0C3C60] px-3.5 py-1 rounded-full shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-[#83DF9C] animate-pulse"></span>
                        <p className="text-[9px] text-[#FAF2CA] font-black uppercase tracking-[0.18em]">Terminal de Control Maestro</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#0C3C60]/70 uppercase tracking-widest block">Usuario / Cédula</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="demo@axisone.coffee" 
                            value={identifier} 
                            onChange={(e) => setIdentifier(e.target.value)} 
                            className="w-full bg-white/70 border border-[#0C3C60]/20 rounded-xl px-4 py-3.5 text-sm focus:border-[#0C3C60] focus:bg-white focus:ring-2 focus:ring-[#69CCC2]/40 outline-none transition-all font-bold text-[#0C3C60]" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#0C3C60]/70 uppercase tracking-widest block">Contraseña</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full bg-white/70 border border-[#0C3C60]/20 rounded-xl px-4 py-3.5 text-sm focus:border-[#0C3C60] focus:bg-white focus:ring-2 focus:ring-[#69CCC2]/40 outline-none transition-all font-bold text-[#0C3C60]" 
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-[#0C3C60] hover:bg-[#83DF9C] text-[#FAF2CA] hover:text-[#0C3C60] font-black py-4 rounded-xl transition-all shadow-lg uppercase text-xs tracking-widest mt-6 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <span>{isLoading ? "Verificando..." : "Entrar al Sistema"}</span>
                        <span>→</span>
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#0C3C60]/10 flex items-center justify-between text-[10px] font-bold text-[#0C3C60]/60">
                    <span>EUDR &amp; Traceability Hub</span>
                    <span className="text-[#0C3C60] font-mono">v2.4 Verified</span>
                </div>
            </div>
        </div>
    );
}
