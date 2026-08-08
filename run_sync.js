const fs = require('fs');

async function check() {
    try {
        const url = "http://localhost:3000/api/sync";
        const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "https://docs.google.com/spreadsheets/d/1O0Kiz7W1J4940R9H2Oa1tqF1Tf-uV9h71G8D1fF9cIg/edit?gid=0#gid=0", poId: "PO-cofinet-2026-08-001" }) });
        const json = await resp.json();
        console.log(json);
    } catch(e) { console.error(e) }
}
check();
