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

            // Almacenar estilos originales
            const originalStyle = element.style.cssText;

            // Forzar un ancho estándar para el renderizado del canvas (A4 ratio approx)
            element.style.width = '1200px';
            element.style.maxWidth = 'none';
            element.style.position = 'relative';
            element.style.transform = 'none';

            const canvas = await html2canvas(element, {
                scale: 3, // Mayor resolución
                backgroundColor: '#050706',
                logging: false,
                useCORS: true,
                allowTaint: true,
                windowWidth: 1200
            });

            // Restaurar estilos
            element.style.cssText = originalStyle;

            const imgData = canvas.toDataURL('image/png', 1.0);

            // Crear PDF tamaño A4
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fileName}.pdf`);

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
            className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-brand-green-bright font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-y-0.5 transition-transform">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span id="btn-export-text">DESCARGAR REPORTE INDUSTRIAL</span>
        </button>
    );
}
