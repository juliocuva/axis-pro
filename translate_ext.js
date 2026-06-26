const fs = require('fs');
const file = 'c:/FullStackDeveloper/axis-oil/axis_pro/src/modules/production/components/CVAAssessmentForm.tsx';
let data = fs.readFileSync(file, 'utf8');

const translations = [
    { from: 'title="Cultivo"', to: 'title="Crop"' },
    { from: 'Información relevante sobre el cultivo', to: 'Relevant information about the crop' },
    { from: "label: 'País'", to: "label: 'Country'" },
    { from: "label: 'Región'", to: "label: 'Region'" },
    { from: "label: 'Nombre de la finca/cooperativa'", to: "label: 'Farm/Cooperative Name'" },
    { from: "label: 'Nombre del (los) productor(es)'", to: "label: 'Producer(s) Name'" },
    { from: "label: 'Especie'", to: "label: 'Species'" },
    { from: "label: 'Variedad o variedades'", to: "label: 'Variety or Varieties'" },
    { from: "label: 'Fecha/Año de cosecha'", to: "label: 'Harvest Date/Year'" },
    { from: 'title="Procesamiento"', to: 'title="Processing"' },
    { from: 'Información relevante sobre el procesamiento', to: 'Relevant information about processing' },
    { from: "label: 'Nombre(s) del beneficiador(es)'", to: "label: 'Processor(s) Name'" },
    { from: "label: 'Beneficio húmedo / Planta de procesamiento'", to: "label: 'Wet Mill / Processing Plant'" },
    { from: "label: 'Beneficio seco/Trilla'", to: "label: 'Dry Mill'" },
    { from: "label: 'Tipo de proceso'", to: "label: 'Process Type'" },
    { from: "label: 'Lavado'", to: "label: 'Washed'" },
    { from: "label: 'Natural'", to: "label: 'Natural'" },
    { from: "label: 'Descafeinado'", to: "label: 'Decaffeinated'" },
    { from: "label: 'Descripción del proceso'", to: "label: 'Process Description'" },
    { from: 'title="Comercio"', to: 'title="Commerce"' },
    { from: 'Información relevante sobre el comercio', to: 'Relevant information about commerce' },
    { from: "label: 'Clasificación local/regional'", to: "label: 'Local/Regional Classification'" },
    { from: "label: 'Número OIC'", to: "label: 'ICO Number'" },
    { from: "label: 'Nombre del importador'", to: "label: 'Importer Name'" },
    { from: "label: 'Nombre del exportador'", to: "label: 'Exporter Name'" },
    { from: "label: 'Precio al productor'", to: "label: 'Producer Price'" },
    { from: "label: 'Tamaño del lote'", to: "label: 'Lot Size'" },
    { from: 'title="Certificaciones"', to: 'title="Certifications"' },
    { from: 'Información relevante sobre certificaciones', to: 'Relevant information about certifications' },
    { from: "label: 'Comercio justo/Fairtrade'", to: "label: 'Fairtrade'" },
    { from: "label: 'Orgánico'", to: "label: 'Organic'" },
    { from: "label: 'Inocuidad alimentaria'", to: "label: 'Food Safety'" },
    { from: "label: 'Otro'", to: "label: 'Other'" },
    { from: 'title="Otro"', to: 'title="Other"' },
    { from: 'Otra información relevante', to: 'Other relevant information' },
    { from: "label: 'Premios/reconocimientos'", to: "label: 'Awards/recognitions'" },
    { from: "COMPLETA N° MUESTRA Y AL MENOS UN CAMPO", to: "FILL AT LEAST ONE FIELD" },
    { from: "SELLAR PROTOCOLO COMPLETO", to: "SEAL COMPLETE PROTOCOL" }
];

for (const { from, to } of translations) {
    data = data.split(from).join(to);
}

fs.writeFileSync(file, data);
