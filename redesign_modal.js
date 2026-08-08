const fs = require('fs');
const path = 'src/app/hub/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix TypeScript error: add customer and exporter to edit button form population
c = c.replace(
`                            setNewPoForm({
                              po_number: po.id,
                              origin: po.origin === 'N/A' ? '' : po.origin,
                              destination: po.destination === 'N/A' ? '' : po.destination,
                              coffee_type: po.coffee_type || '',
                              variety: po.variety || '',
                              process: po.process || '',
                              target_volume_kg: po.volume ? String(po.volume) : '',
                              sheet_url: po.sheetUrl || ''
                            });`,
`                            setNewPoForm({
                              po_number: po.id,
                              customer: po.buyer || '',
                              exporter: po.exporter || '',
                              origin: po.origin === 'N/A' ? '' : po.origin,
                              destination: po.destination === 'N/A' ? '' : po.destination,
                              coffee_type: po.coffee_type || '',
                              variety: po.variety || '',
                              process: po.process || '',
                              target_volume_kg: po.volume ? String(po.volume) : '',
                              sheet_url: po.sheetUrl || ''
                            });`
);

// Now replace the entire modal content with the redesigned version
const oldModal = `          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">PO Code (e.g. PO-...)</label>
                <input type="text" value={newPoForm.po_number} onChange={e => setNewPoForm({...newPoForm, po_number: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="PO-2026-08-001" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Target Kilos (Volume)</label>
                <input type="number" value={newPoForm.target_volume_kg} onChange={e => setNewPoForm({...newPoForm, target_volume_kg: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="20000" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Customer</label>
                <input type="text" value={newPoForm.customer} onChange={e => setNewPoForm({...newPoForm, customer: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Cofinet GmbH" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Exporter</label>
                <input type="text" value={newPoForm.exporter} onChange={e => setNewPoForm({...newPoForm, exporter: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Cooperativa..." />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Origin</label>
                <input type="text" value={newPoForm.origin} onChange={e => setNewPoForm({...newPoForm, origin: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Colombia" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Destination</label>
                <input type="text" value={newPoForm.destination} onChange={e => setNewPoForm({...newPoForm, destination: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Hamburg, Germany" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Coffee Type</label>
                <input type="text" value={newPoForm.coffee_type} onChange={e => setNewPoForm({...newPoForm, coffee_type: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Specialty" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Variety</label>
                <input type="text" value={newPoForm.variety} onChange={e => setNewPoForm({...newPoForm, variety: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Castillo / Blend" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Process</label>
                <input type="text" value={newPoForm.process} onChange={e => setNewPoForm({...newPoForm, process: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Washed" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-[#00C87A] uppercase tracking-widest font-bold mb-1 block flex items-center gap-1"><FileText className="w-3 h-3" /> Google Sheet URL</label>
                <input type="text" value={newPoForm.sheet_url} onChange={e => setNewPoForm({...newPoForm, sheet_url: e.target.value})} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full bg-[#020814] border border-[#00C87A]/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" />
                <p className="text-[10px] text-slate-500 mt-1">This sheet will be used when you click Sync Data.</p>
              </div>
            </div>`;

const newModal = `          {/* PO Header Info */}
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
            </button>`;

c = c.replace(oldModal, newModal);

// Also add execution_date and lots to form state
c = c.replace(
  `  const [newPoForm, setNewPoForm] = useState({\n    po_number: '',\n    customer: '',\n    exporter: '',\n    origin: '',\n    destination: '',\n    coffee_type: '',\n    variety: '',\n    process: '',\n    target_volume_kg: '',\n    sheet_url: ''\n  });`,
  `  const [newPoForm, setNewPoForm] = useState<any>({\n    po_number: '',\n    customer: '',\n    exporter: '',\n    execution_date: '',\n    origin: '',\n    destination: '',\n    coffee_type: '',\n    variety: '',\n    process: '',\n    target_volume_kg: '',\n    sheet_url: '',\n    lots: [{ variety: '', process: '', volume_kg: '' }]\n  });`
);

// Update form resets to include new fields
c = c.replace(
  /setNewPoForm\(\{ po_number: '', customer: '', exporter: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '' \}\)/g,
  `setNewPoForm({ po_number: '', customer: '', exporter: '', execution_date: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '', lots: [{ variety: '', process: '', volume_kg: '' }] })`
);
c = c.replace(
  /setNewPoForm\(\{ po_number: "", customer: "", exporter: "", origin: "", destination: "", coffee_type: "", variety: "", process: "", target_volume_kg: "", sheet_url: "" \}\)/g,
  `setNewPoForm({ po_number: '', customer: '', exporter: '', execution_date: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '', lots: [{ variety: '', process: '', volume_kg: '' }] })`
);

// Compute target_volume_kg from lots sum if not set
const oldSaveLine = `    if (!newPoForm.po_number || !newPoForm.target_volume_kg) {\n      showToast('Por favor completa el código y kilos', 'error');\n      return;\n    }`;
const newSaveLine = `    const lotsTotal = (newPoForm.lots || []).reduce((s: number, l: any) => s + (Number(l.volume_kg) || 0), 0);
    const finalVolume = lotsTotal > 0 ? lotsTotal : Number(newPoForm.target_volume_kg);
    if (!newPoForm.po_number || finalVolume === 0) {
      showToast('Por favor completa el código y agrega al menos un lote con kilos', 'error');
      return;
    }`;
c = c.replace(oldSaveLine, newSaveLine);

// Update target_volume_kg in update and insert to use finalVolume
c = c.replace(
  `        target_volume_kg: Number(newPoForm.target_volume_kg),\n        sheet_url: newPoForm.sheet_url || null\n      }).eq('po_number', editingPoId);`,
  `        target_volume_kg: finalVolume,\n        sheet_url: newPoForm.sheet_url || null\n      }).eq('po_number', editingPoId);`
);
c = c.replace(
  `        target_volume_kg: Number(newPoForm.target_volume_kg),\n        sheet_url: newPoForm.sheet_url || null,\n        status: 'IN_PROGRESS'`,
  `        target_volume_kg: finalVolume,\n        sheet_url: newPoForm.sheet_url || null,\n        status: 'IN_PROGRESS'`
);

fs.writeFileSync(path, c);
console.log('Done');
