const fs = require('fs');

function replaceFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/Coffee Buyer/g, 'Coffee Customer');
  content = content.replace(/AxisONE Buyer/g, 'AxisONE Customer');
  content = content.replace(/"Buyer"/g, '"Customer"');
  content = content.replace(/>Buyer</g, '>Customer<');
  content = content.replace(/po\.buyer /g, 'po.buyer '); // keep property the same if it doesn't matter
  fs.writeFileSync(path, content);
}

replaceFile('src/app/commercial/evidence/page.tsx');
replaceFile('src/app/hub/page.tsx');
console.log('Replaced Buyer with Customer');
