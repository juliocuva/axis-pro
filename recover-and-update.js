const fs = require('fs');

let numInputFile = 'src/shared/components/ui/NumericInput.tsx';
let numInput = fs.readFileSync(numInputFile, 'utf8');
numInput = numInput.replace(/text-sm font-bold/g, 'text-xs font-medium text-brand-navy h-[30px] px-0 py-2');
numInput = numInput.replace(/font-light text-brand-navy\/70/g, 'font-medium text-brand-navy');
fs.writeFileSync(numInputFile, numInput, 'utf8');

let formFile = 'src/modules/supply/components/PurchaseForm.tsx';
let form = fs.readFileSync(formFile, 'utf8');

// BACK button
form = form.replace(/className=\"px-6 py-2\.5 border border-gray-400 shadow-sm text-brand-navy bg-white rounded-md font-bold uppercase text-\[11px\] hover:bg-gray-50 transition-colors disabled:opacity-50\"/g, 
  'className=\"px-6 py-3 border border-brand-navy text-brand-navy bg-transparent rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-brand-navy/5 hover:scale-105 transition-all disabled:opacity-50\"');

// GUARDAR DATOS button
form = form.replace(/className=\{\`w-full font-bold py-2\.5 rounded-industrial-sm transition-all flex items-center justify-center gap-2 group uppercase text-\[11px\] shadow-sm bg-brand-green text-white hover:bg-opacity-90 disabled:opacity-50 border border-brand-green\`\}/g,
  'className={`w-full font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 group uppercase text-[10px] tracking-widest shadow-sm bg-brand-green text-white hover:bg-brand-green/90 hover:scale-[1.02] disabled:opacity-50 border border-transparent`}');

// Encodings
form = form.replace(/ÃƒÂ‚Ã‚Â°C/g, '°C');
form = form.replace(/ÃƒÂ‚Ã‚Â°Bx/g, '°Bx');

// Height enforcement on px-0 py-2
form = form.replace(/px-0 py-2(?! h-\[30px\])/g, 'px-0 py-2 h-[30px]');

// Tono definido
form = form.replace(/font-light text-brand-navy\/70/g, 'font-medium text-brand-navy');
form = form.replace(/font-light text-gray-400 outline-none cursor-pointer text-xs/g, 'font-medium text-brand-navy outline-none cursor-pointer text-xs');
// Replace bold with medium in selects
form = form.replace(/font-bold text-brand-navy outline-none appearance-none bg-\[url/g, 'font-medium text-brand-navy outline-none appearance-none bg-[url');
form = form.replace(/bg-no-repeat font-bold text-brand-navy text-xs uppercase/g, 'bg-no-repeat font-medium text-brand-navy text-xs uppercase');

// NEW USER REQUEST: Remove title, badge, and fix grid
form = form.replace(/<div className=\"flex justify-between items-center mb-4\">\s*<h3 className=\"text-\[10px\] font-bold text-brand-navy\/60 uppercase tracking-\[0\.2em\] mb-4 border-b border-brand-navy\/30 pb-2\">\s*PROCESSING: FARMER DATA\s*<\/h3>\s*<span className=\"px-3 py-1 bg-white text-brand-navy text-\[11px\] font-bold uppercase rounded-full border border-gray-400 shadow-sm\">MINIMUM FIELD<\/span>\s*<\/div>/, '');

// Convert md:col-span-2 to normal div
form = form.replace(/<div className=\"md:col-span-2\">\s*<label className=\"text-\[9px\] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1\.5\">\s*DETECTED BASE PROCESS/, '<div>\n                                  <label className=\"text-[9px] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1.5\">\n                                      DETECTED BASE PROCESS');

// Convert flex flex-col md:col-span-3 to normal div
form = form.replace(/<div className=\"flex flex-col md:col-span-3\">\s*<label className=\"text-\[9px\] font-bold text-brand-navy uppercase tracking-widest block\">FERMENTATION STYLE \/ VARIATION<\/label>/, '<div>\n                                  <label className=\"text-[9px] font-bold text-brand-navy uppercase tracking-widest block\">FERMENTATION STYLE / VARIATION</label>');

fs.writeFileSync(formFile, form, 'utf8');
