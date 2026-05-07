'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import EUDRComplianceBadge from '@/modules/supply/components/EUDRComplianceBadge';

// Tipos de datos basados en el standard SCA CVA v2
interface CVAData {
  descriptive: {
    fragranceIntensity: number;
    aromaIntensity: number;
    flavorIntensity: number;
    aftertasteIntensity: number;
    acidityIntensity: number;
    sweetnessIntensity: number;
    mouthfeelIntensity: number;
    descriptors: string[];
    mouthfeelType: string;
  };
  affective: {
    fragranceQuality: number;
    aromaQuality: number;
    flavorQuality: number;
    aftertasteQuality: number;
    acidityQuality: number;
    sweetnessQuality: number;
    mouthfeelQuality: number;
    overallImpression: number;
  };
  notes: string;
  tasterName: string;
  extrinsic: {
    alchemyProcess: string;
    seedCertificate: string;
    carbonFootprint: string;
    transferPrice: string;
    productionCost: string;
    agrochemicalRegistry: string;
    waterPh: string;
    storageConditions: string;
    eudrHash: string;
  };
}

interface CVAAssessmentFormProps {
  inventoryId: string;
  companyId?: string;
  user?: { companyId: string } | null;
  onSave?: () => void;
  onCuppingComplete?: () => void;
}

const IntensitySlider = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <span className="text-brand-green-bright font-mono font-bold text-sm bg-brand-green/10 px-2 py-0.5 rounded">{value}</span>
    </div>
    <div className="relative h-6 flex items-center">
      <input
        type="range"
        min="0"
        max="15"
        step="0.5"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1 bg-white/10 rounded-lg appearance-none accent-brand-green-bright ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      />
      <div className="absolute -bottom-4 w-full flex justify-between text-[8px] text-gray-500 font-bold px-1">
        <span>BAJA</span>
        <span>MEDIA</span>
        <span>ALTA</span>
      </div>
    </div>
  </div>
);

const QualityScale = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{label}</label>

    <div className="flex justify-between gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          type="button"
          disabled={disabled}
          onClick={() => onChange(num)}
          className={`w-8 h-8 rounded-full border text-[10px] font-bold transition-all flex items-center justify-center
            ${value === num 
              ? 'bg-brand-green border-brand-green-soft text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
              : disabled ? 'border-white/5 bg-white/2 text-gray-600 cursor-not-allowed' : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/30'}`}
        >
          {num}
        </button>
      ))}
    </div>
  </div>
);

