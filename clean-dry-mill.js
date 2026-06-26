const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, rules) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const rule of rules) {
        content = content.replace(rule.from, rule.to);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(Updated );
    } else {
        console.log(No changes made to );
    }
}

const thrashingFile = path.join(__dirname, 'src/modules/supply/components/thrashing/ThrashingForm.tsx');
const sieveFile = path.join(__dirname, 'src/shared/components/ui/SieveDistributionTable.tsx');

const selectClassRegex = /className="w-full h-\[30px\] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 focus:border-black outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs/g;
const selectClassNew = 'className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 focus:border-brand-green outline-none font-bold text-brand-navy transition-all appearance-none pr-8 disabled:opacity-100 disabled:text-brand-navy uppercase text-xs';

const inputReadonlyRegex = /className="w-full h-\[30px\] bg-white border border-gray-400 shadow-sm rounded-industrial-sm px-3 text-xs font-bold text-brand-navy flex justify-between items-center shadow-inner transition-all"/g;
const inputReadonlyNew = 'className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 text-xs font-bold text-brand-navy flex justify-between items-center transition-all"';

const expectedBlockRegex = /className="p-4 bg-white border border-gray-400 shadow-sm rounded-industrial-sm flex flex-col md:flex-row justify-between items-center gap-4 relative z-10"/g;
const expectedBlockNew = 'className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 relative z-10"';

replaceFileContent(thrashingFile, [
    { from: selectClassRegex, to: selectClassNew },
    { from: inputReadonlyRegex, to: inputReadonlyNew },
    { from: expectedBlockRegex, to: expectedBlockNew }
]);

const sieveTableRegex = /className="w-full text-center text-xs font-bold text-brand-navy bg-white border border-gray-400 shadow-sm rounded-industrial-sm py-1 focus:border-black outline-none transition-all"/g;
const sieveTableNew = 'className="w-full text-center text-xs font-bold text-brand-navy bg-transparent border-b-2 border-zinc-300 py-1 focus:border-brand-green outline-none transition-all px-0"';

const readonlySieveRegex = /className="w-full text-center text-xs font-bold text-brand-navy bg-gray-50 border border-gray-200 shadow-sm rounded-industrial-sm py-1 opacity-70 cursor-not-allowed"/g;
const readonlySieveNew = 'className="w-full text-center text-xs font-bold text-brand-navy bg-transparent border-b-2 border-zinc-300 py-1 opacity-70 cursor-not-allowed px-0"';

replaceFileContent(sieveFile, [
    { from: sieveTableRegex, to: sieveTableNew },
    { from: readonlySieveRegex, to: readonlySieveNew }
]);
