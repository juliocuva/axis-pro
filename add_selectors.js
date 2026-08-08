const fs = require('fs');
const path = 'src/app/hub/page.tsx';
let c = fs.readFileSync(path, 'utf8');

const inputStyle = `"w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]"`;

// Replace Variety input with select
c = c.replace(
  `<label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Variety</label>\n                  <input type="text" value={newPoForm.variety} onChange={e => setNewPoForm({...newPoForm, variety: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Castillo / Blend" />`,
  `<label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Variety</label>
                  <select value={newPoForm.variety} onChange={e => setNewPoForm({...newPoForm, variety: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]">
                    <option value="">Select variety...</option>
                    <option>Castillo</option>
                    <option>Caturra</option>
                    <option>Colombia</option>
                    <option>Pink Bourbon</option>
                    <option>Yellow Bourbon</option>
                    <option>Red Bourbon</option>
                    <option>Geisha</option>
                    <option>Sidra</option>
                    <option>Tabi</option>
                    <option>Typica</option>
                    <option>Sudan Rume</option>
                    <option>F6</option>
                    <option>Catimor</option>
                    <option>Commercial Blend</option>
                  </select>`
);

// Replace Process input with select
c = c.replace(
  `<label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Process</label>\n                  <input type="text" value={newPoForm.process} onChange={e => setNewPoForm({...newPoForm, process: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Washed" />`,
  `<label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Process</label>
                  <select value={newPoForm.process} onChange={e => setNewPoForm({...newPoForm, process: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]">
                    <option value="">Select process...</option>
                    <option>Washed</option>
                    <option>Natural</option>
                    <option>Honey</option>
                    <option>Anaerobic Natural</option>
                    <option>Anaerobic Washed</option>
                    <option>Carbonic Maceration</option>
                    <option>Lactic</option>
                  </select>`
);

// Replace Coffee Type input with select
c = c.replace(
  `<label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Coffee Type</label>\n                  <input type="text" value={newPoForm.coffee_type} onChange={e => setNewPoForm({...newPoForm, coffee_type: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]" placeholder="Specialty" />`,
  `<label className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 block">Coffee Type</label>
                  <select value={newPoForm.coffee_type} onChange={e => setNewPoForm({...newPoForm, coffee_type: e.target.value})} className="w-full bg-[#020814] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C87A]">
                    <option value="">Select type...</option>
                    <option>Specialty</option>
                    <option>Commercial</option>
                    <option>Premium</option>
                    <option>Micro-lot</option>
                  </select>`
);

fs.writeFileSync(path, c);
console.log('Done');
