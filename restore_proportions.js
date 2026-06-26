const fs = require('fs');
const path = 'C:/FullStackDeveloper/axis-oil/axis_pro/src/modules/production/components/CVAAssessmentForm.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/lg:grid-cols-10/g, 'lg:grid-cols-5');
data = data.replace(/lg:col-span-7/g, 'lg:col-span-3');
data = data.replace(/lg:col-span-3/g, 'lg:col-span-2');

fs.writeFileSync(path, data);
console.log('Done');
