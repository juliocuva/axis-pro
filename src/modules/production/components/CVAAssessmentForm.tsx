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
    descriptors: {
      fragrance: string[];
      flavor: string[];
      mouthfeel: string[];
      acidity: string[];
      sweetness: string[];
    };
    predominantGusts: string[];
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
  defects: {
    nonUniformCups: number;
    defectiveCups: number;
    type: string[];
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
    legal: {
      landRights: boolean;
      laborCompliance: boolean;
      indigenousRights: boolean;
      fiscalCompliance: boolean;
    };
  };
}
interface CVAAssessmentFormProps {
  inventoryId: string;
  companyId?: string;
  user?: any;
  onSave?: () => void;
  onCuppingComplete?: () => void;
  isReadOnly?: boolean;
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
    </div>
  </div>
);

interface DescriptorOption {
    label: string;
    subOptions?: string[];
}

const DescriptiveMarkerGroup = ({ label, options, selected, onToggle, disabled }: { label: string, options: (string | DescriptorOption)[], selected: string[], onToggle: (val: string) => void, disabled?: boolean }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{label}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5 border-l border-white/5 pl-4">
            {options.map((opt, idx) => {
                const isString = typeof opt === 'string';
                const mainLabel = isString ? opt : opt.label;
                const subs = isString ? [] : opt.subOptions || [];

                return (
                    <div key={idx} className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        {/* CATEGORÍA PRINCIPAL */}
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggle(mainLabel)}
                            className={`flex items-center gap-2 py-0.5 transition-all group ${disabled ? 'opacity-50' : ''}`}
                        >
                            <div className={`w-3 h-3 border flex-shrink-0 transition-all ${selected.includes(mainLabel) ? 'bg-brand-green border-brand-green shadow-[0_0_8px_rgba(0,166,81,0.4)]' : 'border-white/20 group-hover:border-white/40'}`}>
                                {selected.includes(mainLabel) && <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" className="w-full h-full p-0.5"><path d="M20 6L9 17l-5-5" /></svg>}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${selected.includes(mainLabel) ? 'text-brand-green' : 'text-gray-400 group-hover:text-gray-200'}`}>{mainLabel}</span>
                        </button>
                        
                        {/* SUB-CATEGORÍAS (EN LA MISMA FILA) */}
                        {subs.map(sub => (
                            <button
                                key={sub}
                                type="button"
                                disabled={disabled}
                                onClick={() => onToggle(sub)}
                                className={`flex items-center gap-1.5 py-0.5 transition-all group ${disabled ? 'opacity-50' : ''}`}
                            >
                                <div className={`w-2.5 h-2.5 border flex-shrink-0 transition-all ${selected.includes(sub) ? 'bg-brand-green/70 border-brand-green' : 'border-white/10 group-hover:border-white/20'}`}>
                                    {selected.includes(sub) && <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" className="w-full h-full p-0.5"><path d="M20 6L9 17l-5-5" /></svg>}
                                </div>
                                <span className={`text-[9px] font-medium uppercase tracking-tight ${selected.includes(sub) ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'}`}>{sub}</span>
                            </button>
                        ))}
                    </div>
                );
            })}
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
              ? 'bg-brand-green border-brand-green-soft text-black scale-110' 
              : disabled ? 'border-white/5 bg-white/2 text-gray-600 cursor-not-allowed' : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/30'}`}
        >
          {num}
        </button>
      ))}
    </div>
  </div>
);

