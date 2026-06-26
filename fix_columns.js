const fs = require('fs');
const path = 'C:/FullStackDeveloper/axis-oil/axis_pro/src/modules/production/components/CVAAssessmentForm.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/<div className="lg:col-span-2(.*?)border-r/g, '<div className="lg:col-span-3$1border-r');
data = data.replace(/<div className="lg:col-span-2(.*?)Huella Biometría Sensorial/g, '<div className="lg:col-span-3$1Huella Biometría Sensorial');

fs.writeFileSync(path, data);
console.log('Fixed properly');
