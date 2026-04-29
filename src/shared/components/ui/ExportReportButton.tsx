'use client';

import React from 'react';

export default function ExportReportButton({ elementId, fileName }: { elementId: string, fileName: string }) {
    const handleDownload = async () => {
        const btn = document.getElementById('btn-export-text');
        if (btn) btn.innerText = 'GENERANDO PDF...';

        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const element = document.getElementById(elementId);
            if (!element) return;

            // Buscamos directamente los hijos que son las páginas reales
            const pages = Array.from(element.children) as HTMLElement[];
            if (pages.length === 0) return;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Procesamos cada página una por una para asegurar que quepan perfecto
            for (let i = 0; i < pages.length; i++) {
                if (btn) btn.innerText = `PROCESANDO PÁGINA ${i + 1}/${pages.length}...`;
                
                const page = pages[i];
                
                // Si no es la primera, añadimos hoja nueva al documento PDF
                if (i > 0) pdf.addPage();

                const canvas = await html2canvas(page, {
                    scale: 2, // Calidad industrial (alta resolución)
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false,
                    width: 750,  // Ancho exacto definido en LotCertificate
                    height: 1080 // Alto exacto definido en LotCertificate
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                // Insertamos la imagen en la hoja A4 estirándola al tamaño del papel
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            // Descargar el PDF final
            pdf.save(`${fileName}.pdf`);

            // Archivo histórico en el servidor
            const fullPdfData = pdf.output('datauristring');
            try {
                await fetch('/api/pdf/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pdfBase64: fullPdfData, fileName: `${fileName}` })
                });
            } catch (saveErr) {
                console.error('Error auto-archiving PDF:', saveErr);
            }

            if (btn) btn.innerText = 'PDF GENERADO ✓';
            setTimeout(() => { if (btn) btn.innerText = 'DESCARGAR REPORTE INDUSTRIAL'; }, 2000);
        } catch (error) {
            console.error('Error generating PDF:', error);
            if (btn) btn.innerText = 'ERROR EN MOTOR PDF';
        }
    };

    return (
        <button
            onClick={handleDownload}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-brand-green-bright font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-y-0.5 transition-transform">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span id="btn-export-text">DESCARGAR REPORTE INDUSTRIAL</span>
        </button>
    );
}
