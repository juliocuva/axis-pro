import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with Service Role Key to bypass RLS for insertion
// Or use standard client if RLS is configured to allow authenticated users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // 1. Ensure we have data
        if (!body || !body.identity || !body.physical || !body.compliance) {
            return NextResponse.json({ error: 'Faltan datos del formulario' }, { status: 400 });
        }

        // 2. Generate a deterministic JSON string to hash
        // We stringify the payload to ensure any identical payload generates the same hash
        const dataString = JSON.stringify(body);

        // 3. Generate SHA-256 Hash for Immutability
        const hash = crypto.createHash('sha256').update(dataString).digest('hex');

        // 4. Save to Supabase table (commercial_passports)
        // Table needs: hash (text, PK), data (jsonb), issued_at (timestamp)
        const { data, error } = await supabase
            .from('commercial_passports')
            .upsert([
                { 
                    hash: hash,
                    data: body
                    // issued_at is automatically set by Postgres DEFAULT now()
                }
            ], { onConflict: 'hash' })
            .select('issued_at')
            .single();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: 'Error al guardar el pasaporte en la base de datos.' }, { status: 500 });
        }

        // 5. Return the hash and issuance timestamp
        return NextResponse.json({ 
            success: true, 
            hash: hash,
            issued_at: data.issued_at
        });

    } catch (err: any) {
        console.error("API Route Error:", err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
