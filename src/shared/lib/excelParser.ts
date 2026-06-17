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
    thrashingYield: number;
    processData: any; // JSONB con tiempos, ph, brix
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
    descriptiveData: any;
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
function parseNum(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/,/g, '.').replace(/[^0-9.-]/g, ''));
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
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const dataMap: Record<string, any> = {};

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

  // --- MAPEO A INVENTORY ---
  const inventory = {
    lotNumber: dataMap['Numero_Lote'] || '',
    farmerName: dataMap['Caficultor'] || '',
    farmName: dataMap['Finca'] || '',
    altitude: parseNum(dataMap['Altura_msnm']),
    region: (dataMap['Municipio'] || '') + ', ' + (dataMap['Departamento'] || ''),
    variety: dataMap['Variedad'] || '',
    process: dataMap['Proceso'] || '',
    purchaseWeight: parseNum(dataMap['Peso_Pergamino_Kg']),
    thrashedWeight: parseNum(dataMap['Peso_Excelso_Kg']),
    thrashingYield: parseNum(dataMap['Merma_Trilla_Pct']),
    processData: {
      estiloFermentacion: dataMap['Estilo_Fermentacion'] || '',
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
    grainColor: dataMap['Color_Grano'] || '',
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
    roastDate: dataMap['Fecha_Tueste'] || '',
    greenWeight: parseNum(dataMap['Peso_Verde_Entrada_Kg']),
    roastedWeight: parseNum(dataMap['Peso_Tostado_Salida_Kg']),
    machineId: dataMap['Tostadora_ID'] || '',
    roasterName: dataMap['Operario_Tueste'] || '',
    agtronBean: parseNum(dataMap['Agtron_Grano']),
    agtronGround: parseNum(dataMap['Agtron_Molido']),
    roastTime: dataMap['Tiempo_Tueste_min'] ? dataMap['Tiempo_Tueste_min'].toString() : '',
    maxTemp: parseNum(dataMap['Temperatura_Max_C']),
    roastLevel: dataMap['Nivel_Tueste'] || '',
    notes: dataMap['Perfil_Tueste_Notas'] || ''
  };

  // --- MAPEO A CVA CUPPING ---
  const cuppingDate = dataMap['Fecha_Catacion'] || '';
  const tasterName = dataMap['Catador'] || '';
  
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
