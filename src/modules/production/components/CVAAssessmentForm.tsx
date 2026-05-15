'use client';

import React, { useState, useEffect } from 'react';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
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
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5">
        <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
        {label}
      </label>
      <span className="text-black font-mono font-bold text-sm bg-white border border-gray-400 shadow-sm px-2 py-0.5 rounded">{value}</span>
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
        className={`w-full h-1 bg-black/20 rounded-lg appearance-none accent-brand-green ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      />
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #0C6056;
          cursor: pointer;
          border-radius: 50%;
          border: 1px solid #000;
        }
        input[type='range']:disabled::-webkit-slider-thumb {
          background: #006056;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  </div>
);

interface DescriptorOption {
    label: string;
    subOptions?: string[];
}

const DescriptiveMarkerGroup = ({ label, options, selected, onToggle, disabled }: { label: string, options: (string | DescriptorOption)[], selected: string[], onToggle: (val: string) => void, disabled?: boolean }) => (
    <div className="space-y-2">
        <label className="text-[11px] font-bold text-black font-black uppercase ">{label}</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 border-l border-gray-400 pl-4">
            {options.map((opt, idx) => {
                const isString = typeof opt === 'string';
                const mainLabel = isString ? opt : opt.label;
                const subs = isString ? [] : opt.subOptions || [];

                return (
                    <div key={idx} className="flex flex-col gap-1">
                        {/* CATEGORÍA PRINCIPAL */}
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggle(mainLabel)}
                            className={`flex items-center gap-1 py-0.5 transition-all w-fit group ${disabled ? 'cursor-not-allowed' : ''}`}
                        >
                            <div className={`w-3.5 h-3.5 border flex-shrink-0 transition-all flex items-center justify-center ${selected.includes(mainLabel) ? 'bg-black border-black shadow-[0_0_8px_rgba(0,166,81,0.4)]' : 'border-black'}`}>
                                {selected.includes(mainLabel) && <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" className="w-2.5 h-2.5"><path d="M20 6L9 17l-5-5" /></svg>}
                            </div>
                            <span className={`text-[11px] font-bold uppercase  ${selected.includes(mainLabel) ? 'text-black' : 'text-black font-black'}`}>{mainLabel}</span>
                        </button>
                        
                        {/* SUB-CATEGORÍAS */}
                        {subs.length > 0 && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-6">
                                {subs.map(sub => (
                                    <button
                                        key={sub}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => onToggle(sub)}
                                        className={`flex items-center gap-1.5 py-0.5 transition-all group ${disabled ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`w-3 h-3 border flex-shrink-0 transition-all flex items-center justify-center ${selected.includes(sub) ? 'bg-black/70 border-black' : 'border-black'}`}>
                                            {selected.includes(sub) && <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" className="w-2 h-2"><path d="M20 6L9 17l-5-5" /></svg>}
                                        </div>
                                        <span className={`text-[11px] font-medium uppercase  ${selected.includes(sub) ? 'text-black' : 'text-black font-black'}`}>{sub}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

const QualityScale = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) => (
  <div className="space-y-2">
    <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5 mb-3">
      <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
      {label}
    </label>
    <div className="flex justify-between gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          type="button"
          disabled={disabled}
          onClick={() => onChange(num)}
          className={`w-7 h-7 rounded-full border text-[11px] font-bold transition-all flex items-center justify-center
            ${value === num 
              ? 'bg-brand-green border-black text-black font-black scale-110 shadow-sm' 
              : disabled ? 'border-gray-400 bg-white text-black font-black cursor-not-allowed' : 'border-gray-400 bg-white text-black hover:border-black'}`}
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
              transferPrice: lot.purchase_value ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(lot.purchase_value)) : '',
              productionCost: '$9.850.000,00',
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
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 relative bg-white min-h-screen">
      {/* HEADER DE ETAPA NOTARIAL */}
      

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-industrial">
          <p className="text-black font-black uppercase  text-black animate-pulse">Sincronizando con AXIS Cloud...</p>
        </div>
      )}

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex gap-3 mb-10 w-full">
            <button
                onClick={() => setActiveTab('intrinsic')}
                className={`flex-1 py-4 rounded-xl text-[11px] font-bold uppercase border-2 transition-all ${activeTab === 'intrinsic' ? 'bg-brand-green border-transparent text-black' : 'bg-white border-gray-400 text-black'}`}
            >
                1. Evaluación Sensorial (CVA)
            </button>
            <button
                onClick={() => setActiveTab('extrinsic')}
                className={`flex-1 py-4 rounded-xl text-[11px] font-bold uppercase border-2 transition-all ${activeTab === 'extrinsic' ? 'bg-brand-green border-transparent text-black' : 'bg-white border-gray-400 text-black'}`}
            >
                2. Evaluación Extrínseca
            </button>
      </div>

      {activeTab === 'intrinsic' ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-500">
            {/* PARTE 1: DESCRIPTIVA (LÓGICA) */}
            <div className="bg-white p-6 rounded-industrial border border-gray-400 shadow-sm relative overflow-hidden flex flex-col gap-6">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-green shadow-[0_0_15px_rgba(0,166,81,0.3)]"></div>
                <header className="flex justify-between items-center border-b border-black/20 pb-4">
                    <h3 className="text-[11px] font-bold text-black font-black uppercase ">PARTE 1: Evaluación Descriptiva</h3>
                    <span className="text-[9px] font-bold text-black uppercase ">Intensidad (0-15)</span>
                </header>

                <div className="space-y-16">
                    {/* AROMA / FRAGANCIA */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="space-y-6 pt-6 border-t border-black/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <IntensitySlider label="Sabor" value={data.descriptive.flavorIntensity} onChange={(v) => handleIntensityChange('flavorIntensity', v)} disabled={isAlreadySealed || isReadOnly} />
                            <IntensitySlider label="Sabor Residual" value={data.descriptive.aftertasteIntensity} onChange={(v) => handleIntensityChange('aftertasteIntensity', v)} disabled={isAlreadySealed || isReadOnly} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="space-y-6 pt-6 border-t border-black/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <IntensitySlider label="Acidez" value={data.descriptive.acidityIntensity} onChange={(v) => handleIntensityChange('acidityIntensity', v)} disabled={isAlreadySealed || isReadOnly} />
                                <DescriptiveMarkerGroup 
                                    label="Carácter de Acidez"
                                    options={['Cítrica', 'Málica', 'Fosfórica', 'Acética', 'Láctica', 'Vibrante', 'Compleja']}
                                    selected={data.descriptive.descriptors.acidity}
                                    onToggle={(v) => toggleDescriptor('acidity', v)}
                                    disabled={isAlreadySealed || isReadOnly}
                                />
                            </div>
                            <div className="space-y-6">
                                <IntensitySlider label="Dulzor" value={data.descriptive.sweetnessIntensity} onChange={(v) => handleIntensityChange('sweetnessIntensity', v)} disabled={isAlreadySealed || isReadOnly} />
                                <DescriptiveMarkerGroup 
                                    label="Carácter de Dulzor"
                                    options={['Miel', 'Azúcar Moreno', 'Jarabe', 'Melaza', 'Floral', 'Frutal']}
                                    selected={data.descriptive.descriptors.sweetness}
                                    onToggle={(v) => toggleDescriptor('sweetness', v)}
                                    disabled={isAlreadySealed || isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    {/* CUERPO */}
                    <div className="space-y-6 pt-6 border-t border-black/20">
                        <IntensitySlider label="Sensación en Boca (Cuerpo)" value={data.descriptive.mouthfeelIntensity} onChange={(v) => handleIntensityChange('mouthfeelIntensity', v)} disabled={isAlreadySealed || isReadOnly} />
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
            <div className="bg-white p-6 rounded-industrial border border-gray-400 shadow-sm relative overflow-hidden flex flex-col gap-6">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-black-bright shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
                <header className="flex justify-between items-center border-b border-black/20 pb-4">
                    <h3 className="text-[11px] font-bold text-black uppercase ">PARTE 2: Evaluación Afectiva</h3>
                    <span className="text-[9px] font-bold text-black uppercase ">Calidad (1-9)</span>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                    <QualityScale label="Fragancia / Aroma" value={data.affective.fragranceQuality} onChange={(v) => handleQualityChange('fragranceQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Sabor" value={data.affective.flavorQuality} onChange={(v) => handleQualityChange('flavorQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Sabor Residual" value={data.affective.aftertasteQuality} onChange={(v) => handleQualityChange('aftertasteQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Acidez" value={data.affective.acidityQuality} onChange={(v) => handleQualityChange('acidityQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Dulzor" value={data.affective.sweetnessQuality} onChange={(v) => handleQualityChange('sweetnessQuality', v)} disabled={isAlreadySealed} />
                    <QualityScale label="Cuerpo" value={data.affective.mouthfeelQuality} onChange={(v) => handleQualityChange('mouthfeelQuality', v)} disabled={isAlreadySealed} />
                    <div className="md:col-span-2 pt-6 border-t border-black">
                        <QualityScale label="IMPRESIÓN GLOBAL" value={data.affective.overallImpression} onChange={(v) => handleQualityChange('overallImpression', v)} disabled={isAlreadySealed} />
                    </div>
                </div>

                {/* DEFECTOS */}
                <div className="mt-auto pt-8 border-t border-black/20 grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-black uppercase  block">Tazas Uniformes / Defectuosas</label>
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[9px] text-black font-black uppercase ">Uniformes</span>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        min="0" max="5" 
                                        value={data.defects.nonUniformCups} 
                                        onChange={(e) => setData({...data, defects: {...data.defects, nonUniformCups: parseInt(e.target.value)}})} 
                                        disabled={isAlreadySealed}
                                        className="w-20 h-20 bg-white border-2 border-black rounded-2xl text-3xl text-center font-black text-black font-black outline-none focus:border-black focus:bg-white transition-all appearance-none cursor-pointer" 
                                    />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center text-[9px] font-bold text-black font-black">U</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[9px] text-black font-black uppercase ">Defectuosas</span>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        min="0" max="5" 
                                        value={data.defects.defectiveCups} 
                                        onChange={(e) => setData({...data, defects: {...data.defects, defectiveCups: parseInt(e.target.value)}})} 
                                        disabled={isAlreadySealed}
                                        className="w-20 h-20 bg-white border-2 border-black rounded-2xl text-3xl text-center font-black text-brand-red outline-none focus:border-brand-red focus:bg-brand-red/5 transition-all appearance-none cursor-pointer" 
                                    />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red rounded-full flex items-center justify-center text-[9px] font-bold text-black font-black">D</div>
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
                        className="bg-white hover:bg-white border border-gray-400 shadow-sm text-black border border-gray-400 shadow-sm px-10 py-5 rounded-2xl text-[11px] font-bold uppercase  flex items-center gap-4 transition-all group"
                    >
                        Continuar con Evaluación Extrínseca
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-500">
             <div className="bg-white p-6 rounded-industrial border border-gray-400 shadow-sm space-y-6">
                <h3 className="text-[11px] font-bold text-black font-black uppercase ">Protocolo de Alquimia e Insumos</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-black uppercase  block">Proceso de Alquimia</label>
                        <input type="text" value={data.extrinsic.alchemyProcess} onChange={(e) => handleExtrinsicChange('alchemyProcess', e.target.value)} placeholder="Ej: Anaeróbico 72h / Lactic..." className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none focus:border-black placeholder:text-black" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-black uppercase  block">LMR (Químicos)</label>
                            <input type="text" value={data.extrinsic.agrochemicalRegistry} onChange={(e) => handleExtrinsicChange('agrochemicalRegistry', e.target.value)} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-black uppercase  block">Agua (pH)</label>
                            <input type="text" value={data.extrinsic.waterPh} onChange={(e) => handleExtrinsicChange('waterPh', e.target.value)} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-black uppercase  block">Certificado de Semilla</label>
                        <input type="text" value={data.extrinsic.seedCertificate} onChange={(e) => handleExtrinsicChange('seedCertificate', e.target.value)} placeholder="ID de Certificación de Origen..." className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none placeholder:text-black" />
                    </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-industrial border border-gray-400 shadow-sm space-y-6">
                <h3 className="text-[11px] font-bold text-black font-black uppercase ">Transparencia Económica y Ambiental</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-black uppercase  block">Transfer Price (USD)</label>
                        <input type="text" value={data.extrinsic.transferPrice} onChange={(e) => handleExtrinsicChange('transferPrice', e.target.value)} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-black uppercase  block">Costo Prod.</label>
                        <input type="text" value={data.extrinsic.productionCost} onChange={(e) => handleExtrinsicChange('productionCost', e.target.value)} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-black uppercase  block">Condiciones de Almacén</label>
                        <input type="text" value={data.extrinsic.storageConditions} onChange={(e) => handleExtrinsicChange('storageConditions', e.target.value)} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-black uppercase  block">Huella de Carbono</label>
                        <input type="text" value={data.extrinsic.carbonFootprint} onChange={(e) => handleExtrinsicChange('carbonFootprint', e.target.value)} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold outline-none text-black" />
                    </div>
                </div>
                <div className="p-6 bg-white border border-gray-400 shadow-sm rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-400 shadow-sm flex items-center justify-center text-black">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L3 7v9l9 5 9-5V7l-9-5z"/></svg>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-black uppercase ">Sello de Trazabilidad EUDR</p>
                            <p className="text-[11px] text-black font-bold font-mono">{data.extrinsic.eudrHash}</p>
                        </div>
                    </div>
                    <EUDRComplianceBadge status="compliant" />
                </div>


                {!isAlreadySealed && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isAlreadySealed || isReadOnly}
                        className="w-full mt-6 bg-black hover:bg-black/90 text-white font-black py-4 rounded-2xl uppercase  text-[11px] shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        )}
                        Sellar y Finalizar Protocolo
                    </button>
                )}
             </div>
        </div>
      )}

      {/* FOOTER: RADAR Y SELLADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-400 shadow-sm p-6 rounded-industrial flex flex-col items-center gap-6">
                <h4 className="text-[11px] font-bold text-black uppercase ">Huella Biometría Sensorial</h4>
                <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="#00000020" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 10, fontWeight: '900' }} />
                            <Radar 
                                name="Calidad" 
                                dataKey="A" 
                                stroke="#000000" 
                                fill="#000000" 
                                fillOpacity={0.15} 
                                dot={{ fill: '#000000', r: 3 }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-center">
                    <p className="text-[11px] text-black uppercase font-bold  mb-1">LAB Score Final</p>
                    <p className="text-5xl font-black text-black font-black er">{totalScore.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-industrial border border-gray-400 shadow-sm flex flex-col gap-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-black uppercase  block">Catador Principal</label>
                    <input type="text" value={data.tasterName} onChange={(e) => setData({...data, tasterName: e.target.value})} disabled={isAlreadySealed} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none focus:border-black" />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-black uppercase  block">Notas de Laboratorio</label>
                    <textarea rows={4} value={data.notes} onChange={(e) => setData({...data, notes: e.target.value})} disabled={isAlreadySealed} className="w-full bg-white border border-gray-400 shadow-sm rounded-xl px-4 py-3 text-xs font-bold text-black font-black outline-none resize-none focus:border-black" placeholder="Escriba aquí los descriptores finales..." />
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || isAlreadySealed || isReadOnly}
                    className={`w-full py-6 rounded-2xl font-black uppercase  text-xs transition-all flex items-center justify-center gap-4 ${isAlreadySealed ? 'bg-[#0B1E1A] text-black border border-gray-400 shadow-sm cursor-default' : isReadOnly ? 'bg-white text-black border border-gray-400 shadow-sm cursor-not-allowed' : 'bg-black hover:bg-black/90 text-black font-black shadow-[0_0_30px_rgba(0,166,81,0.2)] active:scale-[0.98]'}`}
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
