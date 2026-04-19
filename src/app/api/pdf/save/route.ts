import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const { pdfBase64, fileName } = await request.json();

        if (!pdfBase64 || !fileName) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Project root directory
        const projectRoot = process.cwd();
        const impDir = path.join(projectRoot, 'IMP');

        // Create IMP directory if it doesn't exist
        if (!fs.existsSync(impDir)) {
            fs.mkdirSync(impDir, { recursive: true });
        }

        // Strip the base64 prefix
        const base64Data = pdfBase64.replace(/^data:image\/[a-z]+;base64,/, "").replace(/^data:application\/pdf;base64,/, "");

        // Save file
        const filePath = path.join(impDir, `${fileName}.jpg`);
        fs.writeFileSync(filePath, base64Data, 'base64');

        return NextResponse.json({ success: true, filePath });
    } catch (error: any) {
        console.error('Error saving PDF:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
