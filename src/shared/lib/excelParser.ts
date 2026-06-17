import * as XLSX from 'xlsx';

// Interfaces para tipar la salida del Excel en memoria
export interface ExcelParsedPayload {
  inventory: {
    lotNumber: string;
    farmerName: string;
    farmName: string;
    altitude: number;
    region: string;
    variety: string;
    process: string;
    purchaseWeight: number;
    thrashedWeight: number;
    processData: Record<string, unknown>; // JSONB con tiempos, ph, brix
  };
  physicalAnalysis: {
    moisturePct: number;
    waterActivity: number;
    densityGl: number;
    grainColor: string;
  };
  roastBatch: {
    roastDate: string;
    greenWeight: number;
    roastedWeight: number;
    machineId: string;
    roasterName: string;
    agtronBean: number;
    agtronGround: number;
  };
  cvaCupping: {
    cuppingDate: string;
    tasterName: string;
    descriptiveData: Record<string, unknown>;
    cvaFragranceAroma: number;
    cvaFlavorAftertaste: number;
    cvaAcidity: number;
    cvaSweetness: number;
    cvaMouthfeel: number;
    cvaUniformity: number;
    cvaOverall: number;
    cvaDefectsDeduction: number;
    cvaFinalScore: number;
    legacy100ScoreEquivalent: number;
  };
}

/**
 * Convierte un campo extraído a número de forma segura
 */
