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
  console.log('Iniciando exportación PDF server-side para lote:', lote.loteNumber, options);

  const element = document.getElementById('lot-certificate-area');
  
  if (element) {
    try {
      // 1. Clonar el elemento de forma temporal para limpiarlo y preparar las páginas
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Remover barras de control interactivo, botones y elementos no imprimibles en el clon
      const interactiveElements = clonedElement.querySelectorAll('.no-print, .no-export, button, select');
      interactiveElements.forEach(el => el.remove());

      // Asegurar visibilidad completa de todas las páginas del certificado en el HTML clonado
      const pages = clonedElement.querySelectorAll('.certificate-page');
      pages.forEach((pageEl: any) => {
        pageEl.style.setProperty('display', 'block', 'important');
        pageEl.style.setProperty('visibility', 'visible', 'important');
        pageEl.style.setProperty('opacity', '1', 'important');
        pageEl.style.setProperty('position', 'relative', 'important');
        pageEl.style.setProperty('margin', '0 0 20px 0', 'important');
        pageEl.style.setProperty('box-shadow', 'none', 'important');
        pageEl.style.setProperty('border', 'none', 'important');
        
        // Quitar clases responsivas o de paso oculto
        pageEl.classList.remove('step-hidden');
        pageEl.classList.add('step-visible');
      });

      // Asegurar que las dimensiones de los gráficos de Recharts estén fijadas
      const charts = clonedElement.querySelectorAll('.recharts-responsive-container');
      charts.forEach((chart: any) => {
        chart.style.width = '750px';
        chart.style.height = '400px';
        chart.style.visibility = 'visible';
        chart.style.opacity = '1';
      });

      // Llamar al endpoint del servidor
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          htmlContent: clonedElement.innerHTML,
          fileName: `Certificado-Lote-${lote.loteNumber}`
        })
      });

      if (!response.ok) {
        throw new Error(`Servidor retornó código: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificado-Lote-${lote.loteNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('PDF generado en servidor descargado con éxito.');
      return;
    } catch (error) {
      console.error('Error al generar PDF en el servidor. Intentando fallback básico...', error);
    }
  }

  // Fallback: Generación básica de PDF si no hay elemento DOM o falla la API (MVP)
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
