/**
 * AXIS COFFEE PRO - Módulo de Exportación PDF
 * Lógica para generar informes PDF de alta fidelidad
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface LotData {
  loteNumber: string;
  origen: {
    productor: string;
    finca: string;
    region: string;
    altitud: string;
    variedad: string;
  };
  procesamiento: {
    tipoProceso: string;
    metodoSecado: string;
    tiempoSecado: string;
    pesoIngreso: number;
    pesoExcelso?: number;
    rendimiento?: number;
  };
  analisisFisico: {
    humedad: number;
    densidad: number;
    actividadAgua: number;
    defectosPrimarios: number;
    defectosSecundarios: number;
    distribucionMallas: Record<string, number>;
  };
  analisisFisicoquimico?: {
    phInicial: number;
    phFinal: number;
    brixInicial: number;
    tempMasaMax: number;
    tiempoFermentacion: number;
  };
  cupping?: {
    puntajeTotal: number;
    notas: string;
    atributos: {
      fragancia: number;
      sabor: number;
      residual: number;
      acidez: number;
      cuerpo: number;
      balance: number;
      global: number;
    };
  };
  certificacion: {
    estado: string;
    validadoTecnicamente: boolean;
    eudrHash?: string;
  };
}

export interface PDFExportOptions {
  viewMode: 'productor' | 'comprador';
  incluirGraficos: boolean;
  incluirCupping: boolean;
  orientacion: 'portrait' | 'landscape';
}

/**
 * Exporta un informe de lote a PDF capturando el elemento DOM correspondiente
 * o generando el contenido dinámicamente.
 */
export const exportarInformeLotePDF = async (
  lote: LotData,
  options: PDFExportOptions
): Promise<void> => {
  console.log('Iniciando exportación PDF para lote:', lote.loteNumber, options);

  // Intentamos capturar el elemento con ID 'lot-certificate-area' si existe en el DOM
  const element = document.getElementById('lot-certificate-area');
  
  if (element) {
    try {
      // Buscamos las páginas individuales con la clase 'certificate-page'
      let pages = element.querySelectorAll('.certificate-page');
      
      // Si por alguna razón no la tienen todavía, buscamos divs que tengan minHeight de 1056px
      if (pages.length === 0) {
        pages = element.querySelectorAll('div[style*="1056px"]');
      }

      if (pages.length > 0) {
        console.log(`Detectadas ${pages.length} páginas para exportación de alta fidelidad.`);
        
        // Crear documento PDF en formato de píxeles para coincidir 1:1 con el diseño del certificado (816x1056 px)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [816, 1056],
          hotfixes: ["px_scaling"]
        });

        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i] as HTMLElement;
          
          // Guardar estilos originales
          const originalStyle = pageEl.style.cssText;
          
          // Forzar estilos de renderizado perfectos para html2canvas
          pageEl.style.setProperty('display', 'flex', 'important');
          pageEl.style.setProperty('visibility', 'visible', 'important');
          pageEl.style.width = '816px';
          pageEl.style.height = '1056px';
          pageEl.style.minHeight = '1056px';
          pageEl.style.maxHeight = '1056px';
          pageEl.style.boxShadow = 'none';
          pageEl.style.border = 'none';
          pageEl.style.margin = '0';
          
          // Capturar la página con alta resolución
          const canvas = await html2canvas(pageEl, {
            scale: 2, // Calidad retina
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 816,
            height: 1056,
            windowWidth: 816,
            windowHeight: 1056
          });

          // Restaurar estilo original
          pageEl.style.cssText = originalStyle;

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          if (i > 0) {
            pdf.addPage([816, 1056], 'portrait');
          }
          
          pdf.addImage(imgData, 'JPEG', 0, 0, 816, 1056);
        }

        pdf.save(`Informe-Axis-${lote.loteNumber}.pdf`);
        return;
      }

      // Fallback a captura de contenedor completo tradicional si no se detectan páginas individuales
      console.warn('No se encontraron páginas individuales. Usando captura de contenedor completo...');
      const originalStyle = element.style.cssText;
      element.style.width = '816px';
      element.style.maxWidth = '816px';
      element.style.minWidth = '816px';
      element.style.height = 'auto';
      element.style.overflow = 'visible';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 816,
        height: element.scrollHeight
      });

      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [816, 1056],
      });

      const imgWidth = 816;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= 1056;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage([816, 1056], 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= 1056;
      }

      pdf.save(`Informe-Axis-${lote.loteNumber}.pdf`);
      return;
    } catch (error) {
      console.error('Error capturando DOM para PDF:', error);
      throw error;
    }
  }

  // Fallback: Generación básica de PDF si no hay elemento DOM (MVP)
  const doc = new jsPDF({
    orientation: options.orientacion,
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(20);
  doc.text(`INFORME DE LOTE: ${lote.loteNumber}`, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Productor: ${lote.origen.productor}`, 20, 40);
  doc.text(`Finca: ${lote.origen.finca}`, 20, 50);
  doc.text(`Variedad: ${lote.origen.variedad}`, 20, 60);
  
  doc.text(`Estado: ${lote.certificacion.estado}`, 20, 80);
  
  if (options.incluirCupping && lote.cupping) {
    doc.text(`Puntaje SCA: ${lote.cupping.puntajeTotal}`, 20, 100);
  }

  doc.save(`Informe-Axis-${lote.loteNumber}.pdf`);
};
