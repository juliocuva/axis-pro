const fs = require('fs');
const file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard input boxes
content = content.replace(/className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 py-1\.5 mt-0\.5 focus:border-black outline-none text-brand-navy font-bold uppercase text-xs"/g, 'className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent text-sm placeholder-gray-400 placeholder:font-light"');

// Replace input with prefix/suffix like farm size
content = content.replace(/className="block w-full bg-white border rounded-industrial-sm px-3 py-1\.5 h-\[30px\] text-xs outline-none font-bold transition-all pr-8 border-gray-400 shadow-sm text-brand-navy focus:border-black placeholder:text-brand-navy\/30 placeholder:font-bold uppercase"/g, 'className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green outline-none transition-all font-bold text-brand-navy bg-transparent text-sm placeholder-gray-400 placeholder:font-light uppercase"');

// Replace select boxes
content = content.replace(/className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm pl-3 pr-8 py-1\.5 h-\[30px\] focus:border-black outline-none appearance-none bg-\[url\('.*?'\)\] bg-\[length:1rem_1rem\] bg-\[position:right_0\.75rem_center\] bg-no-repeat font-bold text-brand-navy text-xs uppercase"/g, 'className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green bg-transparent text-sm font-bold text-brand-navy outline-none appearance-none bg-[url(\'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E\')] bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-no-repeat uppercase"');

// Replace other select boxes with different paddings
content = content.replace(/className="w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 py-1\.5 h-\[30px\] focus:border-black outline-none appearance-none bg-\[url\('.*?'\)\] bg-\[length:1\.25rem_1\.25rem\] bg-\[position:right_0\.5rem_center\] bg-no-repeat font-bold text-xs text-brand-navy uppercase transition-all"/g, 'className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green bg-transparent text-sm font-bold text-brand-navy outline-none appearance-none bg-[url(\'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E\')] bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-no-repeat uppercase"');

// Replace select boxes without background URL
content = content.replace(/className="w-full h-\[30px\] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 text-xs font-bold text-brand-navy outline-none focus:border-black uppercase transition-all shadow-inner"/g, 'className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green bg-transparent text-sm font-bold text-brand-navy outline-none uppercase"');

// Replace textarea
content = content.replace(/className="w-full bg-white border border-gray-400 rounded-industrial-sm px-3 py-2 text-xs font-bold text-brand-navy outline-none focus:border-black h-20 resize-none shadow-inner"/g, 'className="w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green bg-transparent text-sm font-bold text-brand-navy outline-none h-20 resize-none"');

// Replace static display boxes (like Detected Variety)
content = content.replace(/className="w-full h-\[30px\] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 flex items-center justify-between shadow-inner"/g, 'className="border-b border-brand-navy/30 px-0 py-2 flex items-center justify-between bg-transparent"');
content = content.replace(/className="w-full min-h-\[30px\] py-1 bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 flex items-center justify-between shadow-inner"/g, 'className="border-b border-brand-navy/30 px-0 py-2 flex items-center justify-between bg-transparent"');

// Replace label bottom margins
content = content.replace(/className="text-\[9px\] font-bold text-brand-navy uppercase tracking-widest block mb-1"/g, 'className="text-[9px] font-bold text-brand-navy uppercase tracking-widest block"');
content = content.replace(/className="text-\[11px\] font-bold text-brand-navy uppercase flex items-center gap-1\.5 mb-1"/g, 'className="text-[9px] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1.5"');
content = content.replace(/className="text-\[11px\] font-bold text-brand-navy uppercase mb-1 block"/g, 'className="text-[9px] font-bold text-brand-navy uppercase tracking-widest block"');
content = content.replace(/className="text-\[11px\] font-bold text-brand-navy uppercase block mb-1"/g, 'className="text-[9px] font-bold text-brand-navy uppercase tracking-widest block"');
content = content.replace(/className="text-\[11px\] font-bold text-brand-navy uppercase mb-1"/g, 'className="text-[9px] font-bold text-brand-navy uppercase tracking-widest block"');

// Replace toggle buttons (Green Coffee, Parchment Coffee, etc.)
content = content.replace(/bg-white border-gray-400 shadow-sm text-brand-navy hover:border-black/g, 'bg-transparent border-brand-navy/30 text-brand-navy/70 hover:border-brand-navy hover:text-brand-navy');
content = content.replace(/rounded-industrial-sm/g, 'rounded-md'); // For everything else that still has industrial-sm, change to rounded-md

fs.writeFileSync(file, content, 'utf8');
console.log('Styles updated.');
