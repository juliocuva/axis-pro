import * as XLSX from 'xlsx';

// Interfaces para tipar la salida del Excel en memoria
export interface ExcelParsedPayload {
  inventory: {
    lotNumber: string;
    commercialName: string;
    harvestDate: string;
    farmerName: string;
    farmName: string;
    altitude: number;
    region: string;
    municipality: string;
    latitude: number;
    longitude: number;
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
    let val = row[1];
    
    // Si la columna B est vaca, intentar leer de la columna C (ndice 2)
    // Esto previene errores si el usuario escribi en C o si hay celdas combinadas.
    if ((val === undefined || val === null || val === '') && row.length > 2) {
        val = row[2];
    }
    
    if (typeof key === 'string' && key.trim() !== '') {
      dataMap[key.trim()] = val;
    }
  }

  const getString = (key: string): string => {
    const val = dataMap[key];
    return val !== undefined && val !== null ? String(val) : '';
  };

  const parseTimeStr = (key: string): string => {
    const val = dataMap[key];
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'number') {
        const total = Math.round(val * 1440);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return String(val);
  };

  // --- FUNCIONES AUXILIARES PARA COORDENADAS ---
  const rawGps = getString('Coordenadas_GPS');
  let lat = 0;
  let lng = 0;
  if (rawGps) {
      // Normalizar comas a puntos para tratar con "4,75 N, 76,10 W" o "4.75, -76.10"
      // Luego extraemos todos los bloques de números (con o sin decimales)
      const normalizedGps = rawGps.replace(/,/g, '.');
      const matches = normalizedGps.match(/-?\d+(\.\d+)?/g);
      if (matches && matches.length >= 2) {
          lat = parseFloat(matches[0]);
          lng = parseFloat(matches[1]);
          // Ajuste heurístico: Si dice "S" o "W", hacemos negativo
          if (rawGps.toUpperCase().includes('S') && lat > 0) lat = -lat;
          if (rawGps.toUpperCase().includes('W') && lng > 0) lng = -lng;
      }
  }

