const fs = require('fs');
let content = fs.readFileSync('c:/FullStackDeveloper/axis-oil/axis_pro/src/modules/supply/components/analysis/LotCertificate.tsx', 'utf8');

// Backgrounds
content = content.replace(/bg-\[#08080c\]/g, 'bg-white');
content = content.replace(/bg-\[#0A0A0E\]/g, 'bg-white tracking-wide');
content = content.replace(/bg-\[#111115\]/g, 'bg-gray-50');
content = content.replace(/bg-black\/40/g, 'bg-gray-50');
content = content.replace(/bg-black\/60/g, 'bg-white');
content = content.replace(/bg-black\/50/g, 'bg-gray-100');
content = content.replace(/bg-black(?= |"|\/)/g, 'bg-white');
content = content.replace(/className="bg-black/g, 'className="bg-white'); // Fix for exact matches

content = content.replace(/bg-white\/\[0\.015\]/g, 'bg-gray-50');
content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-gray-50');
content = content.replace(/bg-white\/5/g, 'bg-gray-100');
content = content.replace(/bg-bg-card/g, 'bg-gray-100');

// Fix QG badge bg
content = content.replace(/bg-white text-\[11px\] font-bold text-gray-400/g, 'bg-gray-900 text-[11px] font-bold text-white');
content = content.replace(/hover:bg-white\/10 text-gray-400 hover:text-white/g, 'hover:bg-gray-200 text-gray-600 hover:text-gray-900');

// Texts
content = content.replace(/text-white/g, 'text-gray-900');
content = content.replace(/text-gray-200/g, 'text-gray-800');
content = content.replace(/text-gray-300/g, 'text-gray-700');
content = content.replace(/text-\[#e2e2e2\]/g, 'text-gray-800');
content = content.replace(/text-gray-400/g, 'text-gray-600');

// Borders
content = content.replace(/border-white\/5/g, 'border-gray-200');
content = content.replace(/border-white\/10/g, 'border-gray-200');
content = content.replace(/border-white\/20/g, 'border-gray-300');
content = content.replace(/border-white\/\[0\.03\]/g, 'border-gray-200');
content = content.replace(/border-white\/\[0\.05\]/g, 'border-gray-200');
content = content.replace(/border-white\/\[0\.02\]/g, 'border-gray-200');

// Charts
content = content.replace(/stroke="#ffffff05"/g, 'stroke="#e5e7eb"');
content = content.replace(/fill='#444'/g, 'fill="#6b7280"');
content = content.replace(/fill=\{Number\(entry\.val\) > 10 \? '#00df9a' : '#2b2b36'\}/g, 'fill={Number(entry.val) > 10 ? \'#00df9a\' : \'#e5e7eb\'}');

// Remove inversion
content = content.replace(/grayscale contrast-125/g, 'grayscale opacity-70');

fs.writeFileSync('c:/FullStackDeveloper/axis-oil/axis_pro/src/modules/supply/components/analysis/LotCertificate.tsx', content);
console.log("Done");
