'use client';

import React, { useState, useEffect } from 'react';
import ModuleHeader from '@/shared/components/ui/ModuleHeader';
import { supabase } from '@/shared/lib/supabase';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import EUDRComplianceBadge from '@/modules/supply/components/EUDRComplianceBadge';
import { useLanguage } from '@/shared/context/LanguageContext';

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
    notes: {
      fragranceAroma: string;
      flavorAftertaste: string;
      acidity: string;
      sweetness: string;
      mouthfeel: string;
      other: string;
    };
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
    notes: {
      fragranceAroma: string;
      flavor: string;
      aftertaste: string;
      acidity: string;
      sweetness: string;
      mouthfeel: string;
      overall: string;
    };
  };
  defects: {
    nonUniformCups: number;
    defectiveCups: number;
    type: string[];
  };
  notes: string;
  tasterName: string;
  date: string;
  objective: string;
  variety: string;
  process: string;
  roastType: string;

}
interface CVAAssessmentFormProps {
  inventoryId?: string;
  companyId?: string;
  user?: any;
  onSave?: () => void;
  onCuppingComplete?: () => void;
  isReadOnly?: boolean;
  isPublic?: boolean;
  onPublicSubmit?: (data: any) => void;
}

const IntensitySlider = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) => {
    return (
        <div className="flex flex-col gap-1 w-full relative group">
            <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-bold text-brand-navy uppercase">{label}</label>
            </div>
            
            <div className="flex items-center gap-3 w-full">
                <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.25"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none accent-brand-green outline-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
                <div className="w-10 sm:w-12 h-6 flex items-center justify-center flex-shrink-0">
                    <input
                        type="number"
                        min="0"
                        max="15"
                        step="0.25"
                        value={value}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) onChange(val);
                        }}
                        disabled={disabled}
                        className="w-full h-full bg-transparent text-center text-[11px] font-black text-brand-navy outline-none"
                    />
                </div>
            </div>
        </div>
    );
};

interface DescriptorOption {
    label: string;
    subOptions?: string[];
}

