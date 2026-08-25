const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);
async function checkLots() {
  // run the logic
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const { JWT } = require('google-auth-library');
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet('1BQpgvFwceSVwkANc_UiYjQAfmuADjs0-km4ipvkwi7U', serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells('A1:T50');
  for(let r=0; r<10; r++) {
    let rowData = [];
    for(let c=0; c<20; c++) {
      const cell = sheet.getCell(r, c);
      rowData.push(cell.value);
    }
    console.log(`Row ${r}:`, rowData);
  }
}
checkLots();
