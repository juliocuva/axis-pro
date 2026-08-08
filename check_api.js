const url = "https://nhhbncogvnocglrymizj.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

async function check() {
  // Get PO
  const poRes = await fetch(url + "/purchase_orders?po_number=eq.PO-cofinet-2026-08-001&select=id", { headers: { apikey: key, Authorization: "Bearer " + key } });
  const po = await poRes.json();
  console.log("PO:", po);
  
  if (po.length > 0) {
    const lotsRes = await fetch(url + "/lots?po_id=eq." + po[0].id + "&select=*", { headers: { apikey: key, Authorization: "Bearer " + key } });
    const lots = await lotsRes.json();
    console.log("Lots in DB for this PO:", lots);
  }
}
check();
