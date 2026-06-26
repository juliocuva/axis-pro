const fs = require('fs');

let file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove all green vertical bars next to labels.
content = content.replace(/<span className=\"w-1(?:\.5)? h-[^\"]*bg-brand-green[^\"]*><\/span>\s*/g, '');

// 2. Remove "Main Origin Data" title (and its parent div/h3 if we can)
content = content.replace(/<h3 className=\"text-brand-navy font-bold flex items-center gap-2 mb-4 uppercase\">\s*Main Origin Data\s*<\/h3>/, '');

// 3. Remove "COMMERCIALIZATION & EXPORT REQUIREMENTS" title
content = content.replace(/<h3 className=\"text-brand-navy font-bold flex items-center gap-2 mb-4 uppercase\">\s*Commercialization & Export Requirements\s*<\/h3>/i, '');

// 4. Remove "PROCESSING: FARMER DATA" and "MINIMUM FIELD"
content = content.replace(/<div className=\"flex justify-between items-center mb-4\">\s*<h3 className=\"text-\[10px\] font-bold text-brand-navy\/60 uppercase tracking-\[0\.2em\] mb-4 border-b border-brand-navy\/30 pb-2\">\s*PROCESSING: FARMER DATA\s*<\/h3>\s*<span className=\"px-3 py-1 bg-white text-brand-navy text-\[11px\] font-bold uppercase rounded-full border border-gray-400 shadow-sm\">MINIMUM FIELD<\/span>\s*<\/div>/, '');

// 5. Fix alignment of the 3 fields in Processing:
// DETECTED BASE PROCESS
content = content.replace(/<div className=\"md:col-span-2\">\s*<label className=\"text-\[9px\] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1\.5\">\s*DETECTED BASE PROCESS/, '<div>\n                                  <label className=\"text-[9px] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1.5\">\n                                      DETECTED BASE PROCESS');
// FERMENTATION STYLE
content = content.replace(/<div className=\"flex flex-col md:col-span-3\">\s*<label className=\"text-\[9px\] font-bold text-brand-navy uppercase tracking-widest block\">FERMENTATION STYLE \/ VARIATION<\/label>/, '<div>\n                                  <label className=\"text-[9px] font-bold text-brand-navy uppercase tracking-widest block\">FERMENTATION STYLE / VARIATION</label>');

// 6. Fix BACK button to be a pill like NEXT
content = content.replace(/className=\"px-6 py-2\.5 border border-gray-400 shadow-sm text-brand-navy bg-white rounded-md font-bold uppercase text-\[11px\] hover:bg-gray-50 transition-colors disabled:opacity-50\"/g, 
  'className=\"px-6 py-3 border border-brand-navy text-brand-navy bg-transparent rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-brand-navy/5 hover:scale-105 transition-all disabled:opacity-50\"');

// 7. Fix NEXT button (it might be a pill but let's check what it was before)
// In the current HEAD it might be different. Let's make sure NEXT is a solid pill.
content = content.replace(/className=\"px-6 py-2\.5 bg-brand-navy text-white rounded-md font-bold uppercase text-\[11px\] hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2 group shadow-sm\"/g,
  'className=\"px-6 py-3 bg-brand-navy text-white rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-brand-navy/90 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2 group shadow-sm\"');

// 8. Fix GUARDAR DATOS button to be a pill
content = content.replace(/className=\{\`w-full font-bold py-2\.5 rounded-industrial-sm transition-all flex items-center justify-center gap-2 group uppercase text-\[11px\] shadow-sm bg-brand-green text-white hover:bg-opacity-90 disabled:opacity-50 border border-brand-green\`\}/g,
  'className={`w-full font-bold py-3 rounded-full transition-all flex items-center justify-center gap-2 group uppercase text-[10px] tracking-widest shadow-sm bg-brand-green text-white hover:bg-brand-green/90 hover:scale-[1.02] disabled:opacity-50 border border-transparent`}');

// 9. Fix inputs to be minimalist and have a "defined tone"
// Find common input classes and replace with the clean one
content = content.replace(/className=\"w-full border-b border-brand-navy\/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-medium text-brand-navy bg-transparent text-sm placeholder-gray-400 placeholder:font-light\"/g,
  'className=\"w-full border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green outline-none transition-all font-medium text-brand-navy bg-transparent text-xs placeholder-gray-400 placeholder:font-light\"');

content = content.replace(/className=\"w-full border-b border-brand-navy\/30 px-0 py-2 focus:border-brand-green bg-transparent text-sm font-medium text-gray-400 outline-none cursor-pointer\"/g,
  'className=\"w-full border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green bg-transparent text-xs font-medium text-brand-navy outline-none cursor-pointer\"');

content = content.replace(/className=\"w-full border-b border-brand-navy\/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent text-sm placeholder-gray-400 placeholder:font-light\"/g,
  'className=\"w-full border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green outline-none transition-all font-medium text-brand-navy bg-transparent text-xs placeholder-gray-400 placeholder:font-light\"');

content = content.replace(/className=\"w-full border-b border-brand-navy\/30 px-0 py-2 focus:border-brand-green bg-transparent text-sm font-bold text-brand-navy outline-none appearance-none bg-\[url/g,
  'className=\"w-full border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green bg-transparent text-xs font-medium text-brand-navy outline-none appearance-none bg-[url');

// Fix the trailing classes for selects
content = content.replace(/bg-no-repeat font-bold text-brand-navy text-sm uppercase/g, 'bg-no-repeat font-medium text-brand-navy text-xs uppercase');

// 10. Fix Encodings
content = content.replace(/Max Temp \(\?C\)/g, 'Max Temp (°C)');
content = content.replace(/unit=\"\?Bx\"/g, 'unit=\"°Bx\"');

// Fix NumericInput.tsx
let numInputFile = 'src/shared/components/ui/NumericInput.tsx';
let numInput = fs.readFileSync(numInputFile, 'utf8');
numInput = numInput.replace(/text-sm font-bold/g, 'text-xs font-medium text-brand-navy h-[30px] px-0 py-2');
numInput = numInput.replace(/font-light text-brand-navy\/70/g, 'font-medium text-brand-navy');
fs.writeFileSync(numInputFile, numInput, 'utf8');

fs.writeFileSync(file, content, 'utf8');
console.log('Restored the correct styling and implemented Step 3 layout!');
