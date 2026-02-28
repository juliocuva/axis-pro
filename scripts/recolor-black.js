const fs = require('fs');

const targetPath = 'c:/FullStackDeveloper/axis-oil/axis_pro/src/modules/supply/components/analysis/LotCertificate.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// Replace standard dark greys used for original "white" components with true black
content = content.replace(/text-gray-900/g, 'text-black');

// Optionally darken text-gray-800 if they were originally text-gray-200
content = content.replace(/text-gray-800/g, 'text-black'); // Or text-gray-900 if preferable, but let's make it sharp black.

fs.writeFileSync(targetPath, content);
console.log('Replaced greys with pure black successfully');
