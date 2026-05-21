'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

interface Member {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    last_active?: string;
}

export default function TeamManagement({ companyId, companyName }: { companyId: string, companyName: string }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [newMember, setNewMember] = useState({
        email: '',
        name: '',
        role: 'caficultor'
    });

    useEffect(() => {
        fetchTeam();
    }, [companyId]);

    const fetchTeam = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setMembers(data || []);
        } catch (e) {
            console.error("Error cargando equipo:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    email: newMember.email.toLowerCase(),
                    full_name: newMember.name.toUpperCase(),
                    role: newMember.role,
                    company_id: companyId,
                    status: 'active'
                }, { onConflict: 'email' });

            if (error) throw error;
            setShowRegisterModal(false);
            setNewMember({ email: '', name: '', role: 'caficultor' });
            fetchTeam();
        } catch (e: any) {
            alert("Error al registrar miembro: " + e.message);
        }
    };

    const roles = [
        { id: 'caficultor', name: 'Caficultor / Productor' },
        { id: 'laboratorio', name: 'Analista de Laboratorio' },
        { id: 'catador', name: 'Catador Q-Grader' },
        { id: 'trilla', name: 'Operador de Trilla' },
        { id: 'director', name: 'Director Técnico' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end bg-white/2 border border-gray-400 shadow-sm p-8 rounded-industrial">
                <div>
                    <h3 className="text-2xl font-black text-text-main uppercase er">Gestión de Equipo: {companyName}</h3>
                    <p className="text-[11px] text-brand-navy font-bold uppercase  mt-1">Administración Delegada de Asociación</p>
                </div>
                <button 
                    onClick={() => setShowRegisterModal(true)}
                    className="px-8 py-4 bg-brand-green text-brand-navy rounded-industrial-sm text-[11px] font-bold uppercase  hover:bg-brand-green-bright transition-all shadow-lg shadow-brand-green/20"
                >
                    Registrar Nuevo Miembro
                </button>
            </header>

            <div className="bg-bg-card border border-gray-400 shadow-sm rounded-industrial overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white border-b border-gray-400 shadow-sm uppercase text-[9px] font-bold text-brand-navy ">
                            <th className="p-6">Miembro / Email</th>
                            <th className="p-6">Rol Especializado</th>
                            <th className="p-6">Último Acceso</th>
                            <th className="p-6 text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-20 text-center text-xs text-brand-navy uppercase ">Sincronizando Nómina...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan={4} className="p-20 text-center text-xs text-brand-navy uppercase ">No hay miembros registrados en esta asociación</td></tr>
                        ) : members.map(m => (
                            <tr key={m.id} className="hover:bg-white/2 transition-colors">
                                <td className="p-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-brand-navy uppercase">{m.full_name}</span>
                                        <span className="text-[11px] text-brand-navy font-mono">{m.email}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="text-[11px] font-bold text-brand-navy-bright border border-gray-400 shadow-sm bg-white px-3 py-1 rounded-full uppercase ">
                                        {m.role}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <span className="text-[11px] text-brand-navy font-mono">
                                        {m.last_active ? new Date(m.last_active).toLocaleString() : 'NUNCA'}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-1.5 h-1.5 bg-brand-green rounded-full shadow-[0_0_8px_rgba(0,255,136,0.6)]"></div>
                                        <span className="text-[9px] font-bold text-brand-navy uppercase ">Activo</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showRegisterModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-bg-card border border-gray-400 shadow-sm p-10 rounded-industrial shadow-3xl">
                        <header className="mb-8 text-center">
                            <h4 className="text-xl font-bold text-brand-navy uppercase er">Alta de Miembro Corporativo</h4>
                            <p className="text-[11px] text-brand-navy-bright font-bold uppercase  mt-1">{companyName}</p>
                        </header>
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Nombre Completo</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-4 text-sm text-brand-navy focus:border-black outline-none"
                                    value={newMember.name}
                                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                                    placeholder="EJ: MARÍA TATAMÁ"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Email Corporativo</label>
                                <input 
                                    required
                                    type="email" 
                                    className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-4 text-sm text-brand-navy focus:border-black outline-none"
                                    value={newMember.email}
                                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                                    placeholder="miembro@asociacion.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-brand-navy uppercase ">Rol en la Operación</label>
                                <select 
                                    className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm px-5 py-4 text-sm text-brand-navy focus:border-black outline-none appearance-none"
                                    value={newMember.role}
                                    onChange={e => setNewMember({...newMember, role: e.target.value})}
                                >
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 px-4 py-4 border border-gray-400 shadow-sm rounded-industrial-sm text-[11px] font-bold text-brand-navy uppercase">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-4 bg-brand-green text-brand-navy rounded-industrial-sm text-[11px] font-bold uppercase hover:bg-brand-green-bright">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
