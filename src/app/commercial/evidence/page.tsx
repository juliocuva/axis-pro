"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle2, ChevronRight, FileText, Globe2,
  Leaf, Truck, Map, Activity, Ship, Layers,
  Search, Bell, Settings, Download, X, FlaskConical,
  Coffee, Award, ArrowLeft
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
import ValueMissionPanel from '../../../components/ValueMissionPanel';

const GlobalMap = dynamic(() => import('../../../components/GlobalMap'), { ssr: false });

// --- DATA ---
const PRODUCERS_CASTILLO = [
  { name: "Juan Carlos Perez", farm: "Finca La Esperanza" },
  { name: "Maria Elena Giraldo", farm: "Finca El Ocaso" },
  { name: "Carlos Arturo Lopez", farm: "Finca Buena Vista" },
  { name: "Luz Marina Ramirez", farm: "Finca El Recuerdo" },
  { name: "Pedro Luis Sanchez", farm: "Finca Los Pinos" },
  { name: "Javier Restrepo", farm: "Finca El Mirador" },
  { name: "Andres Torres", farm: "Finca La Cima" },
  { name: "Claudia Giraldo", farm: "Finca El Sol" },
  { name: "Roberto Gómez", farm: "Finca El Roble" },
  { name: "Diana Martínez", farm: "Finca La Luna" },
  { name: "Sergio Vallejo", farm: "Finca El Naranjo" },
  { name: "Natalia Castro", farm: "Finca La Estrella" },
  { name: "Héctor Jaramillo", farm: "Finca El Palmar" },
  { name: "Gloria Marín", farm: "Finca La Loma" },
  { name: "Diego Ramírez", farm: "Finca El Bosque" },
  { name: "Valeria Ríos", farm: "Finca La Cascada" },
  { name: "Felipe Osorio", farm: "Finca El Río" }
];
const PRODUCERS_BOURBON = [
  { name: "Ana Isabel Gomez", farm: "Finca La Cabaña" },
  { name: "Jorge Eliecer Silva", farm: "Finca El Progreso" },
  { name: "Valentina Herrera", farm: "Finca El Diamante" },
  { name: "Andres Felipe Rojas", farm: "Finca Las Flores" },
  { name: "Camila Andrea Toro", farm: "Finca San Cayetano" },
  { name: "Esteban Aristizabal", farm: "Finca Los Andes" }
];
const PRODUCERS_GEISHA = [
  { name: "Julio César Aruba", farm: "Finca La Esmeralda Alta" },
  { name: "Mariana Ospina", farm: "Finca El Paraíso" }
];
const PRODUCERS_CONSOLIDATED = [...PRODUCERS_CASTILLO, ...PRODUCERS_BOURBON, ...PRODUCERS_GEISHA];
const PRODUCER_MAP: Record<string, any[]> = {
  commercial: PRODUCERS_CONSOLIDATED,
  castillo: PRODUCERS_CASTILLO,
  pink_bourbon: PRODUCERS_BOURBON,
  geisha: PRODUCERS_GEISHA,
};

type EvidenceStatus = 'complete' | 'pending';
interface EvidenceLayer {
  id: string;
  name: string;
  icon: React.ElementType;
  status: EvidenceStatus;
  summary: { label: string; value: string }[];
  explorerContent?: any;
}
interface VarietalData {
  id: string;
  title: string;
  progress: number;
  batchCurrent: string;
  batchTarget: string;
  managementPct: number;
  missingLots: number;
  evidenceLayers: EvidenceLayer[];
  farmers: any[];
  missingFarmersList: any[];
  statusText: string;
  nextAction: string;
  eta: string;
}

