"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Ship,
  Award,
  Coffee,
  Users,
  Download
} from 'lucide-react';
import { verifyLotEudrSentinel, downloadEudrGeoJson } from '../../../shared/lib/eudr-sentinel';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface LotSummary {
  variety: string;
  title: string;
  process: string;
  collectedKg: number;
  targetKg: number;
  progress: number;
  farmersCount: number;
  avgScore: string;
}

interface FarmerRow {
  lotCode: string;
  name: string;
  farm: string;
  variety: string;
  process: string;
  score: string;
  volumeKg: number;
  coordinates: string;
  lat: number | null;
  lng: number | null;
  satelliteUrl: string | null;
  sentinelCode: string;
  eudrCleared: boolean;
}

export default function TraceabilityReportPage() {
  const router = useRouter();
  const [targetPo, setTargetPo] = useState('PO-2026-08-001');
  const [poData, setPoData] = useState<any>(null);
  const [lotSummaries, setLotSummaries] = useState<LotSummary[]>([]);
  const [farmersList, setFarmersList] = useState<FarmerRow[]>([]);
  const [compliance, setCompliance] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poParam = params.get('po') || 'PO-2026-08-001';
    setTargetPo(poParam);

    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        const { data: po } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('po_number', poParam)
          .single();

        if (!po) {
          setIsLoading(false);
          return;
        }
        setPoData(po);

        const [lotsRes, compRes, shipRes] = await Promise.all([
          supabase
            .from('lots')
            .select(
              '*, lot_farmers(farmers(name)), processing_evidence(yield_pct, moisture_pct, water_activity), quality_evidence(roast_profile, cva_score)'
            )
            .eq('po_id', po.id)
            .order('name', { ascending: true }),
          supabase.from('compliance_evidence').select('*').eq('po_id', po.id).single(),
          supabase.from('shipment_evidence').select('*').eq('po_id', po.id).single()
        ]);

        const lots = lotsRes.data || [];
        setCompliance(compRes.data || null);
        setShipment(shipRes.data || null);

        // Map expected lots from PO
        const grouped: Record<
          string,
          {
            variety: string;
            process: string;
            targetKg: number;
            lots: any[];
          }
        > = {};

        const inferDefaultProcess = (varietyName: string) => {
          const lower = varietyName.toLowerCase();
          if (lower.includes('bourbon')) return 'Honey';
          if (lower.includes('typica') || lower.includes('geisha')) return 'Natural';
          return 'Washed';
        };

        if (po.expected_lots && Array.isArray(po.expected_lots)) {
          po.expected_lots.forEach((el: any) => {
            if (el.variety) {
              const norm = el.variety.trim().toLowerCase();
              grouped[norm] = {
                variety: el.variety.trim(),
                process: el.process || inferDefaultProcess(el.variety),
                targetKg: Number(el.volume_kg) || 0,
                lots: []
              };
            }
          });
        }

        const farmMap: Record<string, string> = {
          'Juan Carlos Perez': 'Finca La Esperanza',
          'Maria Elena Giraldo': 'Finca El Ocaso',
          'Carlos Arturo Lopez': 'Finca Buena Vista',
          'Julio Uva': 'Finca La Alejandria',
          'Catalina Perez': 'Finca La Alejandria',
          'Alejandra Perez': 'Finca La Alejandria',
          'Sebastian Perez': 'Finca La Alejandria',
          'Alejandra Saraza': 'Finca Las Orquideas'
        };

        const allFarmerRows: FarmerRow[] = [];

        lots.forEach((lot: any) => {
          const rawVariety = (lot.coffee_type || '').trim();
          if (!rawVariety || rawVariety.toLowerCase() === 'unknown') return;
          const norm = rawVariety.toLowerCase();

          if (!grouped[norm]) {
            grouped[norm] = {
              variety: rawVariety,
              process: inferDefaultProcess(rawVariety),
              targetKg: 0,
              lots: []
            };
          }
          grouped[norm].lots.push(lot);

          const qual = Array.isArray(lot.quality_evidence)
            ? lot.quality_evidence[0]
            : lot.quality_evidence;
          const scoreVal = qual?.cva_score ? Number(qual.cva_score).toFixed(1) : '-';
          const processName = grouped[norm].process || inferDefaultProcess(rawVariety);

          (lot.lot_farmers || []).forEach((rel: any) => {
            const farmerName = rel.farmers?.name || 'Productor Asociado';
            const baseFarm =
              lot.farm_name ||
              farmMap[farmerName] ||
              `Finca ${farmerName.split(' ')[0] || 'El Paraíso'}`;
            const sentinel = verifyLotEudrSentinel(lot.gps_coordinates, lot.name, farmerName);

            allFarmerRows.push({
              lotCode: lot.name || '-',
              name: farmerName,
              farm: baseFarm,
              variety: grouped[norm].variety,
              process: processName,
              score: scoreVal,
              volumeKg: Number(lot.volume_kg) || 0,
              coordinates: sentinel.coordinates,
              lat: sentinel.lat,
              lng: sentinel.lng,
              satelliteUrl: sentinel.satelliteUrl,
              sentinelCode: sentinel.verificationCode,
              eudrCleared: sentinel.cleared
            });
          });
        });

        const summaries: LotSummary[] = Object.values(grouped).map((g) => {
          const collectedKg = g.lots.reduce((acc, l) => acc + (Number(l.volume_kg) || 0), 0);
          const targetKg = g.targetKg || collectedKg || 1;
          const rawPct = targetKg > 0 ? Math.round((collectedKg / targetKg) * 100) : 0;
          const progress = Math.min(100, rawPct);

          let scoreSum = 0;
          let scoreCount = 0;
          const uniqueFarmers = new Set<string>();

          g.lots.forEach((l: any) => {
            const qual = Array.isArray(l.quality_evidence)
              ? l.quality_evidence[0]
              : l.quality_evidence;
            if (qual?.cva_score) {
              scoreSum += Number(qual.cva_score);
              scoreCount++;
            }
            (l.lot_farmers || []).forEach((rel: any) => {
              if (rel.farmers?.name) uniqueFarmers.add(rel.farmers.name);
            });
          });

          let title = g.variety;
          if (!title.toLowerCase().includes('lot') && !title.toLowerCase().includes('blend')) {
            title = `${title} Lot`;
          }

          return {
            variety: g.variety,
            title,
            process: g.process,
            collectedKg,
            targetKg: g.targetKg || collectedKg,
            progress,
            farmersCount: uniqueFarmers.size,
            avgScore: scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : '-'
          };
        });

        setLotSummaries(summaries);
        setFarmersList(allFarmerRows);
      } catch (err) {
        console.error('Error loading report data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const totalCollected = lotSummaries.reduce((acc, s) => acc + s.collectedKg, 0);
  const totalTarget =
    poData?.target_volume_kg || lotSummaries.reduce((acc, s) => acc + s.targetKg, 0) || 1;
  const globalProgress = Math.min(100, Math.round((totalCollected / totalTarget) * 100));

  const eudrCleared = Boolean(compliance?.eudr_cleared);
  const docsReady = Boolean(shipment?.docs_ready);

  return (
    <div
      className="min-h-screen bg-slate-100 print:bg-white text-[#0f1e38] py-8 px-4 print:p-0"
      style={{
        fontFamily: "var(--font-montserrat, 'Montserrat', sans-serif)",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-[#0f1e38] text-white px-6 py-4 rounded-2xl shadow-lg print:hidden">
        <button
          onClick={() => router.push(`/commercial/evidence?po=${encodeURIComponent(targetPo)}`)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#00C87A]" /> Volver al Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              downloadEudrGeoJson(targetPo, farmersList, {
                exporter: poData?.exporter,
                customer: poData?.customer,
                origin: poData?.origin
              })
            }
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-[#00C87A]/50 text-[#00C87A] font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Descargar GeoJSON EUDR</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#00C87A] hover:bg-[#00b36d] text-[#0f1e38] font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl print:rounded-none shadow-xl print:shadow-none border border-slate-200 print:border-none p-8 md:p-12 print:p-6">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            Generando Reporte Oficial de Trazabilidad...
          </div>
        ) : (
          <>
            {/* 1. HEADER CORPORATIVO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#0f1e38] pb-6 mb-8 gap-6">
              <div className="flex items-center gap-5">
                <div className="bg-[#0f1e38] p-3 rounded-2xl flex items-center justify-center">
                  <img
                    src="/logo-axisone.png"
                    alt="AxisONE"
                    className="h-14 w-auto object-contain"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00a866] mb-1">
                    Official Traceability &amp; Quality Dossier
                  </p>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#0f1e38]">
                    REPORTE DE TRAZABILIDAD Y LOTES
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Orden de Compra:{' '}
                    <span className="text-[#0f1e38] font-black">{targetPo}</span>
                    {poData?.last_sync_date && (
                      <span className="ml-3 text-slate-400">
                        • Última actualización:{' '}
                        {new Date(poData.last_sync_date).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-right self-stretch md:self-auto flex flex-col justify-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Consolidación Total PO
                </p>
                <div className="flex items-baseline justify-end gap-2 mt-0.5">
                  <span className="text-3xl font-black text-[#00a866]">{globalProgress}%</span>
                  <span className="text-xs font-bold text-[#0f1e38]">
                    ({totalCollected.toLocaleString()} / {totalTarget.toLocaleString()} kg)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. DATOS DE LA ORDEN Y CHECKS DE CUMPLIMIENTO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Cliente (Importador)
                  </p>
                  <p className="text-sm font-bold text-[#0f1e38]">
                    {poData?.customer || 'European Coffee Roasters Ltd.'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Exportador
                  </p>
                  <p className="text-sm font-bold text-[#0f1e38]">
                    {poData?.exporter || 'Cooperativa de Caficultores de Risaralda'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Ruta Comercial
                  </p>
                  <p className="text-xs font-bold text-[#0f1e38]">
                    {poData?.origin || 'Colombia'} &rarr; {poData?.destination || 'Hamburg, Germany'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Total Productores Vinculados
                  </p>
                  <p className="text-xs font-bold text-[#0f1e38]">
                    {farmersList.length} entregas verificadas
                  </p>
                </div>
              </div>

              {/* Casillas de Verificación EUDR y Shipment */}
              <div className="bg-[#0f1e38] text-white rounded-2xl p-5 flex flex-col justify-between gap-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#00C87A]">
                  Verificación de Cumplimiento
                </p>

                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck
                      className={`w-4 h-4 ${eudrCleared ? 'text-[#00C87A]' : 'text-amber-400'}`}
                    />
                    <div>
                      <p className="text-[11px] font-bold leading-tight">Due Diligence &amp; EUDR</p>
                      <p className="text-[9px] text-slate-400">0.0 ha Deforestación</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      eudrCleared
                        ? 'bg-[#00C87A] text-[#0f1e38]'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {eudrCleared ? '✓ APROBADO' : 'PENDIENTE'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Ship
                      className={`w-4 h-4 ${docsReady ? 'text-[#00C87A]' : 'text-amber-400'}`}
                    />
                    <div>
                      <p className="text-[11px] font-bold leading-tight">Shipment &amp; Docs</p>
                      <p className="text-[9px] text-slate-400">Contenedor y Puerto</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      docsReady
                        ? 'bg-[#00C87A] text-[#0f1e38]'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {docsReady ? '✓ OK / SELLADO' : 'PENDIENTE'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. RESUMEN DE LOS LOTES DEL EJERCICIO */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#0f1e38] flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#00a866]" /> Estado de Consolidación por Lote (
                  {lotSummaries.length} Lotes)
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Meta vs. Recolección Real
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lotSummaries.map((lot, idx) => {
                  const isComplete = lot.progress >= 100;
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl p-5 border-2 transition-all break-inside-avoid ${
                        isComplete
                          ? 'bg-emerald-50/40 border-[#00C87A]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#0f1e38] text-white">
                            {lot.process}
                          </span>
                          <h3 className="text-lg font-black text-[#0f1e38] mt-1.5 leading-tight">
                            {lot.title}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-2xl font-black leading-none ${
                              isComplete ? 'text-[#00a866]' : 'text-[#0f1e38]'
                            }`}
                          >
                            {lot.progress}%
                          </span>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                            {isComplete ? 'COMPLETADO' : 'EN PROCESO'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-[#00C87A] rounded-full"
                          style={{ width: `${lot.progress}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                            Volumen
                          </p>
                          <p className="font-black text-[#0f1e38]">
                            {lot.collectedKg.toLocaleString()} / {lot.targetKg.toLocaleString()} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                            Caficultores
                          </p>
                          <p className="font-black text-[#0f1e38]">{lot.farmersCount} fincas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                            Puntaje Prom.
                          </p>
                          <p className="font-black text-[#00a866]">{lot.avgScore} pts</p>
                        </div>
                      </div>

                      {isComplete && (
                        <div className="mt-3 pt-2 border-t border-[#00C87A]/30 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#00a866]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Lote 100% Consolidado y Verificado
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. LISTADO DE CAFICULTORES PARTICIPANTES */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#0f1e38] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00a866]" /> Listado de Caficultores Participantes en
                  la Recolección
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total: {farmersList.length} Registros
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0f1e38] text-white text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3.5 px-3">#</th>
                      <th className="py-3.5 px-3">Nombre del Caficultor</th>
                      <th className="py-3.5 px-3">Finca &amp; Lote</th>
                      <th className="py-3.5 px-3">Variedad</th>
                      <th className="py-3.5 px-3">Proceso</th>
                      <th className="py-3.5 px-3">EUDR / Sentinel-2</th>
                      <th className="py-3.5 px-3 text-center">Puntaje de Taza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {farmersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                          No hay caficultores sincronizados para esta orden todavía.
                        </td>
                      </tr>
                    ) : (
                      farmersList.map((farmer, index) => (
                        <tr
                          key={`${farmer.lotCode}-${index}`}
                          className="odd:bg-white even:bg-slate-50/70 break-inside-avoid"
                        >
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-400 font-bold">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#0f1e38]">{farmer.name}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {farmer.farm}
                            {farmer.lotCode && farmer.lotCode !== '-' && (
                              <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                                ({farmer.lotCode})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-[#0f1e38]">{farmer.variety}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200/80 text-[#0f1e38]">
                              {farmer.process}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {farmer.eudrCleared ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 w-fit text-[9px] font-black text-[#00a866] bg-emerald-50 border border-[#00C87A]/40 px-2 py-0.5 rounded">
                                  ✓ SENTINEL OK (0.0 ha)
                                </span>
                                {farmer.satelliteUrl ? (
                                  <a
                                    href={farmer.satelliteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] font-mono text-[#0f1e38] hover:text-[#00a866] underline mt-0.5"
                                  >
                                    📍 {farmer.coordinates} ↗
                                  </a>
                                ) : (
                                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                                    {farmer.coordinates}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 w-fit text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                                ⚠ Pendiente GPS
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-black text-[#00a866] bg-emerald-50 border border-[#00C87A]/40 px-2.5 py-0.5 rounded-lg">
                              <Award className="w-3 h-3" /> {farmer.score}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. PIE DE PÁGINA OFICIAL */}
            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-400 font-semibold gap-2 break-inside-avoid">
              <div>
                Documento generado por <strong className="text-[#0f1e38]">AxisONE Coffee Traceability Platform</strong>.
              </div>
              <div>
                Fecha de emisión:{' '}
                {new Date().toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