  const parseDateStr = (key: string): string => {
    const val = dataMap[key];
    if (val === undefined || val === null || val === '') return '';
    
    if (typeof val === 'number') {
       const dateObj = XLSX.SSF.parse_date_code(val);
       if (dateObj) {
           const y = dateObj.y;
           const m = String(dateObj.m).padStart(2, '0');
           const d = String(dateObj.d).padStart(2, '0');
           return `${y}-${m}-${d}`;
       }
       return '';
    }

    const str = String(val).trim();
    const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
        const d = match[1].padStart(2, '0');
        const m = match[2].padStart(2, '0');
        const y = match[3];
        return `${y}-${m}-${d}`; // YYYY-MM-DD format suitable for databases
    }
    return str;
  };

  // --- MAPEO A INVENTORY ---
  const inventory = {
    lotNumber: getString('Numero_Lote'),
    commercialName: getString('Nombre_Comercial_Lote'),
    harvestDate: parseDateStr('Fecha_Cosecha'),
    farmerName: getString('Caficultor'),
    farmName: getString('Finca'),
    altitude: parseNum(dataMap['Altura_msnm']),
    region: getString('Departamento'),
    municipality: getString('Municipio'),
    latitude: lat,
    longitude: lng,
    variety: getString('Variedad'),
    process: getString('Proceso'),
    purchaseWeight: parseNum(dataMap['Peso_Pergamino_Kg']),
    thrashedWeight: parseNum(dataMap['Peso_Excelso_Kg']),
    thrashingYield: parseNum(dataMap['Merma_Trilla_Pct']),
    processData: {
      sicaId: getString('SICA_ID'),
      gpsCoordinates: getString('Coordenadas_GPS'),
      fermentation_style: (() => {
        const fs = getString('Estilo_Fermentacion').toLowerCase();
        if (fs.includes('anaerob') || fs.includes('anaerób')) return 'anaerobico';
        if (fs.includes('aerob') || fs.includes('aerób')) return 'aerobic';
        if (fs.includes('carbonic') || fs.includes('carbónic')) return 'carbonic_maceration';
        if (fs.includes('lactic') || fs.includes('láctic')) return 'lactic';
        if (fs.includes('doble') || fs.includes('double')) return 'double_fermentation';
        if (fs.includes('co-') || fs.includes('coferment')) return 'co_fermentation';
        if (fs.includes('choque') || fs.includes('shock')) return 'thermal_shock';
        if (fs.includes('koji')) return 'koji';
        if (fs.includes('estandar') || fs.includes('estándar') || fs.includes('tradicional')) return 'estandar';
        return fs ? 'otro' : 'estandar';
      })(),
      recipiente_fermentacion: getString('Contenedor_Fermentacion') || getString('Recipiente_Fermentacion') || 'Plastic Tank',
      duracion_fermentacion_horas: parseNum(dataMap['Horas_Fermentacion']),
      ph_inicial: parseNum(dataMap['pH_Inicial']),
      ph_final: parseNum(dataMap['pH_Final']),
      brix_inicial: parseNum(dataMap['Brix_Inicial']),
      brix_final: parseNum(dataMap['Brix_Final']),
      temperatura_masa_max: parseNum(dataMap['Temperatura_Fermentacion_C']),
      duracion_secado: parseNum(dataMap['Tiempo_Secado_Dias']) ? parseNum(dataMap['Tiempo_Secado_Dias']) * 24 : undefined,
      tipo_secado: (() => {
        const ts = String(dataMap['Tipo_Secado'] || '').toLowerCase();
        if (ts.includes('cama') || ts.includes('african')) return 'African Beds';
        if (ts.includes('marquesina') || ts.includes('parabol') || ts.includes('canopy')) return 'Parabolic Canopy';
        if (ts.includes('silo') || ts.includes('mecanic')) return 'Mechanical Silo';
        if (ts.includes('patio') || ts.includes('sun')) return 'Sun Patio';
        return '';
      })(),
      temperatura_secado: parseNum(dataMap['Temperatura_Secado_C']),
      pasillaWeight: parseNum(dataMap['Peso_Pasilla_Kg']),
      ciscoWeight: parseNum(dataMap['Peso_Cisco_Kg']),
    }
  };

  let m18 = parseNum(dataMap['Malla_18_Pct']);
  let m17 = parseNum(dataMap['Malla_17_Pct']);
  let m16 = parseNum(dataMap['Malla_16_Pct']);
  
  // Si la suma supera 100, asumimos que el usuario ingresó kilos (ej. 190kg, 342kg, 230kg)
  // Convertimos automáticamente a porcentajes.
  const sumMeshes = m18 + m17 + m16;
  if (sumMeshes > 100) {
      m18 = parseFloat(((m18 / sumMeshes) * 100).toFixed(1));
      m17 = parseFloat(((m17 / sumMeshes) * 100).toFixed(1));
      m16 = parseFloat(((m16 / sumMeshes) * 100).toFixed(1));
  }

  let menores = parseFloat((100 - (m18 + m17 + m16)).toFixed(1));
  // Si las mallas vienen vacías o suman más de 100 por algún error de redondeo, ajustamos
  if (menores < 0 || (m18 === 0 && m17 === 0 && m16 === 0)) menores = 0;

  // --- MAPEO A PHYSICAL ANALYSIS ---
  const physicalAnalysis = {
    analysisDate: parseDateStr('Fecha_Analisis'),
    moisturePct: parseNum(dataMap['Humedad_Pct']),
    waterActivity: parseNum(dataMap['Actividad_Agua_Aw']),
    densityGl: parseNum(dataMap['Densidad_Confirmada_gL']) || parseNum(dataMap['Densidad_gL']),
    grainColor: getString('Color_Grano'),
    sieveAnalysis: {
        m18: m18,
        m17: m17,
        m16: m16,
        menores: menores
    },
    defects: {
        primary: parseNum(dataMap['Defectos_Totales']),
        secondary: 0
    }
  };

  // --- MAPEO A ROAST BATCH ---
  const roastBatch = {
    roastDate: parseDateStr('Fecha_Tueste'),
    greenWeight: parseNum(dataMap['Peso_Verde_Entrada_Kg']),
    roastedWeight: parseNum(dataMap['Peso_Tostado_Salida_Kg']),
    machineId: getString('Tostadora_ID'),
    roasterName: getString('Operario_Tueste'),
    agtronBean: parseNum(dataMap['Agtron_Grano']),
    agtronGround: parseNum(dataMap['Agtron_Molido']),
    roastTime: parseTimeStr('Tiempo_Tueste_min'),
    maxTemp: parseNum(dataMap['Temperatura_Max_C']),
    roastLevel: getString('Nivel_Tueste'),
    notes: getString('Perfil_Tueste_Notas')
  };

  // --- MAPEO A CVA CUPPING ---
  const cuppingDate = parseDateStr('Fecha_Catacion');
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

  // Calculo simplificado para Legacy 100 pt ajustado a las métricas del cliente: 
  // (Valor Base 30 + (Suma CVA max 63)). 
  // En la vida real la SCA recomienda un mapeo más complejo.
  const legacy100ScoreEquivalent = parseFloat((30 + cvaFinalScore).toFixed(2));

  // Funciones de mapeo para evaluación descriptiva
  const mapIntensity = (val: unknown): number => {
    if (!val) return 0;
    const s = String(val).toUpperCase();
    if (s.includes('MEDIA ALTA')) return 11;
    if (s.includes('MEDIA BAJA')) return 6;
    if (s.includes('ALTA') || s.includes('ALTO')) return 14;
    if (s.includes('MEDIA') || s.includes('MEDIO')) return 8;
    if (s.includes('BAJA') || s.includes('BAJO')) return 4;
    return 0; 
  };

  const mapBody = (val: unknown): number => {
    if (!val) return 0;
    const s = String(val).toUpperCase();
    if (s.includes('SEDOSO')) return 14;
    if (s.includes('CREMOSO')) return 11;
    if (s.includes('MEDIO')) return 8;
    if (s.includes('LIGERO')) return 5;
    if (s.includes('ACUOSO')) return 3;
    return 0; 
  };

  const parseDescriptors = (val: unknown): string[] => {
    if (!val) return [];
    return String(val).split(',').map(s => s.trim()).filter(Boolean);
  };

  const descriptive = {
    acidityIntensity: mapIntensity(dataMap['Intensidad_Acidez']),
    sweetnessIntensity: mapIntensity(dataMap['Intensidad_Dulzor']),
    mouthfeelIntensity: mapBody(dataMap['Tipo_Cuerpo']),
    descriptors: {
        fragrance: parseDescriptors(dataMap['Descriptores_Aroma']),
        flavor: parseDescriptors(dataMap['Descriptores_Sabor']),
        acidity: parseDescriptors(dataMap['Tipo_Acidez']),
        mouthfeel: parseDescriptors(dataMap['Tipo_Cuerpo'])
    },
    notes: {
        fragranceAroma: getString('Descriptores_Aroma'),
        flavorAftertaste: getString('Descriptores_Sabor'),
        acidity: getString('Tipo_Acidez'),
        other: getString('Defectos_Descriptivos')
    }
  };

  const cvaCupping = {
    cuppingDate,
    tasterName,
    descriptive,
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
