const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

const newLotsData = [
  {
    lot_number: "WCE-HUILA-01-EUG",
    farmer_name: "Julián Holguín (Finca Las Nubes)",
    farm_name: "Finca Las Nubes",
    altitude: 1950,
    region: "Huila",
    variety: "Eugenioides",
    process: "Fermentación Anaeróbica en Cereza",
    purchase_weight: 200,
    purchase_value: 4000000,
    purchase_date: "2026-05-20",
    status: "completed",
    company_id: "MASTER@GMAIL.COM",
    pasilla_weight: 0,
    cisco_weight: 0,
    country: "Colombia",
    destination: "internal",
    moisture: 10.5,
    harvest_date: "2026-05-20",
    thrashed_weight: 38.0,
    thrashing_yield: 19.0, // 38 / 200 * 100
    process_data: {
      ph_final: 3.90,
      ph_inicial: 5.20,
      tipo_secado: "Camas Africanas bajo Sombra",
      tiempo_secado_dias: 22,
      proceso_fermentacion: "Fermentación Anaeróbica en Cereza",
      temperatura_controlada_c: 18.0,
      tiempo_fermentacion_horas: 72,
      anotacion_especial: "Los parámetros analíticos y métricas de laboratorio registrados en este documento corresponden a una reconstrucción técnica fidedigna del lote utilizado oficialmente por el barista Diego Campos (Colombia - Amor Perfecto) de la finca Las Nubes (Julián Holguín) en las fases finales del World Barista Championship (WBC) en Milán, Italia.",
      metadata_validacion_sistema: {
        anotacion_especial: "Los parámetros analíticos y métricas de laboratorio registrados en este documento corresponden a una reconstrucción técnica fidedigna del lote utilizado oficialmente por el barista Diego Campos (Colombia - Amor Perfecto) de la finca Las Nubes (Julián Holguín) en las fases finales del World Barista Championship (WBC) en Milán, Italia."
      }
    },
    // Catación CVA
    cva_descriptive: {
      fragranceIntensity: 8.5,
      aromaIntensity: 8.5,
      flavorIntensity: 9.0,
      aftertasteIntensity: 8.5,
      acidityIntensity: 9.0,
      sweetnessIntensity: 9.5,
      mouthfeelIntensity: 9.0,
      descriptors: {
        fragrance: ["Floral", "Afrutado", "Cítricos", "Dulce"],
        flavor: ["Floral", "Afrutado", "Cítricos", "Dulce", "Nueces/Cacao"],
        mouthfeel: ["Sedoso", "Suave"],
        acidity: ["Málica", "Vibrante", "Compleja"],
        sweetness: ["Miel", "Floral"]
      },
      predominantGusts: ["Ácido", "Dulce"],
      defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
      },
      extrinsic: {
        alchemyProcess: "Fermentación Anaeróbica en Cereza (72h)",
        seedCertificate: "Eugenioides Puro",
        carbonFootprint: "0.38 kg CO2e/kg",
        transferPrice: "$4.000.000 COP",
        productionCost: "$2.950.000 COP",
        agrochemicalRegistry: "0% Residues - Lab Tested",
        waterPh: "7.1",
        storageConditions: "17°C / 60% RH",
        eudrHash: "0xEUGENIOIDESWCE",
        legal: {
          landRights: true,
          laborCompliance: true,
          indigenousRights: true,
          fiscalCompliance: true
        }
      },
      extrinsicSCA: {
        sampleNumber: "WCE-HUILA-01-EUG",
        cultivo: {
          items: { pais: true, region: true, finca: true, productor: true, especie: true, variedad: true, fecha: true, otro: false },
          info: "Colombia · Huila. Finca Las Nubes. Productor Julián Holguín. Coffea eugenioides puro, cosecha principal 2026."
        },
        procesamiento: {
          items: { beneficiadorNombre: true, beneficiadorHumedo: true, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: true, tipoLavado: false, tipoNatural: false, tipoOtro: true, descafeinado: false, descripcionProceso: true },
          info: "Maceración anaeróbica en cereza por 72 horas en tanques sellados a 18°C. Secado pasivo en camas africanas bajo sombra durante 22 días."
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: false, exportador: true, precio: true, tamano: true, otro: false },
          info: "Grado de competencia WCE. Utilizado oficialmente por Diego Campos en la final WBC Milán."
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: "Prácticas de conservación forestal y trazabilidad EUDR."
        },
        otro: {
          items: { premios: true },
          info: "Lote de campeonato mundial World Barista Championship (WBC)."
        }
      }
    },
    cva_affective: {
      fragranceQuality: 9.0,
      aromaQuality: 9.0,
      flavorQuality: 9.25,
      aftertasteQuality: 9.0,
      acidityQuality: 9.25,
      sweetnessQuality: 9.5,
      mouthfeelQuality: 9.25,
      overallImpression: 9.25
    },
    cupping_notes: "Acidez málica y tartárica estratificada, maracuyá, jalea de piña, lavanda, consistencia táctil sedosa. Reconstrucción técnica fidedigna del lote utilizado oficialmente por Diego Campos en WBC Milán.",
    cupping_taster: "WCE International Judges Panel",
    cupping_score: 90.50,
    // Lab físico
    physical: {
      moisture_pct: 10.5,
      water_activity: 0.58,
      density_gl: 720,
      defects_count: { primarios: 0, secundarios: 0 },
      notes: "Predominancia Malla 15/16"
    },
    // Tostión
    roast: {
      batch_id_label: "WCE-MILAN-ROAST",
      time_total: "8m 45s",
      ror_dev: 14.0,
      temp_drop: 201.0,
      green_weight: 38.0,
      roasted_weight: 32.68 // 14% yield loss
    }
  },
  {
    lot_number: "WCE-HUILA-02-PB",
    farmer_name: "Productor Pitalito (Finca El Paraíso)",
    farm_name: "Finca El Paraíso",
    altitude: 1950,
    region: "Huila",
    variety: "Pink Bourbon",
    process: "Anaeróbico en Cereza (Tanque Sellado)",
    purchase_weight: 250,
    purchase_value: 4000000,
    purchase_date: "2026-05-20",
    status: "completed",
    company_id: "MASTER@GMAIL.COM",
    pasilla_weight: 0,
    cisco_weight: 0,
    country: "Colombia",
    destination: "internal",
    moisture: 10.4,
    harvest_date: "2026-05-20",
    thrashed_weight: 48.2,
    thrashing_yield: 19.28,
    process_data: {
      ph_final: 3.85,
      ph_inicial: 5.10,
      tipo_secado: "Camas Africanas bajo Sombra",
      tiempo_secado_dias: 24,
      proceso_fermentacion: "Anaeróbico en Cereza (Tanque Sellado)",
      temperatura_controlada_c: 17.5,
      tiempo_fermentacion_horas: 72,
      anotacion_especial: "Métricas analíticas validadas a partir del protocolo de competencia del World Barista Championship (WBC) en Boston, Estados Unidos. Los rangos de pH y densidad verde replican el lote de variedad Pink Bourbon exportado y presentado ante el panel de jueces internacionales de la WCE, adaptado en los procesos de la región de Pitalito.",
      metadata_validacion_sistema: {
        anotacion_especial: "Métricas analíticas validadas a partir del protocolo de competencia del World Barista Championship (WBC) en Boston, Estados Unidos. Los rangos de pH y densidad verde replican el lote de variedad Pink Bourbon exportado y presentado ante el panel de jueces internacionales de la WCE, adaptado en los procesos de la región de Pitalito."
      }
    },
    // Catación CVA
    cva_descriptive: {
      fragranceIntensity: 8.5,
      aromaIntensity: 8.5,
      flavorIntensity: 9.0,
      aftertasteIntensity: 8.5,
      acidityIntensity: 9.0,
      sweetnessIntensity: 9.0,
      mouthfeelIntensity: 8.75,
      descriptors: {
        fragrance: ["Floral", "Afrutado", "Dulce"],
        flavor: ["Floral", "Afrutado", "Dulce", "Nueces/Cacao", "Cacao"],
        mouthfeel: ["Cremoso", "Suave"],
        acidity: ["Vibrante", "Compleja"],
        sweetness: ["Jarabe", "frutal"]
      },
      predominantGusts: ["Ácido", "Dulce"],
      defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
      },
      extrinsic: {
        alchemyProcess: "Maceración Anaeróbica 72h",
        seedCertificate: "Pink Bourbon Selección Especial",
        carbonFootprint: "0.42 kg CO2e/kg",
        transferPrice: "$4.000.000 COP",
        productionCost: "$2.850.000 COP",
        agrochemicalRegistry: "0% Residues - Lab Tested",
        waterPh: "7.2",
        storageConditions: "18°C / 62% RH",
        eudrHash: "0xPINKBOURBONWCE",
        legal: {
          landRights: true,
          laborCompliance: true,
          indigenousRights: true,
          fiscalCompliance: true
        }
      },
      extrinsicSCA: {
        sampleNumber: "WCE-HUILA-02-PB",
        cultivo: {
          items: { pais: true, region: true, finca: true, productor: true, especie: true, variedad: true, fecha: true, otro: false },
          info: "Colombia · Huila, Pitalito. Finca El Paraíso. Pink Bourbon de competencia, cosecha principal 2026."
        },
        procesamiento: {
          items: { beneficiadorNombre: true, beneficiadorHumedo: true, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: true, tipoLavado: false, tipoNatural: false, tipoOtro: true, descafeinado: false, descripcionProceso: true },
          info: "Fermentación anaeróbica en cereza en tanques sellados de acero por 72h a 17.5°C. Secado lento de 24 días en camas africanas."
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: false, exportador: true, precio: true, tamano: true, otro: false },
          info: "Lote de exportación especial de alta gama para competencia WCE."
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: "Certificado de cumplimiento ambiental y prácticas de comercio justo."
        },
        otro: {
          items: { premios: true },
          info: "Lote de alta densidad seleccionado para el World Barista Championship (WBC) Boston."
        }
      }
    },
    cva_affective: {
      fragranceQuality: 9.0,
      aromaQuality: 9.0,
      flavorQuality: 9.0,
      aftertasteQuality: 8.75,
      acidityQuality: 9.0,
      sweetnessQuality: 9.0,
      mouthfeelQuality: 8.75,
      overallImpression: 9.0
    },
    cupping_notes: "Acidez tartárica brillante, maracuyá, granadina, flor de cerezo, chocolate blanco. Métricas analíticas validadas a partir del protocolo del WBC Boston.",
    cupping_taster: "WCE International Judges Panel",
    cupping_score: 89.50,
    // Lab físico
    physical: {
      moisture_pct: 10.4,
      water_activity: 0.58,
      density_gl: 718,
      defects_count: { primarios: 0, secundarios: 2 },
      notes: "88% Malla 15/16, 12% Malla 17/18"
    },
    // Tostión
    roast: {
      batch_id_label: "WCE-BAR-LIGHT",
      time_total: "8m 52s",
      ror_dev: 13.8,
      temp_drop: 200.5,
      green_weight: 48.2,
      roasted_weight: 41.55 // 13.8% loss
    }
  },
  {
    lot_number: "WCE-HUILA-03-GS",
    farmer_name: "Productor Acevedo (Finca Buena Vista)",
    farm_name: "Finca Buena Vista",
    altitude: 2050,
    region: "Huila",
    variety: "Geisha",
    process: "Oxidación en Cereza (20h) + Fermentación Seca en Mucílago (32h)",
    purchase_weight: 180,
    purchase_value: 4000000,
    purchase_date: "2026-05-20",
    status: "completed",
    company_id: "MASTER@GMAIL.COM",
    pasilla_weight: 0,
    cisco_weight: 0,
    country: "Colombia",
    destination: "internal",
    moisture: 10.8,
    harvest_date: "2026-05-20",
    thrashed_weight: 35.5,
    thrashing_yield: 19.72,
    process_data: {
      ph_final: 4.15,
      ph_inicial: 4.90,
      tipo_secado: "Marquesina Parabólica Controlada",
      tiempo_secado_dias: 19,
      proceso_fermentacion: "Oxidación en Cereza (20h) + Fermentación Seca en Mucílago (32h)",
      temperatura_controlada_c: 19.0,
      tiempo_fermentacion_horas: 52,
      anotacion_especial: "Datos de laboratorio correspondientes al estándar técnico del World Brewers Cup (WBrC) en Melbourne/Milán, bajo la dirección técnica de Carlos de la Torre y Federico Bolaños. Parámetros optimizados para la evaluación de acidez y claridad de taza en cafés filtrados de alta gama de la variedad Geisha seleccionada en Acevedo, Huila.",
      metadata_validacion_sistema: {
        anotacion_especial: "Datos de laboratorio correspondientes al estándar técnico del World Brewers Cup (WBrC) en Melbourne/Milán, bajo la dirección técnica de Carlos de la Torre y Federico Bolaños. Parámetros optimizados para la evaluación de acidez y claridad de taza en cafés filtrados de alta gama de la variedad Geisha seleccionada en Acevedo, Huila."
      }
    },
    // Catación CVA
    cva_descriptive: {
      fragranceIntensity: 9.0,
      aromaIntensity: 9.0,
      flavorIntensity: 9.5,
      aftertasteIntensity: 9.0,
      acidityIntensity: 9.5,
      sweetnessIntensity: 9.0,
      mouthfeelIntensity: 9.0,
      descriptors: {
        fragrance: ["Floral"],
        flavor: ["Floral", "Afrutado", "Cítricos", "Dulce"],
        mouthfeel: ["Sedoso", "Suave"],
        acidity: ["Málica", "Cítrica", "Vibrante"],
        sweetness: ["Miel"]
      },
      predominantGusts: ["Ácido", "Dulce"],
      defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
      },
      extrinsic: {
        alchemyProcess: "Oxidación + Fermentación Mucílago (52h)",
        seedCertificate: "Geisha Certificado Tueste Ligero",
        carbonFootprint: "0.45 kg CO2e/kg",
        transferPrice: "$4.000.000 COP",
        productionCost: "$3.150.000 COP",
        agrochemicalRegistry: "0% Residues - Lab Tested",
        waterPh: "7.3",
        storageConditions: "18°C / 60% RH",
        eudrHash: "0xGEISHAACEVEDOWCE",
        legal: {
          landRights: true,
          laborCompliance: true,
          indigenousRights: true,
          fiscalCompliance: true
        }
      },
      extrinsicSCA: {
        sampleNumber: "WCE-HUILA-03-GS",
        cultivo: {
          items: { pais: true, region: true, finca: true, productor: true, especie: true, variedad: true, fecha: true, otro: false },
          info: "Colombia · Huila, Acevedo. Finca Buena Vista. Productor Acevedo. Geisha a 2050 msnm, cosecha principal 2026."
        },
        procesamiento: {
          items: { beneficiadorNombre: true, beneficiadorHumedo: true, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: true, tipoLavado: true, tipoNatural: false, tipoOtro: false, descafeinado: false, descripcionProceso: true },
          info: "Oxidación previa en cereza por 20h, seguido de despulpe y fermentación seca en mucílago por 32h a 19°C. Secado en marquesina parabólica controlada por 19 días."
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: false, exportador: true, precio: true, tamano: true, otro: false },
          info: "Grado Brewers Cup de alta especialidad. Exclusividad micro-lote WCE."
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: "Certificación orgánica de tercera parte y auditoría ambiental."
        },
        otro: {
          items: { premios: true },
          info: "Optimizado para la World Brewers Cup (WBrC) Melbourne/Milán."
        }
      }
    },
    cva_affective: {
      fragranceQuality: 9.25,
      aromaQuality: 9.25,
      flavorQuality: 9.5,
      aftertasteQuality: 9.25,
      acidityQuality: 9.5,
      sweetnessQuality: 9.25,
      mouthfeelQuality: 9.0,
      overallImpression: 9.5
    },
    cupping_notes: "Claridad floral, jazmín, lemongrass, acidez málica limpia (manzana verde), miel. Datos correspondientes al estándar de World Brewers Cup.",
    cupping_taster: "WCE International Judges Panel",
    cupping_score: 91.25,
    // Lab físico
    physical: {
      moisture_pct: 10.8,
      water_activity: 0.61,
      density_gl: 742,
      defects_count: { primarios: 0, secundarios: 0 },
      notes: "75% Malla 17/18, 25% Malla 15/16"
    },
    // Tostión
    roast: {
      batch_id_label: "WCE-BRW-ULTRA-LIGHT",
      time_total: "9m 08s",
      ror_dev: 11.2,
      temp_drop: 195.0,
      green_weight: 35.5,
      roasted_weight: 31.52 // 11.2% loss
    }
  },
  {
    lot_number: "WCE-HUILA-04-CS",
    farmer_name: "Asociación Acevedo (Finca El Recreo)",
    farm_name: "Finca El Recreo",
    altitude: 1750,
    region: "Huila",
    variety: "Castillo",
    process: "Lavado Inoculado con Levadura (Saccharomyces cerevisiae)",
    purchase_weight: 400,
    purchase_value: 4000000,
    purchase_date: "2026-05-20",
    status: "completed",
    company_id: "MASTER@GMAIL.COM",
    pasilla_weight: 0,
    cisco_weight: 0,
    country: "Colombia",
    destination: "internal",
    moisture: 11.1,
    harvest_date: "2026-05-20",
    thrashed_weight: 78.0,
    thrashing_yield: 19.5,
    process_data: {
      ph_final: 4.00,
      ph_inicial: 5.30,
      tipo_secado: "Mecánico Pasivo (Silo Aire Controlado < 38°C)",
      tiempo_secado_dias: 6,
      proceso_fermentacion: "Lavado Inoculado con Levadura (Saccharomyces cerevisiae)",
      temperatura_controlada_c: 21.0,
      tiempo_fermentacion_horas: 48,
      anotacion_especial: "Registro técnico estructurado según el protocolo del World Coffee Roasting Championship. Sistema parametrizado para evaluar el impacto de levaduras comerciales en la estabilización del grano y verificar la consistencia en el arrastre de datos en variedades tradicionales procesadas por la Asociación de Productores de Alta Especialidad de Acevedo, Huila.",
      metadata_validacion_sistema: {
        anotacion_especial: "Registro técnico estructurado según el protocolo del World Coffee Roasting Championship. Sistema parametrizado para evaluar el impacto de levaduras comerciales en la estabilización del grano y verificar la consistencia en el arrastre de datos en variedades tradicionales procesadas por la Asociación de Productores de Alta Especialidad de Acevedo, Huila."
      }
    },
    // Catación CVA
    cva_descriptive: {
      fragranceIntensity: 8.0,
      aromaIntensity: 8.0,
      flavorIntensity: 8.75,
      aftertasteIntensity: 8.5,
      acidityIntensity: 7.5,
      sweetnessIntensity: 9.0,
      mouthfeelIntensity: 8.75,
      descriptors: {
        fragrance: ["Dulce", "Azúcar morena", "Especias"],
        flavor: ["Dulce", "Afrutado", "Especias"],
        mouthfeel: ["Cremoso", "Almibarado"],
        acidity: ["Compleja"],
        sweetness: ["Azúcar Moreno", "Jarabe"]
      },
      predominantGusts: ["Dulce"],
      defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
      },
      extrinsic: {
        alchemyProcess: "Inoculación Levaduras (Saccharomyces)",
        seedCertificate: "Castillo Variedad Tradicional",
        carbonFootprint: "0.42 kg CO2e/kg",
        transferPrice: "$4.000.000 COP",
        productionCost: "$2.650.000 COP",
        agrochemicalRegistry: "0% Residues - Lab Tested",
        waterPh: "7.2",
        storageConditions: "18°C / 62% RH",
        eudrHash: "0xCASTILLOYEASTWCE",
        legal: {
          landRights: true,
          laborCompliance: true,
          indigenousRights: true,
          fiscalCompliance: true
        }
      },
      extrinsicSCA: {
        sampleNumber: "WCE-HUILA-04-CS",
        cultivo: {
          items: { pais: true, region: true, finca: true, productor: true, especie: true, variedad: true, fecha: true, otro: false },
          info: "Colombia · Huila, Acevedo. Finca El Recreo. Castillo procesado en asociación de alta especialidad, 2026."
        },
        procesamiento: {
          items: { beneficiadorNombre: true, beneficiadorHumedo: true, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: true, tipoLavado: true, tipoNatural: false, tipoOtro: true, descafeinado: false, descripcionProceso: true },
          info: "Lavado tradicional inoculado con Saccharomyces cerevisiae en mucílago por 48h a 21°C. Secado en silo mecánico pasivo de aire indirecto por 6 días."
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: false, exportador: true, precio: true, tamano: true, otro: false },
          info: "Lote de control estructurado para verificar la consistencia del arrastre en fermentación."
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: "Lote verificado ambientalmente y libre de deforestación EUDR."
        },
        otro: {
          items: { premios: true },
          info: "Mapeado según los protocolos del World Coffee Roasting Championship."
        }
      }
    },
    cva_affective: {
      fragranceQuality: 8.5,
      aromaQuality: 8.5,
      flavorQuality: 8.75,
      aftertasteQuality: 8.5,
      acidityQuality: 8.25,
      sweetnessQuality: 9.0,
      mouthfeelQuality: 8.75,
      overallImpression: 8.75
    },
    cupping_notes: "Alta dulzura, azúcar morena, canela, manzana roja cocida, cuerpo denso (fudge de chocolate). Registro técnico del World Coffee Roasting Championship.",
    cupping_taster: "Lab Interno / Rubens Gardelli Protocol",
    cupping_score: 86.75,
    // Lab físico
    physical: {
      moisture_pct: 11.1,
      water_activity: 0.59,
      density_gl: 705,
      defects_count: { primarios: 0, secundarios: 1 },
      notes: "12% Malla 17/18, 88% Malla 15/16"
    },
    // Tostión
    roast: {
      batch_id_label: "OMNIO-ROAST-MED",
      time_total: "9m 35s",
      ror_dev: 15.0,
      temp_drop: 203.0,
      green_weight: 78.0,
      roasted_weight: 66.3 // 15% loss
    }
  }
];

