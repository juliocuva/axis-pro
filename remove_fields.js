const fs = require('fs');

const path = 'src/app/hub/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove fields from update
content = content.replace(
  `        const { error: err } = await supabase.from('purchase_orders').update({
          po_number: newPoForm.po_number,
          origin: newPoForm.origin,
          destination: newPoForm.destination,
          coffee_type: newPoForm.coffee_type,
          variety: newPoForm.variety,
          process: newPoForm.process,
          target_volume_kg: Number(newPoForm.target_volume_kg),
          sheet_url: newPoForm.sheet_url
        }).eq('po_number', editingPoId);`,
  `        const { error: err } = await supabase.from('purchase_orders').update({
          po_number: newPoForm.po_number,
          origin: newPoForm.origin,
          destination: newPoForm.destination,
          target_volume_kg: Number(newPoForm.target_volume_kg)
        }).eq('po_number', editingPoId);`
);

// 2. Remove fields from insert
content = content.replace(
  `        const { error: err } = await supabase.from('purchase_orders').insert({
          po_number: newPoForm.po_number,
          origin: newPoForm.origin,
          destination: newPoForm.destination,
          coffee_type: newPoForm.coffee_type,
          variety: newPoForm.variety,
          process: newPoForm.process,
          target_volume_kg: Number(newPoForm.target_volume_kg),
          sheet_url: newPoForm.sheet_url,
          status: 'IN_PROGRESS'
        });`,
  `        const { error: err } = await supabase.from('purchase_orders').insert({
          po_number: newPoForm.po_number,
          origin: newPoForm.origin,
          destination: newPoForm.destination,
          target_volume_kg: Number(newPoForm.target_volume_kg),
          status: 'IN_PROGRESS'
        });`
);

// 3. Remove supabase.update for sheet_url in submitLinkModal
const submitModalCode = `    const submitLinkModal = async () => {
      if (!linkModal || !linkInput.trim()) return;
      const poId = linkModal.poId;
      const sheetId = linkInput.trim();
      
      // Guardar URL en Supabase
      await supabase
        .from('purchase_orders')
        .update({ sheet_url: sheetId })
        .eq('po_number', poId);
      
      // Guardar URL temporalmente en el estado y cerrar modal
      setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: sheetId } : p));
      setLinkModal(null);
      
      // Ejecutar sincronización con la nueva URL
      await executeSync(poId, sheetId);
    };`;

const newSubmitModalCode = `    const submitLinkModal = async () => {
      if (!linkModal || !linkInput.trim()) return;
      const poId = linkModal.poId;
      const sheetId = linkInput.trim();
      
      // Guardar URL temporalmente en el estado y cerrar modal
      setPosData(prev => prev.map(p => p.id === poId ? { ...p, sheetUrl: sheetId } : p));
      setLinkModal(null);
      
      // Ejecutar sincronización con la nueva URL
      await executeSync(poId, sheetId);
    };`;

content = content.replace(submitModalCode, newSubmitModalCode);

fs.writeFileSync(path, content);
console.log('Removed offending fields from Supabase calls');
