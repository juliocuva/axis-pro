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
    tasterName: 'Q-Grader Senior'
  });

  const [chartData, setChartData] = useState<any[]>([]);

  // Sincronizar gráfico de radar
  useEffect(() => {
    const radarValues = [
        { subject: 'Fragancia', A: data.affective.fragranceQuality, fullMark: 9 },
        { subject: 'Sabor', A: data.affective.flavorQuality, fullMark: 9 },
        { subject: 'Residual', A: data.affective.aftertasteQuality, fullMark: 9 },
        { subject: 'Acidez', A: data.affective.acidityQuality, fullMark: 9 },
        { subject: 'Dulzor', A: data.affective.sweetnessQuality, fullMark: 9 },
        { subject: 'Cuerpo', A: data.affective.mouthfeelQuality, fullMark: 9 },
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
            setData({
              descriptive: record.cva_descriptive,
              affective: record.cva_affective,
              notes: record.notes || '',
              tasterName: record.taster_name || 'Q-Grader Senior'
            });
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
        
        if (lotData) setLotDetails(lotData);

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
  const totalScore = totalAffectiveScore + 30; 

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
          cva_descriptive: data.descriptive,
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
                Coffee Value Assessment • SCA 2025-2026
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Evaluación de Valor</h2>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
                Basado en el Protocolo Descriptivo SCA-103 + Afectivo SCA-104
            </p>
            </div>
            <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Puntaje CVA</p>
            <p className={`text-5xl font-bold tracking-tighter ${totalScore >= 84 ? 'text-brand-green-bright' : totalScore >= 80 ? 'text-brand-green-bright' : 'text-brand-green'}`}>
                {totalScore.toFixed(2)}
            </p>
            </div>
        </div>

        <EUDRComplianceBadge lotData={lotDetails} className="mb-4" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                className={`w-full font-bold py-6 rounded-industrial-sm transition-all flex items-center justify-center gap-4 group uppercase tracking-[0.2em] text-xs shadow-2xl ${isAlreadySealed ? 'bg-brand-green/20 text-brand-green border border-brand-green/30 cursor-not-allowed opacity-100' : 'bg-brand-green hover:bg-brand-green-bright text-black disabled:opacity-30'}`}
            >
                {isAlreadySealed ? 'PROCESO SELLADO Y VERIFICADO' : isSaving ? 'SINCRONIZANDO CON SERVIDOR AXIS...' : 'SELLAR EVALUACIÓN CVA'}
            </button>
        </div>
      </div>
    </div>
  );
}
