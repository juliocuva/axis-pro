const url = "https://nhhbncogvnocglrymizj.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

async function check() {
  let res = await fetch(url + "/farmers?limit=1", { headers: { apikey: key, Authorization: "Bearer " + key } });
  console.log("FARMERS SCHEMA:", Object.keys((await res.json())[0] || {}));
  
  res = await fetch(url + "/lots?limit=1", { headers: { apikey: key, Authorization: "Bearer " + key } });
  console.log("LOTS SCHEMA:", Object.keys((await res.json())[0] || {}));
}
check();
