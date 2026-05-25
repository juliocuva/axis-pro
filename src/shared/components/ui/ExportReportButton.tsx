'use client';

import React from 'react';

export default function ExportReportButton({ elementId, fileName }: { elementId: string, fileName: string }) {
    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const btn = document.getElementById('btn-export-text');
        if (btn) btn.innerText = 'GENERANDO REPORTE...';

        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const element = document.getElementById(elementId);
            if (!element) return;

            // Activar clase global y atributo temporal para saltarse visualizadores condicionales/ocultos
            element.setAttribute('data-exporting', 'true');
            document.body.classList.add('exporting');

            // 1. Crear un contenedor temporal en el body (fuera de modales fijos/con scroll)
            const tempContainer = document.createElement('div');
            tempContainer.id = 'axis-passport-temp-container';
            tempContainer.style.cssText = `
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 794px !important;
                height: auto !important;
                overflow: hidden !important;
                display: block !important;
                background: white !important;
                z-index: -99999 !important;
            `;

            // 2. Clonar el elemento completo
            const clonedElement = element.cloneNode(true) as HTMLElement;
            clonedElement.id = `${elementId}-clone`;

            // Quitar clases de cuadrícula y asegurar diseño vertical estándar para la exportación de páginas
            clonedElement.classList.remove('certificate-grid', 'passport-grid');
            clonedElement.classList.add('flex', 'flex-col', 'gap-8');

            clonedElement.style.cssText = `
                width: 794px !important;
                height: auto !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                margin: 0 !important;
                padding: 0 !important;
            `;

            tempContainer.appendChild(clonedElement);
            document.body.appendChild(tempContainer);

            // Asegurarnos de que todas las páginas clonadas y gráficos estén visibles y listos
            const pages = clonedElement.querySelectorAll('.certificate-page, .passport-page, div[style*="1123px"], div[style*="1056px"]');
            pages.forEach((pageEl: any) => {
                pageEl.style.setProperty('display', 'block', 'important');
                pageEl.style.setProperty('visibility', 'visible', 'important');
                pageEl.style.setProperty('opacity', '1', 'important');
                pageEl.style.setProperty('position', 'relative', 'important');
                pageEl.style.setProperty('height', 'auto', 'important');
                pageEl.style.setProperty('overflow', 'visible', 'important');
                pageEl.style.setProperty('margin', '0 0 20px 0', 'important');
                // Neutralizar clases de ocultación
                pageEl.classList.remove('step-hidden');
                pageEl.classList.add('step-visible');
            });

            // Pequeño delay para asegurar que el DOM clonado esté listo
            await new Promise(r => setTimeout(r, 200));

            const canvas = await html2canvas(clonedElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                windowWidth: 794,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc, clonedEl) => {
                    // Force charts to have non-zero dimensions
                    const charts = clonedEl.querySelectorAll('.recharts-responsive-container');
                    charts.forEach((chart: any) => {
                        chart.style.width = '750px';
                        chart.style.height = '400px';
                        chart.style.visibility = 'visible';
                        chart.style.opacity = '1';
                    });

                    // Hide elements with blur classes which often break canvas
                    const blurElements = clonedEl.querySelectorAll('[class*="blur-"]');
                    blurElements.forEach((el: any) => {
                        el.style.filter = 'none';
                        el.style.backdropFilter = 'none';
                    });
                    
                    // Remove filters and complex SVG patterns that crash html2canvas
                    const filters = clonedEl.querySelectorAll('filter, mask, pattern');
                    filters.forEach((el: any) => el.parentNode?.removeChild(el));

                    // Remove radial gradients that can cause createPattern errors
                    const radialElements = clonedEl.querySelectorAll('[style*="radial-gradient"]');
                    radialElements.forEach((el: any) => {
                        el.style.backgroundImage = 'none';
                    });

                    // FATAL ERROR PREVENTION: Strip any element that has explicit 0 width/height avoiding createPattern error
                    const allNodes = clonedEl.querySelectorAll('svg, canvas, img');
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

            // Eliminar el clon temporal del body inmediatamente
            document.body.removeChild(tempContainer);

            // En vez de generar un PDF, lo descargamos como Imagen de Alta Calidad (solicitud del usuario)
            const imgData = canvas.toDataURL('image/jpeg', 0.90);
            
            // Descargar como imagen JPG usando Blob para mayor eficiencia
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${fileName}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
            }, 'image/jpeg', 0.90);

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
        } finally {
            const element = document.getElementById(elementId);
            if (element) {
                element.removeAttribute('data-exporting');
            }
            document.body.classList.remove('exporting');
        }
    };

    return (
        <button
            type="button"
            onClick={handleDownload}
            className="px-8 py-4 bg-white hover:bg-white border border-gray-400 shadow-sm text-brand-navy-bright font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-y-0.5 transition-transform">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span id="btn-export-text">DESCARGAR REPORTE INDUSTRIAL</span>
        </button>
    );
}
