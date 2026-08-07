"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe2, Ship, MapPin, Package, LogOut, FileText, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';

const MOCK_POS = [
  {
    id: 'PO-cofinet-2026-08-001',
    buyer: 'Cofinet Europe',
    destination: 'Hamburg, Germany',
    origin: 'Colombia',
    volume: 20000,
    consolidated: 0,
    status: 'IN PROGRESS',
    eudr: 'CLEARED'
  },
  {
    id: 'PO-2026-08-001',
    buyer: 'European Coffee Roasters Ltd.',
    destination: 'Hamburg, Germany',
    origin: 'Colombia',
    volume: 20000,
    consolidated: 18600,
    status: 'IN PROGRESS',
    eudr: 'CLEARED'
  },
  {
    id: 'PO-2026-08-045',
    buyer: 'Nordic Specialty Imports',
    destination: 'Oslo, Norway',
    origin: 'Brazil',
    volume: 19500,
    consolidated: 19500,
    status: 'COMPLETED',
    eudr: 'CLEARED'
  },
  {
    id: 'PO-2026-09-012',
    buyer: 'Mediterranean Coffee Group',
    destination: 'Istanbul, Turkey',
    origin: 'Peru',
    volume: 38000,
    consolidated: 4000,
    status: 'IN PROGRESS',
    eudr: 'PENDING'
  }
];

export default function AdminHubPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [syncingPoId, setSyncingPoId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [linkModal, setLinkModal] = useState<{ isOpen: boolean, poId: string } | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [posData, setPosData] = useState(MOCK_POS.map(po => ({ ...po, sheetUrl: '' })));

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
    
    // Guardar URL temporalmente en el estado y cerrar modal
    setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: sheetId } : p));
    setLinkModal(null);
    
    // Ejecutar sincronización con la nueva URL
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
              <button className="flex items-center gap-2 bg-[#00C87A] hover:bg-[#00df88] text-[#0f1e38] px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg">
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
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Buyer</p>
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
                        <p className="text-lg font-light text-[#00C87A] leading-none">{progress}%</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#020814] rounded-full overflow-hidden mb-4 border border-white/5">
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