function makeData(
  id: string, title: string, farms: number, batchCurrent: string, batchTarget: string,
  progress: number, missingLots: number, management: number,
  moisture: string, yieldPct: string, score: string
): VarietalData {
  let statusText = 'Completed';
  let nextAction = 'Generate Evidence Package';
  let eta = '-';
  
  if (progress < 100 && progress >= 80) {
    statusText = 'Waiting for Final Delivery';
    nextAction = 'Shipment Documentation';
    eta = 'Tomorrow';
  } else if (progress < 80) {
    statusText = 'Waiting for Milling';
    nextAction = 'Quality Check';
    eta = '3 Days';
  }
  const isComplete = progress === 100;
  const producerList = PRODUCER_MAP[id] || PRODUCERS_CONSOLIDATED;
  const sources = ["SICA", "GEOJSON", "WHATSAPP"];
  const mockFarmers = Array.from({ length: Math.min(farms, producerList.length) }).map((_, i) => ({
    name: producerList[i].name,
    farm: producerList[i].farm,
    volume: `${Math.floor(Math.random() * 2000 + 500)} kg`,
    moisture: `${(parseFloat(moisture) + (Math.random() * 0.6 - 0.3)).toFixed(1)}%`,
    yield: `${(parseFloat(yieldPct) + (Math.random() * 2 - 1)).toFixed(1)}%`,
    score: (parseFloat(score) + (Math.random() * 1.5 - 0.75)).toFixed(1),
    altitude: `${Math.floor(Math.random() * 300 + 1700)}`,
    source: sources[Math.floor(Math.random() * sources.length)]
  }));

  return {
    id, title, progress, batchCurrent, batchTarget,
    managementPct: management, missingLots,
    statusText, nextAction, eta,
    farmers: mockFarmers,
    missingFarmersList: producerList.slice(farms, farms + missingLots).map(p => ({ name: p.name, farm: p.farm })),
    evidenceLayers: [
      {
        id: "origin", 
        name: "Origin", 
        icon: Map, 
        status: "complete",
        summary: [
          { label: "Producers", value: `${farms}` },
          { label: "Farms", value: `${farms}` },
          { label: "Avg Altitude", value: "1935 m" }
        ],
        explorerContent: { type: "origin_layer", title: "Origin Evidence", description: "Who produced this coffee?", farmsValidated: farms }
      },
      {
        id: "processing", 
        name: "Processing", 
        icon: Truck, 
        status: "complete",
        summary: [
          { label: "Yield", value: `${yieldPct}%` },
          { label: "Moisture", value: `${moisture}%` },
          { label: "Water Activity", value: "0.62 aw" }
        ],
        explorerContent: { type: "processing_layer", title: "Processing & Milling", description: "Dry mill and laboratory analysis." }
      },
      {
        id: "quality", 
        name: "Quality", 
        icon: Coffee, 
        status: "complete",
        summary: [
          { label: "Roast Profile", value: "Omni" },
          { label: "CVA Score", value: `${score}` }
        ],
        explorerContent: { type: "quality_layer", title: "Quality Evaluation", description: "Sensory analysis and roasting curve." }
      },
      {
        id: "compliance", 
        name: "Compliance", 
        icon: Globe2, 
        status: isComplete ? "complete" : "pending",
        summary: [
          { label: "Verified", value: isComplete ? "Yes" : "Pending" },
          { label: "Deforestation", value: "0.0 ha" }
        ],
        explorerContent: { type: "compliance_layer", title: "Compliance Verification", description: "EUDR satellite intersection and SICA digital walk." }
      },
      {
        id: "shipment", 
        name: "Shipment", 
        icon: Ship, 
        status: isComplete ? "complete" : "pending",
        summary: [
          { label: "Docs Ready", value: "Yes" },
          { label: "Container", value: isComplete ? "Sealed" : "Pending" }
        ],
        explorerContent: { type: "shipment_layer", title: "Shipment Logistics", description: "Export documentation and container stuffing." }
      }
    ]
  };
}

const DASHBOARD_DATA = [
  makeData("commercial", "Commercial Blend", 20, "8,500", "10,000", 85, 2, 85, "11.2", "90.2", "81.8"),
  makeData("castillo", "Castillo Lot", 10, "5,100", "6,000", 85, 1, 85, "11.0", "91.5", "84.0"),
  makeData("pink_bourbon", "Pink Bourbon Lot", 6, "3,000", "3,000", 100, 0, 100, "10.8", "92.1", "86.5"),
  makeData("geisha", "Geisha Lot", 2, "2,000", "2,000", 100, 0, 100, "10.5", "93.0", "89.0"),
];

