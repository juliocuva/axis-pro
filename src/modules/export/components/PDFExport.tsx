/**
 * AXIS COFFEE PRO - Componente de Exportación PDF
 * Interfaz de usuario para generar y descargar informes de lotes
 */

'use client';

import React, { useState } from 'react';
import { LotData, PDFExportOptions, exportarInformeLotePDF } from './pdfExportModule';

interface PDFExportComponentProps {
  lote: LotData;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const PDFExportButton: React.FC<PDFExportComponentProps> = ({
  lote,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<PDFExportOptions>({
    viewMode: 'productor',
    incluirGraficos: true,
    incluirCupping: true,
    orientacion: 'portrait',
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      await exportarInformeLotePDF(lote, options);
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      onError?.(err);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 disabled:opacity-50 flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4"
          />
        </svg>
        Exportar PDF
      </button>

      {showOptions && (
        <div className="absolute bg-white shadow-lg rounded-lg p-4 z-50 mt-10 border border-gray-200 min-w-80">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Informe
              </label>
              <select
                value={options.viewMode}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    viewMode: e.target.value as 'productor' | 'comprador',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="productor">
                  Productor (Know-how Técnico Completo)
                </option>
                <option value="comprador">Comprador (Export Report)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {options.viewMode === 'productor'
                  ? 'Incluye toda la información técnica detallada'
                  : 'Información resumida para compradores'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.incluirCupping}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      incluirCupping: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Incluir Evaluación Sensorial (Cupping)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.incluirGraficos}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      incluirGraficos: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Incluir Gráficos y Análisis Visuales
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Orientación
              </label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="orientacion"
                    value="portrait"
                    checked={options.orientacion === 'portrait'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        orientacion: e.target.value as 'portrait' | 'landscape',
                      })
                    }
                    className="w-4 h-4 text-amber-600"
                  />
                  <span className="text-sm text-gray-700">Vertical</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="orientacion"
                    value="landscape"
                    checked={options.orientacion === 'landscape'}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        orientacion: e.target.value as 'portrait' | 'landscape',
                      })
                    }
                    className="w-4 h-4 text-amber-600"
                  />
                  <span className="text-sm text-gray-700">Horizontal</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={handleExport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Panel de exportación completo con vista previa
 */
export const PDFExportPanel: React.FC<PDFExportComponentProps> = ({
  lote,
  onSuccess,
  onError,
}) => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSuccess = () => {
    setSuccessMessage(`PDF del lote ${lote.loteNumber} generado correctamente`);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
    onSuccess?.();
  };

  const handleError = (error: Error) => {
    setErrorMessage(`Error: ${error.message}`);
    setSuccessMessage('');
    onError?.(error);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-brand-navy">Exportar Informe del Lote</h3>
          <p className="text-sm text-gray-600 mt-1">
            Lote #{lote.loteNumber} - {lote.origen.variedad}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            lote.certificacion.validadoTecnicamente
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {lote.certificacion.estado}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Genera un informe profesional en PDF con toda la información de trazabilidad,
          análisis de laboratorio y certificaciones del lote.
        </p>

        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-xs font-semibold text-gray-700 uppercase mb-2">
            Información que se incluye:
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Datos del productor y georreferenciación</li>
            <li>✓ Características de procesamiento y secado</li>
            <li>✓ Análisis físico completo (humedad, densidad, defectos)</li>
            <li>✓ Análisis fisicoquímico (pH, Brix, fermentación)</li>
            <li>✓ Evaluación sensorial SCA (si aplica)</li>
            <li>✓ Estado de certificación y cumplimiento EUDR</li>
          </ul>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          ✗ {errorMessage}
        </div>
      )}

      <PDFExportButton
        lote={lote}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
};

/**
 * Mini botón para usar en tablas y listados
 */
export const PDFExportMiniButton: React.FC<PDFExportComponentProps> = ({
  lote,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await exportarInformeLotePDF(lote, {
        viewMode: 'productor',
        incluirGraficos: true,
        incluirCupping: true,
        orientacion: 'portrait',
      });
      onSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Descargar informe PDF del lote"
      className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg disabled:opacity-50 transition"
    >
      {loading ? (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4"
          />
        </svg>
      )}
    </button>
  );
};