function parseNum(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Lee un Buffer o ArrayBuffer del Excel y lo convierte al Payload consolidado
 */
export function parseFichaDeLote(buffer: Buffer | ArrayBuffer): ExcelParsedPayload {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertimos a JSON usando array de arrays para no depender de cabeceras
  const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const dataMap: Record<string, unknown> = {};

  // Iteramos sobre las filas. 
  // Según nuestro generador, el nombre del campo está en la columna A (índice 0)
  // y el valor a llenar está en la columna B (índice 1)
  for (const row of rows) {
    const key = row[0];
    const val = row[1];
    
    if (typeof key === 'string' && key.trim() !== '') {
      dataMap[key.trim()] = val;
    }
  }

  const getString = (key: string): string => {
    const val = dataMap[key];
    return val !== undefined && val !== null ? String(val) : '';
  };

  // --- MAPEO A INVENTORY ---
  const inventory = {
    lotNumber: getString('Numero_Lote'),
    farmerName: getString('Caficultor'),
    farmName: getString('Finca'),
    altitude: parseNum(dataMap['Altura_msnm']),
    region: (getString('Municipio') ? getString('Municipio') + ', ' : '') + getString('Departamento'),
    variety: getString('Variedad'),
    process: getString('Proceso'),
    purchaseWeight: parseNum(dataMap['Peso_Pergamino_Kg']),
    thrashedWeight: parseNum(dataMap['Peso_Excelso_Kg']),
    thrashingYield: parseNum(dataMap['Merma_Trilla_Pct']),
    processData: {
      estiloFermentacion: getString('Estilo_Fermentacion'),
      horasFermentacion: parseNum(dataMap['Horas_Fermentacion']),
      pH_Inicial: parseNum(dataMap['pH_Inicial']),
      pH_Final: parseNum(dataMap['pH_Final']),
      brixInicial: parseNum(dataMap['Brix_Inicial']),
      brixFinal: parseNum(dataMap['Brix_Final']),
      temperaturaFermentacion: parseNum(dataMap['Temperatura_Fermentacion_C']),
      tiempoSecadoDias: parseNum(dataMap['Tiempo_Secado_Dias']),
      tipoSecado: dataMap['Tipo_Secado'] || '',
      temperaturaSecado: parseNum(dataMap['Temperatura_Secado_C']),
      pasillaWeight: parseNum(dataMap['Peso_Pasilla_Kg']),
      ciscoWeight: parseNum(dataMap['Peso_Cisco_Kg']),
    }
  };

  // --- MAPEO A PHYSICAL ANALYSIS ---
  const physicalAnalysis = {
    moisturePct: parseNum(dataMap['Humedad_Pct']),
    waterActivity: parseNum(dataMap['Actividad_Agua_Aw']),
    densityGl: parseNum(dataMap['Densidad_Confirmada_gL']) || parseNum(dataMap['Densidad_gL']),
    grainColor: getString('Color_Grano'),
    sieveAnalysis: {
        size18: parseNum(dataMap['Malla_18_Pct']),
        size17: parseNum(dataMap['Malla_17_Pct']),
        size16: parseNum(dataMap['Malla_16_Pct']),
        size15: 0, size14: 0, size13: 0, size12: 0, under12: 0
    },
    defects: {
        primary: parseNum(dataMap['Defectos_Totales']),
        secondary: 0
    }
  };

  // --- MAPEO A ROAST BATCH ---
  const roastBatch = {
    roastDate: getString('Fecha_Tueste'),
    greenWeight: parseNum(dataMap['Peso_Verde_Tueste_g']),
    roastedWeight: parseNum(dataMap['Peso_Tostado_g']),
    machineId: getString('Maquina_Tueste'),
    roasterName: getString('Tostador'),
    agtronBean: parseNum(dataMap['Agtron_Grano']),
    agtronGround: parseNum(dataMap['Agtron_Molido']),
    roastTime: getString('Tiempo_Tueste'),
    maxTemp: parseNum(dataMap['Temperatura_Maxima']),
    roastLevel: getString('Nivel_Tueste'),
    notes: getString('Notas_Tueste')
  };

  // --- MAPEO A CVA CUPPING ---
  const cuppingDate = getString('Fecha_Catacion');
  const tasterName = getString('Catador');
  
  // Afectivo 1-9
  const cvaFragranceAroma = parseNum(dataMap['CVA_Fragancia_Aroma']);
  const cvaFlavorAftertaste = parseNum(dataMap['CVA_Sabor_Sabor_Residual']);
  const cvaAcidity = parseNum(dataMap['CVA_Acidez']);
  const cvaSweetness = parseNum(dataMap['CVA_Dulzor']);
  const cvaMouthfeel = parseNum(dataMap['CVA_Cuerpo_Mouthfeel']);
  const cvaUniformity = parseNum(dataMap['CVA_Uniformidad']);
  const cvaOverall = parseNum(dataMap['CVA_Impresion_Global']); 
  const cvaDefectsDeduction = parseNum(dataMap['CVA_Defectos_Deduccion']);
  
  // Total máximo posible: 63 (7 atributos x 9)
  const cvaFinalScore = 
    cvaFragranceAroma + 
    cvaFlavorAftertaste + 
    cvaAcidity + 
    cvaSweetness + 
    cvaMouthfeel + 
    cvaUniformity + 
    cvaOverall - 
    cvaDefectsDeduction;

  // Calculo simplificado para Legacy 100 pt: 
  // (Valor Base 37 + (Suma CVA max 63)). Esto es una aproximación para fines demostrativos,
  // En la vida real la SCA recomienda un mapeo más complejo.
  const legacy100ScoreEquivalent = parseFloat((37 + cvaFinalScore).toFixed(2));

  const cvaCupping = {
    cuppingDate,
    tasterName,
    descriptiveData: {
      aroma: dataMap['Descriptores_Aroma'] || '',
      sabor: dataMap['Descriptores_Sabor'] || '',
      tipoAcidez: dataMap['Tipo_Acidez'] || '',
      intensidadAcidez: dataMap['Intensidad_Acidez'] || '',
      tipoCuerpo: dataMap['Tipo_Cuerpo'] || '',
      intensidadDulzor: dataMap['Intensidad_Dulzor'] || '',
      defectos: dataMap['Defectos_Descriptivos'] || ''
    },
    cvaFragranceAroma,
    cvaFlavorAftertaste,
    cvaAcidity,
    cvaSweetness,
    cvaMouthfeel,
    cvaUniformity,
    cvaOverall,
    cvaDefectsDeduction,
    cvaFinalScore,
    legacy100ScoreEquivalent
  };

  return {
    inventory,
    physicalAnalysis,
    roastBatch,
    cvaCupping
  };
}