export default function EvidenceDashboard() {
  const [selectedId, setSelectedId] = useState("commercial");
    const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<EvidenceLayer | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Live Data
  const [liveLots, setLiveLots] = useState<any[]>([]);
  const [livePoData, setLivePoData] = useState<any>(null);
  const [liveVolume, setLiveVolume] = useState(0);
  const [liveAverages, setLiveAverages] = useState<any>(null);
  const [targetPo, setTargetPo] = useState("PO-2026-08-001");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poParam = params.get('po');
    const poQuery = poParam || targetPo;
    if (poParam) setTargetPo(poParam);

    const fetchLiveData = async () => {
      try {
        const { data: po } = await supabase.from('purchase_orders').select('id, target_volume_kg, expected_lots').eq('po_number', poQuery).single();
        if (!po) { setIsLoading(false); return; }
        setLivePoData(po);

        const { data: lots } = await supabase.from('lots').select('id, name, volume_kg, coffee_type, lot_farmers(farmers(name)), processing_evidence(yield_pct, moisture_pct, water_activity), quality_evidence(roast_profile, cva_score)').eq('po_id', po.id);
        const { data: compliance } = await supabase.from('compliance_evidence').select('*').eq('po_id', po.id).single();
        const { data: shipment } = await supabase.from('shipment_evidence').select('*').eq('po_id', po.id).single();

        if (lots && lots.length > 0) {
          let sumYield = 0, sumMoisture = 0, sumWaterActivity = 0, sumScore = 0, countP = 0, countQ = 0;

          // Group lots by coffee_type (varietal)
          const grouped: Record<string, any> = {};
          
          // Pre-populate with expected lots from PO
          if (po.expected_lots && Array.isArray(po.expected_lots)) {
            po.expected_lots.forEach((el: any) => {
              if (el.variety) {
                const normVariety = el.variety.trim().toLowerCase();
                grouped[normVariety] = [];
                // We store the target volume for this specific varietal so we can display it correctly
                grouped[normVariety].targetVolume = Number(el.volume_kg) || 0;
                grouped[normVariety].originalName = el.variety.trim();
                grouped[normVariety].process = el.process || 'Washed';
              }
            });
          }

          (lots || []).forEach((lot: any) => {
            const key = lot.coffee_type || 'Unknown';
            if (key === 'Unknown') return; // Ignorar lotes sin varietal definido
            const normKey = key.trim().toLowerCase();
            if (!grouped[normKey]) {
              grouped[normKey] = [];
              grouped[normKey].targetVolume = 0;
              grouped[normKey].originalName = key.trim();
            }
            grouped[normKey].push(lot);
          });

          const formattedLots = Object.entries(grouped)
            .filter(([variety]) => variety !== 'unknown') // Doble seguridad para no mostrar 'Unknown'
            .map(([normVariety, varietalLots]: [string, any]) => {
            const variety = varietalLots.originalName || normVariety;
            const totalVolumeKg = varietalLots.reduce((s: number, l: any) => s + (l.volume_kg || 0), 0);
            const targetVolumeKg = varietalLots.targetVolume || po.target_volume_kg || 1;

            // Aggregate processing and quality from all lots in this varietal
            let yieldSum = 0, moistureSum = 0, waSum = 0, scoreSum = 0, pCount = 0, qCount = 0;
            const allFarmers: any[] = [];

            varietalLots.forEach((lot: any) => {
              const proc = Array.isArray(lot.processing_evidence) ? lot.processing_evidence[0] : lot.processing_evidence;
              const qual = Array.isArray(lot.quality_evidence) ? lot.quality_evidence[0] : lot.quality_evidence;
              if (proc) { yieldSum += Number(proc.yield_pct||0); moistureSum += Number(proc.moisture_pct||0); waSum += Number(proc.water_activity||0); pCount++; sumYield += Number(proc.yield_pct||0); sumMoisture += Number(proc.moisture_pct||0); sumWaterActivity += Number(proc.water_activity||0); countP++; }
              if (qual) { scoreSum += Number(qual.cva_score||0); qCount++; sumScore += Number(qual.cva_score||0); countQ++; }
              (lot.lot_farmers || []).forEach((rel: any) => {
                const farmerName = rel.farmers?.name || 'Unknown';
                const farmMap: Record<string, string> = {
                  "Juan Carlos Perez": "La Esperanza",
                  "Maria Elena Giraldo": "El Ocaso",
                  "Carlos Arturo Lopez": "Buena Vista",
                  "Julio Uva": "La Alejandria",
                  "Catalina Perez": "La Alejandria",
                  "Alejandra Perez": "La Alejandria",
                  "Sebastian Perez": "La Alejandria",
                  "Alejandra Saraza": "Las Orquideas"
                };
                const farmName = farmMap[farmerName] || `Finca ${farmerName.split(' ')[0] || 'El Paraíso'}`;
                
                // Solo agregamos si no existe ya para que no cuente duplicados por historiales de sync
                if (!allFarmers.find(f => f.name === farmerName)) {
                  allFarmers.push({
                    name: farmerName,
                    farm: `${farmName} - Lote: ${lot.name}`,
                    volume: `${lot.volume_kg || 0} kg`,
                    moisture: proc?.moisture_pct ? `${proc.moisture_pct}%` : '11.2%',
                    yield: proc?.yield_pct ? `${proc.yield_pct}%` : '90.2%',
                    score: qual?.cva_score ? `${qual.cva_score}` : '0',
                    altitude: '1850', source: 'Google Sheets'
                  });
                }
              });
            });

            const avgYield = pCount ? (yieldSum / pCount).toFixed(1) : '0';
            const avgMoisture = pCount ? (moistureSum / pCount).toFixed(1) : '0';
            const avgWa = pCount ? (waSum / pCount).toFixed(2) : '0';
            const avgScore = qCount ? (scoreSum / qCount).toFixed(1) : '0';
            const progress = targetVolumeKg > 0 ? Math.round((totalVolumeKg / targetVolumeKg) * 100) : 0;
            
            // Construir el nombre del lote basado en la variedad
            let lotTitle = variety;
            if (!lotTitle.toLowerCase().includes('lot') && !lotTitle.toLowerCase().includes('blend')) {
              lotTitle = `${lotTitle} Lot`;
            } else if (lotTitle.toLowerCase().includes('blend') && !lotTitle.toLowerCase().includes('lot')) {
              // Si es un blend (ej. Commercial Blend), puedes dejarlo como está o agregar Lot, como el usuario sugirió "Commercial Lot"
              // Usaré la convención solicitada:
              if (lotTitle.toLowerCase() === 'commercial blend') {
                lotTitle = 'Commercial Blend'; // Como en la imagen verde
              } else {
                lotTitle = `${lotTitle} Lot`;
              }
            }

            return {
              id: `part-${normVariety}`,
              title: lotTitle,
              coffeeType: variety,
              process: varietalLots.process || 'Washed',
              progress,
              batchCurrent: totalVolumeKg.toLocaleString(),
              batchTarget: targetVolumeKg.toLocaleString(),
              managementPct: progress,
              missingLots: 0, statusText: 'Traceability Complete', nextAction: 'Generate Contract', eta: '2 Days',
              farmers: allFarmers, missingFarmersList: [],
              evidenceLayers: [
                { id: 'origin', name: 'Origin', icon: Map, status: 'complete',
                  summary: [{ label: 'Producers', value: `${allFarmers.length}` }, { label: 'Avg Altitude', value: '1850 m' }],
                  explorerContent: { type: 'origin_layer', title: 'Origin Evidence', description: 'Who produced this coffee?', farmsValidated: allFarmers.length } },
                { id: 'processing', name: 'Processing', icon: Truck, status: 'complete',
                  summary: [{ label: 'Yield', value: `${avgYield}%` }, { label: 'Moisture', value: `${avgMoisture}%` }, { label: 'Water Activity', value: `${avgWa} aw` }],
                  explorerContent: { type: 'processing_layer', title: 'Processing & Milling', description: 'Dry mill and laboratory analysis.' } },
                { id: 'quality', name: 'Quality', icon: Coffee, status: 'complete',
                  summary: [{ label: 'Roast Profile', value: 'Omni' }, { label: 'CVA Score', value: avgScore }],
                  explorerContent: { type: 'quality_layer', title: 'Quality Evaluation', description: 'Sensory analysis and roasting curve.' } },
                { id: 'compliance', name: 'Compliance', icon: Globe2, status: compliance?.eudr_cleared ? 'complete' : 'pending',
                  summary: [{ label: 'EUDR', value: compliance?.eudr_cleared ? 'Cleared' : 'Pending' }, { label: 'Deforestation', value: `${compliance?.deforestation_ha || 0} ha` }],
                  explorerContent: { type: 'compliance_layer', title: 'Compliance Verification', description: 'EUDR satellite intersection.' } },
                { id: 'shipment', name: 'Shipment', icon: Ship, status: shipment?.docs_ready ? 'complete' : 'pending',
                  summary: [{ label: 'Docs Ready', value: shipment?.docs_ready ? 'Yes' : 'No' }, { label: 'Container', value: shipment?.container_status || 'Pending' }],
                  explorerContent: { type: 'shipment_layer', title: 'Shipment Logistics', description: 'Export documentation and container stuffing.' } }
              ]
            };
          });

          setLiveLots(formattedLots);
          setLiveVolume(lots.reduce((acc: any, lot: any) => acc + (lot.volume_kg||0), 0));
          setLiveAverages({ yield: countP?(sumYield/countP).toFixed(1):'0', moisture: countP?(sumMoisture/countP).toFixed(1):'0', waterActivity: countP?(sumWaterActivity/countP).toFixed(2):'0', score: countQ?(sumScore/countQ).toFixed(1):'0', eudrCleared: compliance?.eudr_cleared?'100%':'0%', deforestation: compliance?`${compliance.deforestation_ha} ha`:'0.0 ha', docsReady: shipment?.docs_ready?'Yes':'No', containerStatus: shipment?.container_status==='PENDING'?'Pending':'Sealed' });
          if (formattedLots.length > 0 && !formattedLots.find(l => l.id === selectedId)) {
            setSelectedId(formattedLots[0].id);
          }
        } else if (po.expected_lots && Array.isArray(po.expected_lots) && po.expected_lots.length > 0) {
          // If no lots synced yet, but we have expected lots, show them empty
          const emptyLots = po.expected_lots.map((el: any) => {
            const variety = el.variety || 'Unknown';
            let lotTitle = variety;
            if (!lotTitle.toLowerCase().includes('lot') && !lotTitle.toLowerCase().includes('blend')) lotTitle = `${lotTitle} Lot`;
            else if (lotTitle.toLowerCase() === 'commercial blend') lotTitle = 'Commercial Blend';
            else if (lotTitle.toLowerCase().includes('blend')) lotTitle = `${lotTitle} Lot`;

            return {
              id: `part-${variety.toLowerCase().replace(/\s+/g, '_')}`,
              title: lotTitle,
              coffeeType: variety,
              process: el.process || 'Washed',
              progress: 0,
              batchCurrent: '0',
              batchTarget: (Number(el.volume_kg) || 0).toLocaleString(),
              managementPct: 0,
              missingLots: 0, statusText: 'Pending Sync', nextAction: 'Sync Sheets', eta: '-',
              farmers: [], missingFarmersList: [],
              evidenceLayers: [
                { id: 'origin', name: 'Origin', icon: Map, status: 'pending', summary: [{ label: 'Producers', value: '0' }], explorerContent: { type: 'origin_layer', title: 'Origin', description: 'No data.', farmsValidated: 0 } },
                { id: 'processing', name: 'Processing', icon: Truck, status: 'pending', summary: [{ label: 'Yield', value: '-' }], explorerContent: { type: 'processing_layer', title: 'Processing', description: 'No data.' } },
                { id: 'quality', name: 'Quality', icon: Coffee, status: 'pending', summary: [{ label: 'CVA Score', value: '-' }], explorerContent: { type: 'quality_layer', title: 'Quality', description: 'No data.' } },
                { id: 'compliance', name: 'Compliance', icon: Globe2, status: 'pending', summary: [{ label: 'EUDR', value: 'Pending' }], explorerContent: { type: 'compliance_layer', title: 'Compliance', description: 'No data.' } },
                { id: 'shipment', name: 'Shipment', icon: Ship, status: 'pending', summary: [{ label: 'Docs', value: 'Pending' }], explorerContent: { type: 'shipment_layer', title: 'Shipment', description: 'No data.' } }
              ]
            };
          });
          setLiveLots(emptyLots);
          setLiveVolume(0);
          if (emptyLots.length > 0 && !emptyLots.find((l: any) => l.id === selectedId)) {
            setSelectedId(emptyLots[0].id);
          }
        } else {
          setLiveLots([]); setLiveVolume(0);
        }

      } catch (err) {
        console.error('Supabase error', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveData();
  }, [targetPo]);

  const defaultLayers = [
    { id: 'origin', name: 'Origin', icon: Map, status: 'pending', summary: [{ label: 'Producers', value: '0' }], explorerContent: { type: 'origin_layer', title: 'Origin', description: 'No data.', farmsValidated: 0 } },
    { id: 'processing', name: 'Processing', icon: Truck, status: 'pending', summary: [{ label: 'Yield', value: '-' }], explorerContent: { type: 'processing_layer', title: 'Processing', description: 'No data.' } },
    { id: 'quality', name: 'Quality', icon: Coffee, status: 'pending', summary: [{ label: 'CVA Score', value: '-' }], explorerContent: { type: 'quality_layer', title: 'Quality', description: 'No data.' } },
    { id: 'compliance', name: 'Compliance', icon: Globe2, status: 'pending', summary: [{ label: 'EUDR', value: 'Pending' }], explorerContent: { type: 'compliance_layer', title: 'Compliance', description: 'No data.' } },
    { id: 'shipment', name: 'Shipment', icon: Ship, status: 'pending', summary: [{ label: 'Docs', value: 'Pending' }], explorerContent: { type: 'shipment_layer', title: 'Shipment', description: 'No data.' } },
  ];
  const active: any = liveLots.find((d: any) => d.id === selectedId) || liveLots[0] || { id: 'empty', title: 'Awaiting Sync', progress: 0, batchCurrent: '0', batchTarget: livePoData?.target_volume_kg || 0, managementPct: 0, missingLots: 0, statusText: 'Pending', nextAction: 'Sync Sheets', eta: '-', farmers: [], missingFarmersList: [], evidenceLayers: defaultLayers };

  const globalTarget = livePoData?.target_volume_kg || 20000;
  const globalCollected = liveVolume;
  const globalProgress = globalTarget > 0 ? Math.round((globalCollected / globalTarget) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden" style={{ fontFamily: "var(--font-montserrat, 'Montserrat', sans-serif)" }}>

      {/* ── SIDEBAR ── */}
      <aside className={`w-full lg:w-[260px] flex-shrink-0 flex flex-col lg:flex-col bg-[#00C87A] border-b lg:border-b-0 border-black/10 transition-all duration-500 ease-in-out z-50 ${isSidebarOpen ? 'lg:ml-0' : 'lg:-ml-[260px]'}`}>
        {/* Logo */}
        <div className="p-4 lg:p-8 lg:pb-4 hidden lg:flex flex-col items-center justify-center">
          <img 
            src="/logo-axisone.png" 
            alt="AxisONE Logo" 
            className="h-32 object-contain"
            style={{ filter: 'brightness(0) saturate(100%) invert(10%) sepia(21%) saturate(6305%) hue-rotate(204deg) brightness(91%) contrast(97%)' }} 
          />
        </div>

        <div className="px-4 pb-2 hidden lg:block">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#0f1e38]/70">Purchase Order Parts</p>
        </div>

        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto flex-nowrap custom-scrollbar">
          {liveLots.map(v => {
            const isActive = v.id === selectedId;
            return (
              <button
                key={v.id}
                onClick={() => { setSelectedId(v.id); setSelectedItem(null); }}
                className="group w-auto lg:w-full min-w-[140px] lg:min-w-0 text-left px-4 py-3 lg:py-4 border-r lg:border-r-0 lg:border-b border-black/10 transition-all hover:bg-black/5 flex-shrink-0"
                style={{ background: isActive ? 'rgba(0,0,0,0.1)' : undefined }}
              >
                <div>
                  <h3 className={`text-[17px] font-black leading-tight tracking-tight text-[#0f1e38] ${isActive ? '' : 'group-hover:text-[#0f1e38]/60 transition-colors'}`}>{v.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-[#0f1e38]/50 uppercase tracking-widest font-bold">{v.process}</p>
                  </div>
                  <p className="text-[10px] font-bold text-[#0f1e38] mt-1.5">{v.batchCurrent} / {v.batchTarget} kg</p>
                  <div className={`flex items-center gap-1.5 mt-1 text-[9px] font-black uppercase tracking-wider text-[#0f1e38] ${isActive ? '' : 'group-hover:text-[#0f1e38]/60 transition-colors'}`}>
                    {v.managementPct >= 100 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>MANAGEMENT COMPLETED</span>
                      </>
                    ) : (
                      <span>{v.managementPct}% MANAGEMENT</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden bg-white relative custom-scrollbar">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 z-40 items-center justify-center w-5 h-16 bg-[#00C87A] text-[#0f1e38] rounded-r-lg shadow-lg border border-l-0 border-[#00C87A]/50 hover:w-7 hover:bg-[#00df88] transition-all duration-300 left-0`}
          style={{ transform: 'translateY(-50%)' }}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {isMapOpen && (
          <div className="absolute inset-0 z-50 bg-[#0a0a0a]">
            <GlobalMap onClose={() => setIsMapOpen(false)} activeLot={active} />
          </div>
        )}

        {/* Top nav */}
        <header className="h-12 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <button 
              onClick={() => router.push('/hub')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white border border-[#0f1e38] bg-[#0f1e38] hover:bg-[#152745] py-1.5 px-4 rounded-full transition-all duration-300 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Hub
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMapOpen(true)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00C87A] border border-[#00C87A]/30 bg-[#00C87A]/10 hover:bg-[#00C87A]/20 py-1.5 px-4 rounded-full transition-all duration-300"
              >
                <Globe2 className="w-3.5 h-3.5" /> Evidence Journey
              </button>
              <div className="hidden xl:flex items-center gap-1.5 text-slate-400 animate-bounce-x-subtle">
                <ArrowLeft className="w-4 h-4 text-[#00C87A]" />
                <span className="text-xs font-medium italic">Click to visualize your coffee's journey</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5 text-slate-400">
            <Search className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Bell className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <div className="w-px h-4 bg-slate-700 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-slate-700 group-hover:bg-[#00C87A] transition-colors flex items-center justify-center font-bold text-[11px] text-white">J</div>
              <div className="hidden lg:block text-left">
                <p className="text-white text-[11px] leading-tight font-bold group-hover:text-[#00C87A] transition-colors">Julio</p>
                <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 leading-tight">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard scroll area */}
        <div className="flex-1 overflow-y-auto px-20 py-6 bg-slate-200 custom-scrollbar">

          {/* Editorial Layout for Evidence Layers */}
          <div className="flex flex-col gap-6 mb-12">
            
            {/* TOP ROW: Value Panel & Purchase Order Card */}
            <div className="grid grid-cols-5 gap-6">
              
              {/* Left: Value & Mission Slider */}
              <div className="col-span-2">
                <ValueMissionPanel selectedLayerId={selectedItem?.id} />
              </div>

              {/* Right: Purchase Order Card */}
              <div className="col-span-1 xl:col-span-3 relative bg-[#0f1e38] rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 flex flex-col justify-between p-6 md:p-8 min-h-[160px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-baseline gap-4">
                      <h1 className="text-3xl font-light text-white tracking-tight">Purchase Order</h1>
                      <span className="text-3xl font-bold text-[#00C87A] tracking-tight">{targetPo}</span>
                    </div>
                    <div className="flex flex-col gap-5">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1">Customer</p>
                        <p className="text-sm font-bold text-white">European Coffee Roasters Ltd.</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1">Exporter</p>
                        <p className="text-sm font-bold text-white">Cooperativa de Caficultores de Risaralda</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <Leaf className="w-3.5 h-3.5 text-[#00C87A]" /> Colombia &rarr; Hamburg
                    </p>
                  </div>
                  <div className="text-left md:text-right mt-6 md:mt-0 flex flex-col items-start md:items-end">
                    <p className="text-[64px] leading-none font-light tracking-tight text-[#00C87A] mb-2">
                      {globalProgress}%
                    </p>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Total Consolidated</p>
                    <div className="text-right">
                      <p className="text-white text-2xl font-bold">
                        {globalCollected.toLocaleString()} <span className="text-slate-400 font-light">/ {globalTarget.toLocaleString()}</span>
                      </p>
                      <p className="text-slate-400 text-sm font-medium mt-1">kg</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#00C87A] transition-all duration-700" style={{ width: `${globalProgress}%` }} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {globalProgress === 100 ? 'Consolidation Complete' : 'Consolidation In Progress'}
                  </span>
                </div>
              </div>
            </div>
{/* MIDDLE ROW: Origin, Processing, Quality */}
            <div className="grid grid-cols-3 gap-6">
              {active.evidenceLayers.filter((l: any) => ['origin', 'processing', 'quality'].includes(l.id)).map((item: any) => {
                const isSelected = selectedItem?.id === item.id;
                
                let bgClass, textColor, labelColor, hoverLayerColor, isNavy;
                if (item.id === 'origin' || item.id === 'quality') {
                  bgClass = 'bg-[#00C87A]';
                  textColor = 'text-[#0f1e38]';
                  labelColor = 'text-emerald-900/70';
                  hoverLayerColor = 'bg-black/20';
                  isNavy = false;
                } else {
                  bgClass = 'bg-[#0f1e38]';
                  textColor = 'text-white';
                  labelColor = 'text-slate-400';
                  hoverLayerColor = 'bg-white/10';
                  isNavy = true;
                }
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative group ${bgClass} rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm border border-slate-200/50 p-6 pb-12 min-h-[160px] flex flex-col justify-start
                      ${isSelected ? (item.id === 'origin' ? 'ring-4 ring-white' : 'ring-2 ring-[#00C87A]') + ' shadow-xl -translate-y-1' : 'hover:shadow-lg hover:-translate-y-1'}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <h2 className={`text-xl font-light ${textColor} uppercase tracking-tight`}>{item.name}</h2>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6">
                      {item.summary.map(s => (
                        <div key={s.label}>
                          <p className={`text-[9px] ${labelColor} uppercase tracking-widest font-bold mb-1`}>{s.label}</p>
                          <p className={`text-base font-bold ${textColor}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Hover Status Layer */}
                    <div className={`absolute inset-x-0 bottom-0 ${hoverLayerColor} h-0 group-hover:h-10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center px-6 justify-between`}>
                       <span className={`${textColor} text-[10px] font-bold uppercase tracking-widest`}>Evidence Status</span>
                       <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isNavy ? 'bg-[#00C87A]' : 'bg-[#0f1e38]'}`}></span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${isNavy ? 'text-[#00C87A]' : 'text-[#0f1e38]'}`}>Verified</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
{/* BOTTOM ROW: Compliance (Small) & Shipment (Small) */}
            <div className="grid grid-cols-4 gap-6">
              {active.evidenceLayers.filter(l => l.id === 'compliance' || l.id === 'shipment').map(item => {
                const isSelected = selectedItem?.id === item.id;
                const isVerified = item.status === 'complete';
                
                const isNavy = item.id === 'compliance';
                const bgClass = isNavy ? 'bg-[#0f1e38]' : 'bg-[#00C87A]';
                const textColor = isNavy ? 'text-white' : 'text-[#0f1e38]';
                const labelColor = isNavy ? 'text-slate-400' : 'text-emerald-900/70';
                const hoverLayerColor = isNavy ? 'bg-white/10' : 'bg-black/20';
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative group ${bgClass} rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm border border-slate-200/50 p-5 pb-10 min-h-[140px] h-full w-full flex flex-col justify-between
                      ${isSelected ? 'ring-2 ring-white shadow-xl -translate-y-1' : 'hover:shadow-md hover:-translate-y-1'}`}
                  >
                    <div>
                      <h2 className={`text-base font-light ${textColor} uppercase tracking-tight mb-3`}>{item.name}</h2>
                      <div className={`flex flex-col ${selectedItem ? '' : 'xl:flex-row'} gap-4`}>
                        {item.summary.map(s => (
                          <div key={s.label}>
                            <p className={`text-[8px] ${labelColor} uppercase tracking-widest font-bold mb-0.5`}>{s.label}</p>
                            <p className={`text-sm font-bold ${textColor}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Hover Status Layer */}
                    <div className={`absolute inset-x-0 bottom-0 ${hoverLayerColor} h-0 group-hover:h-8 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center px-5 justify-between`}>
                       <span className={`${textColor} text-[9px] font-bold uppercase tracking-widest`}>Evidence</span>
                       <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? (isNavy?'bg-[#00C87A]':'bg-[#0f1e38]') : 'bg-amber-400'}`}></span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider ${isVerified ? (isNavy?'text-[#00C87A]':'text-[#0f1e38]') : 'text-amber-400'}`}>
                            {isVerified ? 'Verified' : 'Pending'}
                          </span>
                       </div>
                    </div>
                  </div>
                );
              })}

              {/* CURRENT LOT OVERVIEW */}
              <div className="col-span-1 md:col-span-2 relative bg-transparent rounded-2xl shadow-sm border border-slate-400 p-5 flex flex-col justify-between w-full min-h-[140px] h-full">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Lot Status</p>
                    <h3 className="text-lg font-light text-[#0f1e38] tracking-tight">{active.title}</h3>
                  </div>
                  <div className="text-left md:text-right mt-6 md:mt-0">
                    <p className="text-2xl font-black tracking-tight text-[#0f1e38] leading-none mb-0.5">{active.progress}%</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-[#0f1e38]/70">Consolidated</p>
                  </div>
                </div>

                <div className={`flex flex-col ${selectedItem ? '' : 'xl:flex-row'} gap-6 xl:gap-8 mb-4 mt-1 flex-1`}>
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Volume</p>
                    <p className="text-xs font-bold text-[#0f1e38] font-mono whitespace-nowrap">{active.batchCurrent} <span className="text-slate-400 font-medium">/ {active.batchTarget} kg</span></p>
                  </div>
                  <div className={`min-w-0 border-t pt-3 border-slate-200/50 ${selectedItem ? '' : 'xl:border-l xl:border-t-0 xl:pt-0 xl:border-slate-300 xl:pl-8'}`}>
                    <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Status</p>
                    <p className="text-xs font-bold text-[#0f1e38] leading-tight truncate">{active.statusText}</p>
                  </div>
                  <div className={`min-w-0 border-t pt-3 border-slate-200/50 ${selectedItem ? '' : 'xl:border-l xl:border-t-0 xl:pt-0 xl:border-slate-300 xl:pl-8'}`}>
                    <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Next Action</p>
                    <p className="text-xs font-bold text-[#0f1e38] truncate">{active.nextAction}</p>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </main>
      {/* ── EVIDENCE EXPLORER PANEL ── */}
      <aside
        className={`absolute lg:relative inset-y-0 right-0 z-50 w-full md:w-[420px] flex-shrink-0 flex flex-col border-l border-slate-800 overflow-hidden shadow-2xl lg:shadow-none transition-all duration-500 ease-in-out ${selectedItem ? 'translate-x-0 lg:mr-0' : 'translate-x-full lg:-mr-[420px]'}`}
        style={{ background: 'var(--color-panel-bg)' }}
      >
        {selectedItem && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evidence Explorer</span>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-6 text-white custom-scrollbar">
            <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.explorerContent?.title || selectedItem.name}</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">{selectedItem.explorerContent?.description}</p>

                        {/* ORIGIN LAYER */}
            {selectedItem.explorerContent?.type === 'origin_layer' && (
              <div className="rounded-3xl border border-white/10 p-5" style={{ background: 'var(--color-panel-inner)' }}>
                <div className="grid grid-cols-4 text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/5">
                  <div className="col-span-3">Farmer & Farm</div>
                  <div className="text-left md:text-right mt-6 md:mt-0">Alt (m)</div>
                </div>
                <div className="space-y-4">
                  {active.farmers.map((f, i) => (
                    <div key={i} className="grid grid-cols-4 items-center gap-1">
                      <div className="col-span-3">
                        <p className="text-xs font-bold text-white truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{f.farm}</p>
                      </div>
                      <p className="text-xs font-mono text-right text-emerald-400">
                        {f.altitude} m
                      </p>
                    </div>
                  ))}
                </div>
                <button className="mt-6 w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest border py-3 rounded-lg transition-colors" style={{ color: 'var(--color-brand-green-light)', borderColor: 'rgba(0, 255, 178, 0.3)' }}>
                  <Download className="w-4 h-4" /> Download Traceability
                </button>
              </div>
            )}

            {/* PROCESSING LAYER */}
            {selectedItem.explorerContent?.type === 'processing_layer' && (
              <div className="rounded-3xl border border-white/10 p-5 space-y-6" style={{ background: 'var(--color-panel-inner)' }}>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Milling</h3>
                  <div className="grid grid-cols-4 text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/5">
                    <div className="col-span-3">Farmer & Farm</div>
                    <div className="text-left md:text-right mt-6 md:mt-0">Yield</div>
                  </div>
                  <div className="space-y-2">
                    {active.farmers.slice(0, 3).map((f, i) => (
                      <div key={i} className="grid grid-cols-4 items-center gap-1">
                        <div className="col-span-3"><p className="text-xs font-bold text-white truncate">{f.name}</p></div>
                        <p className="text-xs font-mono text-right text-[#00C87A]">{f.yield}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Laboratory</h3>
                  <div className="grid grid-cols-4 text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/5">
                    <div className="col-span-3">Farmer & Farm</div>
                    <div className="text-left md:text-right mt-6 md:mt-0">Moisture</div>
                  </div>
                  <div className="space-y-2">
                    {active.farmers.slice(0, 3).map((f, i) => (
                      <div key={i} className="grid grid-cols-4 items-center gap-1">
                        <div className="col-span-3"><p className="text-xs font-bold text-white truncate">{f.name}</p></div>
                        <p className="text-xs font-mono text-right text-[#00C87A]">{f.moisture}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* QUALITY LAYER */}
            {selectedItem.explorerContent?.type === 'quality_layer' && (
              <div className="rounded-3xl border border-white/10 p-5 space-y-6" style={{ background: 'var(--color-panel-inner)' }}>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Roasting</h3>
                  <p className="text-xs text-slate-400">Winning Profile: <span className="text-white font-mono">Omni Medium</span></p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">CVA Sensory</h3>
                  <div className="grid grid-cols-4 text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/5">
                    <div className="col-span-3">Farmer & Farm</div>
                    <div className="text-left md:text-right mt-6 md:mt-0">Score</div>
                  </div>
                  <div className="space-y-2">
                    {active.farmers.slice(0, 3).map((f, i) => (
                      <div key={i} className="grid grid-cols-4 items-center gap-1">
                        <div className="col-span-3"><p className="text-xs font-bold text-white truncate">{f.name}</p></div>
                        <p className="text-xs font-mono text-right text-[#00C87A]">{f.score}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COMPLIANCE LAYER */}
            {selectedItem.explorerContent?.type === 'compliance_layer' && (
              <div className="rounded-3xl border border-white/10 p-5 space-y-6" style={{ background: 'var(--color-panel-inner)' }}>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">EUDR Status</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#00C87A]" />
                    <p className="text-sm font-medium text-white">Satellite Intersection (Sentinel-2)</p>
                  </div>
                  <div className="flex justify-between p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Deforestation</span>
                    <span className="text-sm font-mono text-[#00C87A]">0.00 ha</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Farm Verification</h3>
                  <div className="flex justify-between items-end pb-2 border-b border-white/10 mb-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Lots Scanned</p>
                      <p className="text-xl font-bold">{active.farmers.length}<span className="text-sm text-slate-500">/{active.farmers.length + active.missingLots}</span></p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {active.missingFarmersList.map((f, i) => (
                      <div key={`missing-${i}`} className="flex justify-between items-center bg-amber-900/10 p-2 rounded-md border border-amber-500/20">
                        <p className="text-xs font-bold text-white truncate">{f.name}</p>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">PENDING</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SHIPMENT LAYER */}
            {selectedItem.explorerContent?.type === 'shipment_layer' && (
              <div className="rounded-3xl border border-white/10 p-5 space-y-6" style={{ background: 'var(--color-panel-inner)' }}>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Documentation</h3>
                  <div className="space-y-2">
                    {[
                      { name: "Commercial Invoice", pending: false },
                      { name: "Packing List", pending: false },
                      { name: "ICO Certificate", pending: false },
                      { name: "Phytosanitary", pending: false },
                      { name: "Bill of Lading", pending: true },
                    ].map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/10">
                        <p className="text-xs font-bold text-white">{d.name}</p>
                        <span className={`text-[8px] font-bold px-2 py-1 rounded uppercase tracking-wider ${d.pending ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-[#00C87A]'}`}>
                          {d.pending ? 'Awaiting' : 'Ready'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Container</h3>
                  <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                    <span>Stuffed Volume</span><span>{active.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-[#00C87A]" style={{ width: `${active.progress}%` }} />
                  </div>
                  <div className="flex justify-between items-center p-3 mt-4 bg-slate-800 rounded border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Seal Number</span>
                    <span className="text-sm font-mono text-white">AXIS-U-89210</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
        </aside>
    </div>
  );
}

