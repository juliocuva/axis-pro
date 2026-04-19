'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import ClientPerformanceReport from './ClientPerformanceReport';
import ClientLotsArchive from './ClientLotsArchive';
import ClientRoastsArchive from './ClientRoastsArchive';

export default function MasterControlCenter() {
    const [stats, setStats] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMigrating, setIsMigrating] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState('');
    const [reportCompany, setReportCompany] = useState<{ id: string, name: string } | null>(null);
    const [showLotsCompany, setShowLotsCompany] = useState<{ id: string, name: string } | null>(null);
    const [showRoastsCompany, setShowRoastsCompany] = useState<{ id: string, name: string } | null>(null);
    const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
    const [dbError, setDbError] = useState<string | null>(null);
    
    // UI states
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        name: '',
        role: 'caficultor',
        companyId: ''
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchMasterStats(),
                fetchUsers(),
                fetchVerificationLogs()
            ]);
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const fetchVerificationLogs = async () => {
        try {
            const res = await fetch('/api/track-verify');
            if (res.ok) {
                const logs = await res.json();
                setVerificationLogs(logs.sort((a: any, b: any) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime()));
            }
        } catch (err) {
            console.error("No se pudieron cargar los logs de verificación", err);
        }
    };

    const fetchMasterStats = async () => {
        try {
            const { data: lots } = await supabase.from('coffee_purchase_inventory').select('id, company_id, status, farm_name, farmer_name');
            const { data: roasts } = await supabase.from('roast_batches').select('id, company_id');
            const { data: physical } = await supabase.from('physical_analysis').select('id, company_id');
            const { data: cupping } = await supabase.from('sca_cupping').select('id, company_id');

            const getSpecialName = (id: string) => {
                if (id === '33333333-3333-3333-3333-000023000009') return 'JULIO UVA (ADMIN)';
                if (id === '33333333-3333-3333-3333-000025000009') return 'CATALINA PEREZ';
                if (id === '99999999-9999-9999-9999-999999999999') return 'AXIS MASTER';
                if (id === '11111111-1111-1111-1111-111111111111') return 'SAGRADO CORAZÓN';
                if (id === 'unassigned') return 'DATOS HUERFANOS';
                return null;
            };

            const companyGroups: Record<string, any> = {};

            const processRecord = (record: any, type: string) => {
                const cid = record.company_id || 'unassigned';
                if (!companyGroups[cid]) {
                    companyGroups[cid] = {
                        id: cid,
                        name: getSpecialName(cid),
                        lots: 0,
                        purchased: 0,
                        thrashed: 0,
                        completed: 0,
                        roasts: 0,
                        physical: 0,
                        cupping: 0
                    };
                }
                if (type === 'lot') {
                    if (!companyGroups[cid].name && (record.farmer_name || record.farm_name)) {
                        companyGroups[cid].name = (record.farmer_name || record.farm_name).toUpperCase();
                    }
                    companyGroups[cid].lots++;
                    if (record.status === 'purchased') companyGroups[cid].purchased++;
                    if (record.status === 'thrashed') companyGroups[cid].thrashed++;
                    if (record.status === 'completed') companyGroups[cid].completed++;
                } else {
                    companyGroups[cid][type]++;
                }
            };

            lots?.forEach(l => processRecord(l, 'lot'));
            roasts?.forEach(r => processRecord(r, 'roasts'));
            physical?.forEach(p => processRecord(p, 'physical'));
            cupping?.forEach(c => processRecord(c, 'cupping'));

            Object.values(companyGroups).forEach(group => {
                if (!group.name) group.name = 'CLIENTE CORPORATIVO';
            });

            setStats(Object.values(companyGroups));
        } catch (err) {
            console.error("Master Control Error:", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setUsers(data || []);
        } catch (err: any) {
            console.error("Error al cargar usuarios:", err);
            setDbError(err.message || 'Error desconocido de red');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert([{
                    email: newUser.email,
                    full_name: newUser.name,
                    role: newUser.role,
                    company_id: newUser.companyId || '99999999-9999-9999-9999-999999999999',
                    status: 'active'
                }]);

            if (error) throw error;
            
            setShowAddUserModal(false);
            setNewUser({ email: '', name: '', role: 'caficultor', companyId: '' });
            await fetchUsers();
            alert('Usuario registrado exitosamente en la red.');
        } catch (err: any) {
            alert('Error al crear usuario: ' + err.message);
        }
    };

    const handleBlockUser = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
        const actionLabel = newStatus === 'blocked' ? 'BLOQUEAR' : 'ACTIVAR';
        
        if (window.confirm(`¿SEGURIDAD: Estás seguro de ${actionLabel} a este usuario?`)) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ status: newStatus })
                    .eq('id', userId);
                
                if (error) throw error;
                await fetchUsers();
            } catch (err: any) {
                alert('Fallo en la operación: ' + err.message);
            }
        }
    };

    const handleMigration = async () => {
        if (!selectedTargetId) return;
        if (!window.confirm('¿ESTÁ SEGURO?\n\nEsta acción reasignará permanentemente todos los registros huérfanos.')) return;

        setIsMigrating(true);
        try {
            const tables = ['coffee_purchase_inventory', 'roast_batches', 'physical_analysis', 'sca_cupping'];
            for (const table of tables) {
                await supabase.from(table).update({ company_id: selectedTargetId }).is('company_id', null);
            }
            setSelectedTargetId('');
            await fetchMasterStats();
            alert(`Sincronización Exitosa.`);
        } catch (err) {
            console.error("Migration Error:", err);
        } finally {
            setIsMigrating(false);
        }
    };

    const roleDefinitions = [
        { name: 'Caficultor', permissions: 'Ingreso Lotes, Red Blockchain' },
        { name: 'Laboratorio', permissions: 'CRUD Físico, Control Mermas' },
        { name: 'Catador', permissions: 'CRUD Perfil Sensorial (SCA)' },
        { name: 'Tostador', permissions: 'Perfiles de Tueste' },
        { name: 'Director', permissions: 'Aprobación Final Exportación' },
        { name: 'Gerente', permissions: 'Administración Global' }
    ];

    const totalVolume = stats.reduce((acc, s) => acc + s.lots, 0) * 1500;
    const activeCompanies = stats.filter(s => s.id !== 'unassigned').length;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 pb-20">
            <header className="flex justify-between items-end border-b border-white/10 pb-6 mt-10">
                <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Centro de Gobernanza</h2>
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.4em] mt-1">Super Admin • Ecosistema Axis</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowAddUserModal(true)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all flex items-center gap-3"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
                        Nuevo Operador
                    </button>
                    <button
                        onClick={fetchMasterStats}
                        className="px-6 py-3 bg-brand-green text-black rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest border border-brand-green hover:bg-brand-green-bright transition-all flex items-center gap-3 shadow-lg shadow-brand-green/20"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                        Refrescar Red
                    </button>
                </div>
            </header>

            {/* SECCIÓN 1: KPIS */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Salud y Adopción del Sistema</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-bg-card border border-white/5 p-6 rounded-industrial relative overflow-hidden">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2">Asociaciones Activas</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{activeCompanies}</p>
                    </div>
                    <div className="bg-bg-card border border-white/5 p-6 rounded-industrial relative overflow-hidden">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2">Volumen Estimado (Kg)</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{totalVolume.toLocaleString()}</p>
                    </div>
                    <div className="bg-bg-card border border-brand-green/20 p-6 rounded-industrial relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-brand-green/10 blur-xl rounded-full"></div>
                        <p className="text-[9px] text-brand-green font-bold uppercase tracking-widest mb-2">Usuarios Activos Hoy</p>
                        <p className="text-4xl font-black text-white tracking-tighter">
                            {users.filter(u => u.last_active && new Date(u.last_active).toDateString() === new Date().toDateString()).length}
                        </p>
                    </div>
                    <div className="bg-bg-card border border-purple-500/20 p-6 rounded-industrial relative overflow-hidden">
                        <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest mb-2">Verificaciones Externas</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{verificationLogs.length}</p>
                    </div>
                </div>
            </section>

            {/* SECCIÓN 2: USUARIOS */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_8px_rgba(0,223,154,0.6)]"></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Auditoría de Usuarios y Accesos</h3>
                </div>
                
                <div className="bg-bg-card border border-white/5 rounded-industrial overflow-hidden shadow-2xl">
                    {dbError && (
                        <div className="p-8 bg-brand-red/10 border-b border-brand-red/20 space-y-4">
                            <div className="flex items-center gap-3 text-brand-red">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Error de Sincronización en la Bóveda</span>
                            </div>
                            <p className="text-xs text-gray-400">El servidor reporta: <code className="text-brand-red bg-black/40 px-2 py-1 rounded">{dbError}</code></p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Esto ocurre usualmente si la tabla 'profiles' no ha sido creada. ¿Quieres que te muestre el código SQL necesario?</p>
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Usuario / Email</th>
                                <th className="p-5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Asociación</th>
                                <th className="p-5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rol</th>
                                <th className="p-5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Actividad</th>
                                <th className="p-5 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">No hay operadores registrados en la red</p>
                                        <button onClick={() => setShowAddUserModal(true)} className="mt-4 text-brand-green text-[9px] font-bold uppercase underline">Registrar Primer Operador</button>
                                    </td>
                                </tr>
                            ) : users.map((user) => {
                                const isActiveToday = user.last_active && new Date(user.last_active).toDateString() === new Date().toDateString();
                                return (
                                    <tr key={user.id} className={`hover:bg-white/[0.02] transition-colors ${user.status === 'blocked' ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                {isActiveToday && <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.6)]"></div>}
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white uppercase tracking-tight">{user.full_name || 'Sin Nombre'}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono mt-1">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-[10px] font-bold text-white bg-white/10 px-3 py-1.5 rounded uppercase tracking-widest border border-white/5">
                                                {stats.find(s => s.id === user.company_id)?.name || 'Empresa'}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-[10px] text-brand-green font-bold uppercase tracking-widest">{user.role}</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-bold uppercase ${isActiveToday ? 'text-white' : 'text-gray-600'}`}>
                                                    {isActiveToday ? 'Activo Ahora' : 'Fuera de Línea'}
                                                </span>
                                                <span className="text-[9px] text-gray-700 font-mono mt-1">
                                                    {user.last_active ? new Date(user.last_active).toLocaleString('es-CO', { hour12: true }) : 'Sin actividad'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => handleBlockUser(user.id, user.status)}
                                                className={`text-[9px] font-bold uppercase tracking-widest border px-4 py-2 rounded transition-all ${user.status === 'blocked' ? 'border-brand-green text-brand-green' : 'border-white/10 text-gray-400 hover:text-white hover:bg-brand-red/10'}`}
                                            >
                                                {user.status === 'blocked' ? 'Activar' : 'Anular'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* SECCIÓN 3: ROLES */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Matriz de Roles y Permisos</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roleDefinitions.map((role, idx) => (
                        <div key={idx} className="bg-bg-card border border-white/5 p-6 rounded-industrial shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-black text-white uppercase tracking-tight">{role.name}</span>
                                </div>
                                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">Permisos Activos:</p>
                                <p className="text-[10px] text-gray-400 mb-6">{role.permissions}</p>
                            </div>
                            <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                <p className="text-[9px] text-gray-500 font-mono">
                                    {users.filter(u => u.role?.toLowerCase() === role.name.toLowerCase()).length} USUARIOS
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MODAL NUEVO OPERADOR */}
            {showAddUserModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-bg-card border border-white/10 rounded-industrial p-10 shadow-3xl">
                        <h2 className="text-2xl font-bold text-white tracking-tighter uppercase mb-6 text-center">Nuevo Operador</h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 text-sm focus:border-brand-green outline-none text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 text-sm focus:border-brand-green outline-none text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Rol</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm p-3 text-sm text-white"
                                    >
                                        {roleDefinitions.map(r => <option key={r.name} value={r.name.toLowerCase()}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Empresa</label>
                                    <select
                                        value={newUser.companyId}
                                        onChange={(e) => setNewUser({...newUser, companyId: e.target.value})}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm p-3 text-sm text-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {stats.filter(s => s.id !== 'unassigned').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddUserModal(false)} className="flex-1 px-4 py-3 border border-white/10 rounded text-[10px] font-bold text-gray-500">CANCELAR</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-brand-green text-black rounded text-[10px] font-bold">REGISTRAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MIGRATION UI */}
            <div className="mt-20 border-t border-white/5 pt-10">
                <h3 className="text-brand-red text-[10px] font-bold uppercase tracking-widest mb-6">Zona de Rescate de Datos (Legacy)</h3>
                <div className="bg-brand-red/5 p-6 rounded-industrial border border-brand-red/20 flex items-center justify-between">
                    <div>
                        <p className="text-white text-xs font-bold uppercase">Registros Huérfanos Detectados: {stats.find(s => s.id === 'unassigned')?.lots || 0}</p>
                        <p className="text-gray-500 text-[9px] uppercase mt-1">Vincular registros sin empresa a un nuevo perfil</p>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={selectedTargetId}
                            onChange={(e) => setSelectedTargetId(e.target.value)}
                            className="bg-bg-main border border-white/10 p-2 text-[9px] text-white"
                        >
                            <option value="">ASIGNAR A...</option>
                            {stats.filter(s => s.id !== 'unassigned').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button onClick={handleMigration} disabled={isMigrating} className="bg-brand-red text-white text-[9px] font-bold px-6 py-2 rounded">EJECUTAR</button>
                    </div>
                </div>
            </div>

            {reportCompany && <ClientPerformanceReport companyId={reportCompany.id} companyName={reportCompany.name} onClose={() => setReportCompany(null)} />}
            {showLotsCompany && <ClientLotsArchive companyId={showLotsCompany.id} companyName={showLotsCompany.name} onClose={() => setShowLotsCompany(null)} />}
            {showRoastsCompany && <ClientRoastsArchive companyId={showRoastsCompany.id} companyName={showRoastsCompany.name} onClose={() => setShowRoastsCompany(null)} />}
        </div>
    );
}
