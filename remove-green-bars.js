const fs = require('fs');

let file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove ALL decorative vertical green bars
content = content.replace(/<span className=\"w-[^\"]*bg-brand-green rounded-full\"><\/span>\s*/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Removed all decorative green bars!');
