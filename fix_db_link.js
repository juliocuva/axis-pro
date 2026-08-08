const url = "https://nhhbncogvnocglrymizj.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

async function fix() {
  const lotId = '02603a15-bb81-4d2e-8209-e0cb0c153984'; // Castillo L-009
  const farmerId = '3019790f-e644-408f-a781-d8065c0e46a0'; // Alejandra Saraza
  
  const res = await fetch(url + "/lot_farmers?lot_id=eq." + lotId + "&farmer_id=eq." + farmerId, {
    method: "DELETE",
    headers: { apikey: key, Authorization: "Bearer " + key }
  });
  console.log("Deleted erroneous link:", res.status);
}
fix();
