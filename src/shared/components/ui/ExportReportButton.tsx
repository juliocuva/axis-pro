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

            // El elemento 'lot-certificate-area' contiene las 3 páginas
            const pages = Array.from(element.children) as HTMLElement[];
            if (pages.length === 0) return;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                
                // Si no es la primera página, añadir una nueva hoja al PDF
                if (i > 0) pdf.addPage();

                const canvas = await html2canvas(page, {
                    scale: 2, // Alta calidad
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false,
                    width: 750,
                    height: 1080
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            // Descargar el PDF final
            pdf.save(`${fileName}.pdf`);

            // Guardar copia en carpeta IMP vía API para el archivo histórico
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
            if (btn) btn.innerText = 'ERROR AL GENERAR';
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
