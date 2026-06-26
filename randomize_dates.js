const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nhhbncogvnocglrymizj.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

const supabase = createClient(supabaseUrl, supabaseKey);

async function randomizeDates() {
    console.log("Obteniendo entradas...");
    const { data: entries, error } = await supabase.from('commercial_entries').select('id');
    
    if (error) {
        console.error(error);
        return;
    }

    console.log(`Modificando fechas de ${entries.length} registros...`);
    const now = new Date();

    for (let entry of entries) {
        // Random number of days ago, between 1 and 14 days
        const daysAgo = Math.floor(Math.random() * 14) + 1;
        // Random hour of the day (between 8 AM and 4 PM)
        const randomHour = Math.floor(Math.random() * 8) + 8;
        
        const randomDate = new Date(now);
        randomDate.setDate(now.getDate() - daysAgo);
        randomDate.setHours(randomHour, Math.floor(Math.random() * 60), 0, 0);
        
        await supabase.from('commercial_entries').update({ reception_date: randomDate.toISOString(), created_at: randomDate.toISOString() }).eq('id', entry.id);
    }
    
    console.log("¡Fechas aleatorias históricas generadas con éxito!");
}

randomizeDates();
