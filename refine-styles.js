const fs = require('fs');
const file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the title Commercialization & Export Requirements
content = content.replace(/<h3 className="text-\[10px\] font-bold text-brand-navy\/60 uppercase tracking-\[0\.2em\] mb-4 border-b border-brand-navy\/30 pb-2">[\s\S]*?Commercialization & Export Requirements[\s\S]*?<\/h3>/g, '');

// 2. Remove mb-1 from farmSize wrapper to fix alignment
content = content.replace(/<div className="flex justify-between items-end mb-1">/g, '<div className="flex justify-between">');
content = content.replace(/<div className="flex justify-between items-center mb-1">/g, '<div className="flex justify-between items-center">');

// 3. Update the toggle buttons active styling (Parchment, Green Coffee, etc.)
content = content.replace(/'bg-brand-green border-brand-green text-brand-navy shadow-sm'/g, "'bg-brand-green/10 border-brand-green/30 text-brand-green shadow-sm'");

// 4. Update the input/select styling: change text-sm to text-xs, and for dates make it text-brand-navy/70
// General text-sm inputs/selects -> text-xs
content = content.replace(/text-sm font-bold text-brand-navy/g, 'text-xs font-bold text-brand-navy');
// The date input specifically has `bg-transparent text-xs font-bold text-brand-navy outline-none cursor-pointer`, let's make it more transparent
content = content.replace(/bg-transparent text-xs font-bold text-brand-navy outline-none cursor-pointer/g, 'bg-transparent text-xs font-bold text-brand-navy/70 outline-none cursor-pointer');
// Purchase Pack Quantity had `text-xs` but let's make sure it's correct
content = content.replace(/text-xs outline-none font-bold transition-all/g, 'text-xs outline-none font-bold transition-all');

fs.writeFileSync(file, content, 'utf8');
console.log('Styles refined based on feedback.');