const DescriptiveMarkerGroup = ({ label, options, selected, onToggle, disabled }: { label: string, options: (string | DescriptorOption)[], selected: string[], onToggle: (val: string) => void, disabled?: boolean }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-brand-navy uppercase">{label}</label>
        <div className="flex flex-wrap gap-1">
            {options.map((opt, idx) => {
                const isString = typeof opt === 'string';
                const mainLabel = isString ? opt : opt.label;
                const subs = isString ? [] : opt.subOptions || [];
                const isSelected = selected.includes(mainLabel);

                return (
                    <div key={idx} className="flex flex-col gap-1">
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onToggle(mainLabel)}
                            className={`px-1.5 py-0.5 text-[8px] font-medium uppercase rounded-full border transition-all ${
                                isSelected 
                                    ? 'bg-brand-navy border-brand-navy text-white shadow-sm' 
                                    : subs.length > 0
                                        ? 'bg-brand-green/10 border-brand-green/50 text-brand-navy hover:border-brand-green hover:bg-brand-green/20'
                                        : 'bg-white border-gray-400 text-brand-navy hover:border-brand-navy'
                            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                            {mainLabel}
                        </button>
                        
                        {/* SUBCATEGORÍAS SOLO VISIBLES SI LA PRINCIPAL ESTÁ SELECCIONADA */}
                        {isSelected && subs.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 pl-2 border-l border-brand-navy/30">
                                {subs.map(sub => {
                                    const isSubSelected = selected.includes(sub);
                                    return (
                                        <button
                                            key={sub}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => onToggle(sub)}
                                            className={`px-1.5 py-0.5 text-[8px] font-medium uppercase rounded-full border transition-all ${
                                                isSubSelected 
                                                    ? 'bg-brand-green border-brand-green text-brand-navy shadow-sm' 
                                                    : 'bg-white border-gray-300 text-gray-500 hover:border-brand-green hover:text-brand-navy'
                                            } ${disabled ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {sub}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);


const QualityCircles = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-[10px] font-bold text-brand-navy uppercase hidden">{label}</label>}
            <div className="flex justify-between items-center w-full">
                <div className="flex justify-between w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(num)}
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-brand-navy flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all ${
                                Math.floor(value) === num 
                                    ? 'bg-brand-navy text-white' 
                                    : 'bg-white text-brand-navy hover:bg-gray-100'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
                
            </div>
        </div>
    );
};


const TouchIntensitySlider = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) => {
    return (
        <div className="flex flex-col gap-2 w-full bg-gray-50/90 p-3.5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-brand-navy tracking-wider">{label}</span>
                <span className="text-xs font-black text-white bg-brand-navy px-2.5 py-0.5 rounded-full">
                    {value.toFixed(1)} / 15
                </span>
            </div>
            <div className="flex items-center gap-3 w-full pt-1">
                <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.25"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className={`flex-1 h-3 bg-gray-200 rounded-lg appearance-none accent-brand-green outline-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
            </div>
        </div>
    );
};

const TouchQualitySelector = ({ label, value, onChange, disabled }: { label: string, value: number, onChange: (v: number) => void, disabled?: boolean }) => {
    return (
        <div className="flex flex-col gap-2 w-full bg-gray-50/90 p-3.5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase text-brand-navy tracking-wider">{label} (Calidad)</span>
                <span className="text-[11px] font-black text-brand-navy bg-brand-green/30 px-2.5 py-0.5 rounded-full border border-brand-green/50">
                    {value ? `${value} pts` : '5 pts'}
                </span>
            </div>
            <div className="grid grid-cols-9 gap-1 w-full pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                    const isSelected = Math.floor(value) === num;
                    return (
                        <button
                            key={num}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(num)}
                            className={`h-10 rounded-xl border flex items-center justify-center text-xs font-black transition-all ${
                                isSelected
                                    ? 'bg-brand-navy border-brand-navy text-white shadow-md scale-105'
                                    : 'bg-white border-gray-300 text-brand-navy hover:bg-gray-100 active:scale-95'
                            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                            {num}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default function CVAAssessmentForm({ inventoryId, companyId, user, onSave, onCuppingComplete, isReadOnly, isPublic, onPublicSubmit }: CVAAssessmentFormProps) {
  const { t } = useLanguage();
  const resolvedCompanyId = companyId || user?.companyId || '';
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAlreadySealed, setIsAlreadySealed] = useState(false);
  const [activeTab, setActiveTab] = useState<'intrinsic' | 'extrinsic'>('intrinsic');
  const [mobileTabIndex, setMobileTabIndex] = useState<number>(0);
  const mobileTabs = [
    { id: 0, label: 'Muestra', icon: '📋' },
    { id: 1, label: 'Fragancia', icon: '👃' },
    { id: 2, label: 'Sabor', icon: '☕' },
    { id: 3, label: 'Acidez & Dulzor', icon: '🍋' },
    { id: 4, label: 'Cuerpo', icon: '🥄' },
    { id: 5, label: 'Defectos', icon: '⚠️' },
    { id: 6, label: 'Reporte', icon: '📊' }
  ];

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
        predominantGusts: [],
        notes: {
            fragranceAroma: '',
            flavorAftertaste: '',
            acidity: '',
            sweetness: '',
            mouthfeel: '',
            other: ''
        }
    },
    affective: {
        fragranceQuality: 5,
        aromaQuality: 5,
        flavorQuality: 5,
        aftertasteQuality: 5,
        acidityQuality: 5,
        sweetnessQuality: 5,
        mouthfeelQuality: 5,
        overallImpression: 5,
        notes: {
            fragranceAroma: '',
            flavor: '',
            aftertaste: '',
            acidity: '',
            sweetness: '',
            mouthfeel: '',
            overall: ''
        }
    },
    defects: {
        nonUniformCups: 0,
        defectiveCups: 0,
        type: []
    },
    notes: '',
    tasterName: '',
    date: new Date().toISOString().split('T')[0],
    objective: '',
    variety: '',
    process: '',
    roastType: ''
  });

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const radarValues = [
        { subject: t('cuppingForm', 'fragrance') || 'Frag/Aroma', A: data.affective.fragranceQuality, fullMark: 9 },
        { subject: t('cuppingForm', 'flavor') || 'Flavor', A: data.affective.flavorQuality, fullMark: 9 },
        { subject: t('cuppingForm', 'aftertaste') || 'Aftertaste', A: data.affective.aftertasteQuality, fullMark: 9 },
        { subject: t('cuppingForm', 'acidity') || 'Acidity', A: data.affective.acidityQuality, fullMark: 9 },
        { subject: t('cuppingForm', 'sweetness') || 'Sweetness', A: data.affective.sweetnessQuality, fullMark: 9 },
        { subject: t('cuppingForm', 'mouthfeel') || 'Mouthfeel', A: data.affective.mouthfeelQuality, fullMark: 9 },
        { subject: t('cuppingForm', 'overallImpression') || 'Overall', A: data.affective.overallImpression, fullMark: 9 },
    ];
    setChartData(radarValues);
  }, [data.affective, t]);

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
          .select('variety, process, lot_number, purchase_value, process_data')
          .eq('id', inventoryId.trim())
          .single();

        if (existing && existing.length > 0) {
          const record = existing[0];
          if (record.cva_descriptive || record.cva_affective) {
            setData(prev => ({
              ...prev,
              descriptive: {
                ...prev.descriptive,
                ...(record.cva_descriptive || {}),
                descriptors: {
                  ...prev.descriptive.descriptors,
                  ...(record.cva_descriptive?.descriptors || {})
                },
                notes: {
                  ...prev.descriptive.notes,
                  ...(record.cva_descriptive?.notes || {})
                }
              },
              affective: {
                ...prev.affective,
                ...(record.cva_affective || {}),
                notes: {
                  ...prev.affective.notes,
                  ...(record.cva_affective?.notes || {})
                }
              },
              defects: record.cva_descriptive?.defects || prev.defects,
              notes: record.notes || '',
              tasterName: record.taster_name || 'Q-Grader Senior',
              variety: record.cva_descriptive?.variety || '',
              process: record.cva_descriptive?.process || '',
              roastType: record.cva_descriptive?.roastType || ''
            }));
          }
          setIsAlreadySealed(true);
        } else if (lot) {
          // Si no hay registro previo, precargamos datos del café analizado
          const excelCupping = lot.process_data?.raw_excel_data?.cvaCupping;
          
          setData(prev => ({
            ...prev,
            descriptive: {
                ...prev.descriptive,
                ...(excelCupping?.descriptive || {}),
                descriptors: {
                    ...prev.descriptive.descriptors,
                    ...(excelCupping?.descriptive?.descriptors || {})
                },
                notes: {
                    ...prev.descriptive.notes,
                    ...(excelCupping?.descriptive?.notes || {})
                }
            },
            affective: {
                ...prev.affective,
                ...(excelCupping?.affective || {}),
                fragranceQuality: excelCupping?.cvaFragranceAroma || excelCupping?.affective?.fragranceQuality || prev.affective.fragranceQuality,
                aromaQuality: excelCupping?.cvaFragranceAroma || excelCupping?.affective?.aromaQuality || prev.affective.aromaQuality,
                flavorQuality: excelCupping?.cvaFlavorAftertaste || excelCupping?.affective?.flavorQuality || prev.affective.flavorQuality,
                aftertasteQuality: excelCupping?.cvaFlavorAftertaste || excelCupping?.affective?.aftertasteQuality || prev.affective.aftertasteQuality,
                acidityQuality: excelCupping?.cvaAcidity || excelCupping?.affective?.acidityQuality || prev.affective.acidityQuality,
                sweetnessQuality: excelCupping?.cvaSweetness || excelCupping?.affective?.sweetnessQuality || prev.affective.sweetnessQuality,
                mouthfeelQuality: excelCupping?.cvaMouthfeel || excelCupping?.affective?.mouthfeelQuality || prev.affective.mouthfeelQuality,
                overallImpression: excelCupping?.cvaOverall || excelCupping?.affective?.overallImpression || prev.affective.overallImpression,
                notes: {
                    ...prev.affective.notes,
                    ...(excelCupping?.affective?.notes || {})
                }
            },
            defects: {
                ...prev.defects,
                ...(excelCupping?.defects || {})
            },
            notes: excelCupping?.notes || prev.notes
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

  const affectiveScores = [
    (data.affective.fragranceQuality + data.affective.aromaQuality) / 2,
    data.affective.flavorQuality,
    data.affective.aftertasteQuality,
    data.affective.acidityQuality,
    data.affective.sweetnessQuality,
    data.affective.mouthfeelQuality,
    data.affective.overallImpression
  ];
  const totalAffectiveScore = affectiveScores.reduce((acc, val) => acc + (Number(val) > 0 ? Number(val) : 8.0), 0);
  const totalScore = totalAffectiveScore + 30;

  const handleSave = async () => {
    if (isPublic && onPublicSubmit) {
      onPublicSubmit({
        cva_descriptive: { ...data.descriptive, defects: data.defects, variety: data.variety, process: data.process, roastType: data.roastType },
        cva_affective: data.affective,
        notes: data.notes,
        taster_name: data.tasterName
      });
      return;
    }

    if (!inventoryId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sca_cupping')
        .insert([{
          inventory_id: inventoryId,
          company_id: resolvedCompanyId,
          cva_descriptive: { ...data.descriptive, defects: data.defects },
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
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-4 animate-in fade-in duration-700 relative bg-white min-h-[calc(100vh-100px)]">
      
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent pointer-events-none gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-green rounded-full animate-spin"></div>
          <p className="text-[11px] font-bold uppercase text-brand-navy animate-pulse">Sincronizando con AXIS Cloud...</p>
        </div>
      )}

        <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-500 relative">
            
                        {/* MOBILE TABS VIEW (< md) */}
            <div className="flex md:hidden flex-col gap-4 export-mobile">
                {/* STICKY HEADER WITH SCORE AND STEP NAVIGATION */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-2 pb-3 border-b border-gray-200 -mx-2 px-2 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                {mobileTabs[mobileTabIndex].icon} Paso {mobileTabIndex + 1} de {mobileTabs.length}
                            </span>
                            <span className="text-xs font-black text-brand-navy uppercase">
                                {mobileTabs[mobileTabIndex].label}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-brand-navy text-white px-3 py-1 rounded-full shadow-sm">
                            <span className="text-[9px] font-bold uppercase text-white/70">LAB</span>
                            <span className="text-sm font-black text-brand-green tracking-tight">{totalScore.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* HORIZONTAL PILLS SCROLLER */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
                        {mobileTabs.map((tab) => {
                            const isActive = mobileTabIndex === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setMobileTabIndex(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex-shrink-0 ${
                                        isActive
                                            ? 'bg-brand-navy text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* TAB 0: INFORMACIÓN DE MUESTRA */}
                {mobileTabIndex === 0 && (
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in">
                        <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                            Datos del Lote y Catador
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-600 mb-1 block">Catador / Head Taster</label>
                                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy outline-none focus:border-brand-navy" value={data.tasterName} onChange={(e) => setData({...data, tasterName: e.target.value})} disabled={isReadOnly} placeholder="Nombre del catador" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-600 mb-1 block">Fecha de Evaluación</label>
                                <input type="date" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy outline-none focus:border-brand-navy" value={data.date || new Date().toISOString().split('T')[0]} onChange={(e) => setData({...data, date: e.target.value})} disabled={isReadOnly} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-600 mb-1 block">Objetivo</label>
                                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy outline-none focus:border-brand-navy" value={data.objective || ''} onChange={(e) => setData({...data, objective: e.target.value})} disabled={isReadOnly} placeholder="Ej: Control de Calidad / Compra" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-600 mb-1 block">Varietal</label>
                                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy outline-none focus:border-brand-navy" value={data.variety || ''} onChange={(e) => setData({...data, variety: e.target.value})} disabled={isReadOnly} placeholder="Ej: Castillo, Geisha, Caturra" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-600 mb-1 block">Proceso</label>
                                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy outline-none focus:border-brand-navy" value={data.process || ''} onChange={(e) => setData({...data, process: e.target.value})} disabled={isReadOnly} placeholder="Ej: Lavado, Natural, Honey" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-600 mb-1 block">Nivel de Tostión</label>
                                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy outline-none focus:border-brand-navy" value={data.roastType || ''} onChange={(e) => setData({...data, roastType: e.target.value})} disabled={isReadOnly} placeholder="Ej: Media (Agtron 65)" />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 1: FRAGANCIA Y AROMA */}
                {mobileTabIndex === 1 && (
                    <div className="flex flex-col gap-4 animate-in fade-in">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Fragancia (En Seco)
                            </h4>
                            <TouchIntensitySlider label="Intensidad Fragancia" value={data.descriptive.fragranceIntensity} onChange={(v) => handleIntensityChange('fragranceIntensity', v)} disabled={isReadOnly} />
                            <TouchQualitySelector label="Calidad Fragancia" value={data.affective.fragranceQuality} onChange={(v) => handleQualityChange('fragranceQuality', v)} disabled={isReadOnly} />
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Aroma (Al Quebrar Taza)
                            </h4>
                            <TouchIntensitySlider label="Intensidad Aroma" value={data.descriptive.aromaIntensity} onChange={(v) => handleIntensityChange('aromaIntensity', v)} disabled={isReadOnly} />
                            <TouchQualitySelector label="Calidad Aroma" value={data.affective.aromaQuality} onChange={(v) => handleQualityChange('aromaQuality', v)} disabled={isReadOnly} />
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3">
                            <DescriptiveMarkerGroup 
                                label={t('cuppingForm', 'fragranceAromaNotes')}
                                options={[
                                    { label: 'Floral' },
                                    { label: 'Fruity', subOptions: ['Berries', 'Dried Fruit', 'Citrus'] },
                                    { label: 'Sour/Fermented', subOptions: ['Sour', 'Fermented'] },
                                    { label: 'Green/Vegetative' },
                                    { label: 'Roasted', subOptions: ['Cereal', 'Burnt', 'Tobacco'] },
                                    { label: 'Nutty/Cocoa', subOptions: ['Nuts', 'Cocoa'] },
                                    { label: 'Spices' },
                                    { label: 'Sweet', subOptions: ['Vanilla', 'Brown Sugar'] },
                                    { label: 'Other', subOptions: ['Chemical', 'Earthy', 'Woody'] }
                                ]}
                                selected={data.descriptive.descriptors.fragrance}
                                onToggle={(v) => toggleDescriptor('fragrance', v)}
                                disabled={isReadOnly}
                            />
                            <div className="flex flex-col gap-1 mt-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Notas de Fragancia/Aroma</label>
                                <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-brand-navy resize-none outline-none focus:border-brand-navy min-h-[70px]" value={data.descriptive.notes.fragranceAroma} onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, fragranceAroma: e.target.value } } })} disabled={isReadOnly} placeholder="Detalles de fragancia en seco y aroma infusionado..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: SABOR Y POSTGUSTO */}
                {mobileTabIndex === 2 && (
                    <div className="flex flex-col gap-4 animate-in fade-in">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Sabor (Flavor)
                            </h4>
                            <TouchIntensitySlider label="Intensidad Sabor" value={data.descriptive.flavorIntensity} onChange={(v) => handleIntensityChange('flavorIntensity', v)} disabled={isReadOnly} />
                            <TouchQualitySelector label="Calidad Sabor" value={data.affective.flavorQuality} onChange={(v) => handleQualityChange('flavorQuality', v)} disabled={isReadOnly} />
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Postgusto (Aftertaste)
                            </h4>
                            <TouchIntensitySlider label="Intensidad Postgusto" value={data.descriptive.aftertasteIntensity} onChange={(v) => handleIntensityChange('aftertasteIntensity', v)} disabled={isReadOnly} />
                            <TouchQualitySelector label="Calidad Postgusto" value={data.affective.aftertasteQuality} onChange={(v) => handleQualityChange('aftertasteQuality', v)} disabled={isReadOnly} />
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3">
                            <DescriptiveMarkerGroup 
                                label={t('cuppingForm', 'flavorNotes')}
                                options={[
                                    { label: 'Floral' },
                                    { label: 'Fruity', subOptions: ['Berries', 'Dried Fruit', 'Citrus'] },
                                    { label: 'Sour/Fermented', subOptions: ['Sour', 'Fermented'] },
                                    { label: 'Roasted', subOptions: ['Cereal', 'Burnt', 'Tobacco'] },
                                    { label: 'Nutty/Cocoa', subOptions: ['Nuts', 'Cocoa'] },
                                    { label: 'Sweet', subOptions: ['Vanilla', 'Brown Sugar'] }
                                ]}
                                selected={data.descriptive.descriptors.flavor}
                                onToggle={(v) => toggleDescriptor('flavor', v)}
                                disabled={isReadOnly}
                            />
                            <DescriptiveMarkerGroup 
                                label={t('cuppingForm', 'predominantGusts')}
                                options={['Salty', 'Sour', 'Sweet', 'Bitter', 'Umami']}
                                selected={data.descriptive.predominantGusts}
                                onToggle={toggleGust}
                                disabled={isReadOnly}
                            />
                            <div className="flex flex-col gap-1 mt-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Notas de Sabor y Postgusto</label>
                                <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-brand-navy resize-none outline-none focus:border-brand-navy min-h-[70px]" value={data.descriptive.notes.flavorAftertaste} onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, flavorAftertaste: e.target.value } } })} disabled={isReadOnly} placeholder="Descriptores percibidos en taza..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: ACIDEZ Y DULZOR */}
                {mobileTabIndex === 3 && (
                    <div className="flex flex-col gap-4 animate-in fade-in">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Acidez
                            </h4>
                            <TouchIntensitySlider label="Intensidad Acidez" value={data.descriptive.acidityIntensity} onChange={(v) => handleIntensityChange('acidityIntensity', v)} disabled={isReadOnly} />
                            <TouchQualitySelector label="Calidad Acidez" value={data.affective.acidityQuality} onChange={(v) => handleQualityChange('acidityQuality', v)} disabled={isReadOnly} />
                            <DescriptiveMarkerGroup 
                                label={t('cuppingForm', 'acidityCharacter')}
                                options={['Citrus', 'Malic', 'Phosphoric', 'Acetic', 'Lactic', 'Vibrant', 'Complex']}
                                selected={data.descriptive.descriptors.acidity}
                                onToggle={(v) => toggleDescriptor('acidity', v)}
                                disabled={isReadOnly}
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Notas de Acidez</label>
                                <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-brand-navy resize-none outline-none focus:border-brand-navy min-h-[60px]" value={data.descriptive.notes.acidity} onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, acidity: e.target.value } } })} disabled={isReadOnly} placeholder="Brillante, jugosa, cítrica..." />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Dulzor
                            </h4>
                            <TouchIntensitySlider label="Intensidad Dulzor" value={data.descriptive.sweetnessIntensity} onChange={(v) => handleIntensityChange('sweetnessIntensity', v)} disabled={isReadOnly} />
                            <TouchQualitySelector label="Calidad Dulzor" value={data.affective.sweetnessQuality} onChange={(v) => handleQualityChange('sweetnessQuality', v)} disabled={isReadOnly} />
                            <DescriptiveMarkerGroup 
                                label={t('cuppingForm', 'sweetnessCharacter')}
                                options={['Honey', 'Brown Sugar', 'Syrup', 'Molasses', 'Floral', 'Fruity']}
                                selected={data.descriptive.descriptors.sweetness}
                                onToggle={(v) => toggleDescriptor('sweetness', v)}
                                disabled={isReadOnly}
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Notas de Dulzor</label>
                                <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-brand-navy resize-none outline-none focus:border-brand-navy min-h-[60px]" value={data.descriptive.notes.sweetness} onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, sweetness: e.target.value } } })} disabled={isReadOnly} placeholder="Panela, miel de caña, caramelo..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: SENSACIÓN EN BOCA (CUERPO) */}
                {mobileTabIndex === 4 && (
                    <div className="flex flex-col gap-4 animate-in fade-in">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Sensación en Boca / Cuerpo
                            </h4>
                            <TouchIntensitySlider label="Intensidad Cuerpo" value={data.descriptive.mouthfeelIntensity} onChange={(v) => handleIntensityChange('mouthfeelIntensity', v)} disabled={isReadOnly} />
                            <TouchQualitySelector label="Calidad Sensación en Boca" value={data.affective.mouthfeelQuality} onChange={(v) => handleQualityChange('mouthfeelQuality', v)} disabled={isReadOnly} />
                            <DescriptiveMarkerGroup 
                                label={t('cuppingForm', 'mouthfeelCharacter')}
                                options={['Rough', 'Oily', 'Smooth', 'Astringent', 'Metallic', 'Creamy', 'Silky', 'Syrupy']}
                                selected={data.descriptive.descriptors.mouthfeel}
                                onToggle={(v) => toggleDescriptor('mouthfeel', v)}
                                disabled={isReadOnly}
                            />
                            <div className="flex flex-col gap-1 mt-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Notas de Cuerpo</label>
                                <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-brand-navy resize-none outline-none focus:border-brand-navy min-h-[70px]" value={data.descriptive.notes.mouthfeel} onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, mouthfeel: e.target.value } } })} disabled={isReadOnly} placeholder="Sensación táctil, sedosidad, densidad..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: DEFECTOS & IMPRESIÓN GENERAL */}
                {mobileTabIndex === 5 && (
                    <div className="flex flex-col gap-4 animate-in fade-in">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Impresión General (Overall)
                            </h4>
                            <TouchQualitySelector label="Impresión General" value={data.affective.overallImpression} onChange={(v) => handleQualityChange('overallImpression', v)} disabled={isReadOnly} />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Notas de Impresión General</label>
                                <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-brand-navy resize-none outline-none focus:border-brand-navy min-h-[70px]" value={data.affective.notes.overall} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, overall: e.target.value } } })} disabled={isReadOnly} placeholder="Armonía, balance y consistencia..." />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-brand-navy pb-2 border-b border-gray-200">
                                Evaluación de Tazas y Defectos
                            </h4>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Tazas No Uniformes (Non-Uniform Cups)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => setData({...data, defects: {...data.defects, nonUniformCups: data.defects.nonUniformCups === num ? 0 : num}})}
                                            className={`flex-1 h-10 rounded-xl border font-black text-xs transition-all ${
                                                num <= data.defects.nonUniformCups ? 'bg-brand-navy text-white border-brand-navy shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-300'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Tazas Defectuosas (Defective Cups)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => setData({...data, defects: {...data.defects, defectiveCups: data.defects.defectiveCups === num ? 0 : num}})}
                                            className={`flex-1 h-10 rounded-xl border font-black text-xs transition-all ${
                                                num <= data.defects.defectiveCups ? 'bg-brand-red text-white border-brand-red shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-300'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Tipo de Defecto</label>
                                <div className="flex gap-2">
                                    {[{id:'Mohoso', label:'MOLDY'}, {id:'Fenólico', label:'PHENOLIC'}, {id:'Papa', label:'POTATO'}].map(defect => (
                                        <button
                                            key={defect.id}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => toggleDefectType(defect.id)}
                                            className={`flex-1 py-2.5 px-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                                                data.defects.type.includes(defect.id) ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-navy border-gray-300'
                                            }`}
                                        >
                                            {defect.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 mt-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">Otras Observaciones</label>
                                <textarea className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-brand-navy resize-none outline-none focus:border-brand-navy min-h-[70px]" value={data.descriptive.notes.other} onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, other: e.target.value } } })} disabled={isReadOnly} placeholder="Observaciones adicionales de taza o fermentación..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 6: REPORTE & RESUMEN FINAL */}
                {mobileTabIndex === 6 && (
                    <div className="flex flex-col gap-4 animate-in fade-in">
                        {/* SCORE CARD */}
                        <div className="bg-brand-navy text-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center">
                            <span className="text-[11px] font-black uppercase tracking-widest text-brand-green mb-1">Puntaje SCA CVA Final</span>
                            <div className="text-6xl font-black text-white tracking-tighter my-2">{totalScore.toFixed(2)}</div>
                            <span className="text-xs text-white/70 font-medium">
                                Base SCA (30.0) + Evaluación Afectiva ({totalAffectiveScore.toFixed(2)})
                            </span>
                        </div>

                        {/* RADAR SENSORIAL */}
                        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center">
                            <h4 className="text-xs font-black uppercase text-brand-navy tracking-wider mb-2">Huella Sensorial (Radar)</h4>
                            <div className="w-full h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                                        <PolarGrid stroke="#00000020" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#1A1A1A', fontSize: 9, fontWeight: '900' }} />
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
                        </div>

                        {/* NOTAS FINALES */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1 block">Catador Principal (Head Taster)</label>
                                <input type="text" value={data.tasterName} onChange={(e) => setData({...data, tasterName: e.target.value})} disabled={isReadOnly} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy outline-none" placeholder="Nombre y certificación Q-Grader" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1 block">Conclusión y Notas de Laboratorio</label>
                                <textarea value={data.notes} onChange={(e) => setData({...data, notes: e.target.value})} disabled={isReadOnly} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs font-bold text-brand-navy outline-none resize-none min-h-[100px]" placeholder="Dictamen final y perfil descriptivo..." />
                            </div>
                        </div>

                        {/* BOTÓN SELLAR EN MÓVIL */}
                        {!isReadOnly && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-4 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green-bright text-brand-navy shadow-lg active:scale-[0.98] mt-2"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-brand-navy/30 border-t-brand-navy rounded-full animate-spin" />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                )}
                                {isPublic ? 'GENERAR REPORTE CVA CERTIFICADO' : 'GUARDAR CVA'}
                            </button>
                        )}
                    </div>
                )}

                {/* MOBILE BOTTOM NAVIGATION BAR */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200 mt-2 pb-4">
                    <button
                        type="button"
                        disabled={mobileTabIndex === 0}
                        onClick={() => setMobileTabIndex(prev => Math.max(0, prev - 1))}
                        className={`px-4 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition-all ${
                            mobileTabIndex === 0
                                ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400'
                                : 'bg-gray-100 text-brand-navy hover:bg-gray-200 active:scale-95'
                        }`}
                    >
                        ← Anterior
                    </button>

                    <div className="text-[10px] font-black uppercase text-gray-400">
                        {mobileTabIndex + 1} / {mobileTabs.length}
                    </div>

                    {mobileTabIndex < mobileTabs.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setMobileTabIndex(prev => Math.min(mobileTabs.length - 1, prev + 1))}
                            className="px-5 py-3 rounded-xl font-black text-xs uppercase bg-brand-navy text-white hover:bg-black transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                            Siguiente →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setMobileTabIndex(0)}
                            className="px-4 py-3 rounded-xl font-black text-xs uppercase bg-gray-100 text-brand-navy hover:bg-gray-200 transition-all"
                        >
                            Ver Inicio ↺
                        </button>
                    )}
                </div>
            </div>

            {/* DESKTOP / TABLET LAB SHEET VIEW (>= md) */}
            <div className="hidden md:flex flex-col gap-6 export-desktop">
                {/* NEW HEADER BLOCK WITH SCORE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2 mb-2 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 flex-1 w-full">
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Nombre</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.tasterName} onChange={(e) => setData({...data, tasterName: e.target.value})} disabled={isReadOnly} />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Fecha</label>
                        <input type="date" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.date || new Date().toISOString().split('T')[0]} onChange={(e) => setData({...data, date: e.target.value})} disabled={isReadOnly} />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Objetivo</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.objective || ''} onChange={(e) => setData({...data, objective: e.target.value})} disabled={isReadOnly} />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Varietal</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.variety || ''} onChange={(e) => setData({...data, variety: e.target.value})} disabled={isReadOnly} />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Proceso</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.process || ''} onChange={(e) => setData({...data, process: e.target.value})} disabled={isReadOnly} />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Tostión</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.roastType || ''} onChange={(e) => setData({...data, roastType: e.target.value})} disabled={isReadOnly} />
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center pl-8 md:border-l border-gray-300">
                    <p className="text-[11px] text-brand-navy uppercase font-bold mb-1">LAB Score Final</p>
                    <p className="text-5xl font-black text-brand-navy tracking-tighter">{totalScore.toFixed(2)}</p>
                </div>
            </div>

            {/* UNIFIED ROW-BASED TABLE */}
            <div className="bg-white shadow-sm overflow-hidden flex flex-col relative px-1.5 lg:px-0">
                {/* HEADER ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] bg-brand-navy text-white">
                    <div className="p-3 border-b lg:border-b-0 lg:border-r border-white/20 flex justify-between items-center">
                        <h3 className="text-[11px] font-bold font-black uppercase text-white">{t('cuppingForm', 'descriptiveHeader')}</h3>
                        <span className="text-[9px] font-bold uppercase text-white/80">{t('cuppingForm', 'intensityLabel')}</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                        <h3 className="text-[11px] font-bold uppercase text-white">{t('cuppingForm', 'affectiveHeader')}</h3>
                        <span className="text-[9px] font-bold uppercase text-white/80">{t('cuppingForm', 'qualityLabel')}</span>
                    </div>
                </div>

                {/* ROW 1: FRAGRANCE / AROMA */}
                <div className="flex flex-col border-b border-black/20">
                    {/* Fragancia Sub-row */}
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] border-b border-black/10">
                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">
                            <IntensitySlider label={t('cuppingForm', 'fragrance')} value={data.descriptive.fragranceIntensity} onChange={(v) => handleIntensityChange('fragranceIntensity', v)} disabled={isReadOnly} />
                        </div>
                        <div className="p-3 lg:p-4 flex items-center">
                            <QualityCircles label="Fragancia" value={data.affective.fragranceQuality} onChange={(v) => handleQualityChange('fragranceQuality', v)}  />
                        </div>
                    </div>
                    {/* Aroma Sub-row */}
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] border-b border-black/10">
                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">
                            <IntensitySlider label={t('cuppingForm', 'aroma')} value={data.descriptive.aromaIntensity} onChange={(v) => handleIntensityChange('aromaIntensity', v)} disabled={isReadOnly} />
                        </div>
                        <div className="p-3 lg:p-4 flex items-center">
                            <QualityCircles label="Aroma" value={data.affective.aromaQuality} onChange={(v) => handleQualityChange('aromaQuality', v)}  />
                        </div>
                    </div>
                    {/* Notes Sub-row */}
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%]">
                        <div className="p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col gap-4">
                            <div>
                                <DescriptiveMarkerGroup 
                                    label={t('cuppingForm', 'fragranceAromaNotes')}
                                    options={[
                                        { label: 'Floral' },
                                        { label: 'Fruity', subOptions: ['Berries', 'Dried Fruit', 'Citrus'] },
                                        { label: 'Sour/Fermented', subOptions: ['Sour', 'Fermented'] },
                                        { label: 'Green/Vegetative' },
                                        { label: 'Roasted', subOptions: ['Cereal', 'Burnt', 'Tobacco'] },
                                        { label: 'Nutty/Cocoa', subOptions: ['Nuts', 'Cocoa'] },
                                        { label: 'Spices' },
                                        { label: 'Sweet', subOptions: ['Vanilla', 'Brown Sugar'] },
                                        { label: 'Other', subOptions: ['Chemical', 'Earthy', 'Woody'] }
                                    ]}
                                    selected={data.descriptive.descriptors.fragrance}
                                    onToggle={(v) => toggleDescriptor('fragrance', v)}
                                    
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                                <textarea 
                                    className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]"
                                    value={data.descriptive.notes.fragranceAroma}
                                    onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, fragranceAroma: e.target.value } } })}
                                    
                                />
                            </div>
                        </div>
                        <div className="p-4 flex flex-col">
                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                            <textarea className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]" value={data.affective.notes.fragranceAroma} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, fragranceAroma: e.target.value } } })}  />
                        </div>
                    </div>
                </div>

                {/* ROW 2: FLAVOR / AFTERTASTE */}
                <div className="flex flex-col border-b border-black/20">
                    {/* Flavor Sub-row */}
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] border-b border-black/10">
                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">
                            <IntensitySlider label={t('cuppingForm', 'flavor')} value={data.descriptive.flavorIntensity} onChange={(v) => handleIntensityChange('flavorIntensity', v)} disabled={isReadOnly} />
                        </div>
                        <div className="p-3 lg:p-4 flex items-center">
                            <QualityCircles label={t('cuppingForm', 'flavor')} value={data.affective.flavorQuality} onChange={(v) => handleQualityChange('flavorQuality', v)}  />
                        </div>
                    </div>
                    {/* Aftertaste Sub-row */}
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] border-b border-black/10">
                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">
                            <IntensitySlider label={t('cuppingForm', 'aftertaste')} value={data.descriptive.aftertasteIntensity} onChange={(v) => handleIntensityChange('aftertasteIntensity', v)} disabled={isReadOnly} />
                        </div>
                        <div className="p-3 lg:p-4 flex items-center">
                            <QualityCircles label={t('cuppingForm', 'aftertaste')} value={data.affective.aftertasteQuality} onChange={(v) => handleQualityChange('aftertasteQuality', v)}  />
                        </div>
                    </div>
                    {/* Notes Sub-row */}
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%]">
                        <div className="p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col gap-4">
                            <div className="flex flex-col gap-4">
                                <DescriptiveMarkerGroup 
                                    label={t('cuppingForm', 'flavorNotes')}
                                    options={[
                                        { label: 'Floral' },
                                        { label: 'Fruity', subOptions: ['Berries', 'Dried Fruit', 'Citrus'] },
                                        { label: 'Sour/Fermented', subOptions: ['Sour', 'Fermented'] },
                                        { label: 'Roasted', subOptions: ['Cereal', 'Burnt', 'Tobacco'] },
                                        { label: 'Nutty/Cocoa', subOptions: ['Nuts', 'Cocoa'] },
                                        { label: 'Sweet', subOptions: ['Vanilla', 'Brown Sugar'] }
                                    ]}
                                    selected={data.descriptive.descriptors.flavor}
                                    onToggle={(v) => toggleDescriptor('flavor', v)}
                                    
                                />
                                <DescriptiveMarkerGroup 
                                    label={t('cuppingForm', 'predominantGusts')}
                                    options={['Salty', 'Sour', 'Sweet', 'Bitter', 'Umami']}
                                    selected={data.descriptive.predominantGusts}
                                    onToggle={toggleGust}
                                    
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                                <textarea 
                                    className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]"
                                    value={data.descriptive.notes.flavorAftertaste}
                                    onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, flavorAftertaste: e.target.value } } })}
                                    
                                />
                            </div>
                        </div>
                        <div className="p-4 flex flex-col">
                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                            <textarea className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]" value={data.affective.notes.flavor} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, flavor: e.target.value } } })}  />
                        </div>
                    </div>
                </div>

                {/* ROW 3: ACIDITY */}
                <div className="flex flex-col border-b border-black/20">
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] border-b border-black/10">
                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">
                            <IntensitySlider label={t('cuppingForm', 'acidity')} value={data.descriptive.acidityIntensity} onChange={(v) => handleIntensityChange('acidityIntensity', v)} disabled={isReadOnly} />
                        </div>
                        <div className="p-3 lg:p-4 flex items-center">
                            <QualityCircles label={t('cuppingForm', 'acidity')} value={data.affective.acidityQuality} onChange={(v) => handleQualityChange('acidityQuality', v)}  />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%]">
                        <div className="p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col gap-4">
                            <div>
                                <DescriptiveMarkerGroup 
                                    label={t('cuppingForm', 'acidityCharacter')}
                                    options={['Citrus', 'Malic', 'Phosphoric', 'Acetic', 'Lactic', 'Vibrant', 'Complex']}
                                    selected={data.descriptive.descriptors.acidity}
                                    onToggle={(v) => toggleDescriptor('acidity', v)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                                <textarea 
                                    className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]"
                                    value={data.descriptive.notes.acidity}
                                    onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, acidity: e.target.value } } })}
                                    
                                />
                            </div>
                        </div>
                        <div className="p-4 flex flex-col">
                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                            <textarea className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]" value={data.affective.notes.acidity} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, acidity: e.target.value } } })}  />
                        </div>
                    </div>
                </div>

                {/* ROW 4: SWEETNESS */}
                <div className="flex flex-col border-b border-black/20">
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] border-b border-black/10">
                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">
                            <IntensitySlider label={t('cuppingForm', 'sweetness')} value={data.descriptive.sweetnessIntensity} onChange={(v) => handleIntensityChange('sweetnessIntensity', v)} disabled={isReadOnly} />
                        </div>
                        <div className="p-3 lg:p-4 flex items-center">
                            <QualityCircles label={t('cuppingForm', 'sweetness')} value={data.affective.sweetnessQuality} onChange={(v) => handleQualityChange('sweetnessQuality', v)}  />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%]">
                        <div className="p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col gap-4">
                            <div>
                                <DescriptiveMarkerGroup 
                                    label={t('cuppingForm', 'sweetnessCharacter')}
                                    options={['Honey', 'Brown Sugar', 'Syrup', 'Molasses', 'Floral', 'Fruity']}
                                    selected={data.descriptive.descriptors.sweetness}
                                    onToggle={(v) => toggleDescriptor('sweetness', v)}
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                                <textarea 
                                    className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]"
                                    value={data.descriptive.notes.sweetness}
                                    onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, sweetness: e.target.value } } })}
                                    
                                />
                            </div>
                        </div>
                        <div className="p-4 flex flex-col">
                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                            <textarea className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]" value={data.affective.notes.sweetness} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, sweetness: e.target.value } } })}  />
                        </div>
                    </div>
                </div>

                {/* ROW 5: MOUTHFEEL */}
                <div className="flex flex-col border-b border-black/20">
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] border-b border-black/10">
                        <div className="p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col justify-center">
                            <IntensitySlider label={t('cuppingForm', 'mouthfeel')} value={data.descriptive.mouthfeelIntensity} onChange={(v) => handleIntensityChange('mouthfeelIntensity', v)} disabled={isReadOnly} />
                        </div>
                        <div className="p-3 lg:p-4 flex items-center">
                            <QualityCircles label="Sensación en boca" value={data.affective.mouthfeelQuality} onChange={(v) => handleQualityChange('mouthfeelQuality', v)}  />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[65%_35%]">
                        <div className="p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col gap-4">
                            <div>
                                <DescriptiveMarkerGroup 
                                    label={t('cuppingForm', 'mouthfeelCharacter')}
                                    options={['Rough', 'Oily', 'Smooth', 'Astringent', 'Metallic', 'Creamy', 'Silky', 'Syrupy']}
                                    selected={data.descriptive.descriptors.mouthfeel}
                                    onToggle={(v) => toggleDescriptor('mouthfeel', v)}
                                    
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                                <textarea 
                                    className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]"
                                    value={data.descriptive.notes.mouthfeel}
                                    onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, mouthfeel: e.target.value } } })}
                                    
                                />
                            </div>
                        </div>
                        <div className="p-4 flex flex-col">
                            <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                            <textarea className="flex-1 bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[80px]" value={data.affective.notes.mouthfeel} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, mouthfeel: e.target.value } } })}  />
                        </div>
                    </div>
                </div>

                {/* ROW 6: FOOTER (Otras Notas, Overall, Defects) */}
                <div className="grid grid-cols-1 lg:grid-cols-[65%_35%]">
                    {/* Left: Otras Notas */}
                    <div className="p-4 border-b lg:border-b-0 lg:border-r border-black/20 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                        <textarea 
                            className="flex-1 bg-gray-100 border-none rounded-none p-3 text-xs text-brand-navy resize-none outline-none focus:border-black min-h-[120px]"
                            value={data.descriptive.notes.other}
                            onChange={(e) => setData({ ...data, descriptive: { ...data.descriptive, notes: { ...data.descriptive.notes, other: e.target.value } } })}
                            
                        />
                    </div>
                    {/* Right: Overall & Defects */}
                    <div className="p-4 flex flex-col justify-between h-full gap-4">
                        {/* Overall Impression */}
                        <div className="flex flex-col gap-4 flex-1">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">OVERALL IMPRESSION</label>
                                <QualityCircles label={t('cuppingForm', 'overallImpression')} value={data.affective.overallImpression} onChange={(v) => handleQualityChange('overallImpression', v)}  />
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="text-[10px] font-bold text-brand-navy uppercase mb-1">NOTES</label>
                                <textarea className="w-full h-full min-h-[60px] bg-gray-100 border-none rounded-none p-2 text-xs text-brand-navy resize-none outline-none focus:border-black" value={data.affective.notes.overall} onChange={(e) => setData({ ...data, affective: { ...data.affective, notes: { ...data.affective.notes, overall: e.target.value } } })}  />
                            </div>
                        </div>
                        {/* Defects */}
                        <div className="pt-4 border-t border-black/20 flex flex-col gap-5">
                            {/* Top: Tazas */}
                            <div className="flex flex-row flex-wrap gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-brand-navy uppercase leading-tight">NON-UNIFORM CUPS</label>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setData({...data, defects: {...data.defects, nonUniformCups: data.defects.nonUniformCups === num ? 0 : num}})}
                                                
                                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-brand-navy transition-all ${
                                                    num <= data.defects.nonUniformCups ? 'bg-brand-navy' : 'bg-white hover:bg-gray-100'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-brand-navy uppercase leading-tight">DEFECTIVE CUPS</label>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setData({...data, defects: {...data.defects, defectiveCups: data.defects.defectiveCups === num ? 0 : num}})}
                                                
                                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-brand-navy transition-all ${
                                                    num <= data.defects.defectiveCups ? 'bg-brand-red border-brand-red' : 'bg-white hover:bg-gray-100'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom: Defect Type */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-brand-navy uppercase">DEFECT TYPE</label>
                                <div className="flex flex-wrap gap-4">
                                    {[{id:'Mohoso', label:'MOLDY'}, {id:'Fenólico', label:'PHENOLIC'}, {id:'Papa', label:'POTATO'}].map(defect => (
                                        <button
                                            key={defect.id}
                                            type="button"
                                            onClick={() => toggleDefectType(defect.id)}
                                            
                                            className="flex items-center gap-1.5 text-left"
                                        >
                                            <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex-shrink-0 border transition-all ${
                                                data.defects.type.includes(defect.id) ? 'bg-brand-navy border-brand-navy' : 'border-brand-navy bg-white'
                                            }`}>
                                                {data.defects.type.includes(defect.id) && (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="w-full h-full p-[2px]"><path d="M20 6L9 17l-5-5" /></svg>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-brand-navy uppercase leading-tight">{defect.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> {/* END UNIFIED ROW-BASED TABLE */}

            {/* RESULTADOS Y NOTAS */}
            <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-4">
                {/* HUELLA ORGANOLEPTICA (RADAR) */}
                <div className="flex flex-col items-center gap-6">
                    <h4 className="text-[11px] font-bold text-brand-navy uppercase ">SENSORIAL RADAR</h4>
                    <div className="w-full h-[300px]">
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
                </div>

                {/* CATADOR, NOTAS Y SELLADO */}
                <div className="flex flex-col gap-6 pt-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-brand-navy uppercase block">Head Taster</label>
                        <input type="text" value={data.tasterName} onChange={(e) => setData({...data, tasterName: e.target.value})}  className="w-full bg-gray-100 border-none rounded-none px-4 py-3 text-xs font-bold text-brand-navy font-black outline-none focus:border-black" />
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                        <label className="text-[11px] font-bold text-brand-navy uppercase block">Lab Notes</label>
                        <textarea value={data.notes} onChange={(e) => setData({...data, notes: e.target.value})}  className="w-full flex-1 bg-gray-100 border-none rounded-none px-4 py-3 text-xs font-bold text-brand-navy font-black outline-none resize-none focus:border-black min-h-[120px]" placeholder="Escriba aquí los descriptores finales..." />
                    </div>
                </div>
            </div> {/* END RESULTADOS Y NOTAS */}

            {/* BOTÓN SELLAR */}
            {!isReadOnly && (
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-5 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-3 bg-brand-green hover:bg-brand-green-bright text-brand-navy shadow-[0_0_30px_rgba(0,166,81,0.2)] active:scale-[0.98]`}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        )}
                        {isPublic ? 'GENERAR REPORTE CVA CERTIFICADO' : 'GUARDAR CVA'}
                    </button>
                </div>
            )}
        
            </div> {/* END DESKTOP export-desktop */}</div>

    </div>
  );
}
