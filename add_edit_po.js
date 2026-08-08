const fs = require('fs');

const path = 'src/app/hub/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Pen to lucide-react imports
content = content.replace(
  /} from 'lucide-react';/,
  ', Pen } from \'lucide-react\';'
);

// 2. Add editingPoId state
content = content.replace(
  'const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);',
  'const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);\n  const [editingPoId, setEditingPoId] = useState<string | null>(null);'
);

// 3. Update fetchPOs mapping
content = content.replace(
  /sheetUrl: po\.sheet_url \|\| ''\n\s*}\)\);/,
  `sheetUrl: po.sheet_url || '',
          coffee_type: po.coffee_type || '',
          variety: po.variety || '',
          process: po.process || ''
        }));`
);

// 4. Update handleCreatePo to handleSavePo
const handleCreateRegex = /const handleCreatePo = async \(\) => \{[\s\S]*?fetchPOs\(\);\n    \}\n  \};/;
const handleSaveStr = `const handleSavePo = async () => {
    if (!newPoForm.po_number || !newPoForm.target_volume_kg) {
      showToast('Por favor completa el código y kilos', 'error');
      return;
    }
    let error;
    if (editingPoId) {
      const { error: err } = await supabase.from('purchase_orders').update({
        po_number: newPoForm.po_number,
        origin: newPoForm.origin,
        destination: newPoForm.destination,
        coffee_type: newPoForm.coffee_type,
        variety: newPoForm.variety,
        process: newPoForm.process,
        target_volume_kg: Number(newPoForm.target_volume_kg),
        sheet_url: newPoForm.sheet_url
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
        target_volume_kg: Number(newPoForm.target_volume_kg),
        sheet_url: newPoForm.sheet_url,
        status: 'IN_PROGRESS'
      });
      error = err;
    }
    
    if (error) {
      showToast('Error al guardar orden: ' + error.message, 'error');
    } else {
      showToast('Orden guardada exitosamente', 'success');
      setIsNewPoModalOpen(false);
      setEditingPoId(null);
      setNewPoForm({ po_number: '', origin: '', destination: '', coffee_type: '', variety: '', process: '', target_volume_kg: '', sheet_url: '' });
      fetchPOs();
    }
  };`;
content = content.replace(handleCreateRegex, handleSaveStr);

// 5. Update New PO button
content = content.replace(
  'onClick={() => setIsNewPoModalOpen(true)}',
  'onClick={() => { setEditingPoId(null); setNewPoForm({ po_number: "", origin: "", destination: "", coffee_type: "", variety: "", process: "", target_volume_kg: "", sheet_url: "" }); setIsNewPoModalOpen(true); }}'
);

// 6. Update modal title & button
content = content.replace(
  '<h3 className="text-xl font-bold text-white">Create New Purchase Order</h3>',
  '<h3 className="text-xl font-bold text-white">{editingPoId ? "Edit Purchase Order" : "Create New Purchase Order"}</h3>'
);
content = content.replace(
  '<button onClick={handleCreatePo}',
  '<button onClick={handleSavePo}'
);
content = content.replace(
  'Save & Create Order</button>',
  '{editingPoId ? "Save Changes" : "Save & Create Order"}</button>'
);

// 7. Add Edit button next to Sync button
const syncBtn = `<button 
                          onClick={(e) => handleSync(e, po.id)}`;
const editBtn = `<button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPoId(po.id);
                            setNewPoForm({
                              po_number: po.id,
                              origin: po.origin === 'N/A' ? '' : po.origin,
                              destination: po.destination === 'N/A' ? '' : po.destination,
                              coffee_type: po.coffee_type || '',
                              variety: po.variety || '',
                              process: po.process || '',
                              target_volume_kg: po.volume ? String(po.volume) : '',
                              sheet_url: po.sheetUrl || ''
                            });
                            setIsNewPoModalOpen(true);
                          }}
                          className="p-2 rounded-full border bg-transparent border-white/20 text-white/50 hover:border-[#00C87A] hover:text-[#00C87A] transition-all"
                          title="Editar PO"
                        >
                          <Pen className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => handleSync(e, po.id)}`;
content = content.replace(syncBtn, editBtn);

fs.writeFileSync(path, content);
console.log('Added Edit PO button');
