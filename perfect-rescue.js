const fs = require('fs');

let file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// The ultimate clean class we want for ALL text/number/date inputs
const cleanInputClass = 'w-full border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none transition-all font-medium text-brand-navy text-xs placeholder-gray-400 placeholder:font-light';

// The ultimate clean class we want for ALL selects
const cleanSelectClass = 'w-full border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green bg-transparent font-medium text-brand-navy text-xs outline-none appearance-none bg-[url(\\\'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%230c6056%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E\\\')] bg-[length:1rem_1rem] bg-[position:right_0_center] bg-no-repeat uppercase';

// Replace ugly input classes with clean ones globally
content = content.replace(/className=\"w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm[^\"]*\"/g, `className="${cleanInputClass}"`);

// Replace ugly select classes with clean ones globally
content = content.replace(/className=\"w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm[^\"]*bg-\[url[^\"]*\"/g, `className="${cleanSelectClass}"`);

// Also fix date inputs which might have scheme-light and other specific calendar classes
content = content.replace(/className=\"w-full bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 py-1\.5 h-\[30px\] focus:border-black outline-none text-gray-500 font-medium scheme-light pr-8 cursor-pointer text-xs[^\"]*\"/g, `className="w-full border-b border-brand-navy/30 px-0 py-2 h-[30px] focus:border-brand-green bg-transparent outline-none text-brand-navy font-medium scheme-light pr-8 cursor-pointer text-xs [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"`);

// Fix specific div wrappers that have the old styles (e.g. Identity Confirmed boxes)
content = content.replace(/className=\"w-full h-\[30px\] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 flex items-center justify-between shadow-inner\"/g, `className="w-full border-b border-brand-navy/30 px-0 flex items-center justify-between bg-transparent h-[30px]"`);
content = content.replace(/className=\"w-full min-h-\[30px\] py-1 bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 flex items-center justify-between shadow-inner\"/g, `className="w-full border-b border-brand-navy/30 px-0 flex items-center justify-between bg-transparent min-h-[30px]"`);

fs.writeFileSync(file, content, 'utf8');

// NOW FIX NumericInput.tsx
let numInputFile = 'src/shared/components/ui/NumericInput.tsx';
let numContent = fs.readFileSync(numInputFile, 'utf8');

// Remove green bars from NumericInput
numContent = numContent.replace(/<span className=\"w-0\.5 h-2\.5 bg-brand-green rounded-full\"><\/span>/g, '');

// Change label color from text-brand-green to text-brand-navy (like the minimalist look)
numContent = numContent.replace(/text-brand-green uppercase/g, 'text-brand-navy uppercase');

// Update variant styles to remove borders and use bottom border
numContent = numContent.replace(/default: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black',/g, "default: 'border-b border-brand-navy/30 bg-transparent text-brand-navy focus:border-brand-green rounded-none',");
numContent = numContent.replace(/industrial: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black',/g, "industrial: 'border-b border-brand-navy/30 bg-transparent text-brand-navy focus:border-brand-green rounded-none',");

// Update input layout class
numContent = numContent.replace(/className=\{\`w-full border rounded-industrial-sm px-3 py-1\.5 outline-none font-bold transition-all text-xs \$\{variantStyles\[variant\]\} \$\{inputClassName\} placeholder:text-gray-400 placeholder:font-medium\`\}/g, "className={`w-full h-[30px] px-0 py-2 outline-none font-medium transition-all text-xs ${variantStyles[variant]} ${inputClassName} placeholder:text-gray-400 placeholder:font-light`}");

fs.writeFileSync(numInputFile, numContent, 'utf8');

console.log('✅ PERFECT RESCUE COMPLETE');
