const fs = require('fs');

const path = 'src/app/hub/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove origin and destination from update
content = content.replace(
  `        const { error: err } = await supabase.from('purchase_orders').update({
          po_number: newPoForm.po_number,
          origin: newPoForm.origin,
          destination: newPoForm.destination,
          target_volume_kg: Number(newPoForm.target_volume_kg)
        }).eq('po_number', editingPoId);`,
  `        const { error: err } = await supabase.from('purchase_orders').update({
          po_number: newPoForm.po_number,
          target_volume_kg: Number(newPoForm.target_volume_kg)
        }).eq('po_number', editingPoId);`
);

// 2. Remove origin and destination from insert
content = content.replace(
  `        const { error: err } = await supabase.from('purchase_orders').insert({
          po_number: newPoForm.po_number,
          origin: newPoForm.origin,
          destination: newPoForm.destination,
          target_volume_kg: Number(newPoForm.target_volume_kg),
          status: 'IN_PROGRESS'
        });`,
  `        const { error: err } = await supabase.from('purchase_orders').insert({
          po_number: newPoForm.po_number,
          target_volume_kg: Number(newPoForm.target_volume_kg),
          status: 'IN_PROGRESS'
        });`
);

fs.writeFileSync(path, content);
console.log('Removed origin and destination from Supabase calls');
