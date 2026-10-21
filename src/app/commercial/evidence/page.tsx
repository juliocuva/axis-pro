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
import { verifyLotEudrSentinel, downloadEudrGeoJson } from '../../../shared/lib/eudr-sentinel';

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
  const [shipmentDocs, setShipmentDocs] = useState<Record<string, boolean>>({
    "Commercial Invoice": true,
    "Packing List": true,
    "ICO Certificate": true,
    "Phytosanitary": true,
    "Bill of Lading": false,
  });
  const [containerSealed, setContainerSealed] = useState(false);

  const syncShipmentState = async (nextDocs: Record<string, boolean>, nextSealed: boolean) => {
    setShipmentDocs(nextDocs);
    setContainerSealed(nextSealed);
    const allDocsReady = Object.values(nextDocs).every(Boolean);
    const isComplete = allDocsReady && nextSealed;
    const statusVal: EvidenceStatus = isComplete ? 'complete' : 'pending';
    const nextSummary = [
      { label: 'Docs Ready', value: allDocsReady ? 'Yes' : 'No' },
      { label: 'Container', value: nextSealed ? 'Sealed' : 'Pending' }
    ];

    if (typeof window !== 'undefined' && targetPo) {
      localStorage.setItem(`shipment_checklist_${targetPo}`, JSON.stringify({ docs: nextDocs, sealed: nextSealed }));
    }

    setLiveLots(prev => prev.map(lot => ({
      ...lot,
      evidenceLayers: (lot.evidenceLayers || []).map((layer: any) =>
        layer.id === 'shipment'
          ? { ...layer, status: statusVal, summary: nextSummary }
          : layer
      )
    })));

    setSelectedItem(prev =>
      prev && prev.id === 'shipment'
        ? { ...prev, status: statusVal, summary: nextSummary }
        : prev
    );

    if (livePoData?.id) {
      await supabase.from('shipment_evidence').upsert(
        {
          po_id: livePoData.id,
          docs_ready: isComplete,
          container_status: nextSealed ? 'SEALED' : 'PENDING'
        },
        { onConflict: 'po_id' }
      );
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poParam = params.get('po');
    const poQuery = poParam || targetPo;
    if (poParam) setTargetPo(poParam);

    const fetchLiveData = async () => {
      try {
        const { data: po } = await supabase.from('purchase_orders').select('*').eq('po_number', poQuery).single();
        if (!po) { setIsLoading(false); return; }
        setLivePoData(po);

        const { data: lots } = await supabase.from('lots').select('*, lot_farmers(farmers(name)), processing_evidence(yield_pct, moisture_pct, water_activity), quality_evidence(roast_profile, cva_score)').eq('po_id', po.id);
        const { data: compliance } = await supabase.from('compliance_evidence').select('*').eq('po_id', po.id).single();
        const { data: shipment } = await supabase.from('shipment_evidence').select('*').eq('po_id', po.id).single();

        let initialDocs: Record<string, boolean> = {
          "Commercial Invoice": true,
          "Packing List": true,
          "ICO Certificate": true,
          "Phytosanitary": true,
          "Bill of Lading": !!shipment?.docs_ready,
        };
        let initialSealed = !!shipment?.docs_ready || String(shipment?.container_status || '').toUpperCase() === 'SEALED';
        const savedChecklist = typeof window !== 'undefined' ? localStorage.getItem(`shipment_checklist_${poQuery}`) : null;
        if (savedChecklist) {
          try {
            const parsed = JSON.parse(savedChecklist);
            if (parsed.docs) initialDocs = parsed.docs;
            if (typeof parsed.sealed === 'boolean') initialSealed = parsed.sealed;
          } catch {}
        }
        setShipmentDocs(initialDocs);
        setContainerSealed(initialSealed);
        const allDocsInit = Object.values(initialDocs).every(Boolean);
        const isShipmentInitComplete = allDocsInit && initialSealed;

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
                grouped[normVariety].targetVolume = Number(el.volume_kg) || 0;
                grouped[normVariety].originalName = el.variety.trim();
                grouped[normVariety].process = el.process || 'Washed';
              }
            });
          }

          (lots || []).forEach((lot: any) => {
            const key = lot.coffee_type || 'Unknown';
            if (key === 'Unknown') return;
            const normKey = key.trim().toLowerCase();
            if (!grouped[normKey]) {
              grouped[normKey] = [];
              grouped[normKey].targetVolume = 0;
              grouped[normKey].originalName = key.trim();
            }
            grouped[normKey].push(lot);
          });

          const formattedLots = Object.entries(grouped)
            .filter(([variety]) => variety !== 'unknown')
            .map(([normVariety, varietalLots]: [string, any]) => {
            const variety = varietalLots.originalName || normVariety;
            const totalVolumeKg = varietalLots.reduce((s: number, l: any) => s + (l.volume_kg || 0), 0);
            const targetVolumeKg = varietalLots.targetVolume || po.target_volume_kg || 1;

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
                const farmName = lot.farm_name || farmMap[farmerName] || `Finca ${farmerName.split(' ')[0] || 'El Paraíso'}`;
                const sentinel = verifyLotEudrSentinel(lot.gps_coordinates, lot.name, farmerName);
                
                if (!allFarmers.find(f => f.name === farmerName)) {
                  allFarmers.push({
                    name: farmerName,
                    farm: `${farmName} - Lote: ${lot.name}`,
                    lotCode: lot.name,
                    variety,
                    process: varietalLots.process || 'Washed',
                    volume: `${lot.volume_kg || 0} kg`,
                    moisture: proc?.moisture_pct ? `${proc.moisture_pct}%` : '11.2%',
                    yield: proc?.yield_pct ? `${proc.yield_pct}%` : '90.2%',
                    score: qual?.cva_score ? `${qual.cva_score}` : '0',
                    altitude: lot.altitude_m ? `${lot.altitude_m}` : '1850',
                    coordinates: sentinel.coordinates,
                    lat: sentinel.lat,
                    lng: sentinel.lng,
                    eudrCleared: sentinel.cleared,
                    sentinelCode: sentinel.verificationCode,
                    satelliteUrl: sentinel.satelliteUrl,
                    copernicusUrl: sentinel.copernicusUrl,
                    source: 'WhatsApp / Sheets'
                  });
                }
              });
            });

            const avgYield = pCount ? (yieldSum / pCount).toFixed(1) : '0';
            const avgMoisture = pCount ? (moistureSum / pCount).toFixed(1) : '0';
            const avgWa = pCount ? (waSum / pCount).toFixed(2) : '0';
            const avgScore = qCount ? (scoreSum / qCount).toFixed(1) : '0';
            const progress = targetVolumeKg > 0 ? Math.round((totalVolumeKg / targetVolumeKg) * 100) : 0;
            
            let lotTitle = variety;
            if (!lotTitle.toLowerCase().includes('lot') && !lotTitle.toLowerCase().includes('blend')) {
              lotTitle = `${lotTitle} Lot`;
            } else if (lotTitle.toLowerCase().includes('blend') && !lotTitle.toLowerCase().includes('lot')) {
              if (lotTitle.toLowerCase() === 'commercial blend') {
                lotTitle = 'Commercial Blend';
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
                { id: 'compliance', name: 'Compliance', icon: Globe2, status: (compliance?.eudr_cleared || (allFarmers.length > 0 && allFarmers.every(f => f.eudrCleared))) ? 'complete' : 'pending',
                  summary: [{ label: 'EUDR', value: (compliance?.eudr_cleared || (allFarmers.length > 0 && allFarmers.every(f => f.eudrCleared))) ? 'Cleared' : 'Pending' }, { label: 'Deforestation', value: `${compliance?.deforestation_ha || 0} ha` }],
                  explorerContent: { type: 'compliance_layer', title: 'Compliance Verification', description: 'EUDR satellite intersection.' } },
                { id: 'shipment', name: 'Shipment', icon: Ship, status: isShipmentInitComplete ? 'complete' : 'pending',
                  summary: [{ label: 'Docs Ready', value: allDocsInit ? 'Yes' : 'No' }, { label: 'Container', value: initialSealed ? 'Sealed' : 'Pending' }],
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

      {/* ── SIDEBAR (Warm Parchment #FAF2CA) ── */}
      <aside className={`w-full lg:w-[260px] flex-shrink-0 flex flex-col lg:flex-col bg-[#FAF2CA] border-b lg:border-b-0 lg:border-r border-[#0C3C60]/15 transition-all duration-500 ease-in-out z-50 ${isSidebarOpen ? 'lg:ml-0' : 'lg:-ml-[260px]'}`}>
        {/* Logo */}
        <div className="p-4 lg:p-8 lg:pb-4 hidden lg:flex flex-col items-center justify-center">
          <img 
            src="/logo-axisone.png" 
            alt="AxisONE Logo" 
            className="h-32 object-contain"
            style={{ filter: 'brightness(0) saturate(100%) invert(18%) sepia(51%) saturate(1656%) hue-rotate(181deg) brightness(92%) contrast(94%)' }} 
          />
        </div>

        <div className="px-4 pb-2 hidden lg:block">
          <p className="text-[9px] font-bold tracking-widest uppercase text-[#0C3C60]/60">Purchase Order Parts</p>
        </div>

        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto flex-nowrap custom-scrollbar">
          {liveLots.map(v => {
            const isActive = v.id === selectedId;
            const isComplete = v.managementPct >= 100;
            return (
              <button
                key={v.id}
                onClick={() => { setSelectedId(v.id); setSelectedItem(null); }}
                className={`group w-auto lg:w-full min-w-[140px] lg:min-w-0 text-left px-4 py-3 lg:py-4 border-r lg:border-r-0 lg:border-b border-[#0C3C60]/10 transition-all hover:bg-[#0C3C60]/5 flex-shrink-0 ${isActive ? 'bg-[#0C3C60]/[0.08] border-l-4 border-l-[#0C3C60]' : ''}`}
              >
                <div>
                  <h3 className={`text-[17px] font-black leading-tight tracking-tight text-[#0C3C60] ${isActive ? '' : 'group-hover:text-[#0C3C60]/70 transition-colors'}`}>{v.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-[#0C3C60]/60 uppercase tracking-widest font-bold">{v.process}</p>
                  </div>
                  <p className="text-[10px] font-bold text-[#0C3C60] mt-1.5">{v.batchCurrent} / {v.batchTarget} kg</p>
                  <div className="mt-2">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#83DF9C]/35 border border-[#83DF9C] text-[#0C3C60] text-[9px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-[#0C3C60]" />
                        <span>MANAGEMENT COMPLETED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF7E7E]/25 border border-[#FF7E7E]/70 text-[#0C3C60] text-[9px] font-black uppercase tracking-wider">
                        <span>{v.managementPct}% MANAGEMENT</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden bg-slate-200 relative custom-scrollbar">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-40 items-center justify-center w-5 h-16 bg-[#FAF2CA] text-[#0C3C60] rounded-r-lg shadow-lg border border-l-0 border-[#0C3C60]/20 hover:w-7 hover:bg-[#f2e7b5] transition-all duration-300 left-0"
          style={{ transform: 'translateY(-50%)' }}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {isMapOpen && (
          <div className="absolute inset-0 z-50 bg-[#0C3C60]">
            <GlobalMap onClose={() => setIsMapOpen(false)} activeLot={active} />
          </div>
        )}

        {/* Top nav */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-[#0C3C60] flex-shrink-0">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <button 
              onClick={() => router.push('/hub')}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#FAF2CA] border border-[#FAF2CA]/25 bg-white/5 hover:bg-white/15 py-1.5 px-3.5 rounded-full transition-all duration-300 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" /> Back to Hub
            </button>
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsMapOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#69CCC2] border border-[#69CCC2]/40 bg-[#69CCC2]/10 hover:bg-[#69CCC2]/20 py-1.5 px-3.5 rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                <Globe2 className="w-3.5 h-3.5 flex-shrink-0" /> Evidence Journey
              </button>
              <button 
                onClick={() => router.push(`/commercial/report?po=${encodeURIComponent(targetPo)}`)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0C3C60] border border-[#83DF9C] bg-[#83DF9C] hover:bg-[#6fd48b] py-1.5 px-3.5 rounded-full transition-all duration-300 shadow-sm whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 flex-shrink-0" /> Reporte PDF
              </button>
              <div className="hidden 2xl:flex items-center gap-1.5 text-[#FAF2CA]/80 animate-bounce-x-subtle whitespace-nowrap">
                <ArrowLeft className="w-4 h-4 text-[#69CCC2] flex-shrink-0" />
                <span className="text-xs font-medium italic">Click to visualize your coffee's journey</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[#FAF2CA]/70 flex-shrink-0">
            <Search className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Bell className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <div className="w-px h-4 bg-white/15 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-[#69CCC2]/20 border border-[#69CCC2]/40 group-hover:bg-[#83DF9C] group-hover:text-[#0C3C60] transition-colors flex items-center justify-center font-bold text-[11px] text-[#FAF2CA]">J</div>
              <div className="hidden lg:block text-left">
                <p className="text-[#FAF2CA] text-[11px] leading-tight font-bold group-hover:text-[#83DF9C] transition-colors">Julio</p>
                <p className="text-[9px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 leading-tight">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard scroll area */}
        <div className={`flex-1 overflow-y-auto py-6 bg-slate-200 custom-scrollbar transition-all duration-300 ${selectedItem ? 'px-6 xl:px-8' : 'px-8 xl:px-14'}`}>

          {/* Editorial Layout for Evidence Layers */}
          <div className="flex flex-col gap-6 mb-12">
            
            {/* TOP ROW: Value Panel & Purchase Order Card */}
            <div className="grid grid-cols-5 gap-6">
              
              {/* Left: Value & Mission Slider */}
              <div className="col-span-2">
                <ValueMissionPanel selectedLayerId={selectedItem?.id} />
              </div>

              {/* Right: Purchase Order Card (#0C3C60) */}
              <div className="col-span-1 xl:col-span-3 relative bg-[#0C3C60] rounded-3xl overflow-hidden shadow-md border border-[#0C3C60] flex flex-col justify-between p-6 md:p-7 min-h-[160px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex flex-col gap-5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h1 className="text-2xl xl:text-3xl font-light text-[#FAF2CA] tracking-tight whitespace-nowrap">Purchase Order</h1>
                      <span className="text-2xl xl:text-3xl font-bold text-[#69CCC2] tracking-tight whitespace-nowrap">{targetPo}</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 mb-1">Customer</p>
                        <p className="text-sm font-bold text-white">European Coffee Roasters Ltd.</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 mb-1">Exporter</p>
                        <p className="text-sm font-bold text-white">Cooperativa de Caficultores de Risaralda</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[#FAF2CA]/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-[#83DF9C] flex-shrink-0" /> {livePoData?.origin || 'Colombia'} &rarr; {livePoData?.destination || 'Hamburg'}
                      </p>
                      {(livePoData?.last_sync_date || livePoData?.created_at) && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#83DF9C] bg-[#83DF9C]/15 border border-[#83DF9C]/40 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          Actualizado: {new Date(livePoData.last_sync_date || livePoData.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left md:text-right flex flex-col items-start md:items-end flex-shrink-0">
                    <p className={`text-[54px] xl:text-[64px] leading-none font-light tracking-tight mb-2 ${globalProgress >= 100 ? 'text-[#83DF9C]' : 'text-[#69CCC2]'}`}>
                      {globalProgress}%
                    </p>
                    <p className="text-[#FAF2CA]/60 text-[10px] uppercase tracking-widest font-bold mb-1 whitespace-nowrap">Total Consolidated</p>
                    <div className="text-right">
                      <p className="text-white text-xl xl:text-2xl font-bold whitespace-nowrap">
                        {globalCollected.toLocaleString()} <span className="text-[#FAF2CA]/60 font-light">/ {globalTarget.toLocaleString()}</span>
                      </p>
                      <p className="text-[#FAF2CA]/60 text-sm font-medium mt-1">kg</p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex items-center gap-4">
                  <div className="h-1.5 flex-1 bg-white/15 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${globalProgress >= 100 ? 'bg-[#83DF9C]' : 'bg-[#69CCC2]'}`} style={{ width: `${globalProgress}%` }} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${globalProgress >= 100 ? 'text-[#83DF9C]' : 'text-[#FAF2CA]/70'}`}>
                    {globalProgress === 100 ? 'Consolidation Complete' : 'Consolidation In Progress'}
                  </span>
                </div>
              </div>
            </div>

            {/* MIDDLE ROW: Origin, Processing, Quality */}
            <div className="grid grid-cols-3 gap-6">
              {active.evidenceLayers.filter((l: any) => ['origin', 'processing', 'quality'].includes(l.id)).map((item: any) => {
                const isSelected = selectedItem?.id === item.id;
                const isVerified = item.status === 'complete';
                
                let bgClass, textColor, labelColor, hoverLayerColor, isNavy;
                if (item.id === 'origin' || item.id === 'quality') {
                  bgClass = 'bg-[#FAF2CA] border-[#0C3C60]/15';
                  textColor = 'text-[#0C3C60]';
                  labelColor = 'text-[#0C3C60]/60';
                  hoverLayerColor = 'bg-[#0C3C60]/10';
                  isNavy = false;
                } else {
                  bgClass = 'bg-[#0C3C60] border-[#0C3C60]';
                  textColor = 'text-[#FAF2CA]';
                  labelColor = 'text-[#FAF2CA]/60';
                  hoverLayerColor = 'bg-black/25';
                  isNavy = true;
                }
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative group ${bgClass} rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm border p-5 xl:p-6 pb-12 min-h-[160px] flex flex-col justify-start
                      ${isSelected ? 'ring-2 ring-[#69CCC2] shadow-xl -translate-y-1' : 'hover:shadow-lg hover:-translate-y-1'}`}
                  >
                    <div className="flex flex-row justify-between items-center gap-2">
                      <h2 className={`text-base xl:text-lg font-light ${textColor} uppercase tracking-tight truncate`}>{item.name}</h2>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                        isVerified
                          ? isNavy
                            ? 'bg-[#83DF9C]/20 text-[#83DF9C] border border-[#83DF9C]/40'
                            : 'bg-[#83DF9C]/40 text-[#0C3C60] border border-[#83DF9C]'
                          : isNavy
                            ? 'bg-[#FF7E7E]/20 text-[#FF7E7E] border border-[#FF7E7E]/40'
                            : 'bg-[#FF7E7E]/30 text-[#0C3C60] border border-[#FF7E7E]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isVerified ? (isNavy ? 'bg-[#83DF9C]' : 'bg-[#0C3C60]') : (isNavy ? 'bg-[#FF7E7E]' : 'bg-[#0C3C60]')}`} />
                        {isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-3 mt-6">
                      {item.summary.map((s: any) => (
                        <div key={s.label}>
                          <p className={`text-[9px] ${labelColor} uppercase tracking-widest font-bold mb-1`}>{s.label}</p>
                          <p className={`text-base font-bold ${isNavy ? 'text-white' : 'text-[#0C3C60]'}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Hover Status Layer */}
                    <div className={`absolute inset-x-0 bottom-0 ${hoverLayerColor} h-0 group-hover:h-10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center px-6 justify-between`}>
                       <span className={`${textColor} text-[10px] font-bold uppercase tracking-widest`}>Explore Layer</span>
                       <span className={`text-[9px] font-bold uppercase tracking-wider ${isNavy ? 'text-[#69CCC2]' : 'text-[#0C3C60]'}`}>Open Details &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM ROW: Compliance (Small) & Shipment (Small) */}
            <div className="grid grid-cols-4 gap-6">
              {active.evidenceLayers.filter((l: any) => l.id === 'compliance' || l.id === 'shipment').map((item: any) => {
                const isSelected = selectedItem?.id === item.id;
                const isVerified = item.status === 'complete';
                
                const isNavy = item.id === 'compliance';
                const bgClass = isNavy ? 'bg-[#0C3C60] border-[#0C3C60]' : 'bg-[#FAF2CA] border-[#0C3C60]/15';
                const textColor = isNavy ? 'text-[#FAF2CA]' : 'text-[#0C3C60]';
                const labelColor = isNavy ? 'text-[#FAF2CA]/60' : 'text-[#0C3C60]/60';
                const hoverLayerColor = isNavy ? 'bg-black/25' : 'bg-[#0C3C60]/10';
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative group ${bgClass} rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-sm border p-5 pb-10 min-h-[140px] h-full w-full flex flex-col justify-between
                      ${isSelected ? 'ring-2 ring-[#69CCC2] shadow-xl -translate-y-1' : 'hover:shadow-md hover:-translate-y-1'}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className={`text-base font-light ${textColor} uppercase tracking-tight`}>{item.name}</h2>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          isVerified
                            ? isNavy
                              ? 'bg-[#83DF9C]/20 text-[#83DF9C] border border-[#83DF9C]/40'
                              : 'bg-[#83DF9C]/40 text-[#0C3C60] border border-[#83DF9C]'
                            : isNavy
                              ? 'bg-[#FF7E7E]/20 text-[#FF7E7E] border border-[#FF7E7E]/40'
                              : 'bg-[#FF7E7E]/30 text-[#0C3C60] border border-[#FF7E7E]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? (isNavy ? 'bg-[#83DF9C]' : 'bg-[#0C3C60]') : (isNavy ? 'bg-[#FF7E7E]' : 'bg-[#0C3C60]')}`} />
                          {isVerified ? 'OK' : 'Alert'}
                        </span>
                      </div>
                      <div className={`flex flex-col ${selectedItem ? '' : 'xl:flex-row'} gap-4`}>
                        {item.summary.map((s: any) => (
                          <div key={s.label}>
                            <p className={`text-[8px] ${labelColor} uppercase tracking-widest font-bold mb-0.5`}>{s.label}</p>
                            <p className={`text-sm font-bold ${isNavy ? 'text-white' : 'text-[#0C3C60]'}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Hover Status Layer */}
                    <div className={`absolute inset-x-0 bottom-0 ${hoverLayerColor} h-0 group-hover:h-8 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center px-5 justify-between`}>
                       <span className={`${textColor} text-[9px] font-bold uppercase tracking-widest`}>Evidence</span>
                       <span className={`text-[8px] font-bold uppercase tracking-wider ${isNavy ? 'text-[#69CCC2]' : 'text-[#0C3C60]'}`}>
                         View &rarr;
                       </span>
                    </div>
                  </div>
                );
              })}

              {/* CURRENT LOT OVERVIEW (#0C3C60) */}
              <div className="col-span-1 md:col-span-2 relative bg-[#0C3C60] rounded-2xl shadow-sm border border-[#0C3C60] p-5 flex flex-col justify-between w-full min-h-[140px] h-full">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 mb-0.5">Lot Status</p>
                    <h3 className="text-lg font-light text-[#FAF2CA] tracking-tight">{active.title}</h3>
                  </div>
                  <div className="text-left md:text-right mt-6 md:mt-0">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-lg font-black tracking-tight leading-none mb-0.5 ${
                      active.progress >= 100
                        ? 'bg-[#83DF9C]/20 text-[#83DF9C] border border-[#83DF9C]/50'
                        : 'bg-[#FF7E7E]/20 text-[#FF7E7E] border border-[#FF7E7E]/50'
                    }`}>
                      {active.progress}%
                    </span>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 mt-1">Consolidated</p>
                  </div>
                </div>

                <div className={`flex flex-col ${selectedItem ? '' : 'xl:flex-row'} gap-4 xl:gap-8 mb-2 mt-2 flex-1`}>
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 mb-0.5">Volume</p>
                    <p className="text-xs font-bold text-white font-mono whitespace-nowrap">{active.batchCurrent} <span className="text-[#FAF2CA]/60 font-medium">/ {active.batchTarget} kg</span></p>
                  </div>
                  <div className={`min-w-0 border-t pt-2.5 border-white/10 ${selectedItem ? '' : 'xl:border-l xl:border-t-0 xl:pt-0 xl:border-white/15 xl:pl-8'}`}>
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 mb-0.5">Status</p>
                    <p className="text-xs font-bold text-white leading-tight truncate">{active.statusText}</p>
                  </div>
                  <div className={`min-w-0 border-t pt-2.5 border-white/10 ${selectedItem ? '' : 'xl:border-l xl:border-t-0 xl:pt-0 xl:border-white/15 xl:pl-8'}`}>
                    <p className="text-[8px] uppercase tracking-widest font-bold text-[#FAF2CA]/60 mb-0.5">Next Action</p>
                    <p className="text-xs font-bold text-[#69CCC2] truncate">{active.nextAction}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── EVIDENCE EXPLORER PANEL (#082840 / #0C3C60) ── */}
      <aside
        className={`absolute lg:relative inset-y-0 right-0 z-50 w-full md:w-[420px] flex-shrink-0 flex flex-col bg-[#082840] border-l border-white/10 overflow-hidden shadow-2xl lg:shadow-none transition-all duration-500 ease-in-out ${selectedItem ? 'translate-x-0 lg:mr-0' : 'translate-x-full lg:-mr-[420px]'}`}
      >
        {selectedItem && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0C3C60]">
              <div className="flex items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FAF2CA]/80">Evidence Explorer</span>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-[#FAF2CA]/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-6 text-white custom-scrollbar">
              <h2 className="text-2xl font-bold text-[#FAF2CA] mb-2">{selectedItem.explorerContent?.title || selectedItem.name}</h2>
              <p className="text-sm text-[#FAF2CA]/70 leading-relaxed mb-8">{selectedItem.explorerContent?.description}</p>

              {/* ORIGIN LAYER */}
              {selectedItem.explorerContent?.type === 'origin_layer' && (
                <div className="rounded-3xl border border-white/10 p-5 bg-[#0C3C60]">
                  <div className="grid grid-cols-4 text-[9px] text-[#FAF2CA]/60 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/10">
                    <div className="col-span-3">Farmer, Farm &amp; Geolocalización</div>
                    <div className="text-left md:text-right mt-6 md:mt-0">Alt (m)</div>
                  </div>
                  <div className="space-y-4">
                    {active.farmers.map((f: any, i: number) => (
                      <div key={i} className="grid grid-cols-4 items-center gap-1 pb-2 border-b border-white/5 last:border-none">
                        <div className="col-span-3">
                          <p className="text-xs font-bold text-white truncate">{f.name}</p>
                          <p className="text-[10px] text-[#FAF2CA]/70 truncate">{f.farm}</p>
                          {f.eudrCleared && f.satelliteUrl ? (
                            <a
                              href={f.satelliteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-mono text-[#83DF9C] hover:underline mt-0.5 flex items-center gap-1.5"
                              title="Ver finca en imagen satelital real"
                            >
                              <span>📍 {f.coordinates} ↗</span>
                              <span className="bg-[#83DF9C]/20 border border-[#83DF9C]/50 text-[#83DF9C] px-1.5 py-0.2 rounded text-[8px] font-bold">
                                ✓ SENTINEL OK
                              </span>
                            </a>
                          ) : (
                            <p className="text-[9px] font-mono text-[#FF7E7E] mt-0.5">
                              ⚠ Pendiente Coordenada GPS en Sheet
                            </p>
                          )}
                        </div>
                        <p className="text-xs font-mono text-right text-[#69CCC2]">
                          {f.altitude} m
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      downloadEudrGeoJson(
                        targetPo,
                        liveLots.flatMap((l: any) => l.farmers || [])
                      )
                    }
                    className="mt-6 w-full flex items-center justify-center gap-2 px-4 text-[10px] font-bold uppercase tracking-widest border border-[#83DF9C]/50 text-[#83DF9C] py-3 rounded-lg hover:bg-[#83DF9C]/15 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Descargar GeoJSON EUDR</span>
                  </button>
                </div>
              )}

              {/* PROCESSING LAYER */}
              {selectedItem.explorerContent?.type === 'processing_layer' && (
                <div className="rounded-3xl border border-white/10 p-5 space-y-6 bg-[#0C3C60]">
                  <div>
                    <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest mb-3">Milling</h3>
                    <div className="grid grid-cols-4 text-[9px] text-[#FAF2CA]/60 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/10">
                      <div className="col-span-3">Farmer &amp; Farm</div>
                      <div className="text-left md:text-right mt-6 md:mt-0">Yield</div>
                    </div>
                    <div className="space-y-2">
                      {active.farmers.slice(0, 3).map((f: any, i: number) => (
                        <div key={i} className="grid grid-cols-4 items-center gap-1">
                          <div className="col-span-3"><p className="text-xs font-bold text-white truncate">{f.name}</p></div>
                          <p className="text-xs font-mono text-right text-[#83DF9C]">{f.yield}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest mb-3">Laboratory</h3>
                    <div className="grid grid-cols-4 text-[9px] text-[#FAF2CA]/60 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/10">
                      <div className="col-span-3">Farmer &amp; Farm</div>
                      <div className="text-left md:text-right mt-6 md:mt-0">Moisture</div>
                    </div>
                    <div className="space-y-2">
                      {active.farmers.slice(0, 3).map((f: any, i: number) => (
                        <div key={i} className="grid grid-cols-4 items-center gap-1">
                          <div className="col-span-3"><p className="text-xs font-bold text-white truncate">{f.name}</p></div>
                          <p className="text-xs font-mono text-right text-[#69CCC2]">{f.moisture}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* QUALITY LAYER */}
              {selectedItem.explorerContent?.type === 'quality_layer' && (
                <div className="rounded-3xl border border-white/10 p-5 space-y-6 bg-[#0C3C60]">
                  <div>
                    <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest mb-3">Roasting</h3>
                    <p className="text-xs text-[#FAF2CA]/70">Winning Profile: <span className="text-[#69CCC2] font-mono font-bold">Omni Medium</span></p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest mb-3">CVA Sensory</h3>
                    <div className="grid grid-cols-4 text-[9px] text-[#FAF2CA]/60 uppercase tracking-widest font-bold mb-3 pb-2 border-b border-white/10">
                      <div className="col-span-3">Farmer &amp; Farm</div>
                      <div className="text-left md:text-right mt-6 md:mt-0">Score</div>
                    </div>
                    <div className="space-y-2">
                      {active.farmers.slice(0, 3).map((f: any, i: number) => (
                        <div key={i} className="grid grid-cols-4 items-center gap-1">
                          <div className="col-span-3"><p className="text-xs font-bold text-white truncate">{f.name}</p></div>
                          <p className="text-xs font-mono text-right text-[#83DF9C]">{f.score}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* COMPLIANCE LAYER */}
              {selectedItem.explorerContent?.type === 'compliance_layer' && (
                <div className="rounded-3xl border border-white/10 p-5 space-y-6 bg-[#0C3C60]">
                  <div>
                    <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest mb-3">EUDR Status</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#83DF9C]" />
                      <div>
                        <p className="text-sm font-medium text-white">Satellite Intersection (Sentinel-2)</p>
                        <p className="text-[10px] text-[#FAF2CA]/70">Copernicus L2A + JRC 2020 Baseline (Cutoff 31-Dec-2020)</p>
                      </div>
                    </div>
                    <div className="flex justify-between p-4 bg-[#83DF9C]/10 border border-[#83DF9C]/30 rounded-lg">
                      <span className="text-[10px] text-[#FAF2CA]/80 uppercase tracking-widest">Deforestation</span>
                      <span className="text-sm font-mono font-bold text-[#83DF9C]">0.00 ha (CLEARED)</span>
                    </div>
                    <button
                      onClick={() =>
                        downloadEudrGeoJson(
                          targetPo,
                          liveLots.flatMap((l: any) => l.farmers || [])
                        )
                      }
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 text-[10px] font-black uppercase tracking-widest bg-[#83DF9C] text-[#0C3C60] hover:bg-[#6fd48b] py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Descargar GeoJSON EUDR</span>
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest mb-3">Farm &amp; Lot Verification (GPS + Sentinel)</h3>
                    <div className="flex justify-between items-end pb-2 border-b border-white/10 mb-3">
                      <div>
                        <p className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest mb-1">Lots Scanned</p>
                        <p className="text-xl font-bold text-[#83DF9C]">
                          {active.farmers.filter((f: any) => f.eudrCleared).length}
                          <span className="text-sm text-[#FAF2CA]/50">/{active.farmers.length}</span>
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-[#69CCC2]">Geolocalización Real</span>
                    </div>
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                      {active.farmers.map((f: any, i: number) => (
                        <div key={`verified-${i}`} className={`flex justify-between items-center p-2.5 rounded-xl border ${f.eudrCleared ? 'bg-[#83DF9C]/10 border-[#83DF9C]/30' : 'bg-[#FF7E7E]/10 border-[#FF7E7E]/30'}`}>
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-white truncate">{f.name}</p>
                            <p className="text-[10px] text-[#FAF2CA]/70 truncate">{f.farm}</p>
                            {f.eudrCleared && f.satelliteUrl ? (
                              <a
                                href={f.satelliteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-mono text-[#83DF9C] hover:underline mt-0.5 block"
                              >
                                📍 {f.coordinates} (Ver Satélite ↗)
                              </a>
                            ) : (
                              <p className="text-[9px] font-mono text-[#FF7E7E] mt-0.5">
                                ⚠ Sin coordenada GPS en Sheet
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {f.eudrCleared ? (
                              <>
                                <span className="inline-block text-[8px] font-black px-2 py-0.5 rounded bg-[#83DF9C]/20 text-[#83DF9C] border border-[#83DF9C]/40">
                                  ✓ SENTINEL OK
                                </span>
                                <p className="text-[8px] font-mono text-[#FAF2CA]/50 mt-1">{f.sentinelCode}</p>
                              </>
                            ) : (
                              <span className="inline-block text-[8px] font-black px-2 py-0.5 rounded bg-[#FF7E7E]/20 text-[#FF7E7E] border border-[#FF7E7E]/40">
                                PENDIENTE GPS
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SHIPMENT LAYER (INTERACTIVE BUTTON CHECKLIST) */}
              {selectedItem.explorerContent?.type === 'shipment_layer' && (
                <div className="rounded-3xl border border-white/10 p-5 space-y-6 bg-[#0C3C60]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest">Documentation</h3>
                      <span className="text-[9px] text-[#FAF2CA]/60 font-medium">Clic para cambiar estado</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(shipmentDocs).map(([docName, isReady]) => (
                        <div key={docName} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-[#082840]/60">
                          <p className="text-xs font-bold text-white">{docName}</p>
                          <button
                            type="button"
                            onClick={() => {
                              const nextDocs = { ...shipmentDocs, [docName]: !isReady };
                              syncShipmentState(nextDocs, containerSealed);
                            }}
                            className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                              isReady
                                ? 'bg-[#83DF9C] text-[#0C3C60] border border-[#83DF9C] shadow-sm hover:bg-[#6fd48b]'
                                : 'bg-[#FF7E7E]/20 text-[#FF7E7E] border border-[#FF7E7E]/50 hover:bg-[#FF7E7E] hover:text-[#0C3C60]'
                            }`}
                          >
                            {isReady ? '✓ Ready' : 'Awaiting'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FAF2CA] uppercase tracking-widest mb-3">Container</h3>
                    <div className="flex justify-between text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold mb-2">
                      <span>Stuffed Volume</span><span>{active.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full ${active.progress >= 100 ? 'bg-[#83DF9C]' : 'bg-[#69CCC2]'}`} style={{ width: `${active.progress}%` }} />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#082840] rounded-xl border border-white/10 mb-2.5">
                      <span className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest">Seal Number</span>
                      <span className="text-sm font-mono text-[#69CCC2]">AXIS-U-89210</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#082840] rounded-xl border border-white/10">
                      <span className="text-[10px] text-[#FAF2CA]/70 uppercase tracking-widest font-bold">Container Status</span>
                      <button
                        type="button"
                        onClick={() => syncShipmentState(shipmentDocs, !containerSealed)}
                        className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                          containerSealed
                            ? 'bg-[#83DF9C] text-[#0C3C60] border border-[#83DF9C] shadow-sm hover:bg-[#6fd48b]'
                            : 'bg-[#FF7E7E]/20 text-[#FF7E7E] border border-[#FF7E7E]/50 hover:bg-[#FF7E7E] hover:text-[#0C3C60]'
                        }`}
                      >
                        {containerSealed ? '✓ Sealed' : 'Pending'}
                      </button>
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
