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
  extrinsicSCA: {
    sampleNumber: string;
    cultivo: { items: Record<string, boolean>; info: string; };
    procesamiento: { items: Record<string, boolean>; info: string; };
    comercio: { items: Record<string, boolean>; info: string; };
    certificaciones: { items: Record<string, boolean>; info: string; };
    otro: { items: Record<string, boolean>; info: string; };
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

interface SCACheckboxItem { key: string; label: string; indent?: boolean; }

const SCAExtrinsicSection = ({
    title, infoLabel, items, checkedItems, info, onToggle, onInfoChange, disabled
}: {
    title: string; infoLabel: string; items: SCACheckboxItem[];
    checkedItems: Record<string, boolean>; info: string;
    onToggle: (key: string) => void; onInfoChange: (val: string) => void; disabled?: boolean;
}) => (
    <div className="flex flex-col">
        <div className="m-4 mb-2 bg-brand-green text-white px-6 py-1.5 rounded-full inline-flex w-max">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{title}</h4>
        </div>
        <div className="flex flex-1">
            <div className="flex-1 p-3 space-y-1.5">
                {items.map(item => (
                    <button key={item.key} type="button" disabled={disabled}
                        onClick={() => onToggle(item.key)}
                        className={`flex items-center gap-2 w-full text-left ${item.indent ? 'pl-4' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-3 h-3 border rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                            checkedItems[item.key] ? 'bg-black border-black' : 'border-black bg-white'
                        }`}>
                            {checkedItems[item.key] && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="w-2 h-2"><path d="M20 6L9 17l-5-5" /></svg>
                            )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase leading-tight ${
                            item.indent ? 'text-brand-navy/60 font-medium' : 'text-brand-navy'
                        }`}>{item.label}</span>
                    </button>
                ))}
            </div>
            <div className="w-[280px] p-3 flex flex-col gap-1">
                <p className="text-[8px] font-bold text-brand-navy/50 uppercase leading-tight">{infoLabel}</p>
                <textarea
                    value={info} disabled={disabled}
                    onChange={(e) => onInfoChange(e.target.value)}
                    className={`flex-1 bg-gray-100 border-none rounded-none px-2 py-1.5 text-[10px] text-brand-navy outline-none resize-none focus:border-black min-h-[80px] ${
                        disabled ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                    placeholder="..."
                />
            </div>
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

export default function CVAAssessmentForm({ inventoryId, companyId, user, onSave, onCuppingComplete, isReadOnly }: CVAAssessmentFormProps) {
  const { t } = useLanguage();
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
    },
    extrinsicSCA: {
        sampleNumber: '',
        cultivo: {
            items: { pais: false, region: false, finca: false, productor: false, especie: false, variedad: false, fecha: false, otro: false },
            info: ''
        },
        procesamiento: {
            items: { beneficiadorNombre: false, beneficiadorHumedo: false, beneficiadorSeco: false, beneficiadorOtro: false, tipoProceso: false, tipoLavado: false, tipoNatural: false, tipoOtro: false, descafeinado: false, descripcionProceso: false },
            info: ''
        },
        comercio: {
            items: { clasificacion: false, oic: false, importador: false, exportador: false, precio: false, tamano: false, otro: false },
            info: ''
        },
        certificaciones: {
            items: { c4: false, fairtrade: false, organico: false, rainforest: false, inocuidad: false, otro: false },
            info: ''
        },
        otro: {
            items: { premios: false },
            info: ''
        }
    }
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
              extrinsicSCA: {
                ...(record.cva_descriptive?.extrinsicSCA || prev.extrinsicSCA),
                sampleNumber: record.cva_descriptive?.extrinsicSCA?.sampleNumber || lot?.lot_number || prev.extrinsicSCA.sampleNumber
              }
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
            notes: excelCupping?.notes || prev.notes,
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
            },
            extrinsicSCA: {
              ...prev.extrinsicSCA,
              sampleNumber: lot.lot_number || prev.extrinsicSCA.sampleNumber
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

  const isExtrinsicFilled = (() => {
    const sca = data.extrinsicSCA;
    
    const hasAnyCheckbox =
      Object.values(sca.cultivo.items).some(v => v) ||
      Object.values(sca.procesamiento.items).some(v => v) ||
      Object.values(sca.comercio.items).some(v => v) ||
      Object.values(sca.certificaciones.items).some(v => v) ||
      Object.values(sca.otro.items).some(v => v);
    return hasAnyCheckbox;
  })();
  const handleExtrinsicChange = (key: keyof CVAData['extrinsic'], val: string) => {
    setData(prev => ({
      ...prev,
      extrinsic: { ...prev.extrinsic, [key]: val }
    }));
  };

  const fillDemoExtrinsic = () => {
    setData(prev => ({
      ...prev,
      extrinsicSCA: {
        sampleNumber: prev.extrinsicSCA.sampleNumber || 'ALE-LOTE-DEMO',
        cultivo: {
          items: { pais: true, region: true, finca: true, productores: true, especie: true, variedad: true, cosecha: true, otro: false },
          info: 'Colombia · Huila, Acevedo. Finca El Paraíso. Familia Martínez. Coffea arabica var. Geisha, cosecha principal oct-dic 2024.'
        },
        procesamiento: {
          items: { beneficiador: true, humedo: true, seco: false, benefOtro: false, lavado: false, natural: false, procOtro: true, descafeinado: false, descripcion: true },
          info: 'Beneficio propio en finca. Proceso Anaeróbico Natural 96h en tanques herméticos. pH controlado 4.8. Secado en camas africanas 22 días.'
        },
        comercio: {
          items: { clasificacion: true, oic: true, importador: true, exportador: true, precio: true, lote: true, otro: false },
          info: 'Clasificación: Specialty Grade 1. OIC: CO-12345. Exportador: Axis Coffee Exports SAS. Precio productor: $2.800.000 COP/carga.'
        },
        certificaciones: {
          items: { c4: false, fairtrade: true, organico: true, rainforest: true, inocuidad: true, otro: false },
          info: 'Fairtrade FLO-CERT #23891. USDA Organic NOP. Rainforest Alliance RA-2024-CO. Certificaciones vigentes hasta dic 2026.'
        },
        otro: {
          items: { premios: true },
          info: 'Ganador Taza de Excelencia Colombia 2023 (92.1 pts). Top 5 COE 2024. Perfil destacado en World Coffee Research varietal catalog.'
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!inventoryId) return;

    // Validación: el tab extrínseco debe estar completo antes de sellar
    if (!isExtrinsicFilled && !isAlreadySealed) {
      setActiveTab('extrinsic');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sca_cupping')
        .insert([{
          inventory_id: inventoryId,
          company_id: resolvedCompanyId,
          cva_descriptive: { ...data.descriptive, defects: data.defects, extrinsic: data.extrinsic, extrinsicSCA: data.extrinsicSCA },
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
      {/* HEADER DE ETAPA NOTARIAL */}
      

      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent pointer-events-none gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-green rounded-full animate-spin"></div>
          <p className="text-[11px] font-bold uppercase text-brand-navy animate-pulse">Sincronizando con AXIS Cloud...</p>
        </div>
      )}

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex w-full border-b border-gray-300 mb-6 mt-2">
            <button
                onClick={() => setActiveTab('intrinsic')}
                className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-t-xl text-[11px] font-bold uppercase transition-all ${
                    activeTab === 'intrinsic' 
                        ? 'bg-brand-green text-white' 
                        : 'bg-transparent text-brand-navy hover:bg-gray-50'
                }`}
            >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === 'intrinsic' ? 'bg-white/20' : 'bg-gray-200'}`}>1</div>
                SENSORY & AFFECTIVE ASSESSMENT (CVA)
            </button>
            <button
                onClick={() => setActiveTab('extrinsic')}
                className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-t-xl text-[11px] font-bold uppercase transition-all ${
                    activeTab === 'extrinsic' 
                        ? 'bg-brand-green text-white' 
                        : 'bg-transparent text-brand-navy hover:bg-gray-50'
                }`}
            >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === 'extrinsic' ? 'bg-white/20' : 'bg-gray-200'}`}>2</div>
                EXTRINSIC ASSESSMENT
            </button>
      </div>

      {activeTab === 'intrinsic' ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-500 relative">
            
            {/* NEW HEADER BLOCK WITH SCORE */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2 mb-2 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 flex-1 w-full">
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Nombre</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.tasterName} onChange={(e) => setData({...data, tasterName: e.target.value})}  />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Fecha</label>
                        <input type="date" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.date || new Date().toISOString().split('T')[0]} onChange={(e) => setData({...data, date: e.target.value})}  />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">Objetivo</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.objective || ''} onChange={(e) => setData({...data, objective: e.target.value})}  />
                    </div>
                    <div className="flex items-end gap-2 border-b border-gray-400 pb-1">
                        <label className="text-[12px] font-bold text-brand-navy whitespace-nowrap">N° de muestra</label>
                        <input type="text" className="flex-1 bg-transparent outline-none text-[12px] font-bold text-brand-navy px-2" value={data.extrinsicSCA.sampleNumber} onChange={(e) => setData({...data, extrinsicSCA: {...data.extrinsicSCA, sampleNumber: e.target.value}})}  />
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

            {/* BOTÓN DE NAVEGACIÓN A EXTRÍNSECO */}
            {true && (
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => setActiveTab('extrinsic')}
                        className="bg-white hover:bg-white border border-gray-400 shadow-sm text-brand-navy border border-gray-400 shadow-sm px-10 py-5 rounded-2xl text-[11px] font-bold uppercase  flex items-center gap-4 transition-all group"
                    >
                        {t('cuppingForm', 'continueExtrinsic')}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-1 transition-transform">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-500">


          {/* CULTIVO + PROCESAMIENTO */}
          <div className="">
            <div className="grid grid-cols-2 gap-4">
              <SCAExtrinsicSection
                title="Crop"
                infoLabel="Relevant information about the crop"
                items={[
                  { key: 'pais', label: 'Country' },
                  { key: 'region', label: 'Region', indent: true },
                  { key: 'finca', label: 'Farm/Cooperative Name' },
                  { key: 'productor', label: 'Producer(s) Name' },
                  { key: 'especie', label: 'Species' },
                  { key: 'variedad', label: 'Variety or Varieties', indent: true },
                  { key: 'fecha', label: 'Harvest Date/Year' },
                  { key: 'otro', label: 'Other' },
                ]}
                checkedItems={data.extrinsicSCA.cultivo.items}
                info={data.extrinsicSCA.cultivo.info}
                onToggle={(key) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, cultivo: {...p.extrinsicSCA.cultivo, items: {...p.extrinsicSCA.cultivo.items, [key]: !p.extrinsicSCA.cultivo.items[key]}}}}))} 
                onInfoChange={(val) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, cultivo: {...p.extrinsicSCA.cultivo, info: val}}}))}
                disabled={isReadOnly}
              />
              <SCAExtrinsicSection
                title="Processing"
                infoLabel="Relevant information about processing"
                items={[
                  { key: 'beneficiadorNombre', label: 'Processor(s) Name' },
                  { key: 'beneficiadorHumedo', label: 'Wet Mill / Processing Plant', indent: true },
                  { key: 'beneficiadorSeco', label: 'Dry Mill', indent: true },
                  { key: 'beneficiadorOtro', label: 'Other', indent: true },
                  { key: 'tipoProceso', label: 'Process Type' },
                  { key: 'tipoLavado', label: 'Washed', indent: true },
                  { key: 'tipoNatural', label: 'Natural', indent: true },
                  { key: 'tipoOtro', label: 'Other', indent: true },
                  { key: 'descafeinado', label: 'Decaffeinated' },
                  { key: 'descripcionProceso', label: 'Process Description' },
                ]}
                checkedItems={data.extrinsicSCA.procesamiento.items}
                info={data.extrinsicSCA.procesamiento.info}
                onToggle={(key) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, procesamiento: {...p.extrinsicSCA.procesamiento, items: {...p.extrinsicSCA.procesamiento.items, [key]: !p.extrinsicSCA.procesamiento.items[key]}}}}))} 
                onInfoChange={(val) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, procesamiento: {...p.extrinsicSCA.procesamiento, info: val}}}))}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* COMERCIO + {t('cuppingForm', 'certificaciones')} */}
          <div className="">
            <div className="grid grid-cols-2 gap-4">
              <SCAExtrinsicSection
                title="Commerce"
                infoLabel="Relevant information about commerce"
                items={[
                  { key: 'clasificacion', label: 'Local/Regional Classification' },
                  { key: 'oic', label: 'ICO Number' },
                  { key: 'importador', label: 'Importer Name' },
                  { key: 'exportador', label: 'Exporter Name' },
                  { key: 'precio', label: 'Producer Price' },
                  { key: 'tamano', label: 'Lot Size' },
                  { key: 'otro', label: 'Other' },
                ]}
                checkedItems={data.extrinsicSCA.comercio.items}
                info={data.extrinsicSCA.comercio.info}
                onToggle={(key) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, comercio: {...p.extrinsicSCA.comercio, items: {...p.extrinsicSCA.comercio.items, [key]: !p.extrinsicSCA.comercio.items[key]}}}}))} 
                onInfoChange={(val) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, comercio: {...p.extrinsicSCA.comercio, info: val}}}))}
                disabled={isReadOnly}
              />
              <SCAExtrinsicSection
                title="Certifications"
                infoLabel="Relevant information about certifications"
                items={[
                  { key: 'c4', label: '4C' },
                  { key: 'fairtrade', label: 'Fairtrade' },
                  { key: 'organico', label: 'Organic' },
                  { key: 'rainforest', label: 'Rainforest Alliance' },
                  { key: 'inocuidad', label: 'Food Safety' },
                  { key: 'otro', label: 'Other' },
                ]}
                checkedItems={data.extrinsicSCA.certificaciones.items}
                info={data.extrinsicSCA.certificaciones.info}
                onToggle={(key) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, certificaciones: {...p.extrinsicSCA.certificaciones, items: {...p.extrinsicSCA.certificaciones.items, [key]: !p.extrinsicSCA.certificaciones.items[key]}}}}))} 
                onInfoChange={(val) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, certificaciones: {...p.extrinsicSCA.certificaciones, info: val}}}))}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* OTRO */}
          <div className="">
            <div className="grid grid-cols-2 gap-4">
              <SCAExtrinsicSection
                title="Other"
                infoLabel="Other relevant information"
                items={[
                  { key: 'premios', label: 'Awards/recognitions' },
                ]}
                checkedItems={data.extrinsicSCA.otro.items}
                info={data.extrinsicSCA.otro.info}
                onToggle={(key) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, otro: {...p.extrinsicSCA.otro, items: {...p.extrinsicSCA.otro.items, [key]: !p.extrinsicSCA.otro.items[key]}}}}))} 
                onInfoChange={(val) => setData(p => ({...p, extrinsicSCA: {...p.extrinsicSCA, otro: {...p.extrinsicSCA.otro, info: val}}}))}
                disabled={isReadOnly}
              />
              <div className="p-4 bg-white flex items-center justify-center">
                <p className="text-[9px] font-bold text-brand-navy/40 uppercase text-center">ADDITIONAL FIELDS AVAILABLE<br />IN THE ALQUIMIA PROTOCOL MODULE</p>
              </div>
            </div>
          </div>

          {/* BOTÓN SELLAR EN TAB EXTRÍNSECO */}
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving || !isExtrinsicFilled}
              className={`w-full py-5 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-3 ${
                isExtrinsicFilled
                  ? 'bg-brand-green hover:bg-brand-green-bright text-brand-navy shadow-[0_0_30px_rgba(0,166,81,0.2)] active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              )}
              {isExtrinsicFilled ? 'SEAL COMPLETE PROTOCOL' : 'FILL AT LEAST ONE FIELD'}
            </button>
          )}

        </div>
      )}

    </div>
  );
}
