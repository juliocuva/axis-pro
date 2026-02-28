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

            // Almacenar estilos originales y de padres críticos
            const originalStyle = element.style.cssText;
            const parent = element.parentElement;
            const originalParentStyle = parent ? parent.style.cssText : '';

            // Forzar un estado de visualización limpio para la captura
            // 1. Desactivar transiciones para evitar frames intermedios
            element.style.transition = 'none';

            // 2. Forzar ancho industrial (proporción A4 ideal)
            element.style.width = '1200px';
            element.style.maxWidth = 'none';
            element.style.minWidth = '1200px';
            element.style.position = 'relative';
            element.style.left = '0';
            element.style.top = '0';
            element.style.margin = '0';
            element.style.transform = 'none';

            // 3. Relax parent constraints to avoid clipping
            if (parent) {
                parent.style.overflow = 'visible';
                parent.style.maxWidth = 'none';
                parent.style.width = 'auto';
            }

            // Pequeño delay para asegurar que el DOM se ajuste al nuevo ancho
            await new Promise(r => setTimeout(r, 500));

            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#050706',
                logging: false,
                useCORS: true,
                allowTaint: true,
                windowWidth: 1200,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const itemsToHide = clonedDoc.querySelectorAll('.no-export');
                    itemsToHide.forEach((el: any) => el.style.display = 'none');

                    // Force charts to have non-zero dimensions
                    // Force charts to have non-zero dimensions
                    const charts = clonedDoc.querySelectorAll('.recharts-responsive-container');
                    charts.forEach((chart: any) => {
                        chart.style.width = '800px';
                        chart.style.height = '400px';
                        chart.style.visibility = 'visible';
                        chart.style.opacity = '1';
                    });

                    // Remove filters and complex SVG patterns that crash html2canvas
                    const filters = clonedDoc.querySelectorAll('filter, clipPath, mask');
                    filters.forEach((el: any) => el.parentNode?.removeChild(el));

                    // Hide elements with blur classes which often break canvas
                    const blurElements = clonedDoc.querySelectorAll('[class*="blur-"]');
                    blurElements.forEach((el: any) => {
                        el.style.filter = 'none';
                        el.style.backdropFilter = 'none';
                    });
                }
            });

            // Restaurar estilos inmediatamente
            element.style.cssText = originalStyle;
            if (parent) parent.style.cssText = originalParentStyle;

            const imgData = canvas.toDataURL('image/png', 1.0);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Centrar si es más corto que la página, o empezar en 0 si es más largo
            const yOffset = pdfHeight < pdf.internal.pageSize.getHeight() ? 5 : 0;

            pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, pdfHeight);
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
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-brand-green-bright font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-y-0.5 transition-transform">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span id="btn-export-text">DESCARGAR REPORTE INDUSTRIAL</span>
        </button>
    );
}
