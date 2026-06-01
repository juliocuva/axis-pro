process.env.NEXT_PUBLIC_SUPABASE_URL = "https://nhhbncogvnocglrymizj.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI";

import { supabase } from './src/shared/lib/supabase';

async function diagnose() {
    console.log("Checking profiles columns...");
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching profiles:", error);
    } else if (data && data.length > 0) {
        console.log("Profiles columns found:", Object.keys(data[0]));
    } else {
        console.log("Profiles table is empty");
    }
}

diagnose();
