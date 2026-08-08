const fs = require('fs');
const path = 'src/app/hub/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add customer and exporter to form state
c = c.replace(
  `  const [newPoForm, setNewPoForm] = useState({\n    po_number: '',\n    origin: '',\n    destination: '',\n    coffee_type: '',\n    variety: '',\n    process: '',\n    target_volume_kg: '',\n    sheet_url: ''\n  });`,
  `  const [newPoForm, setNewPoForm] = useState({\n    po_number: '',\n    customer: '',\n    exporter: '',\n    origin: '',\n    destination: '',\n    coffee_type: '',\n    variety: '',\n    process: '',\n    target_volume_kg: '',\n    sheet_url: ''\n  });`
);

// 2. Add buyer_name and exporter to fetchPOs mapping
c = c.replace(
  `        id: po.po_number,\n        buyer: po.buyer_name || 'AxisONE Customer',`,
  `        id: po.po_number,\n        buyer: po.buyer_name || 'AxisONE Customer',\n        exporter: po.exporter || '',`
);

// 3. Add buyer_name and exporter to Supabase update
c = c.replace(
  `        const { error: err } = await supabase.from('purchase_orders').update({\n        origin: newPoForm.origin,`,
  `        const { error: err } = await supabase.from('purchase_orders').update({\n        buyer_name: newPoForm.customer,\n        exporter: newPoForm.exporter,\n        origin: newPoForm.origin,`
);

// 4. Add buyer_name and exporter to Supabase insert
c = c.replace(
  `        const { error: err } = await supabase.from('purchase_orders').insert({\n        po_number: newPoForm.po_number,\n        origin: newPoForm.origin,`,
  `        const { error: err } = await supabase.from('purchase_orders').insert({\n        po_number: newPoForm.po_number,\n        buyer_name: newPoForm.customer,\n        exporter: newPoForm.exporter,\n        origin: newPoForm.origin,`
);

// 5. Add to edit button form population
c = c.replace(
  `                              setNewPoForm({\n                                po_number: po.id,\n                                origin: po.origin === 'N/A' ? '' : po.origin,\n                                destination: po.destination === 'N/A' ? '' : po.destination,\n                                coffee_type: po.coffee_type || '',\n                                variety: po.variety || '',\n                                process: po.process || '',\n                                target_volume_kg: po.volume ? String(po.volume) : '',\n                                sheet_url: po.sheetUrl || ''\n                              });`,
  `                              setNewPoForm({\n                                po_number: po.id,\n                                customer: po.buyer || '',\n                                exporter: po.exporter || '',\n                                origin: po.origin === 'N/A' ? '' : po.origin,\n                                destination: po.destination === 'N/A' ? '' : po.destination,\n                                coffee_type: po.coffee_type || '',\n                                variety: po.variety || '',\n                                process: po.process || '',\n                                target_volume_kg: po.volume ? String(po.volume) : '',\n                                sheet_url: po.sheetUrl || ''\n                              });`
);

// 6. Add to form reset (handleSavePo and New button)
c = c.replace(/setNewPoForm\(\{ po_number: '', origin: ''/g, `setNewPoForm({ po_number: '', customer: '', exporter: '', origin: ''`);
c = c.replace(/setNewPoForm\(\{ po_number: "", origin: ""/g, `setNewPoForm({ po_number: "", customer: "", exporter: "", origin: ""`);

// 7. Add Customer and Exporter fields to modal UI (before Origin)
c = c.replace(
  `              <div>\n                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Origin</label>`,
  `              <div>\n                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Customer</label>\n                <input type="text" value={newPoForm.customer} onChange={e => setNewPoForm({...newPoForm, customer: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Cofinet GmbH" />\n              </div>\n              <div>\n                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Exporter</label>\n                <input type="text" value={newPoForm.exporter} onChange={e => setNewPoForm({...newPoForm, exporter: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Cooperativa..." />\n              </div>\n              <div>\n                <label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Origin</label>`
);

fs.writeFileSync(path, c);
console.log('Done');
