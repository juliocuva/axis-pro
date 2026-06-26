const fs = require('fs');
const path = 'C:/FullStackDeveloper/axis-oil/axis_pro/src/modules/production/components/CVAAssessmentForm.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/\r\n/g, '\n');

// Header
data = data.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-2 bg-brand-navy text-white">\n                    <div className="p-3 border-b lg:border-b-0 lg:border-r border-white/20 flex justify-between items-center">',
    '<div className="grid grid-cols-1 lg:grid-cols-5 bg-brand-navy text-white">\n                    <div className="lg:col-span-3 p-3 border-b lg:border-b-0 lg:border-r border-white/20 flex justify-between items-center">'
);
data = data.replace(
    '<div className="p-3 flex justify-between items-center">\n                        <h3 className="text-[11px] font-bold uppercase text-white">{t(\'cuppingForm\', \'affectiveHeader\')}</h3>',
    '<div className="lg:col-span-2 p-3 flex justify-between items-center">\n                        <h3 className="text-[11px] font-bold uppercase text-white">{t(\'cuppingForm\', \'affectiveHeader\')}</h3>'
);

// All grid-cols-2 border-b
data = data.replaceAll(
    '<div className="grid grid-cols-1 lg:grid-cols-2 border-b border-black/10">\n                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">',
    '<div className="grid grid-cols-1 lg:grid-cols-5 border-b border-black/10">\n                        <div className="lg:col-span-3 p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">'
);

data = data.replaceAll(
    'disabled={isAlreadySealed || isReadOnly} />\n                        </div>\n                        <div className="p-3 lg:p-4 flex items-center">',
    'disabled={isAlreadySealed || isReadOnly} />\n                        </div>\n                        <div className="lg:col-span-2 p-3 lg:p-4 flex items-center">'
);

// Notes sub-rows
data = data.replaceAll(
    '<div className="grid grid-cols-1 lg:grid-cols-2">\n                        <div className="p-4 border-b lg:border-b-0 lg:border-r border-black/20 grid grid-cols-1 sm:grid-cols-2 gap-4">',
    '<div className="grid grid-cols-1 lg:grid-cols-5">\n                        <div className="lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r border-black/20 grid grid-cols-1 sm:grid-cols-2 gap-4">'
);

data = data.replaceAll(
    '<div className="p-4 flex flex-col">\n                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">Notas</label>',
    '<div className="lg:col-span-2 p-4 flex flex-col">\n                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">Notas</label>'
);
data = data.replaceAll(
    '<div className="p-4 flex flex-col h-full gap-4">\n                            <div className="flex flex-col flex-1">',
    '<div className="lg:col-span-2 p-4 flex flex-col h-full gap-4">\n                            <div className="flex flex-col flex-1">'
);

fs.writeFileSync(path, data);
