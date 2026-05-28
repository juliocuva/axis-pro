'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import ClientPerformanceReport from './ClientPerformanceReport';
import ClientLotsArchive from './ClientLotsArchive';
import { useLanguage } from '@/shared/context/LanguageContext';
import ClientRoastsArchive from './ClientRoastsArchive';

export default function MasterControlCenter() {
    const { t } = useLanguage();
    const [stats, setStats] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMigrating, setIsMigrating] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState('');
    const [reportCompany, setReportCompany] = useState<{ id: string, name: string } | null>(null);
    const [showLotsCompany, setShowLotsCompany] = useState<{ id: string, name: string } | null>(null);
    const [showRoastsCompany, setShowRoastsCompany] = useState<{ id: string, name: string } | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [allLots, setAllLots] = useState<any[]>([]); // Nuevo estado para la lista maestra de lotes
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

    // Menú de gestión por usuario
    const [activeManagementId, setActiveManagementId] = useState<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            
            // Cargar usuario actual para filtrado
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('email', authUser.email).single();
                setCurrentUser(profile);
            }

            await Promise.all([
                fetchMasterStats(),
                fetchUsers(),
                fetchAllLots() // Cargar la lista maestra de lotes
            ]);
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const fetchVerificationLogs = async () => {
        try {
            const { data } = await supabase.from('eudr_validations').select('*').order('created_at', { ascending: false });
            setVerificationLogs(data || []);
        } catch (err) {
            console.error("Error cargando logs:", err);
        }
    };

    const fetchAllLots = async () => {
        try {
            const { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setAllLots(data || []);
        } catch (err) {
            console.error("Error al cargar lotes maestros:", err);
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
                        cupping: 0,
                        users: 0
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
                } else if (type === 'users') {
                    companyGroups[cid].users++;
                } else {
                    companyGroups[cid][type]++;
                }
            };

            lots?.forEach(l => processRecord(l, 'lot'));
            roasts?.forEach(r => processRecord(r, 'roasts'));
            physical?.forEach(p => processRecord(p, 'physical'));
            cupping?.forEach(c => processRecord(c, 'cupping'));

            // INTEGRACIÓN: También procesar usuarios para que las empresas aparezcan aunque no tengan lotes
            const { data: allUsers } = await supabase.from('profiles').select('company_id');
            allUsers?.forEach(u => processRecord(u, 'users'));

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
            
            // FILTRADO DE SEGURIDAD: Solo juliocuva@gmail.com tiene acceso total a la red global
            let filteredUsers = data || [];
            if (currentUser && currentUser.email !== 'juliocuva@gmail.com') {
                filteredUsers = filteredUsers.filter(u => u.company_id === currentUser.company_id);
            }
            
            setUsers(filteredUsers);
        } catch (err: any) {
            console.error("Error al cargar usuarios:", err);
            setDbError(err.message || 'Error desconocido de red');
        }
    };

    const handleUpdateUser = async (userId: string, updates: { role?: string, company_id?: string }) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);
            
            if (error) throw error;
            setActiveManagementId(null);
            await fetchUsers();
        } catch (err: any) {
            alert('Error al actualizar: ' + err.message);
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

    const handleDeleteLot = async (lotId: string, lotNumber: string) => {
        if (!window.confirm(`¿SEGURIDAD CRÍTICA?\n\nEstás a punto de ELIMINAR PERMANENTEMENTE el lote ${lotNumber}.\n\nEsta acción borrará también todos los análisis físicos y de catación asociados.\n\n¿Deseas continuar?`)) return;

        try {
            // Eliminar registros asociados primero (Cascada manual para seguridad)
            await supabase.from('physical_analysis').delete().eq('inventory_id', lotId);
            await supabase.from('sca_cupping').delete().eq('inventory_id', lotId);
            
            // Eliminar el lote principal
            const { error } = await supabase.from('coffee_purchase_inventory').delete().eq('id', lotId);
            
            if (error) throw error;
            
            alert('Lote eliminado con éxito.');
            await fetchAllLots();
            await fetchMasterStats();
        } catch (err: any) {
            alert('Error al eliminar: ' + err.message);
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
            <header className="flex justify-between items-end border-b border-gray-400 shadow-sm pb-6 mt-10">
                <div>
                    <h2 className="text-4xl font-black text-text-main uppercase er">Centro de Gobernanza</h2>
                    <p className="text-[11px] text-brand-navy font-bold uppercase  mt-1">Super Admin • Ecosistema Axis</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowAddUserModal(true)}
                        className="px-6 py-3 bg-white hover:bg-white text-brand-navy rounded-industrial-sm text-[11px] font-bold uppercase  border border-gray-400 shadow-sm transition-all flex items-center gap-3"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
                        Nuevo Operador
                    </button>
                    <button
                        onClick={fetchMasterStats}
                        className="px-6 py-3 bg-brand-green text-brand-navy rounded-industrial-sm text-[11px] font-bold uppercase  border border-black hover:bg-brand-green-bright transition-all flex items-center gap-3 shadow-lg shadow-brand-green/20"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                        Refrescar Red
                    </button>
                </div>
            </header>
            
            {/* PANEL DE DIAGNÓSTICO RÁPIDO */}
            <section className="bg-bg-card border border-gray-400 shadow-sm p-6 rounded-industrial">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-[11px] font-black text-brand-navy uppercase ">Estado de la Red Axis</h3>
                        <p className="text-xs text-text-offset mt-1">Conexión con la Bóveda Central (Supabase)</p>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-center">
                            <p className="text-[9px] text-brand-navy font-bold uppercase">Perfiles en Red</p>
                            <p className="text-xl font-black text-text-main">{users.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-brand-navy font-bold uppercase">Estado de Tabla</p>
                            <p className={`text-[11px] font-bold uppercase ${dbError ? 'text-brand-red' : 'text-brand-navy'}`}>
                                {dbError ? 'ERROR DE ESQUEMA' : 'ACTIVA'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* NUEVA SECCIÓN: AUDITORÍA GLOBAL DE LOTES */}
             <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                        <h3 className="text-xs font-bold text-brand-navy uppercase ">Lotes Generados en la Red Axis</h3>
                    </div>
                    <span className="text-[11px] font-bold text-brand-navy-bright bg-white px-3 py-1 rounded-full uppercase ">
                        {allLots.length} Registros Totales
                    </span>
                </div>
                
                <div className="bg-bg-card border border-gray-400 shadow-sm rounded-industrial overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-400 shadow-sm">
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">No. Lote</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Origen / Caficultor</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Asociación</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Estado EUDR</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase  text-right">Peso (Kg) / Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium">
                                {allLots.slice(0, 10).map((lot) => (
                                    <tr key={lot.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-5 text-xs font-black text-text-main">{lot.lot_number}</td>
                                        <td className="p-5 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-text-main uppercase font-bold">{lot.farmer_name}</span>
                                                <span className="text-[9px] text-brand-navy uppercase er">{lot.farm_name} • {lot.region}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-[11px] font-bold text-brand-navy uppercase">
                                            {stats.find(s => s.id === lot.company_id)?.name || 'INCOGNITO'}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${lot.status === 'completed' ? 'bg-brand-green' : 'bg-brand-green'}`}></div>
                                                <span className="text-[9px] font-bold uppercase  text-brand-navy">
                                                    {lot.status === 'completed' ? 'Verificado Satélite' : 'En Sincronización'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right flex items-center justify-end gap-6">
                                            <span className="text-xs font-black text-text-main">{lot.purchase_weight.toLocaleString()} KG</span>
                                            {currentUser?.email === 'juliocuva@gmail.com' && (
                                                <button 
                                                    onClick={() => handleDeleteLot(lot.id, lot.lot_number)}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-bold px-3 py-1.5 rounded border border-red-500/20 transition-all uppercase "
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* SECCIÓN: ESTADÍSTICAS DE ADOPCIÓN */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                    <h3 className="text-xs font-bold text-brand-navy uppercase ">Salud y Adopción del Sistema</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-bg-card border border-gray-400 shadow-sm p-6 rounded-industrial relative overflow-hidden">
                        <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2">Asociaciones Activas</p>
                        <p className="text-4xl font-black text-brand-navy er">{activeCompanies}</p>
                    </div>
                    <div className="bg-bg-card border border-gray-400 shadow-sm p-6 rounded-industrial relative overflow-hidden">
                        <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2">Volumen Estimado (Kg)</p>
                        <p className="text-4xl font-black text-text-main er">{totalVolume.toLocaleString()}</p>
                    </div>
                    <div className="bg-bg-card border border-gray-400 shadow-sm p-6 rounded-industrial relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white blur-xl rounded-full"></div>
                        <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2">Usuarios Activos Hoy</p>
                        <p className="text-4xl font-black text-text-main er">
                            {users.filter(u => u.last_active && new Date(u.last_active).toDateString() === new Date().toDateString()).length}
                        </p>
                    </div>
                    <div className="bg-bg-card border border-gray-400 shadow-sm p-6 rounded-industrial relative overflow-hidden">
                        <p className="text-[9px] text-brand-navy-bright font-bold uppercase  mb-2">Verificaciones Externas</p>
                        <p className="text-4xl font-black text-brand-navy er">{verificationLogs.length}</p>
                    </div>
                </div>
            </section>

            {/* SECCIÓN 1.5: ASOCIACIONES REGISTRADAS */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
                    <h3 className="text-xs font-bold text-brand-navy uppercase ">Cartera de Asociaciones y Clientes</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-bg-card border border-gray-400 shadow-sm rounded-industrial overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-400 shadow-sm">
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Organización</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase  text-center">Usuarios</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase  text-center">Lotes</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase  text-center">Laboratorio</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase  text-center">Catación</th>
                                    <th className="p-5 text-[9px] font-bold text-brand-navy uppercase  text-right">Herramientas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.length === 0 ? (
                                    <tr><td colSpan={6} className="p-10 text-center text-brand-navy text-[11px] font-bold uppercase ">No hay organizaciones detectadas</td></tr>
                                ) : stats.map((company) => (
                                    <tr key={company.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-bg-main border border-gray-400 shadow-sm flex items-center justify-center">
                                                    <span className="text-[11px] font-black text-brand-navy">{company.name?.substring(0, 2)}</span>
                                                </div>
                                                <span className="text-xs font-black text-text-main uppercase ">{company.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center text-xs font-bold text-brand-navy-bright">{company.users || 0}</td>
                                        <td className="p-5 text-center text-xs font-bold text-text-main">{company.lots}</td>
                                        <td className="p-5 text-center text-xs font-bold text-brand-navy">{company.physical}</td>
                                        <td className="p-5 text-center text-xs font-bold text-brand-navy-bright">{company.cupping}</td>
                                        <td className="p-5 text-right flex justify-end gap-2">
                                            <button onClick={() => setReportCompany(company)} className="text-[9px] font-bold bg-white hover:bg-white text-brand-navy px-3 py-1.5 rounded uppercase  border border-gray-400 shadow-sm transition-all">{t('tabs', 'reports')}</button>
                                            <button onClick={() => setShowLotsCompany(company)} className="text-[9px] font-bold bg-white hover:bg-white border border-gray-400 shadow-sm text-brand-navy px-3 py-1.5 rounded uppercase  border border-gray-400 shadow-sm transition-all">Lotes</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* SECCIÓN 2: USUARIOS */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_8px_rgba(0,223,154,0.6)]"></div>
                    <h3 className="text-xs font-bold text-brand-navy uppercase ">Auditoría de Usuarios y Accesos</h3>
                </div>
                
                <div className="bg-bg-card border border-gray-400 shadow-sm rounded-industrial overflow-hidden shadow-2xl">
                    {dbError && (
                        <div className="p-8 bg-brand-red/10 border-b border-brand-red/20 space-y-4">
                            <div className="flex items-center gap-3 text-brand-red">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                <span className="text-[11px] font-black uppercase ">Error de Sincronización en la Bóveda</span>
                            </div>
                            <p className="text-xs text-brand-navy">El servidor reporta: <code className="text-brand-red bg-black/40 px-2 py-1 rounded">{dbError}</code></p>
                            <p className="text-[11px] text-brand-navy uppercase font-bold ">Esto ocurre usualmente si la tabla 'profiles' no ha sido creada. ¿Quieres que te muestre el código SQL necesario?</p>
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-gray-400 shadow-sm">
                                <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Usuario / Email</th>
                                <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Asociación</th>
                                <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Rol</th>
                                <th className="p-5 text-[9px] font-bold text-brand-navy uppercase ">Actividad</th>
                                <th className="p-5 text-[9px] font-bold text-brand-navy uppercase  text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <p className="text-[11px] text-brand-navy font-bold uppercase ">No hay operadores registrados en la red</p>
                                        <button onClick={() => setShowAddUserModal(true)} className="mt-4 text-brand-navy text-[9px] font-bold uppercase underline">Registrar Primer Operador</button>
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
                                                    <span className="text-xs font-bold text-brand-navy uppercase ">{user.full_name || 'Sin Nombre'}</span>
                                                    <span className="text-[11px] text-brand-navy font-mono mt-1">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-[11px] font-bold text-brand-navy bg-white px-3 py-1.5 rounded uppercase  border border-gray-400 shadow-sm">
                                                {stats.find(s => s.id === user.company_id)?.name || 'Empresa'}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-[11px] text-brand-navy font-bold uppercase ">{user.role}</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className={`text-[11px] font-bold uppercase ${isActiveToday ? 'text-brand-navy' : 'text-gray-600'}`}>
                                                    {isActiveToday ? 'Activo Ahora' : 'Fuera de Línea'}
                                                </span>
                                                <span className="text-[9px] text-gray-700 font-mono mt-1">
                                                    {user.last_active ? new Date(user.last_active).toLocaleString('es-CO', { hour12: true }) : 'Sin actividad'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right flex justify-end gap-2 relative">
                                            <button
                                                onClick={() => setActiveManagementId(activeManagementId === user.id ? null : user.id)}
                                                className={`text-[9px] font-bold uppercase  border px-4 py-2 rounded transition-all ${activeManagementId === user.id ? 'bg-brand-green border-black text-brand-navy' : 'border-gray-400 shadow-sm text-brand-navy-bright hover:bg-white'}`}
                                            >
                                                {activeManagementId === user.id ? 'Cerrar' : 'Gestionar'}
                                            </button>

                                            {/* DROPDOWN DE GESTIÓN INDUSTRIAL */}
                                            {activeManagementId === user.id && (
                                                <div className="absolute right-0 top-full mt-2 w-64 bg-bg-card border border-gray-400 shadow-sm rounded-industrial shadow-3xl z-[100] p-4 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="mb-4">
                                                        <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2 px-1">Asignar Rol</p>
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            {['operador', 'gerente', 'catador', 'barista', 'tostador'].map(role => (
                                                                <button
                                                                    key={role}
                                                                    onClick={() => handleUpdateUser(user.id, { role })}
                                                                    className={`text-[9px] font-bold uppercase p-2 rounded border transition-all ${user.role === role ? 'bg-white border border-gray-400 shadow-sm border-gray-400 shadow-sm text-brand-navy-bright' : 'bg-white border-gray-400 shadow-sm text-brand-navy hover:text-brand-navy hover:bg-white'}`}
                                                                >
                                                                    {role}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-gray-400 shadow-sm">
                                                        <p className="text-[9px] text-brand-navy font-bold uppercase  mb-2 px-1">Cambiar Asociación</p>
                                                        <select
                                                            value={user.company_id}
                                                            onChange={(e) => handleUpdateUser(user.id, { company_id: e.target.value.toUpperCase() })}
                                                            className="w-full bg-bg-main border border-gray-400 shadow-sm rounded p-2 text-[9px] text-brand-navy font-bold uppercase outline-none focus:border-gray-400 shadow-sm"
                                                        >
                                                            {stats.filter(s => s.id !== 'unassigned').map(s => (
                                                                <option key={s.id} value={s.id.toUpperCase()}>{s.name || 'EMPRESA'}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleBlockUser(user.id, user.status)}
                                                className={`text-[9px] font-bold uppercase  border px-4 py-2 rounded transition-all ${user.status === 'blocked' ? 'border-black text-brand-navy' : 'border-border-main text-text-offset hover:text-text-main hover:bg-brand-red/10'}`}
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
                    <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                    <h3 className="text-xs font-bold text-brand-navy uppercase ">Matriz de Roles y Permisos</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roleDefinitions.map((role, idx) => (
                        <div key={idx} className="bg-bg-card border border-gray-400 shadow-sm p-6 rounded-industrial shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-black text-brand-navy uppercase ">{role.name}</span>
                                </div>
                                <p className="text-[11px] text-brand-navy-bright font-bold uppercase  mb-1">Permisos Activos:</p>
                                <p className="text-[11px] text-brand-navy mb-6">{role.permissions}</p>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-400 shadow-sm pt-4">
                                <p className="text-[9px] text-brand-navy font-mono">
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
                        <div className="bg-bg-card border border-border-main p-10 rounded-industrial shadow-3xl">
                            <h2 className="text-2xl font-black text-text-main er uppercase mb-6 text-center">Nuevo Operador</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-bold text-brand-navy uppercase  block mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                        className="w-full bg-bg-main border border-border-main rounded-industrial-sm px-4 py-3 text-sm focus:border-black outline-none text-text-main placeholder:text-text-offset"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-brand-navy uppercase  block mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                        className="w-full bg-bg-main border border-border-main rounded-industrial-sm px-4 py-3 text-sm focus:border-black outline-none text-text-main placeholder:text-text-offset"
                                    />
                                </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-brand-navy uppercase  block mb-1">Rol</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                        className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm p-3 text-sm text-brand-navy"
                                    >
                                        {roleDefinitions.map(r => <option key={r.name} value={r.name.toLowerCase()}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-brand-navy uppercase  block mb-1">Empresa</label>
                                    <select
                                        value={newUser.companyId}
                                        onChange={(e) => setNewUser({...newUser, companyId: e.target.value})}
                                        className="w-full bg-bg-main border border-gray-400 shadow-sm rounded-industrial-sm p-3 text-sm text-brand-navy"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {stats.filter(s => s.id !== 'unassigned').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddUserModal(false)} className="flex-1 px-4 py-3 border border-gray-400 shadow-sm rounded text-[11px] font-bold text-brand-navy">CANCELAR</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-brand-green text-brand-navy rounded text-[11px] font-bold">REGISTRAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MIGRATION UI */}
            <div className="mt-20 border-t border-gray-400 shadow-sm pt-10">
                <h3 className="text-brand-red text-[11px] font-bold uppercase  mb-6">Zona de Rescate de Datos (Legacy)</h3>
                <div className="bg-brand-red/5 p-6 rounded-industrial border border-brand-red/20 flex items-center justify-between">
                    <div>
                        <p className="text-text-main text-xs font-black uppercase">Registros Huérfanos Detectados: {stats.find(s => s.id === 'unassigned')?.lots || 0}</p>
                        <p className="text-brand-navy text-[9px] uppercase mt-1">Vincular registros sin empresa a un nuevo perfil</p>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={selectedTargetId}
                            onChange={(e) => setSelectedTargetId(e.target.value)}
                            className="bg-bg-main border border-gray-400 shadow-sm p-2 text-[9px] text-brand-navy"
                        >
                            <option value="">ASIGNAR A...</option>
                            {stats.filter(s => s.id !== 'unassigned').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <button onClick={handleMigration} disabled={isMigrating} className="bg-brand-red text-brand-navy text-[9px] font-bold px-6 py-2 rounded">EJECUTAR</button>
                    </div>
                </div>
            </div>

            {reportCompany && <ClientPerformanceReport companyId={reportCompany.id} companyName={reportCompany.name} onClose={() => setReportCompany(null)} />}
            {showLotsCompany && <ClientLotsArchive companyId={showLotsCompany.id} companyName={showLotsCompany.name} onClose={() => setShowLotsCompany(null)} />}
            {showRoastsCompany && <ClientRoastsArchive companyId={showRoastsCompany.id} companyName={showRoastsCompany.name} onClose={() => setShowRoastsCompany(null)} />}
        </div>
    );
}
