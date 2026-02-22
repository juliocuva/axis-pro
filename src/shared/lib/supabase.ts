import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
).trim();

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ AXIS OIL: Faltan credenciales de Supabase en variables de entorno.");
} else {
    // Log partially for debugging in development (without exposing full key)
    if (process.env.NODE_ENV === 'development') {
        process.nextTick(() => {
            console.log(`📡 AXIS Cloud: Conectado a ${supabaseUrl.substring(0, 15)}...`);
        });
    }
}

export const supabase = createClient(supabaseUrl, supabaseKey);
