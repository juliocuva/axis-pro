'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';

export default function MasterControlCenter() {
    const [stats, setStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">Terminal de Control Maestro</h2>
                    <p className="text-xs text-brand-green font-bold uppercase tracking-[0.4em] mt-2">Visión Global de Operaciones y Facturación</p>
                </div>
                <button
                    onClick={fetchMasterStats}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-industrial-sm text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all"
                >
                    Actualizar Red
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-bg-card border border-white/5 rounded-industrial overflow-hidden">
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
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : stats.map((company, idx) => (
                                <tr key={idx} className="hover:bg-white/2 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(0,229,153,0.5)]"></div>
                                            <span className="text-xs font-mono text-gray-300">
                                                {company.id === '33333333-3333-3333-3333-000023000009' ? 'JULIO UVA (ADMIN)' :
                                                    company.id === '33333333-3333-3333-3333-000025000009' ? 'CATALINA PÉREZ' :
                                                        company.id === '99999999-9999-9999-9999-999999999999' ? 'AXIS MASTER' :
                                                            company.id.substring(0, 18) + '...'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xl font-bold text-white">{company.lots}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2">
                                            <span className="text-[9px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded font-bold border border-orange-500/10" title="En Ingreso">ING: {company.purchased}</span>
                                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold border border-blue-500/10" title="En Trilla">TRI: {company.thrashed}</span>
                                            <span className="text-[9px] bg-brand-green/10 text-brand-green-bright px-2 py-1 rounded font-bold border border-brand-green/10" title="Finalizados">FIN: {company.completed}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="text-lg font-bold text-white">{company.roasts}</span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="flex justify-center gap-4 text-[10px] font-bold">
                                            <span className="text-blue-400">LAB: {company.physical}</span>
                                            <span className="text-brand-green-bright">CUP: {company.cupping}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className="text-brand-green-bright font-black tracking-widest text-sm">
                                            {(company.roasts * 10 + company.physical * 5 + company.cupping * 5).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-bg-card border border-white/5 p-8 rounded-industrial">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Empresas Activas</p>
                        <p className="text-4xl font-black text-white">{stats.length}</p>
                    </div>
                    <div className="bg-bg-card border border-white/5 p-8 rounded-industrial">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Volumen Total Lotes</p>
                        <p className="text-4xl font-black text-white">{stats.reduce((acc, s) => acc + s.lots, 0)}</p>
                    </div>
                    <div className="bg-bg-card border border-white/5 p-8 rounded-industrial">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Eficiencia del Ecosistema</p>
                        <p className="text-4xl font-black text-brand-green-bright">99.4%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
