async function sync() {
  const res = await fetch("http://127.0.0.1:3000/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ poId: "PO-cofinet-2026-08-001" })
  });
  console.log(await res.json());
}
sync();
