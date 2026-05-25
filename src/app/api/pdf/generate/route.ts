import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { htmlContent, fileName } = await request.json();

        if (!htmlContent) {
            return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
        }

        // Wrap the HTML elements in a clean, fully styled document template
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>${fileName || 'Informe AxisOne'}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Montserrat', sans-serif;
                            margin: 0;
                            padding: 0;
                            background: white !important;
                            color: black !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        /* Ensure the pages retain correct page-break definitions */
                        .passport-page, .certificate-page {
                            width: 794px !important;
                            min-height: 1123px !important;
                            max-height: none !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            position: relative !important;
                            box-sizing: border-box !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white !important;
                            color: black !important;
                            overflow: visible !important;
                        }
                        /* Neutralize dark elements and ensure print-ready vector styles */
                        .no-print, .no-export {
                            display: none !important;
                            visibility: hidden !important;
                        }
                        svg, canvas, img {
                            max-width: 100% !important;
                        }
                    </style>
                </head>
                <body>
                    <div style="width: 794px; margin: 0 auto;">
                        ${htmlContent}
                    </div>
                </body>
            </html>
        `;

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
                source: fullHtml,
                sandbox: !apiKey, // Uses sandbox mode (free, unlimited) if no Vercel environment API key is defined
                margin: '0',
                format: 'A4',
                orientation: 'portrait'
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
