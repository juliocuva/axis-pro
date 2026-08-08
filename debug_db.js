const url = "https://nhhbncogvnocglrymizj.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

async function check() {
  const lRes = await fetch(url + "/lots?select=id,name,coffee_type", { headers: { apikey: key, Authorization: "Bearer " + key } });
  const lots = await lRes.json();
  
  const lfRes = await fetch(url + "/lot_farmers?select=lot_id,farmer_id", { headers: { apikey: key, Authorization: "Bearer " + key } });
  const lfs = await lfRes.json();
  
  const fRes = await fetch(url + "/farmers?select=id,name", { headers: { apikey: key, Authorization: "Bearer " + key } });
  const farmers = await fRes.json();
  
  console.log("LOTS:");
  console.log(lots);
  console.log("\nFARMERS:");
  console.log(farmers.filter(f => f.name.includes('Alejandra') || f.name.includes('Sebastian')));
  console.log("\nLOT FARMERS:");
  const relevantLots = lots.filter(l => l.name === 'L-009' || l.coffee_type === 'Castillo');
  const relevantLotIds = relevantLots.map(l => l.id);
  
  lfs.filter(lf => relevantLotIds.includes(lf.lot_id)).forEach(lf => {
    const fName = farmers.find(f => f.id === lf.farmer_id)?.name;
    const lInfo = lots.find(l => l.id === lf.lot_id);
    console.log(`Lot: ${lInfo.name} (${lInfo.coffee_type}) -> Farmer: ${fName}`);
  });
}
check();
