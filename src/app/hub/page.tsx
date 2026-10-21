"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe2, Ship, MapPin, Package, LogOut, FileText, CheckCircle2, ArrowRight, RefreshCw, X, Pen } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminHubPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [syncingPoId, setSyncingPoId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [linkModal, setLinkModal] = useState<{ isOpen: boolean, poId: string } | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [posData, setPosData] = useState<any[]>([]);
  const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [newPoForm, setNewPoForm] = useState<any>({
    po_number: '',
    customer: '',
    exporter: '',
    execution_date: '',
    origin: '',
    destination: '',
    coffee_type: '',
    variety: '',
    process: '',
    target_volume_kg: '',
    sheet_url: '',
    lots: [{ variety: '', process: '', volume_kg: '' }]
  });

  const fetchPOs = async () => {
    const { data, error } = await supabase.from('purchase_orders').select('*, actual_lots:lots(volume_kg), compliance_evidence(*), shipment_evidence(*)').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(po => {
        let actualVolume = 0;
        if (po.actual_lots && Array.isArray(po.actual_lots)) {
          actualVolume = po.actual_lots.reduce((sum: number, l: any) => sum + (Number(l.volume_kg) || 0), 0);
        }

        const comp = po.compliance_evidence?.[0] || po.compliance_evidence;
        const ship = po.shipment_evidence?.[0] || po.shipment_evidence;

        return {
          id: po.po_number,
          buyer: po.buyer_name || 'AxisONE Customer',
          exporter: po.exporter || '',
          destination: po.destination || 'N/A',
          origin: po.origin || 'N/A',
          volume: Number(po.target_volume_kg) || 0,
          consolidated: actualVolume,
          status: po.status || 'DRAFT',
          eudr: comp?.eudr_cleared ? 'CLEARED' : 'PENDING',
          shipmentReady: !!ship?.docs_ready,
          sheetUrl: po.sheet_url || localStorage.getItem(`sheet_url_${po.po_number}`) || '',
          coffee_type: po.coffee_type || '',
          variety: po.variety || '',
          process: po.process || '',
          executionDate: po.execution_date || localStorage.getItem(`date_${po.po_number}`) || '',
          lots: po.expected_lots || JSON.parse(localStorage.getItem(`lots_${po.po_number}`) || 'null') || [{ variety: '', process: '', volume_kg: '' }],
          last_sync_date: po.last_sync_date || null
        };
      });
      setPosData(formatted);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSavePo = async () => {
    const lotsTotal = (newPoForm.lots || []).reduce((s: number, l: any) => s + (Number(l.volume_kg) || 0), 0);
    const finalVolume = lotsTotal > 0 ? lotsTotal : Number(newPoForm.target_volume_kg);
    if (!newPoForm.po_number || finalVolume === 0) {
      showToast('Por favor completa el código y agrega al menos un lote con kilos', 'error');
      return;
    }
    let error;
    let finalPoId = null;
    if (editingPoId) {
      const { error: err, data } = await supabase.from('purchase_orders').update({
        origin: newPoForm.origin,
        destination: newPoForm.destination,
        coffee_type: newPoForm.coffee_type,
        variety: newPoForm.variety,
        process: newPoForm.process,
        target_volume_kg: finalVolume,
        sheet_url: newPoForm.sheet_url || null,
        execution_date: newPoForm.execution_date || null,
        expected_lots: newPoForm.lots || []
      }).eq('po_number', editingPoId).select('id').single();
      error = err;
      if (data) finalPoId = data.id;
    } else {
      const { error: err, data } = await supabase.from('purchase_orders').insert({
        po_number: newPoForm.po_number,
        origin: newPoForm.origin,
        destination: newPoForm.destination,
        coffee_type: newPoForm.coffee_type,
        variety: newPoForm.variety,
        process: newPoForm.process,
        target_volume_kg: finalVolume,
        sheet_url: newPoForm.sheet_url || null,
        execution_date: newPoForm.execution_date || null,
        expected_lots: newPoForm.lots || []
      }).select('id').single();
      error = err;
      if (data) finalPoId = data.id;
    }
    
    if (error) {
      showToast('Error al guardar: ' + error.message, 'error');
    } else {
      if (finalPoId) {
        await supabase.from('compliance_evidence').upsert({ po_id: finalPoId, eudr_cleared: newPoForm.eudr_cleared }, { onConflict: 'po_id' });
        await supabase.from('shipment_evidence').upsert({ po_id: finalPoId, docs_ready: newPoForm.docs_ready, container_status: newPoForm.docs_ready ? 'SEALED' : 'PENDING' }, { onConflict: 'po_id' });
      }
      showToast('Orden guardada exitosamente', 'success');
      setIsNewPoModalOpen(false);
      setEditingPoId(null);
      setNewPoForm({ po_number: '', customer: '', exporter: '', execution_date: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '', lots: [{ variety: '', process: '', volume_kg: '' }], eudr_cleared: false, docs_ready: false });
      fetchPOs();
    }
  };

  const handleSync = async (e: React.MouseEvent, poId: string) => {
    e.stopPropagation();

    const currentPo = posData.find(p => p.id === poId);
    if (!currentPo) return;

    if (!currentPo.sheetUrl) {
      setLinkInput('');
      setLinkModal({ isOpen: true, poId });
      return;
    }

    await executeSync(poId, currentPo.sheetUrl);
  };

  const submitLinkModal = async () => {
    if (!linkModal || !linkInput.trim()) return;
    const poId = linkModal.poId;
    const sheetId = linkInput.trim();
    
    localStorage.setItem(`sheet_url_${poId}`, sheetId);
    setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: sheetId } : p));
    setLinkModal(null);
    await executeSync(poId, sheetId);
  };

  const executeSync = async (poId: string, sheetId: string) => {
    setSyncingPoId(poId);
    try {
      const res = await fetch('/api/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId, poId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${data.recordsProcessed} registros sincronizados para ${poId} (${data.sheetTitle})`, 'success');
        
        if (data.data && data.data.length > 0) {
          const totalSyncedVolume = data.data.reduce((sum: number, item: any) => sum + (item.volume || 0), 0);
          setPosData(prev => prev.map(po => 
            po.id === poId 
              ? { ...po, consolidated: totalSyncedVolume, status: 'UPDATED', sheetUrl: sheetId } 
              : po
          ));
        }
      } else {
        showToast('Error en la sincronización: ' + data.error, 'error');
        setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: '' } : p));
      }
    } catch (err) {
      showToast('Error de conexión al sincronizar', 'error');
      setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: '' } : p));
    } finally {
      setSyncingPoId(null);
    }
  };

  const filteredPOs = posData.filter(po => 
    po.id.toLowerCase().includes(search.toLowerCase()) || 
    po.buyer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0C3C60] flex flex-col" style={{ fontFamily: "var(--font-montserrat, 'Montserrat', sans-serif)" }}>
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-[#082840] shadow-md">
        <div className="flex items-center gap-6">
          <img 
            src="/logo-axisone.png" 
            alt="AxisONE Logo" 
            className="h-8 object-contain"
            style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} 
          />
          <div className="w-px h-6 bg-white/15 hidden sm:block"></div>
          <span className="font-bold text-[#FAF2CA] uppercase text-[11px] tracking-widest bg-white/10 rounded-full px-3.5 py-1 border border-[#FAF2CA]/25">
            Admin Hub
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-[#FAF2CA]/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search Orders..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0C3C60] border border-white/15 text-white placeholder-[#FAF2CA]/50 text-xs rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-[#69CCC2]"
            />
          </div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#69CCC2]/20 border border-[#69CCC2]/50 text-[#FAF2CA] flex items-center justify-center font-bold text-xs group-hover:bg-[#83DF9C] group-hover:text-[#0C3C60] transition-colors">
              AD
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[#FAF2CA] text-[11px] leading-tight font-bold group-hover:text-[#83DF9C] transition-colors">Admin User</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 leading-tight">Global Manager</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="text-[#FAF2CA]/70 hover:text-[#FF7E7E] transition-colors ml-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#0C3C60]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light text-[#FAF2CA] tracking-tight mb-2">Global Operations</h1>
              <p className="text-sm text-[#FAF2CA]/75 font-medium">Manage and track all commercial blend purchase orders.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setEditingPoId(null); setNewPoForm({ po_number: '', customer: '', exporter: '', execution_date: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '', lots: [{ variety: '', process: '', volume_kg: '' }] }); setIsNewPoModalOpen(true); }}
                className="flex items-center gap-2 bg-[#83DF9C] hover:bg-[#6fd48b] text-[#0C3C60] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg cursor-pointer"
              >
                <Package className="w-4 h-4 text-[#0C3C60]" /> New Purchase Order
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPOs.map((po) => {
              const progress = po.volume > 0 ? Math.round((po.consolidated / po.volume) * 100) : 0;
              const isCompleted = progress >= 100 || po.status === 'COMPLETED';
              
              return (
                <div 
                  key={po.id}
                  onClick={() => router.push(`/commercial/evidence?po=${po.id}`)}
                  className="group relative bg-[#FAF2CA] rounded-3xl p-6 border border-[#0C3C60]/15 hover:border-[#0C3C60]/40 hover:ring-2 hover:ring-[#69CCC2]/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl flex flex-col justify-between min-h-[280px]"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2 mb-5 min-h-[54px]">
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex flex-col mb-1">
                        <p className="text-[10px] font-bold text-[#0C3C60]/60 uppercase tracking-widest">Purchase Order</p>
                        {po.last_sync_date && (
                          <p className="text-[9px] text-[#0C3C60]/80 font-bold tracking-wider flex items-center gap-1 mt-0.5">
                            Updated: {new Date(po.last_sync_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-[#0C3C60] tracking-tight truncate" title={po.id}>{po.id}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPoId(po.id);
                          setNewPoForm({
                            po_number: po.id,
                            customer: po.buyer || '',
                            exporter: po.exporter || '',
                            origin: po.origin === 'N/A' ? '' : po.origin,
                            destination: po.destination === 'N/A' ? '' : po.destination,
                            coffee_type: po.coffee_type || '',
                            variety: po.variety || '',
                            process: po.process || '',
                            target_volume_kg: po.volume ? String(po.volume) : '',
                            sheet_url: po.sheetUrl || '',
                            execution_date: po.executionDate || '',
                            lots: po.lots && po.lots.length > 0 ? po.lots : [{ variety: '', process: '', volume_kg: '' }],
                            eudr_cleared: po.eudr === 'CLEARED',
                            docs_ready: po.shipmentReady
                          });
                          setIsNewPoModalOpen(true);
                        }}
                        className="p-2 rounded-full border border-[#0C3C60]/20 text-[#0C3C60]/70 hover:bg-[#0C3C60] hover:text-[#FAF2CA] transition-all cursor-pointer"
                        title="Editar PO"
                      >
                        <Pen className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => handleSync(e, po.id)}
                        disabled={syncingPoId === po.id}
                        className={`p-2 rounded-full border transition-all cursor-pointer ${po.sheetUrl ? 'bg-[#83DF9C]/40 border-[#83DF9C] text-[#0C3C60] hover:bg-[#83DF9C]' : 'bg-transparent border-[#0C3C60]/20 text-[#0C3C60]/70 hover:bg-[#0C3C60] hover:text-[#FAF2CA]'} disabled:opacity-50`}
                        title={po.sheetUrl ? "Sincronizar (URL guardada)" : "Vincular Google Sheet"}
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingPoId === po.id ? 'animate-spin' : ''}`} />
                      </button>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border whitespace-nowrap ${
                        isCompleted
                          ? 'bg-[#83DF9C]/45 text-[#0C3C60] border-[#83DF9C]'
                          : 'bg-[#FF7E7E]/30 text-[#0C3C60] border-[#FF7E7E]'
                      }`}>
                        {isCompleted ? 'COMPLETED' : String(po.status).replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-4 mb-6 flex-1">
                    <div>
                      <p className="text-[9px] font-bold text-[#0C3C60]/60 uppercase tracking-widest mb-1">Customer</p>
                      <p className="text-sm text-[#0C3C60] font-bold">{po.buyer}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-[#0C3C60]/60 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Origin</p>
                        <p className="text-sm text-[#0C3C60] font-black">{po.origin}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-[#0C3C60]/60 uppercase tracking-widest mb-1 flex items-center gap-1"><Ship className="w-3 h-3" /> Dest</p>
                        <p className="text-sm text-[#0C3C60] font-black">{po.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer (Progress & EUDR) */}
                  <div className="pt-4 border-t border-[#0C3C60]/15 mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[9px] font-bold text-[#0C3C60]/60 uppercase tracking-widest mb-1">Volume Consolidating</p>
                        <p className="text-xs text-[#0C3C60] font-mono font-bold">{po.consolidated.toLocaleString()} / {po.volume.toLocaleString()} kg</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-lg font-black leading-tight ${
                          progress >= 100
                            ? 'bg-[#83DF9C]/50 text-[#0C3C60] border border-[#83DF9C]'
                            : 'bg-[#FF7E7E]/30 text-[#0C3C60] border border-[#FF7E7E]'
                        }`}>
                          {progress}%
                        </span>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[#0C3C60]/60 mt-1">Consolidated</p>
                      </div>
                    </div>
                    
                    {/* Varietals Breakdown in Hub Card */}
                    {po.lots && Array.isArray(po.lots) && po.lots.length > 0 && po.lots[0].variety && (
                      <div className="mt-3 pt-3 border-t border-[#0C3C60]/10 space-y-1.5">
                        {po.lots.map((lot: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-[10px] text-[#0C3C60]/80 font-bold uppercase tracking-wider">{lot.variety} <span className="opacity-60 font-medium capitalize">({lot.process})</span></span>
                            <span className="text-[10px] text-[#FAF2CA] font-bold bg-[#0C3C60] px-2 py-0.5 rounded">{lot.volume_kg} kg</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#0C3C60]/15 rounded-full overflow-hidden mb-4 mt-5">
                      <div
                        className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-[#83DF9C]' : 'bg-[#0C3C60]'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                        <Globe2 className="w-3.5 h-3.5 text-[#0C3C60]/70" />
                        <span className="text-[#0C3C60]/70">EUDR:</span>
                        <span className={`px-2 py-0.5 rounded-full border ${
                          po.eudr === 'CLEARED'
                            ? 'bg-[#83DF9C]/45 text-[#0C3C60] border-[#83DF9C]'
                            : 'bg-[#FF7E7E]/35 text-[#0C3C60] border-[#FF7E7E]'
                        }`}>
                          {po.eudr}
                        </span>
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#0C3C60] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        View Evidence <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* LINK MODAL */}
      {linkModal?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#082840]/80 backdrop-blur-sm"
            onClick={() => setLinkModal(null)}
          ></div>
          <div className="relative bg-[#0C3C60] border border-white/15 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[#FAF2CA] mb-2">Vincular Google Sheet</h3>
            <p className="text-xs text-[#FAF2CA]/70 mb-6 leading-relaxed">
              Ingresa el enlace de Google Sheets de la cooperativa para la orden <strong className="text-white">{linkModal.poId}</strong>.
            </p>
            
            <input 
              type="text" 
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="w-full bg-[#082840] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#83DF9C] transition-colors mb-6"
              autoFocus
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setLinkModal(null)}
                className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#FAF2CA]/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={submitLinkModal}
                disabled={!linkInput.trim()}
                className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#83DF9C] text-[#0C3C60] hover:bg-[#6fd48b] transition-colors disabled:opacity-50"
              >
                Vincular y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PO MODAL */}
      {isNewPoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#082840]/80 backdrop-blur-sm" onClick={() => setIsNewPoModalOpen(false)}></div>
          <div className="relative bg-[#0C3C60] border border-white/15 rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#FAF2CA]">{editingPoId ? "Edit Purchase Order" : "Create New Purchase Order"}</h3>
              <button onClick={() => setIsNewPoModalOpen(false)} className="text-[#FAF2CA]/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* PO Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-1 block">PO Code</label>
                <input type="text" value={newPoForm.po_number} onChange={e => setNewPoForm({...newPoForm, po_number: e.target.value})} className="w-full bg-[#082840] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#83DF9C]" placeholder="PO-2026-08-001" />
              </div>
              <div>
                <label className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-1 block">Execution Date</label>
                <input type="date" value={newPoForm.execution_date || ''} onChange={e => setNewPoForm({...newPoForm, execution_date: e.target.value})} className="w-full bg-[#082840] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#83DF9C]" />
              </div>
            </div>

            {/* Exporter & Customer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-1 block">Customer (Importer)</label>
                <input type="text" value={newPoForm.customer} onChange={e => setNewPoForm({...newPoForm, customer: e.target.value})} className="w-full bg-[#082840] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#83DF9C]" placeholder="European Coffee Roasters Ltd." />
              </div>
              <div>
                <label className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-1 block">Exporter</label>
                <input type="text" value={newPoForm.exporter} onChange={e => setNewPoForm({...newPoForm, exporter: e.target.value})} className="w-full bg-[#082840] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#83DF9C]" placeholder="Cooperativa de Caficultores..." />
              </div>
              <div>
                <label className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-1 block">Origin</label>
                <input type="text" value={newPoForm.origin} onChange={e => setNewPoForm({...newPoForm, origin: e.target.value})} className="w-full bg-[#082840] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#83DF9C]" placeholder="Colombia" />
              </div>
              <div>
                <label className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-1 block">Destination</label>
                <input type="text" value={newPoForm.destination} onChange={e => setNewPoForm({...newPoForm, destination: e.target.value})} className="w-full bg-[#082840] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#83DF9C]" placeholder="Hamburg, Germany" />
              </div>
            </div>

            {/* Compliance & Shipment (Fase 2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={newPoForm.eudr_cleared || false} onChange={e => setNewPoForm({...newPoForm, eudr_cleared: e.target.checked})} className="w-5 h-5 accent-[#83DF9C] bg-[#082840] border-white/20 rounded" />
                <div>
                  <p className="text-[11px] font-bold text-[#FAF2CA] uppercase tracking-wider">EUDR Aprobado</p>
                  <p className="text-[9px] text-[#FAF2CA]/60">Due Diligence completado</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={newPoForm.docs_ready || false} onChange={e => setNewPoForm({...newPoForm, docs_ready: e.target.checked})} className="w-5 h-5 accent-[#83DF9C] bg-[#082840] border-white/20 rounded" />
                <div>
                  <p className="text-[11px] font-bold text-[#FAF2CA] uppercase tracking-wider">Docs &amp; Shipment</p>
                  <p className="text-[9px] text-[#FAF2CA]/60">Contenedor sellado y docs listos</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="text-[10px] text-[#83DF9C] uppercase tracking-widest font-bold mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> Google Sheet URL</label>
                <input type="text" value={newPoForm.sheet_url} onChange={e => setNewPoForm({...newPoForm, sheet_url: e.target.value})} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full bg-[#082840] border border-[#83DF9C]/40 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#83DF9C]" />
              </div>
            </div>

            {/* Lots Separator */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FAF2CA]/60">Varietals / Lots</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Lots List */}
            <div className="space-y-3 mb-4">
              {newPoForm.lots && newPoForm.lots.map((lot: any, idx: number) => (
                <div key={idx} className="grid grid-cols-3 gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                  <div>
                    <label className="text-[9px] text-[#FAF2CA]/60 uppercase tracking-widest font-bold mb-1 block">Variety</label>
                    <select value={lot.variety} onChange={e => { const lots = [...newPoForm.lots]; lots[idx].variety = e.target.value; setNewPoForm({...newPoForm, lots}); }} className="w-full bg-[#082840] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#83DF9C]">
                      <option value="">Select...</option>
                      <option>Castillo</option><option>Caturra</option><option>Colombia</option>
                      <option>Pink Bourbon</option><option>Yellow Bourbon</option><option>Red Bourbon</option>
                      <option>Geisha</option><option>Sidra</option><option>Tabi</option>
                      <option>Typica</option><option>Sudan Rume</option><option>F6</option>
                      <option>Catimor</option><option>Commercial Blend</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-[#FAF2CA]/60 uppercase tracking-widest font-bold mb-1 block">Process</label>
                    <select value={lot.process} onChange={e => { const lots = [...newPoForm.lots]; lots[idx].process = e.target.value; setNewPoForm({...newPoForm, lots}); }} className="w-full bg-[#082840] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#83DF9C]">
                      <option value="">Select...</option>
                      <option>Washed</option><option>Natural</option><option>Honey</option>
                      <option>Anaerobic Natural</option><option>Anaerobic Washed</option>
                      <option>Carbonic Maceration</option><option>Lactic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-[#FAF2CA]/60 uppercase tracking-widest font-bold mb-1 block">Kg</label>
                    <div className="flex gap-2">
                      <input type="number" value={lot.volume_kg} onChange={e => { const lots = [...newPoForm.lots]; lots[idx].volume_kg = e.target.value; setNewPoForm({...newPoForm, lots}); }} className="w-full bg-[#082840] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#83DF9C]" placeholder="200" />
                      <button type="button" onClick={() => { const lots = newPoForm.lots.filter((_: any, i: number) => i !== idx); setNewPoForm({...newPoForm, lots}); }} className="text-[#FF7E7E] hover:text-red-300 px-2">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setNewPoForm({...newPoForm, lots: [...(newPoForm.lots || []), { variety: '', process: '', volume_kg: '' }]})} className="w-full border border-dashed border-white/20 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest text-[#FAF2CA]/70 hover:border-[#83DF9C] hover:text-[#83DF9C] transition-all">
              + Add Lot
            </button>
            
            <div className="flex gap-3 justify-end mt-8 border-t border-white/10 pt-6">
              <button onClick={() => setIsNewPoModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#FAF2CA]/70 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSavePo} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#83DF9C] text-[#0C3C60] hover:bg-[#6fd48b] transition-colors shadow-lg">{editingPoId ? "Save Changes" : "Save & Create Order"}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-[#83DF9C] text-[#0C3C60]' : 'bg-[#FF7E7E] text-[#0C3C60]'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
