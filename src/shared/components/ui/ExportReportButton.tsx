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

            // 2. Forzar ancho industrial (proporción A4/Carta ideal)
            element.style.width = '816px';
            element.style.maxWidth = 'none';
            element.style.minWidth = '816px';
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
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                windowWidth: 816,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const itemsToHide = clonedDoc.querySelectorAll('.no-export');
                    itemsToHide.forEach((el: any) => el.style.display = 'none');
                    
                    // Remueve explícitamente elementos que rompen html2canvas
                    const badElements = clonedDoc.querySelectorAll('[data-html2canvas-ignore="true"]');
                    badElements.forEach((el: any) => el.remove());

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
                    const filters = clonedDoc.querySelectorAll('filter, mask, pattern');
                    filters.forEach((el: any) => el.parentNode?.removeChild(el));

                    // Hide elements with blur classes which often break canvas
                    const blurElements = clonedDoc.querySelectorAll('[class*="blur-"]');
                    blurElements.forEach((el: any) => {
                        el.style.filter = 'none';
                        el.style.backdropFilter = 'none';
                    });
                    
                    // Remove radial gradients that can cause createPattern errors
                    const radialElements = clonedDoc.querySelectorAll('[style*="radial-gradient"]');
                    radialElements.forEach((el: any) => {
                        el.style.backgroundImage = 'none';
                    });

                    // FATAL ERROR PREVENTION: Strip any element that has explicit 0 width/height avoiding createPattern error
                    const allNodes = clonedDoc.querySelectorAll('svg, canvas, img');
                    allNodes.forEach((node: any) => {
                        const w = node.getAttribute('width');
                        const h = node.getAttribute('height');
                        const styleW = node.style.width;
                        const styleH = node.style.height;
                        if (w === '0' || h === '0' || styleW === '0px' || styleH === '0px' || styleW === '0' || styleH === '0') {
                            node.remove();
                        }
                    });
                }
            });

            // Restaurar estilos inmediatamente
            element.style.cssText = originalStyle;
            if (parent) parent.style.cssText = originalParentStyle;

            // En vez de generar un PDF, lo descargamos como Imagen de Alta Calidad (solicitud del usuario)
            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Descargar como imagen JPG
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `${fileName}.jpg`;
            link.click();

            // Save copy to local IMP directory via API
            try {
                const response = await fetch('/api/pdf/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Reutilizamos el nombre de la variable de la API pero mandamos el JPG
                    body: JSON.stringify({ pdfBase64: imgData, fileName: `${fileName}` })
                });
                if (!response.ok) {
                    console.error('Failed to save to IMP folder');
                }
            } catch (saveErr) {
                console.error('Error saving to IMP folder:', saveErr);
            }

            if (btn) btn.innerText = 'IMAGEN GENERADA ✓';
            setTimeout(() => { if (btn) btn.innerText = 'DESCARGAR REPORTE INDUSTRIAL'; }, 2000);
        } catch (error) {
            console.error('Error generating Image:', error);
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
