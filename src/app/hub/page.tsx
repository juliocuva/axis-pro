"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe2, Ship, MapPin, Package, LogOut, FileText, CheckCircle2, ArrowRight, RefreshCw, X , Pen } from 'lucide-react';
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
    // Select purchase_orders and their actual lots to calculate dynamic progress
    const { data, error } = await supabase.from('purchase_orders').select('*, actual_lots:lots(volume_kg)').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(po => {
        // Pass the actual volume to consolidated
        let actualVolume = 0;
        if (po.actual_lots && Array.isArray(po.actual_lots)) {
          actualVolume = po.actual_lots.reduce((sum: number, l: any) => sum + (Number(l.volume_kg) || 0), 0);
        }

        return {
          id: po.po_number,
          buyer: po.buyer_name || 'AxisONE Customer',
          exporter: po.exporter || '',
          destination: po.destination || 'N/A',
          origin: po.origin || 'N/A',
          volume: Number(po.target_volume_kg) || 0,
          consolidated: actualVolume,
          status: po.status || 'DRAFT',
        eudr: 'PENDING',
        sheetUrl: po.sheet_url || localStorage.getItem(`sheet_url_${po.po_number}`) || '',
        coffee_type: po.coffee_type || '',
        variety: po.variety || '',
        process: po.process || '',
        executionDate: po.execution_date || localStorage.getItem(`date_${po.po_number}`) || '',
        lots: po.expected_lots || JSON.parse(localStorage.getItem(`lots_${po.po_number}`) || 'null') || [{ variety: '', process: '', volume_kg: '' }]
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
    if (editingPoId) {
      const { error: err } = await supabase.from('purchase_orders').update({
        origin: newPoForm.origin,
        destination: newPoForm.destination,
        coffee_type: newPoForm.coffee_type,
        variety: newPoForm.variety,
        process: newPoForm.process,
        target_volume_kg: finalVolume,
        sheet_url: newPoForm.sheet_url || null,
        execution_date: newPoForm.execution_date || null,
        expected_lots: newPoForm.lots || []
      }).eq('po_number', editingPoId);
      error = err;
    } else {
      const { error: err } = await supabase.from('purchase_orders').insert({
        po_number: newPoForm.po_number,
        origin: newPoForm.origin,
        destination: newPoForm.destination,
        coffee_type: newPoForm.coffee_type,
        variety: newPoForm.variety,
        process: newPoForm.process,
        target_volume_kg: finalVolume,
        sheet_url: newPoForm.sheet_url || null,
        execution_date: newPoForm.execution_date || null,
        expected_lots: newPoForm.lots || [],
        status: 'IN_PROGRESS'
      });
      error = err;
    }
    
    if (error) {
      showToast('Error al guardar orden: ' + error.message, 'error');
    } else {
      // Guardar sheet_url en localStorage si se proporcionó
      const poKey = editingPoId || newPoForm.po_number;
      if (poKey) {
        if (newPoForm.sheet_url) localStorage.setItem(`sheet_url_${poKey}`, newPoForm.sheet_url);
        if (newPoForm.lots) localStorage.setItem(`lots_${poKey}`, JSON.stringify(newPoForm.lots));
        if (newPoForm.execution_date) localStorage.setItem(`date_${poKey}`, newPoForm.execution_date);
      }
      showToast('Orden guardada exitosamente', 'success');
      setIsNewPoModalOpen(false);
      setEditingPoId(null);
      setNewPoForm({ po_number: '', customer: '', exporter: '', execution_date: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '', lots: [{ variety: '', process: '', volume_kg: '' }] });
      fetchPOs();
    }
  };

  const handleSync = async (e: React.MouseEvent, poId: string) => {
    e.stopPropagation(); // Prevenir navegacion a Evidence Dashboard

    const currentPo = posData.find(p => p.id === poId);
    if (!currentPo) return;

    if (!currentPo.sheetUrl) {
      // Abrir modal personalizado en vez de window.prompt
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
    
    // Guardar URL en localStorage para que persista entre recargas
    localStorage.setItem(`sheet_url_${poId}`, sheetId);
    // Guardar URL en el estado y cerrar modal
    setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: sheetId } : p));
    setLinkModal(null);
    // Ejecutar sincronización
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
        // Clear broken URL so the user can try again
        setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: '' } : p));
      }
    } catch (err) {
      showToast('Error de conexión al sincronizar', 'error');
      // Clear broken URL so the user can try again
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
    <div className="min-h-screen bg-[#020814] flex flex-col" style={{ fontFamily: "var(--font-montserrat, 'Montserrat', sans-serif)" }}>
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-[#0f1e38]">
        <div className="flex items-center gap-6">
          <img 
            src="/logo-axisone.png" 
            alt="AxisONE Logo" 
            className="h-8 object-contain"
            style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} 
          />
          <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
          <span className="font-bold text-white uppercase text-[11px] tracking-widest bg-white/5 rounded-full px-3 py-1 border border-white/10">
            Admin Hub
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search Orders..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#020814] border border-white/10 text-white text-xs rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-[#00C87A]"
            />
          </div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#00C87A]/20 border border-[#00C87A]/50 text-[#00C87A] flex items-center justify-center font-bold text-xs group-hover:bg-[#00C87A] group-hover:text-[#0f1e38] transition-colors">
              AD
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-white text-[11px] leading-tight font-bold group-hover:text-[#00C87A] transition-colors">Admin User</p>
              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 leading-tight">Global Manager</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-rose-400 transition-colors ml-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light text-white tracking-tight mb-2">Global Operations</h1>
              <p className="text-sm text-slate-400 font-medium">Manage and track all commercial blend purchase orders.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setEditingPoId(null); setNewPoForm({ po_number: '', customer: '', exporter: '', execution_date: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '', lots: [{ variety: '', process: '', volume_kg: '' }] }); setIsNewPoModalOpen(true); }}
                className="flex items-center gap-2 bg-[#00C87A] hover:bg-[#00df88] text-[#0f1e38] px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg"
              >
                <Package className="w-4 h-4" /> New Purchase Order
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPOs.map((po) => {
              const progress = Math.round((po.consolidated / po.volume) * 100);
              const isCompleted = po.status === 'COMPLETED';
              
              return (
                <div 
                  key={po.id}
                  onClick={() => router.push(`/commercial/evidence?po=${po.id}`)}
                  className="group relative bg-[#0f1e38] rounded-3xl p-6 border border-white/10 hover:border-[#00C87A]/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl flex flex-col justify-between min-h-[280px]"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purchase Order</p>
                      <h3 className="text-xl font-bold text-white tracking-tight">{po.id}</h3>
                    </div>
                    <div className="flex items-center gap-2">
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
                              lots: po.lots && po.lots.length > 0 ? po.lots : [{ variety: '', process: '', volume_kg: '' }]
                            });
                            setIsNewPoModalOpen(true);
                          }}
                          className="p-2 rounded-full border bg-transparent border-white/20 text-white/50 hover:border-[#00C87A] hover:text-[#00C87A] transition-all"
                          title="Editar PO"
                        >
                          <Pen className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => handleSync(e, po.id)}
                          disabled={syncingPoId === po.id}
                          className={`p-2 rounded-full border transition-all ${po.sheetUrl ? 'bg-[#00C87A]/10 border-[#00C87A]/30 text-[#00C87A] hover:bg-[#00C87A] hover:text-[#0f1e38]' : 'bg-transparent border-white/20 text-white/50 hover:border-[#00C87A] hover:text-[#00C87A]'} disabled:opacity-50`}
                          title={po.sheetUrl ? "Sincronizar (URL guardada)" : "Vincular Google Sheet"}
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingPoId === po.id ? 'animate-spin' : ''}`} />
                        </button>
                        <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${isCompleted ? 'bg-[#00C87A]/10 text-[#00C87A] border-[#00C87A]/30' : 'bg-amber-400/10 text-amber-400 border-amber-400/30'}`}>
                        {po.status}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-4 mb-6 flex-1">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Customer</p>
                      <p className="text-sm text-slate-300 font-medium">{po.buyer}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Origin</p>
                        <p className="text-sm text-white font-bold">{po.origin}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Ship className="w-3 h-3" /> Dest</p>
                        <p className="text-sm text-white font-bold">{po.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer (Progress & EUDR) */}
                  <div className="pt-4 border-t border-white/10 mt-auto">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volume Consolidating</p>
                        <p className="text-xs text-white font-mono">{po.consolidated.toLocaleString()} / {po.volume.toLocaleString()} kg</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-[#00C87A]">{progress}%</span>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Consolidated</p>
                      </div>
                    </div>
                    
                    {/* Varietals Breakdown in Hub Card */}
                    {po.lots && Array.isArray(po.lots) && po.lots.length > 0 && po.lots[0].variety && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                        {po.lots.map((lot: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lot.variety} <span className="opacity-50 font-normal capitalize">({lot.process})</span></span>
                            <span className="text-[10px] text-white font-bold bg-white/5 px-2 py-0.5 rounded">{lot.volume_kg} kg</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#020814] rounded-full overflow-hidden mb-4 border border-white/5 mt-5">
                      <div className="h-full bg-[#00C87A] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
                        <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-500">EUDR:</span>
                        <span className={po.eudr === 'CLEARED' ? 'text-[#00C87A]' : 'text-amber-400'}>{po.eudr}</span>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1 group-hover:text-[#00C87A] transition-colors">
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setLinkModal(null)}
          ></div>
          <div className="relative bg-[#0f1e38] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Vincular Google Sheet</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Ingresa el enlace de Google Sheets de la cooperativa para la orden <strong className="text-white">{linkModal.poId}</strong>.
            </p>
            
            <input 
              type="text" 
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00C87A] transition-colors mb-6"
              autoFocus
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setLinkModal(null)}
                className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={submitLinkModal}
                disabled={!linkInput.trim()}
                className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#00C87A] text-[#0f1e38] hover:bg-[#00df88] transition-colors disabled:opacity-50"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewPoModalOpen(false)}></div>
          <div className="relative bg-[#0f1e38] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingPoId ? "Edit Purchase Order" : "Create New Purchase Order"}</h3>
              <button onClick={() => setIsNewPoModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* PO Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">PO Code</label>
                <input type="text" value={newPoForm.po_number} onChange={e => setNewPoForm({...newPoForm, po_number: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="PO-2026-08-001" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Execution Date</label>
                <input type="date" value={newPoForm.execution_date || ''} onChange={e => setNewPoForm({...newPoForm, execution_date: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" />
              </div>
            </div>

            {/* Exporter & Customer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Customer (Importer)</label>
                <input type="text" value={newPoForm.customer} onChange={e => setNewPoForm({...newPoForm, customer: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="European Coffee Roasters Ltd." />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Exporter</label>
                <input type="text" value={newPoForm.exporter} onChange={e => setNewPoForm({...newPoForm, exporter: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Cooperativa de Caficultores..." />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Origin</label>
                <input type="text" value={newPoForm.origin} onChange={e => setNewPoForm({...newPoForm, origin: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Colombia" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Destination</label>
                <input type="text" value={newPoForm.destination} onChange={e => setNewPoForm({...newPoForm, destination: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Hamburg, Germany" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-[#00C87A] uppercase tracking-widest font-bold mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> Google Sheet URL</label>
                <input type="text" value={newPoForm.sheet_url} onChange={e => setNewPoForm({...newPoForm, sheet_url: e.target.value})} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full bg-[#020814] border border-[#00C87A]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" />
              </div>
            </div>

            {/* Lots Separator */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Varietals / Lots</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Lots List */}
            <div className="space-y-3 mb-4">
              {newPoForm.lots && newPoForm.lots.map((lot: any, idx: number) => (
                <div key={idx} className="grid grid-cols-3 gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Variety</label>
                    <select value={lot.variety} onChange={e => { const lots = [...newPoForm.lots]; lots[idx].variety = e.target.value; setNewPoForm({...newPoForm, lots}); }} className="w-full bg-[#020814] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00C87A]">
                      <option value="">Select...</option>
                      <option>Castillo</option><option>Caturra</option><option>Colombia</option>
                      <option>Pink Bourbon</option><option>Yellow Bourbon</option><option>Red Bourbon</option>
                      <option>Geisha</option><option>Sidra</option><option>Tabi</option>
                      <option>Typica</option><option>Sudan Rume</option><option>F6</option>
                      <option>Catimor</option><option>Commercial Blend</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Process</label>
                    <select value={lot.process} onChange={e => { const lots = [...newPoForm.lots]; lots[idx].process = e.target.value; setNewPoForm({...newPoForm, lots}); }} className="w-full bg-[#020814] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00C87A]">
                      <option value="">Select...</option>
                      <option>Washed</option><option>Natural</option><option>Honey</option>
                      <option>Anaerobic Natural</option><option>Anaerobic Washed</option>
                      <option>Carbonic Maceration</option><option>Lactic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 block">Kg</label>
                    <div className="flex gap-2">
                      <input type="number" value={lot.volume_kg} onChange={e => { const lots = [...newPoForm.lots]; lots[idx].volume_kg = e.target.value; setNewPoForm({...newPoForm, lots}); }} className="w-full bg-[#020814] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00C87A]" placeholder="200" />
                      <button type="button" onClick={() => { const lots = newPoForm.lots.filter((_: any, i: number) => i !== idx); setNewPoForm({...newPoForm, lots}); }} className="text-red-400 hover:text-red-300 px-2">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setNewPoForm({...newPoForm, lots: [...(newPoForm.lots || []), { variety: '', process: '', volume_kg: '' }]})} className="w-full border border-dashed border-white/20 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:border-[#00C87A] hover:text-[#00C87A] transition-all">
              + Add Lot
            </button>
            
            <div className="flex gap-3 justify-end mt-8 border-t border-white/10 pt-6">
              <button onClick={() => setIsNewPoModalOpen(false)} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSavePo} className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-[#00C87A] text-[#0f1e38] hover:bg-[#00df88] transition-colors shadow-lg">{editingPoId ? "Save Changes" : "Save & Create Order"}</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-[#00C87A] text-[#0f1e38]' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
