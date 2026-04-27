import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { lot_id, user_agent, email, polygon, eudr_status, farm_name } = body;

        if (!email) {
            return NextResponse.json({ error: 'Missing user email' }, { status: 400 });
        }

        const projectRoot = process.cwd();
        const dbPath = path.join(projectRoot, 'public', 'verification_logs.json');

        let logs = [];
        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            try {
                logs = JSON.parse(fileContent);
            } catch (e) {
                logs = [];
            }
        }

        const newLog = {
            id: `verif-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            lot_id: lot_id || `PENDING-${Date.now()}`,
            farm_name: farm_name || 'Sin Nombre',
            email,
            polygon: polygon || null,
            eudr_status: eudr_status || 'not_checked',
            ip_address: request.headers.get('x-forwarded-for') || 'IP Privada (Tracking Activo)',
            user_agent: user_agent || request.headers.get('user-agent') || 'Unknown Browser',
            verified_at: new Date().toISOString()
        };

        logs.push(newLog);
        fs.writeFileSync(dbPath, JSON.stringify(logs, null, 2), 'utf-8');

        return NextResponse.json({ success: true, log: newLog });
    } catch (error: any) {
        console.error('Error in track-verify API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const projectRoot = process.cwd();
        const dbPath = path.join(projectRoot, 'public', 'verification_logs.json');
        
        let logs = [];
        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            logs = JSON.parse(fileContent);
        }
        
        return NextResponse.json(logs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
