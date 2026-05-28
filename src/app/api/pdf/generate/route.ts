import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url, fileName } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'Missing source URL' }, { status: 400 });
        }

        const apiKey = process.env.PDFSHIFT_API_KEY || '';
        
        // Authorization header: basic auth with 'api:KEY' or 'api:' for sandbox (free, unlimited)
        const authHeader = 'Basic ' + Buffer.from(apiKey ? `api:${apiKey}` : 'api:').toString('base64');

        const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                source: url,
                sandbox: !apiKey, // Uses sandbox mode (free, unlimited) if no Vercel environment API key is defined
                margin: '0',
                format: 'A4',
                orientation: 'portrait',
                print_background: true
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('PDFShift API Error:', errText);
            return NextResponse.json({ error: `PDF generation engine failed: ${errText}` }, { status: response.status });
        }

        const pdfBuffer = await response.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName || 'reporte'}.pdf"`,
                'Content-Length': pdfBuffer.byteLength.toString()
            }
        });

    } catch (error: any) {
        console.error('Server-side PDF generation crash:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
