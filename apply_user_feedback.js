const fs = require('fs');
const path = 'C:/FullStackDeveloper/axis-oil/axis_pro/src/modules/production/components/CVAAssessmentForm.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/\r\n/g, '\n');

// 1. 70/30 ratio (from 5 to 10)
data = data.replaceAll('lg:grid-cols-5', 'lg:grid-cols-10');
data = data.replaceAll('lg:col-span-3', 'lg:col-span-7');
data = data.replaceAll('lg:col-span-2', 'lg:col-span-3');

// 2. IntensitySlider remove numeric box
data = data.replace(
    '<span className="text-xs font-bold text-brand-navy bg-white border border-gray-400 px-1.5 py-0.5 rounded-sm shadow-sm">{value.toFixed(2)}</span>',
    ''
);

// 3. QualityCircles remove FINAL input
data = data.replace(
    /<div className="flex items-center gap-1 sm:gap-2 border border-brand-navy rounded-full px-2 py-0\.5 sm:py-1 bg-white">\n                    <span className="text-\[8px\] sm:text-\[9px\] font-bold text-brand-navy\/60 uppercase">FINAL<\/span>\n                    <input[\s\S]*?className="w-8 sm:w-10 bg-transparent text-center text-\[10px\] font-bold text-brand-navy outline-none"\n                    \/>\n                <\/div>/g,
    ''
);

// 4. Notes layout in descriptive (left column) stack vertically instead of grid
data = data.replaceAll(
    'lg:border-r border-black/20 grid grid-cols-1 sm:grid-cols-2 gap-4"',
    'lg:border-r border-black/20 flex flex-col gap-4"'
);

// 5. Flavor / Aftertaste remove right column extra notes box
let flavorStr = `<div className="lg:col-span-3 p-4 flex flex-col h-full gap-4">
                            <div className="flex flex-col flex-1">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">Notas Sabor</label>
                                <textarea className="w-full flex-1 bg-white border border-gray-400 rounded-lg p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[60px]" value={data.affective.notes.flavor} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, flavor: e.target.value } } })} disabled={isAlreadySealed} />
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">Notas Sabor Residual</label>
                                <textarea className="w-full flex-1 bg-white border border-gray-400 rounded-lg p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[60px]" value={data.affective.notes.aftertaste} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, aftertaste: e.target.value } } })} disabled={isAlreadySealed} />
                            </div>
                        </div>`;
let newFlavorStr = `<div className="lg:col-span-3 p-4 flex flex-col">
                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">Notas</label>
                            <textarea className="flex-1 bg-white border border-gray-400 rounded-lg p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]" value={data.affective.notes.flavor} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, flavor: e.target.value } } })} disabled={isAlreadySealed} />
                        </div>`;
data = data.replace(flavorStr, newFlavorStr);

fs.writeFileSync(path, data);
