const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nhhbncogvnocglrymizj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGJuY29ndm5vY2dscnltaXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzA2MDMsImV4cCI6MjA4NzA0NjYwM30.Mx8_54xL52FrhQuh5x2FHmybJIjBpIlo5PN4MHZ6TeI';
const supabase = createClient(supabaseUrl, supabaseKey);

const targetLots = {
  '1fe8cc28-4104-43fc-b4c8-448b5dfccc93': {
    lot_number: 'WCE-HUILA-01',
    cva_descriptive: {
      fragranceIntensity: 8,
      aromaIntensity: 8,
      flavorIntensity: 8.5,
      aftertasteIntensity: 8,
      acidityIntensity: 9,
      sweetnessIntensity: 9,
      mouthfeelIntensity: 8.5,
      descriptors: {
        fragrance: ["Floral", "Afrutado", "Cítricos", "Dulce", "Vainilla"],
        flavor: ["Floral", "Afrutado", "Cítricos", "Dulce", "Nueces/Cacao", "Cacao"],
        mouthfeel: ["Cremoso", "Suave"],
        acidity: ["Vibrante", "Compleja"],
        sweetness: ["floral", "frutal"]
      },
      predominantGusts: ["Ácido", "Dulce"],
      defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
      },
      extrinsic: {
        alchemyProcess: "Maceración Anaeróbica",
        seedCertificate: "Pink Bourbon",
        carbonFootprint: "0.42 kg CO2e/kg",
        transferPrice: "$2.000.000 COP",
        productionCost: "$1.450.000 COP",
        agrochemicalRegistry: "0% Residues - Lab Tested",
        waterPh: "7.2",
        storageConditions: "18°C / 62% RH",
        eudrHash: "0xWCEHUILA01",
        legal: {
          landRights: true,
          laborCompliance: true,
          indigenousRights: true,
          fiscalCompliance: true
        }
      },
      extrinsicSCA: {
        sampleNumber: "WCE-HUILA-01",
        cultivo: {
          items: { pais: true, region: true, finca: true, productor: true, especie: true, variedad: true, fecha: true, otro: false },
          info: "Colombia · Huila, Pitalito. Finca Pitalito. Productor WCE 01. Coffea arabica var. Pink Bourbon, cosecha principal 2026."
        },
        procesamiento: {
          items: { beneficiadorNombre: true, beneficiadorHumedo: true, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: true, tipoLavado: false, tipoNatural: false, tipoOtro: true, descafeinado: false, descripcionProceso: true },
          info: "Maceración anaeróbica durante 72 horas a temperatura controlada de 17.5°C en tanques de acero sellados. Secado pasivo lento de 24 días en camas africanas."
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: false, exportador: true, precio: true, tamano: true, otro: false },
          info: "Clasificación especial WCE. Exportador: Axis Coffee Exports. Precio productor: $2.000.000 COP por saco."
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: "Certificado de origen WCE y prácticas sostenibles EUDR."
        },
        otro: {
          items: { premios: true },
          info: "Lote oficial del campeonato World Coffee Events."
        }
      }
    },
    cva_affective: {
      fragranceQuality: 9,
      aromaQuality: 9,
      flavorQuality: 9,
      aftertasteQuality: 8.5,
      acidityQuality: 9,
      sweetnessQuality: 9,
      mouthfeelQuality: 8.5,
      overallImpression: 9
    }
  },
  '9e062743-6e56-46f5-af6c-e79810fb42be': {
    lot_number: 'WCE-HUILA-02',
    cva_descriptive: {
      fragranceIntensity: 9,
      aromaIntensity: 9,
      flavorIntensity: 9,
      aftertasteIntensity: 8.5,
      acidityIntensity: 9,
      sweetnessIntensity: 9,
      mouthfeelIntensity: 8.75,
      descriptors: {
        fragrance: ["Floral"],
        flavor: ["Floral", "Afrutado", "Cítricos", "Dulce"],
        mouthfeel: ["Sedoso", "Suave"],
        acidity: ["Cítrica", "Málica", "Vibrante"],
        sweetness: ["Miel"]
      },
      predominantGusts: ["Ácido", "Dulce"],
      defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
      },
      extrinsic: {
        alchemyProcess: "Lavado de Alta Densidad",
        seedCertificate: "Geisha",
        carbonFootprint: "0.42 kg CO2e/kg",
        transferPrice: "$2.000.000 COP",
        productionCost: "$1.550.000 COP",
        agrochemicalRegistry: "0% Residues - Lab Tested",
        waterPh: "7.2",
        storageConditions: "18°C / 62% RH",
        eudrHash: "0xWCEHUILA02",
        legal: {
          landRights: true,
          laborCompliance: true,
          indigenousRights: true,
          fiscalCompliance: true
        }
      },
      extrinsicSCA: {
        sampleNumber: "WCE-HUILA-02",
        cultivo: {
          items: { pais: true, region: true, finca: true, productor: true, especie: true, variedad: true, fecha: true, otro: false },
          info: "Colombia · Huila, San Agustín. Finca San Agustín. Productor WCE 02. Coffea arabica var. Geisha, cosecha principal 2026."
        },
        procesamiento: {
          items: { beneficiadorNombre: true, beneficiadorHumedo: true, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: true, tipoLavado: true, tipoNatural: false, tipoOtro: false, descafeinado: false, descripcionProceso: true },
          info: "Oxidación previa de 20 horas en cereza seguida de desmucilaginado y fermentación seca durante 32 horas. Secado en secadores parabólicos con flujo de aire regulado durante 19 días."
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: false, exportador: true, precio: true, tamano: true, otro: false },
          info: "Clasificación especial WCE. Exportador: Axis Coffee Exports."
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: "Certificado de origen WCE y prácticas sostenibles EUDR."
        },
        otro: {
          items: { premios: true },
          info: "Lote oficial del campeonato World Coffee Events."
        }
      }
    },
    cva_affective: {
      fragranceQuality: 9,
      aromaQuality: 9,
      flavorQuality: 9,
      aftertasteQuality: 9,
      acidityQuality: 9,
      sweetnessQuality: 9,
      mouthfeelQuality: 8.75,
      overallImpression: 9
    }
  },
  'a514cc1f-45d3-441f-bfcd-d766894cfacc': {
    lot_number: 'WCE-HUILA-03',
    cva_descriptive: {
      fragranceIntensity: 8.5,
      aromaIntensity: 8.5,
      flavorIntensity: 9,
      aftertasteIntensity: 8.5,
      acidityIntensity: 8,
      sweetnessIntensity: 9.5,
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
        alchemyProcess: "Fermentación con Levaduras Inoculadas",
        seedCertificate: "Castillo",
        carbonFootprint: "0.42 kg CO2e/kg",
        transferPrice: "$2.000.000 COP",
        productionCost: "$1.250.000 COP",
        agrochemicalRegistry: "0% Residues - Lab Tested",
        waterPh: "7.2",
        storageConditions: "18°C / 62% RH",
        eudrHash: "0xWCEHUILA03",
        legal: {
          landRights: true,
          laborCompliance: true,
          indigenousRights: true,
          fiscalCompliance: true
        }
      },
      extrinsicSCA: {
        sampleNumber: "WCE-HUILA-03",
        cultivo: {
          items: { pais: true, region: true, finca: true, productor: true, especie: true, variedad: true, fecha: true, otro: false },
          info: "Colombia · Huila, Acevedo. Finca Acevedo. Productor WCE 03. Coffea arabica var. Castillo, cosecha principal 2026."
        },
        procesamiento: {
          items: { beneficiadorNombre: true, beneficiadorHumedo: true, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: true, tipoLavado: true, tipoNatural: false, tipoOtro: true, descafeinado: false, descripcionProceso: true },
          info: "Lavado con inoculación de levadura (Saccharomyces cerevisiae) en fase de mucílago durante 48 horas a temperatura controlada de 21°C. Secado mecánico pasivo en silos de flujo alternado durante 6 días."
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: false, exportador: true, precio: true, tamano: true, otro: false },
          info: "Clasificación especial WCE. Exportador: Axis Coffee Exports."
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: "Certificado de origen WCE y prácticas sostenibles EUDR."
        },
        otro: {
          items: { premios: true },
          info: "Lote oficial del campeonato World Coffee Events."
        }
      }
    },
    cva_affective: {
      fragranceQuality: 8.5,
      aromaQuality: 8.5,
      flavorQuality: 9,
      aftertasteQuality: 8.5,
      acidityQuality: 8.5,
      sweetnessQuality: 9,
      mouthfeelQuality: 8.75,
      overallImpression: 9
    }
  }
};

async function runRestructure() {
  console.log('Iniciando reestructuración de registros sca_cupping...');
  
  for (const [inventoryId, values] of Object.entries(targetLots)) {
    console.log(`\nProcesando lote: ${values.lot_number} (inventory_id: ${inventoryId})...`);
    
    const { data, error } = await supabase
      .from('sca_cupping')
      .update({
        company_id: 'MASTER@GMAIL.COM',
        is_cva_version: true,
        cva_descriptive: values.cva_descriptive,
        cva_affective: values.cva_affective
      })
      .eq('inventory_id', inventoryId);
      
    if (error) {
      console.error(`Error al actualizar el lote ${values.lot_number}:`, error);
    } else {
      console.log(`Lote ${values.lot_number} reestructurado correctamente.`);
    }
  }
  
  console.log('\n--- PROCESO FINALIZADO CON ÉXITO ---');
}

runRestructure();