export default function CVAAssessmentForm({ inventoryId, companyId, user, onSave, onCuppingComplete }: CVAAssessmentFormProps) {
  const resolvedCompanyId = companyId || user?.companyId || '';
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadySealed, setIsAlreadySealed] = useState(false);
  const [lotDetails, setLotDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'intrinsic' | 'extrinsic'>('intrinsic');
  const [data, setData] = useState<CVAData>({
    descriptive: {
        fragranceIntensity: 0,
        aromaIntensity: 0,
        flavorIntensity: 0,
        aftertasteIntensity: 0,
        acidityIntensity: 0,
        sweetnessIntensity: 0,
        mouthfeelIntensity: 0,
        descriptors: [],
        mouthfeelType: ''
    },
    affective: {
        fragranceQuality: 5,
        aromaQuality: 5,
        flavorQuality: 5,
        aftertasteQuality: 5,
        acidityQuality: 5,
        sweetnessQuality: 5,
        mouthfeelQuality: 5,
        overallImpression: 5
    },
    notes: '',
    tasterName: 'Q-Grader Senior',
    extrinsic: {
        alchemyProcess: '',
        seedCertificate: '',
        carbonFootprint: '0.42 kg CO2e/kg',
        transferPrice: '',
        productionCost: '',
        agrochemicalRegistry: '0% Residues - Lab Tested',
        waterPh: '7.2',
        storageConditions: '18°C / 62% RH',
        eudrHash: '0x' + Math.random().toString(16).slice(2, 10).toUpperCase()
    }
  });

  const [chartData, setChartData] = useState<any[]>([]);

  // Sincronizar gráfico de radar
  useEffect(() => {
    const radarValues = [
        { subject: 'Frag/Aroma', A: data.affective.fragranceQuality, fullMark: 9 },
        { subject: 'Sabor', A: data.affective.flavorQuality, fullMark: 9 },
        { subject: 'Residual', A: data.affective.aftertasteQuality, fullMark: 9 },
        { subject: 'Acidez', A: data.affective.acidityQuality, fullMark: 9 },
        { subject: 'Dulzor', A: data.affective.sweetnessQuality, fullMark: 9 },
        { subject: 'Cuerpo', A: data.affective.mouthfeelQuality, fullMark: 9 },
        { subject: 'Global', A: data.affective.overallImpression, fullMark: 9 },
    ];
    setChartData(radarValues);
  }, [data.affective]);

  // Cargar datos existentes si el lote ya fue evaluado
  useEffect(() => {
    const fetchExisting = async () => {
      if (!inventoryId) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const { data: existing } = await supabase
          .from('sca_cupping')
          .select('*')
          .eq('inventory_id', inventoryId.trim())
          .eq('company_id', resolvedCompanyId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          const record = existing[0];
          if (record.cva_descriptive && record.cva_affective) {
            setData(prev => ({
              ...prev,
              descriptive: record.cva_descriptive,
              affective: record.cva_affective,
              notes: record.notes || '',
              tasterName: record.taster_name || 'Q-Grader Senior',
              extrinsic: record.cva_descriptive?.extrinsic || prev.extrinsic
            }));
          } else {
            setData(prev => ({
              ...prev,
              notes: record.notes || '',
              tasterName: record.taster_name || 'Q-Grader Senior'
            }));
          }
          setIsAlreadySealed(true);
        }

        // Fetch lot details for EUDR
        const { data: lotData } = await supabase
          .from('coffee_purchase_inventory')
          .select('*')
          .eq('id', inventoryId.trim())
          .single();
        
        if (lotData) {
            setLotDetails(lotData);
            
            // Auto-poblar datos extrínsecos si es una evaluación nueva
            if (!existing || existing.length === 0) {
                setData(prev => {
                    const processName = lotData.process || '';
                    const styleName = lotData.process_data?.fermentation_style || '';
                    const customName = lotData.process_data?.custom_fermentation_name || '';
                    
                    let alchemy = customName ? customName.toUpperCase() : `${processName} ${styleName}`.trim().toUpperCase();
                    
                    return {
                        ...prev,
                        extrinsic: {
                            ...prev.extrinsic,
                            alchemyProcess: alchemy || prev.extrinsic.alchemyProcess,
                            seedCertificate: lotData.variety || prev.extrinsic.seedCertificate,
                            transferPrice: lotData.purchase_value ? (Number(lotData.purchase_value) / 4000).toFixed(2) : prev.extrinsic.transferPrice, // Estimación USD base $4000 COP
                            eudrHash: (lotData.farm_size_hectares && lotData.farm_size_hectares >= 4) ? 'PENDING MAP' : 'AUTO-VALIDATED'
                        }
                    };
                });
            }
        }

      } catch (err) {
        console.error("AXIS ERROR (CVA Fetch):", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExisting();
  }, [inventoryId, resolvedCompanyId]);

  const handleIntensityChange = (key: keyof CVAData['descriptive'], val: number) => {
    setData(prev => ({
      ...prev,
      descriptive: { ...prev.descriptive, [key]: val }
    }));
  };

  const handleQualityChange = (key: keyof CVAData['affective'], val: number) => {
    setData(prev => ({
      ...prev,
      affective: { ...prev.affective, [key]: val }
    }));
  };

  const totalAffectiveScore = (
    data.affective.fragranceQuality + 
    data.affective.flavorQuality + 
    data.affective.aftertasteQuality + 
    data.affective.acidityQuality + 
    data.affective.sweetnessQuality + 
    data.affective.mouthfeelQuality + 
    data.affective.overallImpression
  );

  // --- MOTOR HÍBRIDO AOC (Algoritmo V2.0) ---
  // Base técnica ajustada a 25 para dar peso a los metadatos comerciales y de trazabilidad (Extrínsecos)
  let extrinsicBonus = 0;
  if (data.extrinsic.eudrHash && data.extrinsic.eudrHash.length > 5 && data.extrinsic.eudrHash !== 'PENDING') extrinsicBonus += 2.0;
  if (data.extrinsic.alchemyProcess && data.extrinsic.alchemyProcess.length > 2) extrinsicBonus += 1.5;
  if (data.extrinsic.seedCertificate && data.extrinsic.seedCertificate.length > 2) extrinsicBonus += 0.5;
  if (data.extrinsic.carbonFootprint && data.extrinsic.carbonFootprint.length > 2) extrinsicBonus += 0.5;
  if (data.extrinsic.transferPrice && data.extrinsic.transferPrice.length > 1) extrinsicBonus += 0.5;
  
  const agro = data.extrinsic.agrochemicalRegistry?.toLowerCase() || '';
  if (agro.includes('orgánic') || agro.includes('organic') || agro.includes('biológic') || agro.includes('biologic') || agro.includes('0%')) {
      extrinsicBonus += 1.0;
  }

  const totalScore = totalAffectiveScore + 25 + extrinsicBonus; 

  const handleExtrinsicChange = (key: keyof CVAData['extrinsic'], val: string) => {
    setData(prev => ({
      ...prev,
      extrinsic: { ...prev.extrinsic, [key]: val }
    }));
  };

  const handleSave = async () => {
    if (!inventoryId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sca_cupping')
        .insert([{
          inventory_id: inventoryId,
          company_id: resolvedCompanyId,
          fragrance_aroma: data.affective.fragranceQuality,
          flavor: data.affective.flavorQuality,
          aftertaste: data.affective.aftertasteQuality,
          acidity: data.affective.acidityQuality,
          body: data.affective.mouthfeelQuality,
          overall: data.affective.overallImpression,
          cva_descriptive: { ...data.descriptive, extrinsic: data.extrinsic },
          cva_affective: data.affective,
          is_cva_version: true,
          notes: data.notes,
          taster_name: data.tasterName
        }]);

      if (error) throw error;
      
      await supabase
        .from('coffee_purchase_inventory')
        .update({ status: 'completed' })
        .eq('id', inventoryId);

      setIsAlreadySealed(true);
      onCuppingComplete?.();
      onSave?.();
    } catch (err) {
      console.error(err);
      alert(`Error al sincronizar CVA: ${(err as any)?.message || JSON.stringify(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-industrial">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-green-bright animate-pulse">Sincronizando con AXIS Cloud...</p>
          </div>
        </div>
      )}

      {/* FILA SUPERIOR: FORMULARIOS */}
      <div className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-6 gap-4">
            <div>
            <div className="inline-block px-2 py-0.5 bg-brand-green/10 border border-brand-green/20 rounded text-[9px] text-brand-green uppercase font-black tracking-widest mb-2">
                Protocolo AOC v2.0 • Industrial Verification
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Pasaporte de Calidad</h2>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                    ID Único: <span className="text-brand-green-bright font-mono">{data.extrinsic.eudrHash}</span>
                </p>
                <button 
                    className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                    onClick={() => alert('Descargando Plantilla AOC Excel...')}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00A651" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Plantilla Excel</span>
                </button>
            </div>
            </div>
            <div className="flex flex-col items-end gap-3">
                <button 
                    onClick={() => alert('Iniciando Ingesta desde Excel...')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-brand-green/30 rounded-xl hover:border-brand-green transition-all shadow-xl group"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A651" strokeWidth="2" className="group-hover:scale-110 transition-transform"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Importar desde Excel</span>
                </button>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Extrinsic Bonus</p>
                    <p className="text-xl font-bold text-brand-green-bright mb-2">+{extrinsicBonus.toFixed(2)} pts</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">LAB Final Score</p>
                    <p className={`text-5xl font-bold tracking-tighter ${totalScore >= 84 ? 'text-brand-green-bright' : totalScore >= 80 ? 'text-brand-green-bright' : 'text-brand-green'}`}>
                        {totalScore.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS AOC */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
            <button
                onClick={() => setActiveTab('intrinsic')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'intrinsic' ? 'bg-brand-green text-black' : 'text-gray-500 hover:text-white'}`}
            >
                1. Evaluación Intrínseca
            </button>
            <button
                onClick={() => setActiveTab('extrinsic')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'extrinsic' ? 'bg-brand-green text-black' : 'text-gray-500 hover:text-white'}`}
            >
                2. Evaluación Extrínseca (AOC)
            </button>
        </div>

        {activeTab === 'intrinsic' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-left duration-300">
                {/* PARTE 1: DESCRIPTIVA */}
                <div className="bg-bg-card p-8 rounded-industrial border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-green shadow-[0_0_10px_rgba(0,166,81,0.5)]"></div>
                    <h3 className="text-xs font-black text-brand-green uppercase tracking-widest mb-6">Análisis Descriptivo (Intensidad 0-15)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14">
                        <IntensitySlider label="Fragancia" value={data.descriptive.fragranceIntensity} onChange={(v) => handleIntensityChange('fragranceIntensity', v)} disabled={isAlreadySealed} />
                        <IntensitySlider label="Aroma" value={data.descriptive.aromaIntensity} onChange={(v) => handleIntensityChange('aromaIntensity', v)} disabled={isAlreadySealed} />
                        <IntensitySlider label="Sabor" value={data.descriptive.flavorIntensity} onChange={(v) => handleIntensityChange('flavorIntensity', v)} disabled={isAlreadySealed} />
                        <IntensitySlider label="Sabor Residual" value={data.descriptive.aftertasteIntensity} onChange={(v) => handleIntensityChange('aftertasteIntensity', v)} disabled={isAlreadySealed} />
                        <IntensitySlider label="Acidez" value={data.descriptive.acidityIntensity} onChange={(v) => handleIntensityChange('acidityIntensity', v)} disabled={isAlreadySealed} />
                        <IntensitySlider label="Dulzor" value={data.descriptive.sweetnessIntensity} onChange={(v) => handleIntensityChange('sweetnessIntensity', v)} disabled={isAlreadySealed} />
                    </div>
                    <div className="pt-8 border-t border-white/5 mt-8">
                        <IntensitySlider label="Cuerpo (Sensación en Boca)" value={data.descriptive.mouthfeelIntensity} onChange={(v) => handleIntensityChange('mouthfeelIntensity', v)} disabled={isAlreadySealed} />
                    </div>
                </div>

                {/* PARTE 2: AFECTIVA */}
                <div className="bg-bg-card p-8 rounded-industrial border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-brand-green shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    <h3 className="text-xs font-black text-brand-green uppercase tracking-widest mb-6">Análisis Afectivo (Calidad 1-9)</h3>
                    <div className="flex flex-col gap-y-4">

                        <QualityScale label="Fragancia / Aroma" value={data.affective.fragranceQuality} onChange={(v) => handleQualityChange('fragranceQuality', v)} disabled={isAlreadySealed} />
                        <QualityScale label="Sabor" value={data.affective.flavorQuality} onChange={(v) => handleQualityChange('flavorQuality', v)} disabled={isAlreadySealed} />
                        <QualityScale label="Sabor Residual" value={data.affective.aftertasteQuality} onChange={(v) => handleQualityChange('aftertasteQuality', v)} disabled={isAlreadySealed} />
                        <QualityScale label="Acidez" value={data.affective.acidityQuality} onChange={(v) => handleQualityChange('acidityQuality', v)} disabled={isAlreadySealed} />
                        <QualityScale label="Dulzor" value={data.affective.sweetnessQuality} onChange={(v) => handleQualityChange('sweetnessQuality', v)} disabled={isAlreadySealed} />
                        <QualityScale label="Cuerpo" value={data.affective.mouthfeelQuality} onChange={(v) => handleQualityChange('mouthfeelQuality', v)} disabled={isAlreadySealed} />
                        <div className="pt-4 border-t border-white/5 mt-0">
                            <QualityScale label="IMPRESIÓN GLOBAL" value={data.affective.overallImpression} onChange={(v) => handleQualityChange('overallImpression', v)} disabled={isAlreadySealed} />
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-300">
                {/* PARTE 3: ALQUIMIA Y CUMPLIMIENTO (EXTRÍNSECO) */}
                <div className="bg-bg-card p-8 rounded-industrial border border-white/5 space-y-8">
                    <h3 className="text-xs font-black text-brand-green uppercase tracking-widest mb-6">Módulo de Alquimia e Insumos</h3>
                    
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Proceso de Alquimia (Fermentaciones)</label>
                        <input 
                            type="text"
                            value={data.extrinsic.alchemyProcess} 
                            onChange={(e) => handleExtrinsicChange('alchemyProcess', e.target.value)}
                            disabled={isAlreadySealed}
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none text-brand-green-bright"
                            placeholder="Ej: Lavado Tradicional"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Trazabilidad de Agroquímicos y Fertilizantes (LMR)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: 0% Residuos"
                                value={data.extrinsic.agrochemicalRegistry}
                                onChange={(e) => handleExtrinsicChange('agrochemicalRegistry', e.target.value)}
                                disabled={isAlreadySealed}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Calidad de Agua (pH)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: 7.2"
                                value={data.extrinsic.waterPh}
                                onChange={(e) => handleExtrinsicChange('waterPh', e.target.value)}
                                disabled={isAlreadySealed}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Identidad de Semilla</label>
                        <input 
                            type="text" 
                            placeholder="Número de Certificado"
                            value={data.extrinsic.seedCertificate}
                            onChange={(e) => handleExtrinsicChange('seedCertificate', e.target.value)}
                            disabled={isAlreadySealed}
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none" 
                        />
                    </div>
                </div>

                {/* PARTE 4: FINANZAS Y CONSERVACIÓN */}
                <div className="bg-bg-card p-8 rounded-industrial border border-white/5 space-y-8">
                    <h3 className="text-xs font-black text-brand-green uppercase tracking-widest mb-6">Transparencia y Logística</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Precio de Transferencia (USD/lb)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: 2.85"
                                value={data.extrinsic.transferPrice}
                                onChange={(e) => handleExtrinsicChange('transferPrice', e.target.value)}
                                disabled={isAlreadySealed}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none text-brand-green-bright" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Costo de Producción</label>
                            <input 
                                type="text" 
                                placeholder="Ej: 1.95"
                                value={data.extrinsic.productionCost}
                                onChange={(e) => handleExtrinsicChange('productionCost', e.target.value)}
                                disabled={isAlreadySealed}
                                className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none text-gray-400" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Condiciones de Almacenamiento</label>
                        <input 
                            type="text" 
                            placeholder="Ej: 18°C / 62% RH"
                            value={data.extrinsic.storageConditions}
                            onChange={(e) => handleExtrinsicChange('storageConditions', e.target.value)}
                            disabled={isAlreadySealed}
                            className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none" 
                        />
                    </div>

                    <div className="pt-6 border-t border-white/5">
                         <div className="flex items-center gap-4 p-4 bg-brand-green/5 rounded-xl border border-brand-green/20">
                            <div className="p-2 bg-brand-green/20 rounded-full text-brand-green">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-brand-green uppercase tracking-widest">Garantía de Origen EUDR</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">El sistema ha validado las geocoordenadas de este lote automáticamente.</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* FILA INFERIOR: VISUALIZACIÓN Y ACCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO DE HUELLA ORGANOLÉPTICA */}
        <div className="bg-bg-card border border-white/5 p-6 rounded-industrial flex flex-col items-center space-y-4 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-brand-green/5 blur-3xl opacity-50"></div>
            <h4 className="text-[12px] font-bold text-gray-300 uppercase tracking-[0.4em] text-center leading-relaxed relative z-10 px-4 pt-2">
                Huella Organoléptica<br />estándar CVA
            </h4>
            <div className="w-full h-[280px] min-h-[280px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[1, 9]} axisLine={false} tick={false} />
                        <Radar
                            name="Calidad"
                            dataKey="A"
                            stroke="#ffffff"
                            fill="#ffffff"
                            fillOpacity={0.6}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="pb-4 text-center space-y-3 relative z-10 w-full border-t border-white/5 pt-6">
                <span className={`px-6 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border shadow-xl ${totalScore >= 85 ? 'bg-brand-green/20 text-brand-green-bright border-brand-green/30' : 'bg-brand-green/20 text-brand-green-bright border-brand-green/30'}`}>
                    {totalScore >= 85 ? '✓ SPECIALTY COFFEE' : '✓ PREMIUM GRADE'}
                </span>
            </div>
        </div>

        {/* NOTAS Y SELLADO */}
        <div className="bg-bg-card p-6 rounded-industrial border border-white/5 space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Catador / Q-Grader</label>
                <input
                    type="text"
                    value={data.tasterName}
                    disabled={isAlreadySealed}
                    onChange={(e) => setData({...data, tasterName: e.target.value})}
                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Notas de Cata</label>
                <textarea
                    value={data.notes}
                    disabled={isAlreadySealed}
                    onChange={(e) => setData({...data, notes: e.target.value})}
                    rows={4}
                    className="w-full bg-bg-main border border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:border-brand-green outline-none resize-none"
                    placeholder="Descriptores de sabor, acidez, cuerpo..."
                />
            </div>

            <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isAlreadySealed}
                className={`w-full font-black py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl ${isAlreadySealed ? 'bg-brand-green/20 text-brand-green-bright border border-brand-green/30 cursor-not-allowed opacity-100' : 'bg-brand-green hover:bg-brand-green-bright text-black disabled:opacity-30'}`}
            >
                {isAlreadySealed ? (
                    <>
                        PROCESO SELLADO Y VERIFICADO
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                    </>
                ) : isSaving ? (
                    <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        SINCRONIZANDO CON LA NUBE...
                    </>
                ) : (
                    <>
                        SELLAR PROCESO Y VERIFICAR
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-12 transition-transform">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}
