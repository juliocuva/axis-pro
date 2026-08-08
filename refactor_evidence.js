const fs = require('fs');

const filePath = 'src/app/commercial/evidence/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add livePoData and liveLots states
content = content.replace(
  'const [liveFarmers, setLiveFarmers] = useState<any[]>([]);',
  `const [liveLots, setLiveLots] = useState<any[]>([]);\n  const [livePoData, setLivePoData] = useState<any>(null);`
);

// 2. Modify fetchLiveData
const fetchRegex = /const fetchLiveData = async \(\) => \{[\s\S]*?fetchLiveData\(\);\n  \}, \[targetPo\]\);/;
const newFetchBlock = `const fetchLiveData = async () => {
      try {
        const { data: po } = await supabase.from('purchase_orders').select('*').eq('po_number', poQuery).single();
        if (!po) {
          setIsLoading(false);
          return;
        }
        setLivePoData(po);

        const { data: lots } = await supabase.from('lots').select('id, name, volume_kg, lot_farmers(farmers(name)), processing_evidence(yield_pct, moisture_pct, water_activity), quality_evidence(roast_profile, cva_score)').eq('po_id', po.id);
        const { data: compliance } = await supabase.from('compliance_evidence').select('*').eq('po_id', po.id).single();
        const { data: shipment } = await supabase.from('shipment_evidence').select('*').eq('po_id', po.id).single();

        if (lots && lots.length > 0) {
          let sumYield = 0, sumMoisture = 0, sumWaterActivity = 0, sumScore = 0;
          let countProcessing = 0, countQuality = 0;

          const formattedLots = lots.map((lot: any) => {
            if (lot.processing_evidence && lot.processing_evidence[0]) {
               const proc = lot.processing_evidence[0];
               sumYield += Number(proc.yield_pct || 0);
               sumMoisture += Number(proc.moisture_pct || 0);
               sumWaterActivity += Number(proc.water_activity || 0);
               countProcessing++;
            }
            if (lot.quality_evidence && lot.quality_evidence[0]) {
               const qual = lot.quality_evidence[0];
               sumScore += Number(qual.cva_score || 0);
               countQuality++;
            }

            const farmersInLot = (lot.lot_farmers || []).map((rel:any) => ({
              name: rel.farmers?.name || 'Unknown',
              yield: lot.processing_evidence?.[0]?.yield_pct ? \`\${lot.processing_evidence[0].yield_pct}%\` : "90.2%",
              moisture: lot.processing_evidence?.[0]?.moisture_pct ? \`\${lot.processing_evidence[0].moisture_pct}%\` : "11.2%",
              score: lot.quality_evidence?.[0]?.cva_score ? \`\${lot.quality_evidence[0].cva_score}\` : "85.0"
            }));

            return {
              id: lot.id,
              title: lot.name || 'Unnamed Lot',
              progress: Math.round(((lot.volume_kg || 0) / (po.target_volume_kg || 1)) * 100),
              batchCurrent: (lot.volume_kg || 0).toLocaleString(),
              batchTarget: (po.target_volume_kg || 0).toLocaleString(),
              managementPct: lot.quality_evidence?.[0]?.cva_score || 85,
              missingLots: 0,
              statusText: "Traceability Complete",
              nextAction: "Generate Contract",
              eta: "2 Days",
              yield: lot.processing_evidence?.[0]?.yield_pct || 90,
              moisture: lot.processing_evidence?.[0]?.moisture_pct || 11,
              waterActivity: lot.processing_evidence?.[0]?.water_activity || 0.6,
              roastProfile: lot.quality_evidence?.[0]?.roast_profile || "Omni",
              cvaScore: lot.quality_evidence?.[0]?.cva_score || 84,
              source: "Google Sheets",
              farmers: farmersInLot,
              missingFarmersList: []
            };
          });

          setLiveLots(formattedLots);
          setLiveVolume(lots.reduce((acc: any, lot: any) => acc + (lot.volume_kg || 0), 0));
          setLiveAverages({
             yield: countProcessing ? (sumYield / countProcessing).toFixed(1) : "90.2",
             moisture: countProcessing ? (sumMoisture / countProcessing).toFixed(1) : "11.2",
             waterActivity: countProcessing ? (sumWaterActivity / countProcessing).toFixed(2) : "0.62",
             score: countQuality ? (sumScore / countQuality).toFixed(1) : "85.0",
             eudrCleared: compliance?.eudr_cleared ? "100%" : "0%",
             deforestation: compliance ? \`\${compliance.deforestation_ha} ha\` : "0.0 ha",
             docsReady: shipment?.docs_ready ? "Yes" : "No",
             containerStatus: shipment?.container_status === 'PENDING' ? "Pending" : "Sealed"
          });
          
          if (!selectedId || selectedId === 'commercial') {
            setSelectedId(formattedLots[0].id);
          }
        } else {
          setLiveLots([]);
          setLiveVolume(0);
        }
      } catch (err) {
        console.error("Supabase error", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveData();
  }, [targetPo]);`;

content = content.replace(fetchRegex, newFetchBlock);

// 3. active and global Progress
const activeRegex = /const active = DASHBOARD_DATA\.find.*?const globalProgress = Math\.round.*?100\);/s;
const newActive = `const active = liveLots.find(d => d.id === selectedId) || liveLots[0] || {
    id: 'empty', title: 'Awaiting Sync', progress: 0, batchCurrent: '0', batchTarget: livePoData?.target_volume_kg || 0,
    managementPct: 0, missingLots: 0, statusText: 'Pending Data', nextAction: 'Sync Sheets', eta: '-',
    yield: 0, moisture: 0, waterActivity: 0, roastProfile: '-', cvaScore: 0, source: '-', farmers: [], missingFarmersList: []
  };

  const globalTarget = livePoData?.target_volume_kg || 20000;
  const globalCollected = liveVolume;
  const globalProgress = globalTarget > 0 ? Math.round((globalCollected / globalTarget) * 100) : 0;`;
content = content.replace(activeRegex, newActive);

// 4. Map DASHBOARD_DATA inside JSX to liveLots
content = content.replace(/DASHBOARD_DATA\.map/g, 'liveLots.map');

// 5. Dynamic texts
content = content.replace('<p className="text-sm font-bold text-white">European Coffee Roasters Ltd.</p>', '<p className="text-sm font-bold text-white">{livePoData?.buyer_name || "AxisONE Buyer"}</p>');
content = content.replace('Colombia &rarr; Hamburg', '{livePoData?.origin || "Origin"} &rarr; {livePoData?.destination || "Destination"}');
content = content.replace('<p className="text-sm font-bold text-white">Cooperativa de Caficultores de Risaralda</p>', '<p className="text-sm font-bold text-white">AxisONE Cooperative</p>');

fs.writeFileSync(filePath, content);
console.log('Refactor completed.');
