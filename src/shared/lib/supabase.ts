import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
).trim();

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ AXIS OIL: Faltan credenciales de Supabase.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
