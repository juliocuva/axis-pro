'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

export default function MasterControlCenter() {
    const [stats, setStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMigrating, setIsMigrating] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState('');

    useEffect(() => {
        fetchMasterStats();
    }, []);

    const fetchMasterStats = async () => {
        setIsLoading(true);
        try {
            // 1. Obtener todos los lotes
            const { data: lots } = await supabase.from('coffee_purchase_inventory').select('id, company_id, status');
            // 2. Obtener todos los tuestes
            const { data: roasts } = await supabase.from('roast_batches').select('id, company_id');
            // 3. Obtener análisis
            const { data: physical } = await supabase.from('physical_analysis').select('id, company_id');
            const { data: cupping } = await supabase.from('sca_cupping').select('id, company_id');

            // Agrupar por empresa
            const companyGroups: Record<string, any> = {};

            const processRecord = (record: any, type: string) => {
                const cid = record.company_id || 'unassigned';
                if (!companyGroups[cid]) {
                    companyGroups[cid] = {
                        id: cid,
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

            setStats(Object.values(companyGroups));
        } catch (err) {
            console.error("Master Control Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMigration = async () => {
        if (!selectedTargetId) return;

        // Confirmación de Seguridad Industrial
        const confirmMsg = `¿ESTÁ SEGURO?\n\nEsta acción reasignará permanentemente todos los registros huérfanos a la empresa seleccionada.\n\nEsta operación no se puede deshacer desde esta interfaz.`;
        if (!window.confirm(confirmMsg)) return;

        setIsMigrating(true);
        try {
            const tables = ['coffee_purchase_inventory', 'roast_batches', 'physical_analysis', 'sca_cupping'];
            let totalAffected = 0;

            for (const table of tables) {
                const { data, error } = await supabase
                    .from(table)
                    .update({ company_id: selectedTargetId })
                    .is('company_id', null)
                    .select('id');

                if (error) console.error(`Error migrando ${table}:`, error);
                if (data) totalAffected += data.length;
            }

            setSelectedTargetId('');
            await fetchMasterStats();
            alert(`Sincronización Exitosa: ${totalAffected} registros han sido rescatados y vinculados.`);
        } catch (err) {
            console.error("Migration Error:", err);
            alert("Fallo Crítico: Error en la comunicación con la Bóveda Cloud.");
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">Terminal de Control Maestro</h2>
                    <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.4em] mt-2">Visión Global de Operaciones y Facturación</p>
                </div>
                <button
                    onClick={fetchMasterStats}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all flex items-center gap-3 group"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-180 transition-transform duration-500"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                    Actualizar Red
                </button>
            </header>

            <div className="grid grid-cols-1 gap-8">
                <div className="bg-bg-card border border-white/5 rounded-industrial overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-green via-brand-green-bright to-transparent opacity-30"></div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identidad (Company ID)</th>
                                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lotes Totales</th>
                                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flujo de Lotes</th>
                                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Tuestes (Batches)</th>
                                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Análisis (Lab/Cup)</th>
                                <th className="p-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Potencial Fact.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-32 text-center">
                                        <div className="inline-block w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-6">Sincronizando con la Bóveda...</p>
                                    </td>
                                </tr>
                            ) : stats.map((company, idx) => (
                                <tr key={idx} className={`hover:bg-white/[0.03] transition-colors group ${company.id === 'unassigned' ? 'bg-brand-red/[0.03]' : ''}`}>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${company.id === 'unassigned' ? 'bg-brand-red animate-pulse shadow-[0_0_12px_rgba(237,28,36,0.6)]' : 'bg-brand-green shadow-[0_0_8px_rgba(0,166,81,0.4)]'}`}></div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-white uppercase tracking-tight">
                                                    {company.id === '33333333-3333-3333-3333-000023000009' ? 'JULIO UVA (ADMIN)' :
                                                        company.id === '33333333-3333-3333-3333-000025000009' ? 'CATALINA PEREZ' :
                                                            company.id === '99999999-9999-9999-9999-999999999999' ? 'AXIS MASTER' :
                                                                company.id === 'unassigned' ? 'DATOS HUERFANOS' :
                                                                    'CLIENTE CORPORATIVO'}
                                                </span>
                                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter mt-0.5">
                                                    {company.id === 'unassigned' ? 'ASIGNACIÓN PENDIENTE' : company.id}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-2xl font-bold text-white tracking-tighter">{company.lots}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2">
                                            <span className="text-[9px] bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-md font-bold border border-orange-500/20" title="En Ingreso">ING: {company.purchased}</span>
                                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-md font-bold border border-blue-500/20" title="En Trilla">TRI: {company.thrashed}</span>
                                            <span className="text-[9px] bg-brand-green/10 text-brand-green-bright px-3 py-1.5 rounded-md font-bold border border-brand-green/20" title="Finalizados">FIN: {company.completed}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="text-2xl font-bold text-white tracking-tighter">{company.roasts}</span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex justify-center gap-6 text-[10px] font-bold">
                                            <div className="text-center">
                                                <p className="text-blue-400 mb-1">LAB</p>
                                                <p className="text-lg text-white">{company.physical}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-brand-green-bright mb-1">CUP</p>
                                                <p className="text-lg text-white">{company.cupping}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        {company.id === 'unassigned' ? (
                                            <div className="flex flex-col items-end gap-3">
                                                <select
                                                    value={selectedTargetId}
                                                    onChange={(e) => setSelectedTargetId(e.target.value)}
                                                    className="bg-bg-main border border-white/10 rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest p-3 text-white outline-none focus:border-brand-green transition-all shadow-inner w-48"
                                                >
                                                    <option value="">ASIGNAR DESTINO...</option>
                                                    {stats.filter(s => s.id !== 'unassigned').map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.id === '33333333-3333-3333-3333-000023000009' ? 'JULIO UVA' :
                                                                s.id === '33333333-3333-3333-3333-000025000009' ? 'CATALINA PEREZ' :
                                                                    s.id === '99999999-9999-9999-9999-999999999999' ? 'AXIS MASTER' :
                                                                        s.id.substring(0, 10)}
                                                        </option>
                                                    ))}
                                                    <option value="11111111-1111-1111-1111-111111111111">SAGRADO CORAZÓN</option>
                                                </select>
                                                <button
                                                    onClick={handleMigration}
                                                    disabled={!selectedTargetId || isMigrating}
                                                    className="px-6 py-2.5 bg-brand-red text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-industrial-sm hover:bg-brand-red-bright transition-all disabled:opacity-50 shadow-lg shadow-brand-red/20"
                                                >
                                                    {isMigrating ? 'SINCRONIZANDO...' : 'EJECUTAR RESCATE'}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="gold-gradient-text font-bold tracking-widest text-2xl">
                                                {(company.roasts * 10 + company.physical * 5 + company.cupping * 5).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-bg-card border border-white/5 p-10 rounded-industrial group hover:border-brand-green/30 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-brand-green/10 transition-all"></div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mb-4">Empresas Activas</p>
                        <p className="text-5xl font-bold text-white tracking-tighter">{stats.filter(s => s.id !== 'unassigned').length}</p>
                    </div>
                    <div className="bg-bg-card border border-white/5 p-10 rounded-industrial group hover:border-brand-green/30 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/10 transition-all"></div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mb-4">Volumen Total Lotes</p>
                        <p className="text-5xl font-bold text-white tracking-tighter">{stats.reduce((acc, s) => acc + s.lots, 0)}</p>
                    </div>
                    <div className="bg-bg-card border border-white/5 p-10 rounded-industrial group hover:border-brand-red/30 transition-all relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 transition-all ${stats.find(s => s.id === 'unassigned')?.lots > 0 ? 'bg-brand-red/20 animate-pulse' : 'bg-white/5'}`}></div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] mb-4">Registros Huérfanos</p>
                        <p className={`text-5xl font-bold tracking-tighter ${stats.find(s => s.id === 'unassigned')?.lots > 0 ? 'text-brand-red animate-pulse' : 'text-white'}`}>
                            {stats.find(s => s.id === 'unassigned')?.lots || 0}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
