const url = "https://nhhbncogvnocglrymizj.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

async function fix() {
  const poRes = await fetch(url + "/purchase_orders?po_number=eq.PO-cofinet-2026-08-001", { headers: { apikey: key, Authorization: "Bearer " + key } });
  const po = (await poRes.json())[0];
  
  const fRes = await fetch(url + "/farmers?name=eq.Alejandra%20Saraza", { headers: { apikey: key, Authorization: "Bearer " + key } });
  let farmer = (await fRes.json())[0];
  
  if (!farmer) {
    console.log("Farmer not found");
    return;
  }
  
  // Insert lot
  const lotData = {
    name: 'L-009',
    po_id: po.id,
    coffee_type: 'Pink Bourbon',
    volume_kg: 50
  };
  
  const lRes = await fetch(url + "/lots", { 
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(lotData)
  });
  const lot = (await lRes.json())[0];
  console.log("Created lot:", lot);
  
  // Link farmer
  const lfRes = await fetch(url + "/lot_farmers", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ lot_id: lot.id, farmer_id: farmer.id })
  });
  console.log("Linked farmer:", lfRes.status);
  
  // Create evidence
  await fetch(url + "/processing_evidence", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ lot_id: lot.id, yield_pct: 89.5, moisture_pct: 11.2, water_activity: 0.62 })
  });
  
  await fetch(url + "/quality_evidence", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ lot_id: lot.id, cva_score: 86.5 })
  });
  console.log("Done");
}
fix();
