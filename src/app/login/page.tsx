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
        
        // Guardar la sesión global para que otras partes del sistema lo lean si es necesario
        localStorage.setItem('axis-user', JSON.stringify({ email, name: finalIdentity.name, companyId: finalIdentity.companyId, role: finalIdentity.role }));
        
        setIsLoading(false);
        router.push('/hub');
    };

    return (
        <div className="min-h-screen bg-soft-white flex items-center justify-center p-6 relative overflow-hidden text-brand-navy" style={{ fontFamily: "var(--font-montserrat, 'Montserrat', sans-serif)" }}>
            {/* Background elements to match the soft-white theme of AuthScreen */}
            <div className="absolute inset-0 bg-gradient-to-b from-soft-white via-transparent to-soft-white z-0"></div>
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="w-full max-w-md bg-white rounded-[2rem] p-10 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative z-10 border border-brand-gray/50 animate-in fade-in duration-300">
                <button onClick={() => router.push('/')} className="absolute top-8 right-8 text-brand-navy hover:text-brand-green transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
                <div className="mb-10 text-center">
                    <img src="/logo.png" alt="AXISONE" className="h-28 mx-auto mb-6" />
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.2em]">Terminal de Control Maestro</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">Usuario</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="user@email.com" 
                            value={identifier} 
                            onChange={(e) => setIdentifier(e.target.value)} 
                            className="w-full border-b border-black/10 px-0 py-3 text-sm focus:border-brand-green outline-none transition-all font-semibold text-brand-navy bg-transparent" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">Contraseña</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full border-b border-black/10 px-0 py-3 text-sm focus:border-brand-green outline-none transition-all font-semibold text-brand-navy bg-transparent" 
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-brand-green text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-brand-green/20 hover:shadow-brand-green/30 uppercase text-xs tracking-widest mt-10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? "Verificando..." : "Entrar al Sistema"}
                    </button>
                </form>
            </div>
        </div>
    );
}
