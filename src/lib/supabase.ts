import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Usamos el nombre exacto que recomienda Supabase en su nueva interfaz
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ AXIS OIL: Faltan credenciales de Supabase. Revisa tus variables de entorno.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
