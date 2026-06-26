const fs = require('fs');
const file = 'src/modules/supply/components/PurchaseForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all select elements that still have font-bold text-brand-navy
content = content.replace(/className=\"w-full border-b border-brand-navy\/30 px-0 py-2 focus:border-brand-green bg-transparent text-xs font-bold text-brand-navy outline-none appearance-none/g, 
  'className=\"w-full border-b border-brand-navy/30 px-0 py-2 focus:border-brand-green bg-transparent text-xs font-light text-brand-navy/70 outline-none appearance-none');

// Make sure GEISHA and other options are not bold either. Wait, GEISHA is just the selected value of the select! So the select's class controls it.
// Let's also check if the input for Quantity has any bold.
// Wait! I noticed something! If the value is light, why did the user say "alinear" and pointed a line from GEISHA to 250?
// Let's look at the screenshot VERY carefully!
// GEISHA baseline: Is it higher than 250?
// Actually, "COFFEE VARIETY" and "PURCHASE PACK QUANTITY" are on DIFFERENT rows!
// Wait! Look at the screenshot! "COFFEE VARIETY" is on the same row as "HARVEST DATE" and "BASE PROCESS".
// "PURCHASE PACK QUANTITY" is on the same row as "PURCHASE DATE" and "TOTAL PAID VALUE".
// Why did the user draw a line from GEISHA down to 250?
// Because the TEXT for GEISHA and 250 do not align vertically! (Column alignment!)
// Ah! "este no esta alineado y los textos estan grandes frenet a los otros" -> "This is not aligned and the texts are big compared to the others".
// They drew an arrow from "FARM LOT SIZE" to GEISHA/250 in the first screenshot, and here they draw a line aligning GEISHA and 250.
// Wait! Let's check the layout grids!
// In the first row: `# LOT` (span 1), `FARM LOT SIZE` (span 2), `USED FOR EUDR` (span 1). Total 4 columns?
// In the Dates row: `HARVEST DATE`, `COFFEE VARIETY`, `BASE PROCESS`.
// Wait, `PurchaseForm.tsx` grid definitions:
// `grid grid-cols-1 md:grid-cols-3 gap-6` or something.
// Let's check the layout of these rows to see why the columns don't align perfectly vertically across rows!

// Also, the text size: `Ej. 4.5` is really small. `GEISHA` and `250` are still a bit bigger.
// Let's make sure ALL inputs use exactly the same font class as the placeholder.
// The placeholder uses `placeholder-gray-400 placeholder:font-light`.
// I will change all inputs to `font-light text-gray-500` so they are equally light and thin as the placeholder!

fs.writeFileSync(file, content, 'utf8');