export default function CVAAssessmentForm({ inventoryId, companyId, user, onSave, onCuppingComplete, isReadOnly }: CVAAssessmentFormProps) {
  const resolvedCompanyId = companyId || user?.companyId || '';
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadySealed, setIsAlreadySealed] = useState(false);
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
        descriptors: {
            fragrance: [],
            flavor: [],
            mouthfeel: [],
            acidity: [],
            sweetness: []
        },
        predominantGusts: []
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
    defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
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
        eudrHash: '0x' + Math.random().toString(16).slice(2, 10).toUpperCase(),
        legal: {
            landRights: false,
            laborCompliance: false,
            indigenousRights: false,
            fiscalCompliance: false
        }
    }
  });

  const [chartData, setChartData] = useState<any[]>([]);

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

  useEffect(() => {
    const fetchExisting = async () => {
      if (!inventoryId) { setIsLoading(false); return; }
      try {
        // 1. Fetch existing cupping record
        const { data: existing } = await supabase
          .from('sca_cupping')
          .select('*')
          .eq('inventory_id', inventoryId.trim())
          .eq('company_id', resolvedCompanyId)
          .order('created_at', { ascending: false })
          .limit(1);

        // 2. Fetch lot details for defaults
        const { data: lot } = await supabase
          .from('coffee_purchase_inventory')
          .select('variety, process, lot_number, purchase_value')
          .eq('id', inventoryId.trim())
          .single();

        if (existing && existing.length > 0) {
          const record = existing[0];
          if (record.cva_descriptive) {
            setData(prev => ({
              ...prev,
              descriptive: {
                ...prev.descriptive,
                ...record.cva_descriptive,
                descriptors: {
                  ...prev.descriptive.descriptors,
                  ...(record.cva_descriptive?.descriptors || {})
                }
              },
              affective: record.cva_affective || prev.affective,
              defects: record.cva_descriptive?.defects || prev.defects,
              notes: record.notes || '',
              tasterName: record.taster_name || 'Q-Grader Senior'
            }));
          }
          setIsAlreadySealed(true);
        } else if (lot) {
          // Si no hay registro previo, precargamos datos del café analizado
          setData(prev => ({
            ...prev,
            extrinsic: {
              ...prev.extrinsic,
              alchemyProcess: lot.process || 'Lavado Tradicional',
              seedCertificate: lot.variety || 'Variedad Castillo',
              agrochemicalRegistry: '0% Residues - Lab Tested',
              waterPh: '7.2',
              storageConditions: '18°C / 62% RH',
              carbonFootprint: '0.42 kg CO2e/kg',
              transferPrice: lot.purchase_value ? `$${Number(lot.purchase_value).toFixed(2)}` : '',
              eudrHash: lot.lot_number || prev.extrinsic.eudrHash
            }
          }));
        }
      } catch (err) {
        console.error("AXIS ERROR:", err);
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

  const toggleDescriptor = (category: keyof CVAData['descriptive']['descriptors'], val: string) => {
    setData(prev => {
        const current = prev.descriptive.descriptors[category] || [];
        const updated = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
        return {
            ...prev,
            descriptive: {
                ...prev.descriptive,
                descriptors: { ...prev.descriptive.descriptors, [category]: updated }
            }
        };
    });
  };

  const toggleGust = (val: string) => {
    setData(prev => {
        const current = prev.descriptive.predominantGusts;
        const updated = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
        return {
            ...prev,
            descriptive: { ...prev.descriptive, predominantGusts: updated }
        };
    });
  };

  const toggleDefectType = (val: string) => {
    setData(prev => {
        const current = prev.defects.type;
        const updated = current.includes(val) ? current.filter(x => x !== val) : [...current, val];
        return {
            ...prev,
            defects: { ...prev.defects, type: updated }
        };
    });
  };

  const handleQualityChange = (key: keyof CVAData['affective'], val: number) => {
    setData(prev => ({
      ...prev,
      affective: { ...prev.affective, [key]: val }
    }));
  };

  const totalAffectiveScore = Object.values(data.affective).reduce((acc, val) => acc + (Number(val) > 0 ? Number(val) : 8.0), 0);
  const totalScore = totalAffectiveScore + 25; 
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
          cva_descriptive: { ...data.descriptive, defects: data.defects, extrinsic: data.extrinsic },
          cva_affective: data.affective,
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
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 relative bg-bg-main min-h-screen">
      {/* HEADER DE ETAPA NOTARIAL */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.4em]">Axis Digital Notary</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter">ETAPA 05: LABORATORIO Y CATACIÓN</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">SCA CVA v2.0 Protocol | Industrial Standardization</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Hash de Trazabilidad</p>
            <p className="text-[11px] font-mono text-brand-green-bright font-bold">{data.extrinsic.eudrHash}</p>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/60 backdrop-blur-sm rounded-industrial">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-green-bright animate-pulse">Sincronizando con AXIS Cloud...</p>
        </div>
      )}

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
            <button
                onClick={() => setActiveTab('intrinsic')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'intrinsic' ? 'bg-brand-green text-black' : 'text-gray-500 hover:text-white'}`}
            >
                1. Evaluación Sensorial (CVA)
            </button>
            <button
                onClick={() => setActiveTab('extrinsic')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'extrinsic' ? 'bg-brand-green text-black' : 'text-gray-500 hover:text-white'}`}
            >
                2. Evaluación Extrínseca (AOC)
            </button>
      </div>

      {activeTab === 'intrinsic' ? (
        <div className="flex flex-col gap-10 animate-in slide-in-from-left duration-500">
            {/* PARTE 1: DESCRIPTIVA (LÓGICA) */}
            <div className="bg-bg-card p-10 rounded-industrial border border-white/10 relative overflow-hidden flex flex-col gap-10">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-green shadow-[0_0_15px_rgba(0,166,81,0.3)]"></div>
                <header className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">PARTE 1: Evaluación Descriptiva</h3>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Intensidad (0-15)</span>
                </header>

                <div className="space-y-12">
                    {/* AROMA / FRAGANCIA */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <IntensitySlider label="Fragancia" value={data.descriptive.fragranceIntensity} onChange={(v) => handleIntensityChange('fragranceIntensity', v)} disabled={isAlreadySealed || isReadOnly} />
                            <IntensitySlider label="Aroma" value={data.descriptive.aromaIntensity} onChange={(v) => handleIntensityChange('aromaIntensity', v)} disabled={isAlreadySealed || isReadOnly} />
                        </div>
                        <DescriptiveMarkerGroup 
                            label="Notas de Fragancia / Aroma"
                            options={[
                                { label: 'Floral' },
                                { label: 'Afrutado', subOptions: ['Bayas', 'Frutas deshidratadas', 'Cítricos'] },
                                { label: 'Ácido/Fermentado', subOptions: ['Ácido', 'Fermentado'] },
                                { label: 'Verde/Vegetal' },
                                { label: 'Tostado', subOptions: ['Cereal', 'Quemado', 'Tabaco'] },
                                { label: 'Nueces/Cacao', subOptions: ['Nueces', 'Cacao'] },
                                { label: 'Especias' },
                                { label: 'Dulce', subOptions: ['Vainilla', 'Azúcar morena'] },
                                { label: 'Otra', subOptions: ['Químico', 'Tierra', 'Madera'] }
                            ]}
                            selected={data.descriptive.descriptors.fragrance}
                            onToggle={(v) => toggleDescriptor('fragrance', v)}
                            disabled={isAlreadySealed}
                        />
                    </div>

                    {/* SABOR / SABOR RESIDUAL */}
                    <div className="space-y-6 pt-8 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <IntensitySlider label="Sabor" value={data.descriptive.flavorIntensity} onChange={(v) => handleIntensityChange('flavorIntensity', v)} disabled={isAlreadySealed} />
                            <IntensitySlider label="Sabor Residual" value={data.descriptive.aftertasteIntensity} onChange={(v) => handleIntensityChange('aftertasteIntensity', v)} disabled={isAlreadySealed} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <DescriptiveMarkerGroup 
                                label="Notas de Sabor"
                                options={[
                                    { label: 'Floral' },
                                    { label: 'Afrutado', subOptions: ['Bayas', 'Frutas deshidratadas', 'Cítricos'] },
                                    { label: 'Ácido/Fermentado', subOptions: ['Ácido', 'Fermentado'] },
                                    { label: 'Tostado', subOptions: ['Cereal', 'Quemado', 'Tabaco'] },
                                    { label: 'Nueces/Cacao', subOptions: ['Nueces', 'Cacao'] },
                                    { label: 'Dulce', subOptions: ['Vainilla', 'Azúcar morena'] }
                                ]}
                                selected={data.descriptive.descriptors.flavor}
                                onToggle={(v) => toggleDescriptor('flavor', v)}
                                disabled={isAlreadySealed}
                            />
                            <DescriptiveMarkerGroup 
                                label="Gustos Predominantes"
                                options={['Salado', 'Ácido', 'Dulce', 'Amargo', 'Umami']}
                                selected={data.descriptive.predominantGusts}
                                onToggle={toggleGust}
                                disabled={isAlreadySealed}
                            />
                        </div>
                    </div>

                    {/* ACIDEZ / DULZOR */}
                    <div className="space-y-6 pt-8 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <IntensitySlider label="Acidez" value={data.descriptive.acidityIntensity} onChange={(v) => handleIntensityChange('acidityIntensity', v)} disabled={isAlreadySealed} />
                                <DescriptiveMarkerGroup 
                                    label="Carácter de Acidez"
                                    options={['Cítrica', 'Málica', 'Fosfórica', 'Acética', 'Láctica', 'Vibrante', 'Compleja']}
                                    selected={data.descriptive.descriptors.acidity}
                                    onToggle={(v) => toggleDescriptor('acidity', v)}
                                    disabled={isAlreadySealed}
                                />
                            </div>
                            <div className="space-y-6">
                                <IntensitySlider label="Dulzor" value={data.descriptive.sweetnessIntensity} onChange={(v) => handleIntensityChange('sweetnessIntensity', v)} disabled={isAlreadySealed} />
                                <DescriptiveMarkerGroup 
                                    label="Carácter de Dulzor"
                                    options={['Miel', 'Azúcar Moreno', 'Jarabe', 'Melaza', 'Floral', 'Frutal']}
                                    selected={data.descriptive.descriptors.sweetness}
                                    onToggle={(v) => toggleDescriptor('sweetness', v)}
                                    disabled={isAlreadySealed}
                                />
                            </div>
                        </div>
                    </div>

                    {/* CUERPO */}
                    <div className="space-y-6 pt-8 border-t border-white/5">
                        <IntensitySlider label="Sensación en Boca (Cuerpo)" value={data.descriptive.mouthfeelIntensity} onChange={(v) => handleIntensityChange('mouthfeelIntensity', v)} disabled={isAlreadySealed} />
                        <DescriptiveMarkerGroup 
                            label="Textura y Sensación"
                            options={['Áspero', 'Aceitoso', 'Suave', 'Astringente', 'Metálico', 'Cremoso', 'Sedoso', 'Almibarado']}
                            selected={data.descriptive.descriptors.mouthfeel}
                            onToggle={(v) => toggleDescriptor('mouthfeel', v)}
                            disabled={isAlreadySealed}
                        />
                    </div>
                </div>
            </div>

            {/* PARTE 2: AFECTIVA (EMOCIÓN) */}
            <div className="bg-bg-card p-10 rounded-industrial border border-white/10 relative overflow-hidden flex flex-col gap-10">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-brand-green-bright shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
                <header className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h3 className="text-[11px] font-black text-brand-green-bright uppercase tracking-[0.3em]">PARTE 2: Evaluación Afectiva</h3>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Calidad (1-9)</span>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                    <QualityScale label="Fragancia / Aroma" value={data.affective.fragranceQuality} onChange={(v) => handleQualityChange('fragranceQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Sabor" value={data.affective.flavorQuality} onChange={(v) => handleQualityChange('flavorQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Sabor Residual" value={data.affective.aftertasteQuality} onChange={(v) => handleQualityChange('aftertasteQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Acidez" value={data.affective.acidityQuality} onChange={(v) => handleQualityChange('acidityQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Dulzor" value={data.affective.sweetnessQuality} onChange={(v) => handleQualityChange('sweetnessQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Cuerpo" value={data.affective.mouthfeelQuality} onChange={(v) => handleQualityChange('mouthfeelQuality', v)} disabled={isAlreadySealed} />
                    <div className="md:col-span-2 pt-6 border-t border-white/10">
                        <QualityScale label="IMPRESIÓN GLOBAL" value={data.affective.overallImpression} onChange={(v) => handleQualityChange('overallImpression', v)} disabled={isAlreadySealed} />
                    </div>
                </div>

                {/* DEFECTOS */}
                <div className="mt-auto pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Tazas Uniformes / Defectuosas</label>
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Uniformes</span>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        min="0" max="5" 
                                        value={data.defects.nonUniformCups} 
                                        onChange={(e) => setData({...data, defects: {...data.defects, nonUniformCups: parseInt(e.target.value)}})} 
                                        disabled={isAlreadySealed}
                                        className="w-20 h-20 bg-black/40 border-2 border-white/10 rounded-2xl text-3xl text-center font-black text-white outline-none focus:border-brand-green focus:bg-brand-green/5 transition-all appearance-none cursor-pointer" 
                                    />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-green rounded-full flex items-center justify-center text-[8px] font-black text-black">U</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Defectuosas</span>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        min="0" max="5" 
                                        value={data.defects.defectiveCups} 
                                        onChange={(e) => setData({...data, defects: {...data.defects, defectiveCups: parseInt(e.target.value)}})} 
                                        disabled={isAlreadySealed}
                                        className="w-20 h-20 bg-black/40 border-2 border-white/10 rounded-2xl text-3xl text-center font-black text-brand-red outline-none focus:border-brand-red focus:bg-brand-red/5 transition-all appearance-none cursor-pointer" 
                                    />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red rounded-full flex items-center justify-center text-[8px] font-black text-black">D</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DescriptiveMarkerGroup 
                        label="Defectos"
                        options={['Mohoso', 'Fenólico', 'Papa', 'Fermento', 'Químico', 'Tierra']}
                        selected={data.defects.type}
                        onToggle={toggleDefectType}
                        disabled={isAlreadySealed}
                    />
                </div>
            </div>

            {/* BOTÓN DE NAVEGACIÓN A EXTRÍNSECO */}
            {!isAlreadySealed && (
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => setActiveTab('extrinsic')}
                        className="bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border border-brand-green/30 px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 transition-all group"
                    >
                        Continuar con Evaluación Extrínseca (AOC)
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-500">
             <div className="bg-bg-card p-10 rounded-industrial border border-white/10 space-y-10">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Protocolo de Alquimia e Insumos</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Proceso de Alquimia</label>
                        <input type="text" value={data.extrinsic.alchemyProcess} onChange={(e) => handleExtrinsicChange('alchemyProcess', e.target.value)} placeholder="Ej: Anaeróbico 72h / Lactic..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-brand-green placeholder:text-gray-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">LMR (Químicos)</label>
                            <input type="text" value={data.extrinsic.agrochemicalRegistry} onChange={(e) => handleExtrinsicChange('agrochemicalRegistry', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Agua (pH)</label>
                            <input type="text" value={data.extrinsic.waterPh} onChange={(e) => handleExtrinsicChange('waterPh', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Certificado de Semilla</label>
                        <input type="text" value={data.extrinsic.seedCertificate} onChange={(e) => handleExtrinsicChange('seedCertificate', e.target.value)} placeholder="ID de Certificación de Origen..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-gray-700" />
                    </div>
                </div>
             </div>

             <div className="bg-bg-card p-10 rounded-industrial border border-white/10 space-y-10">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Transparencia Económica y Ambiental</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Transfer Price (USD)</label>
                        <input type="text" value={data.extrinsic.transferPrice} onChange={(e) => handleExtrinsicChange('transferPrice', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-brand-green-bright outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Costo Prod.</label>
                        <input type="text" value={data.extrinsic.productionCost} onChange={(e) => handleExtrinsicChange('productionCost', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Condiciones de Almacén</label>
                        <input type="text" value={data.extrinsic.storageConditions} onChange={(e) => handleExtrinsicChange('storageConditions', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Huella de Carbono</label>
                        <input type="text" value={data.extrinsic.carbonFootprint} onChange={(e) => handleExtrinsicChange('carbonFootprint', e.target.value)} className="w-full bg-white/2 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none text-brand-green" />
                    </div>
                </div>
                <div className="p-6 bg-brand-green/5 border border-brand-green/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L3 7v9l9 5 9-5V7l-9-5z"/></svg>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-brand-green uppercase tracking-widest">Sello de Trazabilidad EUDR</p>
                            <p className="text-[10px] text-gray-400 font-bold font-mono">{data.extrinsic.eudrHash}</p>
                        </div>
                    </div>
                    <EUDRComplianceBadge status="compliant" />
                </div>
                <div className="mt-4 p-4 bg-white/2 border border-white/5 rounded-xl">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Protección de Propiedad Intelectual AXIS
                    </p>
                    <p className="text-[9px] text-gray-600 leading-relaxed italic">
                        Los descriptores extrínsecos y métricas de terroir están protegidos por el protocolo de irreproducibilidad AXIS. Estos datos se sellan para certificar la autenticidad del origen sin exponer protocolos críticos de fermentación a terceros no autorizados.
                    </p>
                </div>

                {/* MÓDULO LEGAL DE CUMPLIMIENTO */}
                <div className="bg-black/40 border border-brand-green/20 p-8 rounded-industrial space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Módulo de Cumplimiento Legal</h4>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Validación de Autoridad y Soberanía</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'landRights', label: 'Derechos de Tierra (INCORA)', icon: '🏠' },
                            { key: 'laborCompliance', label: 'Cumplimiento Laboral', icon: '👥' },
                            { key: 'indigenousRights', label: 'Derechos Indígenas', icon: '🌿' },
                            { key: 'fiscalCompliance', label: 'Cumplimiento Fiscal (DIAN)', icon: '🏛️' }
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                disabled={isAlreadySealed}
                                onClick={() => setData(prev => ({
                                    ...prev,
                                    extrinsic: {
                                        ...prev.extrinsic,
                                        legal: { ...prev.extrinsic.legal, [item.key]: !prev.extrinsic.legal[item.key as keyof typeof prev.extrinsic.legal] }
                                    }
                                }))}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${data.extrinsic.legal[item.key as keyof typeof prev.extrinsic.legal] ? 'bg-brand-green/10 border-brand-green/40 text-brand-green' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm">{item.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${data.extrinsic.legal[item.key as keyof typeof prev.extrinsic.legal] ? 'bg-brand-green border-brand-green' : 'border-white/20'}`}>
                                    {data.extrinsic.legal[item.key as keyof typeof prev.extrinsic.legal] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="5"><path d="M20 6L9 17l-5-5"/></svg>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {!isAlreadySealed && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isAlreadySealed || isReadOnly}
                        className="w-full mt-6 bg-brand-green hover:bg-brand-green-bright text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(0,166,81,0.3)] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        )}
                        Sellar y Finalizar Protocolo AOC
                    </button>
                )}
             </div>
        </div>
      )}

      {/* FOOTER: RADAR Y SELLADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-bg-card border border-white/10 p-8 rounded-industrial flex flex-col items-center gap-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Huella Biometría Sensorial</h4>
                <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="#ffffff10" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: '900' }} />
                            <Radar 
                                name="Calidad" 
                                dataKey="A" 
                                stroke="#0C6056" 
                                fill="#0C6056" 
                                fillOpacity={0.4} 
                                dot={{ fill: '#0C6056', r: 3 }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">LAB Score Final</p>
                    <p className="text-5xl font-black text-white tracking-tighter">{totalScore.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-bg-card p-8 rounded-industrial border border-white/10 flex flex-col gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Catador Principal</label>
                    <input type="text" value={data.tasterName} onChange={(e) => setData({...data, tasterName: e.target.value})} disabled={isAlreadySealed} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-brand-green" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Notas de Laboratorio</label>
                    <textarea rows={4} value={data.notes} onChange={(e) => setData({...data, notes: e.target.value})} disabled={isAlreadySealed} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none resize-none focus:border-brand-green" placeholder="Escriba aquí los descriptores finales..." />
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || isAlreadySealed || isReadOnly}
                    className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-4 ${isAlreadySealed ? 'bg-[#0B1E1A] text-brand-green border border-brand-green/30 cursor-default' : isReadOnly ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed' : 'bg-brand-green hover:bg-brand-green-bright text-black shadow-[0_0_30px_rgba(0,166,81,0.2)] active:scale-[0.98]'}`}
                >
                    {isAlreadySealed ? (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            PROTOCOLO SELLADO E INMUTABLE
                        </>
                    ) : isReadOnly ? (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" /></svg>
                            MODO LECTURA (SIN PERMISOS DE EDICIÓN)
                        </>
                    ) : isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            SINCRONIZANDO...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse"><path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" /></svg>
                            SELLAR PROCESO DE CATACIÓN
                        </>
                    )}
                    {isAlreadySealed && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
            </div>
      </div>
    </div>
  );
}
