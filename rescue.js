const fs = require('fs');

let file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove all decorative vertical green bars (Empty spans with bg-brand-green)
content = content.replace(/<span[^>]*bg-brand-green[^>]*><\/span>\s*/g, '');

// 2. Remove "Main Origin Data" title
content = content.replace(/<h3[^>]*>\s*Main Origin Data\s*<\/h3>/gi, '');

// 3. Remove "Commercialization & Export Requirements" title
content = content.replace(/<h3[^>]*>\s*Commercialization & Export Requirements\s*<\/h3>/gi, '');

// 4. Remove "PROCESSING: FARMER DATA" title and "MINIMUM FIELD" badge
content = content.replace(/<div className=\"flex justify-between items-center mb-4\">\s*<h3[^>]*>[\s\S]*?PROCESSING: FARMER DATA[\s\S]*?<\/h3>\s*<span[^>]*>MINIMUM FIELD<\/span>\s*<\/div>/gi, '');

// 5. Fix grid alignment in Processing section (put the 3 fields in one line)
content = content.replace(/<div className="md:col-span-2">(\s*<label[^>]*>[\s\S]*?DETECTED BASE PROCESS)/, '<div>$1');
content = content.replace(/<div className="flex flex-col md:col-span-3">(\s*<label[^>]*>FERMENTATION STYLE)/, '<div>$1');

// 6. Fix input field styles (revert back to minimalist border-b style globally)
content = content.replace(/bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 py-1\.5( mt-0\.5)? focus:border-black outline-none text-brand-navy font-bold( uppercase text-xs| text-xs)?/g, 'border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light');

// 7. Fix select field styles (minimalist border-b)
content = content.replace(/bg-white border border-gray-400 shadow-sm rounded-industrial-sm pl-[^ ]* pr-[^ ]* py-1\.5 h-\[30px\] focus:border-black outline-none appearance-none bg-\[url/g, 'border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green bg-transparent font-medium text-brand-navy text-xs outline-none appearance-none bg-[url');

// 8. Fix the BACK button style (pill, minimal)
content = content.replace(/className=\"px-6 py-2\.5 border border-gray-400 shadow-sm text-brand-navy bg-white rounded-industrial-sm font-bold uppercase text-\[11px\] hover:bg-gray-50 transition-colors disabled:opacity-50\"/g, 'className="px-6 py-3 border border-brand-navy text-brand-navy bg-transparent rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-brand-navy/5 hover:scale-105 transition-all disabled:opacity-50"');

// 9. Fix the NEXT button style (pill)
content = content.replace(/className=\"px-6 py-2\.5 bg-white text-brand-navy border border-gray-400 shadow-sm rounded-industrial-sm font-bold uppercase text-\[11px\] hover:bg-gray-50 transition-colors flex items-center gap-2\"/g, 'className="px-6 py-3 bg-brand-navy text-white rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-brand-navy/90 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"');

// 10. Fix the GUARDAR DATOS button style (pill)
content = content.replace(/className=\{\`w-full font-bold py-2\.5 rounded-industrial-sm transition-all flex items-center justify-center gap-2 group uppercase text-\[11px\] shadow-sm bg-brand-green text-white hover:bg-opacity-90 disabled:opacity-50 border border-brand-green\`\}/g, 'className={`w-full font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 group uppercase text-[10px] tracking-widest shadow-sm bg-brand-green text-white hover:bg-brand-green/90 hover:scale-[1.02] disabled:opacity-50 border border-transparent`}');

// 11. Fix specific custom classes in processing inputs (like readonly boxes)
content = content.replace(/bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 flex items-center justify-between shadow-inner/g, 'border-b border-brand-navy/30 px-0 flex items-center justify-between bg-transparent');

fs.writeFileSync(file, content, 'utf8');

// Fix NumericInput.tsx
let numInputFile = 'src/shared/components/ui/NumericInput.tsx';
let numContent = fs.readFileSync(numInputFile, 'utf8');
numContent = numContent.replace(/text-sm font-bold/g, 'text-xs font-medium text-brand-navy h-[30px] px-0 py-2');
numContent = numContent.replace(/font-light text-brand-navy\/70/g, 'font-medium text-brand-navy');
fs.writeFileSync(numInputFile, numContent, 'utf8');

console.log('✅ RECOVERY COMPLETE: Green bars removed, layouts fixed, minimal style restored.');
