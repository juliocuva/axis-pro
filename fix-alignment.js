const fs = require('fs');
const file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the Total Paid Value label to match the text-[9px] tracking-widest style
content = content.replace(/<label className="text-\[11px\] font-bold text-brand-navy uppercase block">Total Paid Value<\/label>/g, '<label className="text-[9px] font-bold text-brand-navy uppercase tracking-widest block">Total Paid Value</label>');

// Fix the Total Paid Value wrapper to not break alignment (by using absolute positioning for the badge to not affect height)
// Currently:
// <div className="flex justify-between items-center">
//     <label className="text-[9px] font-bold text-brand-navy uppercase tracking-widest block">Total Paid Value</label>
//     <span className="text-[7px] bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-bold uppercase border border-brand-green/20 shadow-sm">Fair Trade</span>
// </div>
content = content.replace(/<div className="flex justify-between items-center">\s*<label className="text-\[9px\] font-bold text-brand-navy uppercase tracking-widest block">Total Paid Value<\/label>\s*<span className="(.*?)">Fair Trade<\/span>\s*<\/div>/g, 
'<div className="relative">\n<label className="text-[9px] font-bold text-brand-navy uppercase tracking-widest block">Total Paid Value</label>\n<span className="absolute right-0 bottom-1 $1">Fair Trade</span>\n</div>');

// The date input above also had `text-sm`, change to `text-xs`
content = content.replace(/<input\s*type="text"\s*inputMode="decimal"\s*required\s*value=\{displayWeight\}\s*onChange=\{handleWeightChange\}\s*placeholder="0"\s*disabled=\{isSubmitting\}\s*className="w-full border-b border-brand-navy\/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent text-sm placeholder-gray-400 placeholder:font-light uppercase"/g, 
'<input type="text" inputMode="decimal" required value={displayWeight} onChange={handleWeightChange} placeholder="0" disabled={isSubmitting} className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent text-xs placeholder-gray-400 placeholder:font-light uppercase"');

content = content.replace(/<input\s*type="text"\s*value=\{displayValue\}\s*onChange=\{handleValueChange\}\s*className="w-full border-b border-brand-navy\/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent text-sm placeholder-gray-400 placeholder:font-light uppercase"/g, 
'<input type="text" value={displayValue} onChange={handleValueChange} className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent text-xs placeholder-gray-400 placeholder:font-light uppercase"');

// While we are at it, let's make sure ALL text-sm inputs in PurchaseForm are changed to text-xs, since they said the texts are large compared to the others
content = content.replace(/bg-transparent text-sm/g, 'bg-transparent text-xs');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed alignment and font sizes.');
