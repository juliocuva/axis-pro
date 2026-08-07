const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function run() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1jUXdpI3uqmg4Y-Lr8EX4UcW8qn2RLX5z7csSBDPhMVw', serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  console.log('Total rows:', rows.length);
  rows.forEach((r, i) => {
    console.log('Row ' + i + ':', r._rawData);
  });
}
run().catch(console.error);