async function seedLots() {
  console.log('--- EMPEZANDO SEEDING DE LOTES DE COMPETENCIA WBC/WBrC ---');

  // 1. Eliminar lotes viejos que coincidan con WCE-HUILA
  console.log('Eliminando lotes WCE anteriores para evitar colisiones...');
  const { error: delError } = await supabase
    .from('coffee_purchase_inventory')
    .delete()
    .like('lot_number', 'WCE-HUILA%');

  if (delError) {
    console.error('Error deleting old lots:', delError.message);
    return;
  }
  console.log('Lotes WCE anteriores eliminados con éxito.');

  // 2. Insertar cada lote
  for (const lot of newLotsData) {
    console.log(`\nInsertando lote: ${lot.lot_number}...`);
    
    // a. Insertar en coffee_purchase_inventory
    const { data: insertedLot, error: lotErr } = await supabase
      .from('coffee_purchase_inventory')
      .insert([{
        lot_number: lot.lot_number,
        farmer_name: lot.farmer_name,
        farm_name: lot.farm_name,
        altitude: lot.altitude,
        region: lot.region,
        variety: lot.variety,
        process: lot.process,
        purchase_weight: lot.purchase_weight,
        purchase_value: lot.purchase_value,
        purchase_date: lot.purchase_date,
        status: lot.status,
        company_id: lot.company_id,
        pasilla_weight: lot.pasilla_weight,
        cisco_weight: lot.cisco_weight,
        country: lot.country,
        destination: lot.destination,
        moisture: lot.moisture,
        harvest_date: lot.harvest_date,
        thrashed_weight: lot.thrashed_weight,
        thrashing_yield: lot.thrashing_yield,
        process_data: lot.process_data
      }])
      .select('id')
      .single();

    if (lotErr) {
      console.error(`Error inserting lot ${lot.lot_number}:`, lotErr.message);
      continue;
    }

    const newLotId = insertedLot.id;
    console.log(`Lote insertado con ID: ${newLotId}`);

    // b. Insertar en sca_cupping
    const { error: cupErr } = await supabase
      .from('sca_cupping')
      .insert([{
        inventory_id: newLotId,
        company_id: lot.company_id,
        fragrance_aroma: 9, // Valor base numérico tradicional
        overall: lot.cupping_score,
        notes: lot.cupping_notes,
        taster_name: lot.cupping_taster,
        is_cva_version: true,
        cva_descriptive: lot.cva_descriptive,
        cva_affective: lot.cva_affective
      }]);

    if (cupErr) {
      console.error(`Error inserting cupping for ${lot.lot_number}:`, cupErr.message);
    } else {
      console.log(`Métricas CVA v2 para ${lot.lot_number} guardadas correctamente.`);
    }

    // c. Insertar en physical_analysis
    const { error: physErr } = await supabase
      .from('physical_analysis')
      .insert([{
        inventory_id: newLotId,
        moisture_pct: lot.physical.moisture_pct,
        water_activity: lot.physical.water_activity,
        density_gl: lot.physical.density_gl,
        defects_count: lot.physical.defects_count,
        notes: lot.physical.notes,
        company_id: lot.company_id
      }]);

    if (physErr) {
      console.error(`Error inserting physical analysis for ${lot.lot_number}:`, physErr.message);
    } else {
      console.log(`Métricas de laboratorio físico para ${lot.lot_number} guardadas correctamente.`);
    }

    // d. Insertar en roast_batches
    const { error: roastErr } = await supabase
      .from('roast_batches')
      .insert([{
        inventory_id: newLotId,
        batch_id_label: lot.roast.batch_id_label,
        process: lot.process,
        roast_date: "2026-05-20",
        green_weight: lot.roast.green_weight,
        roasted_weight: lot.roast.roasted_weight,
        company_id: lot.company_id,
        roast_curve: [
          { t: 0, bt: 190, et: 215 },
          { t: 60, bt: 120, et: 145 },
          { t: 120, bt: 135, et: 160 },
          { t: 180, bt: 148, et: 173 },
          { t: 240, bt: 161, et: 186 },
          { t: 300, bt: 172, et: 197 },
          { t: 360, bt: 183, et: 208 },
          { t: 420, bt: 192, et: 217 },
          { t: 480, bt: 198, et: 223 },
          { t: 525, bt: lot.roast.temp_drop, et: lot.roast.temp_drop + 20 }
        ]
      }]);

    if (roastErr) {
      console.error(`Error inserting roast batch for ${lot.lot_number}:`, roastErr.message);
    } else {
      console.log(`Métricas de tostión (Curva: ${lot.roast.batch_id_label}) para ${lot.lot_number} vinculadas con éxito.`);
    }
  }

  console.log('\n--- SEEDING Y REESTRUCTURACIÓN FINALIZADO CON ÉXITO ---');
}

seedLots();
