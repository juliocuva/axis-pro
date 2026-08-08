const url = "https://nhhbncogvnocglrymizj.supabase.co/rest/v1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

async function check() {
  const res = await fetch(url + "/farms?limit=1", { headers: { apikey: key, Authorization: "Bearer " + key } });
  console.log(res.status);
  if(res.status === 200) {
      console.log(await res.json());
  }
}
check();
