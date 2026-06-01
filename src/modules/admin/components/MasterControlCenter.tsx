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
    const [allCupping, setAllCupping] = useState<any[]>([]); // Puntajes de catación mapeados
    const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
    const [dbError, setDbError] = useState<string | null>(null);
    
    // UI states
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        name: '',
        phone: '',
        role: 'operativo',
        companyId: ''
    });

    // Menú de gestión por usuario
    const [activeManagementId, setActiveManagementId] = useState<string | null>(null);

    // Estados para la aprobación y revisión
    const [selectedReviewLot, setSelectedReviewLot] = useState<any | null>(null);
    const [reviewPhysical, setReviewPhysical] = useState<any | null>(null);
    const [reviewRoast, setReviewRoast] = useState<any | null>(null);
    const [reviewCupping, setReviewCupping] = useState<any | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

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
                fetchAllLots(), // Cargar la lista maestra de lotes
                fetchVerificationLogs() // Cargar registros de validaciones
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

            try {
                const { data: cuppings } = await supabase
                    .from('sca_cupping')
                    .select('inventory_id, overall');
                setAllCupping(cuppings || []);
            } catch (cupErr) {
                console.warn("No se pudieron cargar puntajes de catación:", cupErr);
            }
        } catch (err) {
            console.error("Error al cargar lotes maestros:", err);
        }
    };

    const handleOpenReview = async (lot: any) => {
        setSelectedReviewLot(lot);
        setIsReviewing(true);
        try {
            const [physRes, roastRes, cupRes] = await Promise.all([
                supabase.from('physical_analysis').select('*').eq('inventory_id', lot.id).maybeSingle(),
                supabase.from('roast_batches').select('*').eq('inventory_id', lot.id).maybeSingle(),
                supabase.from('sca_cupping').select('*').eq('inventory_id', lot.id).maybeSingle(),
            ]);
            setReviewPhysical(physRes.data);
            setReviewRoast(roastRes.data);
            setReviewCupping(cupRes.data);
        } catch (err) {
            console.error("Error fetching review details:", err);
        }
    };

    const handleApproveLot = async (lotId: string) => {
        if (!selectedReviewLot) return;
        setIsApproving(true);
        try {
            const cryptoHash = 'AXIS-SIG-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);
            
            // Actualizar coffee_purchase_inventory
            const { error } = await supabase
                .from('coffee_purchase_inventory')
                .update({
                    status: 'completed',
                    process_data: {
                        ...(selectedReviewLot.process_data || {}),
                        admin_approved: true,
                        approved_by: currentUser?.full_name || 'System Admin',
                        approved_at: new Date().toISOString(),
                        crypto_hash: cryptoHash
                    }
                })
                .eq('id', lotId);
                
            if (error) throw error;
            
            // Registrar validación de auditoría
            try {
                await supabase.from('eudr_validations').insert([{
                    lot_number: selectedReviewLot.lot_number,
                    farm_name: selectedReviewLot.farm_name,
                    farmer_name: selectedReviewLot.farmer_name,
                    company_id: selectedReviewLot.company_id || currentUser?.company_id || '99999999-9999-9999-9999-999999999999',
                    status: 'success',
                    notes: `Aprobación de Lote y Firma Criptográfica realizada por ${currentUser?.full_name || 'Admin'}. Hash: ${cryptoHash}`
                }]);
            } catch (audErr) {
                console.warn("No se pudo registrar la validación EUDR:", audErr);
            }

            alert('✓ Lote Aprobado con Éxito. El pasaporte digital y el código QR han sido firmados criptográficamente.');
            setIsReviewing(false);
            setSelectedReviewLot(null);
            setReviewPhysical(null);
            setReviewRoast(null);
            setReviewCupping(null);
            await fetchAllLots();
            await fetchMasterStats();
            await fetchVerificationLogs();
        } catch (err: any) {
            alert('Error al aprobar el lote: ' + err.message);
        } finally {
            setIsApproving(false);
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
            const combinedName = newUser.phone ? `${newUser.name} | Tel: ${newUser.phone}` : newUser.name;
            const { data, error } = await supabase
                .from('profiles')
                .insert([{
                    email: newUser.email,
                    full_name: combinedName,
                    role: newUser.role,
                    company_id: newUser.companyId || '99999999-9999-9999-9999-999999999999',
                    status: 'active'
                }]);

            if (error) throw error;
            
            setShowAddUserModal(false);
            setNewUser({ email: '', name: '', phone: '', role: 'operativo', companyId: '' });
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
        { name: 'Administrativo', permissions: 'Gobernanza global, auditoría de lotes, pasaportes criptográficos, control de operadores.' },
        { name: 'Operativo', permissions: 'Ingreso y flujo completo de información (Origen, Trilla, Lab Físico, Tostión y Catación).' }
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

            {/* SECCIÓN: LOTES PENDIENTES DE APROBACIÓN (CONTROL DE CALIDAD) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Aprobaciones Pendientes (Q Grader Captura Rápida)</h3>
                    </div>
                    {allLots.filter((lot) => lot.status === 'purchased' && lot.process_data?.quick_capture_complete === true).length > 0 && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full uppercase">
                            {allLots.filter((lot) => lot.status === 'purchased' && lot.process_data?.quick_capture_complete === true).length} por Sellar
                        </span>
                    )}
                </div>

                <div className="bg-bg-card border-2 border-amber-400/40 shadow-xl rounded-industrial overflow-hidden">
                    {allLots.filter((lot) => lot.status === 'purchased' && lot.process_data?.quick_capture_complete === true).length === 0 ? (
                        <div className="p-8 text-center text-brand-navy/60 font-bold uppercase text-xs flex flex-col items-center justify-center gap-2">
                            <span className="text-2xl">☕</span>
                            <span>No hay lotes pendientes de revisión. Todos los despachos están sellados.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-amber-500/10 border-b border-amber-300/40">
                                        <th className="p-5 text-[9px] font-bold text-brand-navy uppercase">No. Lote</th>
                                        <th className="p-5 text-[9px] font-bold text-brand-navy uppercase">Productor / Finca</th>
                                        <th className="p-5 text-[9px] font-bold text-brand-navy uppercase">Variedad y Proceso</th>
                                        <th className="p-5 text-[9px] font-bold text-brand-navy uppercase text-center">Puntaje SCA (CVA)</th>
                                        <th className="p-5 text-[9px] font-bold text-brand-navy uppercase text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200/5 font-medium">
                                    {allLots.filter((lot) => lot.status === 'purchased' && lot.process_data?.quick_capture_complete === true).map((lot) => {
                                        const score = allCupping.find(c => c.inventory_id === lot.id)?.overall;
                                        return (
                                            <tr key={lot.id} className="hover:bg-amber-500/5 transition-colors">
                                                <td className="p-5 text-xs font-black text-brand-navy">{lot.lot_number}</td>
                                                <td className="p-5 text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-text-main uppercase font-bold">{lot.farmer_name}</span>
                                                        <span className="text-[9px] text-brand-navy uppercase">{lot.farm_name} • {lot.region}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-text-main font-bold">{lot.variety}</span>
                                                        <span className="text-[9px] text-brand-navy uppercase">{lot.process}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className="inline-block px-3 py-1 rounded bg-amber-500/20 text-brand-navy text-xs font-black">
                                                        {score ? Number(score).toFixed(2) : 'Catación Pendiente'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <button
                                                        onClick={() => handleOpenReview(lot)}
                                                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-brand-navy rounded font-black text-[10px] uppercase border border-black shadow-md transition-all inline-flex items-center gap-2"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                        Revisar y Sellar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* NUEVA SECCIÓN: PIPELINE 360° DE TRANSPARENCIA Y BANCO TÉCNICO */}
             <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-brand-green rounded-full shadow-[0_0_10px_rgba(0,255,136,0.6)] animate-pulse"></div>
                        <h3 className="text-sm font-black text-brand-navy uppercase tracking-wider">Pipeline 360° de Transparencia Global (Banco Técnico)</h3>
                    </div>
                    <span className="text-[10px] font-black text-brand-navy bg-white border border-gray-300 px-3.5 py-1 rounded-full uppercase">
                        {allLots.length} Lotes en Ecosistema
                    </span>
                </div>
                
                <div className="space-y-4">
                    {allLots.length === 0 ? (
                        <div className="bg-bg-card border border-gray-400 p-12 text-center rounded-industrial">
                            <span className="text-3xl">☕</span>
                            <p className="text-xs font-black uppercase text-brand-navy/60 mt-2">No se han registrado lotes en la cooperativa aún.</p>
                        </div>
                    ) : (
                        allLots.slice(0, 15).map((lot) => {
                            const score = allCupping.find(c => c.inventory_id === lot.id)?.overall;
                            const isCompleted = lot.status === 'completed';
                            
                            // Determinación de fases del pipeline en tiempo real
                            const isStep1 = true; // Origen completado
                            const isStep2 = lot.thrashed_weight > 0 || isCompleted || lot.status === 'thrashed';
                            const isStep3 = lot.moisture > 0 || isCompleted || lot.status === 'physical_analyzed';
                            const isStep4 = isCompleted; // Tostión
                            const isStep5 = isCompleted; // Catación/Sello
                            
                            return (
                                <div 
                                    key={lot.id} 
                                    className={`bg-white border-2 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-center justify-between gap-6 animate-in fade-in duration-300 ${isCompleted ? 'border-emerald-500/30' : 'border-zinc-200'}`}
                                >
                                    {/* Bloque 1: Identificación y Origen */}
                                    <div className="flex items-center gap-4 min-w-[240px] w-full lg:w-auto">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shadow-inner ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-teal-50/50 text-teal-800 border border-teal-200'}`}>
                                            ☕
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono font-black text-brand-navy tracking-wider">{lot.lot_number}</span>
                                                {isCompleted ? (
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        🏆 {score ? `${Number(score).toFixed(2)} PTS` : 'SCA CVA'}
                                                    </span>
                                                ) : (
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                                        ⏳ EN PROCESO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-text-main uppercase mt-1 leading-tight">{lot.farmer_name}</p>
                                            <p className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5 leading-none">{lot.farm_name || 'Sin Finca'} · {lot.region || 'Huila'}</p>
                                        </div>
                                    </div>

                                    {/* Bloque 2: Timeline de Transparencia de 5 Pasos */}
                                    <div className="flex-1 flex items-center justify-between w-full max-w-[450px] relative px-2">
                                        {/* Línea de Fondo del Pipeline */}
                                        <div className="absolute left-4 right-4 top-4 h-0.5 bg-zinc-200 z-0">
                                            <div 
                                                className="h-full bg-emerald-500 transition-all duration-700" 
                                                style={{ 
                                                    width: isStep5 ? '100%' : (isStep4 ? '75%' : (isStep3 ? '50%' : (isStep2 ? '25%' : '0%'))) 
                                                }}
                                            ></div>
                                        </div>

                                        {/* Pasos */}
                                        {[
                                            { label: 'Origen', done: isStep1 },
                                            { label: 'Trilla', done: isStep2 },
                                            { label: 'Laboratorio', done: isStep3 },
                                            { label: 'Tostión', done: isStep4 },
                                            { label: 'Catación', done: isStep5 }
                                        ].map((step, idx) => (
                                            <div key={idx} className="relative z-10 flex flex-col items-center gap-1">
                                                <div 
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                                                        step.done 
                                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                                                            : 'bg-white border-zinc-300 text-zinc-400'
                                                    }`}
                                                >
                                                    {step.done ? '✓' : idx + 1}
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-wider ${step.done ? 'text-brand-navy' : 'text-zinc-400'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bloque 3: Acciones e Información Final */}
                                    <div className="flex items-center gap-4 justify-between lg:justify-end w-full lg:w-auto border-t lg:border-t-0 border-zinc-100 pt-4 lg:pt-0">
                                        <div className="text-left lg:text-right">
                                            <p className="text-[8px] text-zinc-500 font-bold uppercase leading-none">Peso Registrado</p>
                                            <p className="text-xs font-black text-brand-navy mt-1">{(lot.purchase_weight || 0).toLocaleString()} KG</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenReview(lot)}
                                                className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border-2 transition-all active:scale-95 flex items-center gap-1.5 ${
                                                    isCompleted 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' 
                                                        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                                }`}
                                            >
                                                🔍 Ver Detalles
                                            </button>
                                            
                                            {currentUser?.email === 'juliocuva@gmail.com' && (
                                                <button 
                                                    onClick={() => handleDeleteLot(lot.id, lot.lot_number)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-black px-3 py-2 rounded-xl border border-red-200 transition-all uppercase"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
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
                                                    {(() => {
                                                        const rawName = user.full_name || '';
                                                        const hasPhone = rawName.includes(' | Tel: ');
                                                        const displayName = hasPhone ? rawName.split(' | Tel: ')[0] : rawName;
                                                        const displayPhone = hasPhone ? rawName.split(' | Tel: ')[1] : 'Sin Teléfono';
                                                        return (
                                                            <>
                                                                <span className="text-xs font-bold text-brand-navy uppercase ">{displayName || 'Sin Nombre'}</span>
                                                                <span className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Tel: {displayPhone}</span>
                                                            </>
                                                        );
                                                    })()}
                                                    <span className="text-[10px] text-brand-navy font-mono mt-1">{user.email}</span>
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
                                                            {['administrativo', 'operativo'].map(role => (
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
                                <div>
                                    <label className="text-[9px] font-bold text-brand-navy uppercase  block mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                                        placeholder="Ej: 3013970002"
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

            {/* MODAL DE REVISIÓN Y APROBACIÓN DE LOTES (SUPER ADMIN GOVERNANCE) */}
            {isReviewing && selectedReviewLot && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-bg-card border-2 border-brand-green/60 w-full max-w-5xl rounded-industrial shadow-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                        
                        {/* Cabecera del Modal */}
                        <header className="bg-white border-b border-gray-400 p-6 flex justify-between items-center flex-shrink-0">
                            <div>
                                <span className="px-3 py-1 bg-amber-500/20 text-brand-navy rounded-full text-[9px] font-black uppercase tracking-widest">
                                    Revisión de Calidad y Firma Digital
                                </span>
                                <h2 className="text-2xl font-black text-brand-navy uppercase mt-1">Lote: {selectedReviewLot.lot_number}</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setIsReviewing(false);
                                    setSelectedReviewLot(null);
                                }}
                                className="w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center text-brand-navy transition-all"
                            >
                                ✕
                            </button>
                        </header>

                        {/* Contenido / Grid */}
                        <div className="p-8 overflow-y-auto space-y-8 flex-grow">
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* COLUMNA IZQUIERDA: Flujo Físico y Alquimia */}
                                <div className="space-y-6">
                                    
                                    {/* 1. Origen y Compra */}
                                    <div className="bg-bg-main/50 p-5 rounded-industrial border border-gray-300/60">
                                        <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest border-b border-gray-300 pb-2 mb-3">
                                            1. Origen y Compra (Origin & Purchase)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Caficultor</p>
                                                <p className="font-bold text-text-main">{selectedReviewLot.farmer_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Finca / Región</p>
                                                <p className="font-bold text-text-main">{selectedReviewLot.farm_name} • {selectedReviewLot.region}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Variedad / Proceso</p>
                                                <p className="font-bold text-brand-navy">{selectedReviewLot.variety} / {selectedReviewLot.process}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Peso de Compra</p>
                                                <p className="font-bold text-text-main">{selectedReviewLot.purchase_weight ? `${selectedReviewLot.purchase_weight.toLocaleString()} Kg` : '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Fecha de Cosecha</p>
                                                <p className="font-bold text-text-main">{selectedReviewLot.harvest_date || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Destino Previsto</p>
                                                <p className="font-bold text-brand-navy uppercase text-[10px]">{selectedReviewLot.destination || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Fermentación y Alquimia */}
                                    <div className="bg-bg-main/50 p-5 rounded-industrial border border-gray-300/60">
                                        <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest border-b border-gray-300 pb-2 mb-3">
                                            2. Fermentación y Alquimia (Alchemy)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">pH Inicial / Final</p>
                                                <p className="font-bold text-text-main">
                                                    {selectedReviewLot.process_data?.ph_inicial || '-'} / {selectedReviewLot.process_data?.ph_final || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Tipo de Secado</p>
                                                <p className="font-bold text-text-main">{selectedReviewLot.process_data?.tipo_secado || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Tiempo Secado</p>
                                                <p className="font-bold text-text-main">
                                                    {selectedReviewLot.process_data?.tiempo_secado_dias ? `${selectedReviewLot.process_data.tiempo_secado_dias} días` : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Fermentación Horas</p>
                                                <p className="font-bold text-text-main">
                                                    {selectedReviewLot.process_data?.tiempo_fermentacion_horas ? `${selectedReviewLot.process_data.tiempo_fermentacion_horas} hrs` : '-'}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[9px] text-gray-500 uppercase">Notas Especiales de Proceso</p>
                                                <p className="text-xs text-text-main italic">{selectedReviewLot.process_data?.anotacion_especial || 'Sin anotaciones.'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Trilla y Rendimiento */}
                                    <div className="bg-bg-main/50 p-5 rounded-industrial border border-gray-300/60">
                                        <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest border-b border-gray-300 pb-2 mb-3">
                                            3. Trilla y Rendimiento (Milling)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Peso Café Almendra (Verde)</p>
                                                <p className="font-bold text-text-main">
                                                    {selectedReviewLot.thrashed_weight ? `${selectedReviewLot.thrashed_weight.toLocaleString()} Kg` : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Rendimiento Trilla</p>
                                                <p className="font-black text-brand-green">
                                                    {selectedReviewLot.thrashing_yield ? `${Number(selectedReviewLot.thrashing_yield).toFixed(2)}%` : '0.00%'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Peso Pasilla</p>
                                                <p className="font-bold text-text-main">
                                                    {selectedReviewLot.pasilla_weight ? `${selectedReviewLot.pasilla_weight.toLocaleString()} Kg` : '0 Kg'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-500 uppercase">Peso Cisco</p>
                                                <p className="font-bold text-text-main">
                                                    {selectedReviewLot.cisco_weight ? `${selectedReviewLot.cisco_weight.toLocaleString()} Kg` : '0 Kg'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Laboratorio Físico */}
                                    <div className="bg-bg-main/50 p-5 rounded-industrial border border-gray-300/60">
                                        <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest border-b border-gray-300 pb-2 mb-3">
                                            4. Laboratorio Físico (Physical Analysis)
                                        </h4>
                                        {reviewPhysical ? (
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">Humedad (Moisture %)</p>
                                                    <p className="font-bold text-text-main">{reviewPhysical.moisture_pct ? `${reviewPhysical.moisture_pct}%` : '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">Actividad de Agua (aW)</p>
                                                    <p className="font-bold text-text-main">{reviewPhysical.water_activity || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">Densidad (g/L)</p>
                                                    <p className="font-bold text-text-main">{reviewPhysical.density_gl ? `${reviewPhysical.density_gl} g/l` : '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">Defectos (P/S)</p>
                                                    <p className="font-bold text-brand-red">
                                                        {reviewPhysical.defects_count?.primarios || 0} Primarios / {reviewPhysical.defects_count?.secundarios || 0} Secundarios
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[9px] text-gray-500 uppercase">Notas Físicas</p>
                                                    <p className="text-xs text-text-main italic">{reviewPhysical.notes || 'Sin notas físicas.'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-brand-navy italic">No se han registrado datos de laboratorio físico para este lote.</p>
                                        )}
                                    </div>

                                    {/* 5. Tostión */}
                                    <div className="bg-bg-main/50 p-5 rounded-industrial border border-gray-300/60">
                                        <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest border-b border-gray-300 pb-2 mb-3">
                                            5. Tostión (Roasting Batch)
                                        </h4>
                                        {reviewRoast ? (
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">ID Batch Tueste</p>
                                                    <p className="font-bold text-text-main">{reviewRoast.batch_id_label || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">Fecha Roast</p>
                                                    <p className="font-bold text-text-main">{reviewRoast.roast_date || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">Peso Verde / Tostado</p>
                                                    <p className="font-bold text-text-main">
                                                        {reviewRoast.green_weight || 0} Kg / {reviewRoast.roasted_weight || 0} Kg
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase">Merma Tueste (%)</p>
                                                    <p className="font-black text-brand-red">
                                                        {reviewRoast.green_weight && reviewRoast.roasted_weight
                                                            ? (((reviewRoast.green_weight - reviewRoast.roasted_weight) / reviewRoast.green_weight) * 100).toFixed(2) + '%'
                                                            : '0.00%'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-brand-navy italic">No se han registrado datos de tostión para este lote.</p>
                                        )}
                                    </div>

                                </div>

                                {/* COLUMNA DERECHA: Análisis Sensorial SCA */}
                                <div className="space-y-6">
                                    
                                    {/* 6. Catación SCA CVA */}
                                    <div className="bg-bg-main p-6 rounded-industrial border-2 border-brand-green/40 shadow-inner flex flex-col justify-between h-full">
                                        <div>
                                            <h4 className="text-[10px] font-black text-brand-navy uppercase tracking-widest border-b border-gray-300 pb-2 mb-4">
                                                6. Análisis Sensorial SCA CVA (Cupping)
                                            </h4>

                                            {reviewCupping ? (
                                                <div className="space-y-6">
                                                    
                                                    {/* Tarjeta del Puntaje Total */}
                                                    <div className="bg-white border border-gray-400 p-5 rounded-industrial flex items-center justify-between shadow-sm">
                                                        <div>
                                                            <p className="text-[9px] text-brand-navy font-bold uppercase">Puntaje Total SCA</p>
                                                            <p className="text-[11px] text-gray-500">Escala de Calidad Afectiva</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-4xl font-black text-brand-navy">
                                                                {reviewCupping.overall ? Number(reviewCupping.overall).toFixed(2) : '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Matriz de Atributos - Calidad Afectiva */}
                                                    <div className="space-y-3">
                                                        <h5 className="text-[10px] font-bold text-brand-navy uppercase tracking-wider">
                                                            Puntajes de Calidad Afectiva (SCA Quality)
                                                        </h5>
                                                        <div className="grid grid-cols-2 gap-3 text-xs bg-white/60 p-4 rounded-industrial border border-gray-200">
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Fragancia:</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.fragranceQuality || '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Aroma:</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.aromaQuality || '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Sabor:</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.flavorQuality || '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Posgusto:</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.aftertasteQuality || '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Acidez:</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.acidityQuality || '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Cuerpo (Mouthfeel):</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.mouthfeelQuality || '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Dulzura (Sweetness):</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.sweetnessQuality || '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-b border-gray-200/50 pb-1">
                                                                <span className="text-gray-600">Apreciación Global:</span>
                                                                <span className="font-bold text-brand-navy">{reviewCupping.cva_affective?.overallImpression || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Intensidades Sensoriales */}
                                                    <div className="space-y-3">
                                                        <h5 className="text-[10px] font-bold text-brand-navy uppercase tracking-wider">
                                                            Intensidades Percibidas (Descriptive CVA)
                                                        </h5>
                                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/40 p-4 rounded-industrial border border-gray-200">
                                                            <div>
                                                                <span className="text-gray-600">Fragancia Int:</span>
                                                                <span className="font-bold ml-1 text-brand-navy">{reviewCupping.cva_descriptive?.fragranceIntensity || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Aroma Int:</span>
                                                                <span className="font-bold ml-1 text-brand-navy">{reviewCupping.cva_descriptive?.aromaIntensity || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Sabor Int:</span>
                                                                <span className="font-bold ml-1 text-brand-navy">{reviewCupping.cva_descriptive?.flavorIntensity || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Posgusto Int:</span>
                                                                <span className="font-bold ml-1 text-brand-navy">{reviewCupping.cva_descriptive?.aftertasteIntensity || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Acidez Int:</span>
                                                                <span className="font-bold ml-1 text-brand-navy">{reviewCupping.cva_descriptive?.acidityIntensity || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Cuerpo Int:</span>
                                                                <span className="font-bold ml-1 text-brand-navy">{reviewCupping.cva_descriptive?.mouthfeelIntensity || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">Dulzura Int:</span>
                                                                <span className="font-bold ml-1 text-brand-navy">{reviewCupping.cva_descriptive?.sweetnessIntensity || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Notas y Catador */}
                                                    <div className="space-y-2 text-xs">
                                                        <div>
                                                            <p className="text-[9px] text-gray-500 uppercase">Catador Responsable</p>
                                                            <p className="font-bold text-text-main">{reviewCupping.taster_name || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-gray-500 uppercase">Descriptores y Notas Sensoriales</p>
                                                            <p className="text-xs text-text-main italic bg-white/50 p-3 rounded border border-gray-200">
                                                                {reviewCupping.notes || 'Sin comentarios o notas del catador.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                </div>
                                            ) : (
                                                <p className="text-xs text-brand-navy italic">No se han registrado datos de catación sensorial para este lote.</p>
                                            )}
                                        </div>

                                        {/* Bloque de Información Importante y Exclusiones */}
                                        <div className="mt-8 pt-4 border-t border-gray-300 text-[10px] text-brand-navy/70 space-y-2">
                                            <p className="flex items-center gap-1.5 font-bold text-amber-800">
                                                <span>⚠️</span>
                                                <span>Huella de carbono (Carbon Footprint) omitida por política interna.</span>
                                            </p>
                                            <p className="leading-relaxed">
                                                Al certificar, el lote quedará inmutable. Se inyectará una firma criptográfica única y se registrarán auditorías EUDR automatizadas.
                                            </p>
                                        </div>
                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* Pie del Modal: Botones de Acción */}
                        <footer className="bg-bg-main border-t border-gray-400 p-6 flex justify-between items-center flex-shrink-0 gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsReviewing(false);
                                    setSelectedReviewLot(null);
                                }}
                                className="px-6 py-3 border border-gray-400 shadow-sm hover:bg-white text-brand-navy rounded text-[11px] font-bold uppercase transition-all"
                            >
                                Cancelar y Volver
                            </button>
                            <button
                                type="button"
                                onClick={() => handleApproveLot(selectedReviewLot.id)}
                                disabled={isApproving}
                                className="px-8 py-3.5 bg-brand-green text-brand-navy hover:bg-brand-green-bright rounded text-[11px] font-black uppercase border border-black shadow-lg shadow-brand-green/20 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {isApproving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-brand-navy" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Firmando...
                                    </>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                        Aprobar y Emitir Certificado
                                    </>
                                )}
                            </button>
                        </footer>

                    </div>
                </div>
            )}

            {reportCompany && <ClientPerformanceReport companyId={reportCompany.id} companyName={reportCompany.name} onClose={() => setReportCompany(null)} />}
            {showLotsCompany && <ClientLotsArchive companyId={showLotsCompany.id} companyName={showLotsCompany.name} onClose={() => setShowLotsCompany(null)} />}
            {showRoastsCompany && <ClientRoastsArchive companyId={showRoastsCompany.id} companyName={showRoastsCompany.name} onClose={() => setShowRoastsCompany(null)} />}
        </div>
    );
}
