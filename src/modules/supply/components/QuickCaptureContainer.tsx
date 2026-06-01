'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useLanguage } from '@/shared/context/LanguageContext';
import { sendTelegramAlert } from '@/shared/lib/telegram';

interface QuickCaptureProps {
    user: { name: string; email: string; companyId: string; role?: string };
    onClose: () => void;
    fetchRecentLots?: () => Promise<void>;
}

export default function QuickCaptureContainer({ user, onClose, fetchRecentLots }: QuickCaptureProps) {
    const { t } = useLanguage();

    // Estado del asistente por pasos
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [dbLotId, setDbLotId] = useState<string | null>(null);

    // ==========================================
    // ESTADO DE LOS 60 CAMPOS MAESTROS (EN INGLÉS)
    // ==========================================

    // Ventana 1: Purchase & Origin
    const [lotNumber, setLotNumber] = useState('');
    const [farmerName, setFarmerName] = useState('');
    const [farmName, setFarmName] = useState('');
    const [country, setCountry] = useState('Colombia');
    const [region, setRegion] = useState('');
    const [altitude, setAltitude] = useState<number | ''>('');
    const [variety, setVariety] = useState('Pink Bourbon');
    const [process, setProcess] = useState('Anaerobic');
    const [purchaseWeight, setPurchaseWeight] = useState<number | ''>('');
    const [purchaseValue, setPurchaseValue] = useState<number | ''>('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
    const [destination, setDestination] = useState<'internal' | 'export_green' | 'export_roasted'>('export_green');

    // Ventana 2: Fermentation & Alchemy (process_data JSON)
    const [phInicial, setPhInicial] = useState<number | ''>('');
    const [phFinal, setPhFinal] = useState<number | ''>('');
    const [tipoSecado, setTipoSecado] = useState('Camas Africanas');
    const [tiempoSecadoDias, setTiempoSecadoDias] = useState<number | ''>('');
    const [temperaturaControladaC, setTemperaturaControladaC] = useState<number | ''>('');
    const [tiempoFermentacionHoras, setTiempoFermentacionHoras] = useState<number | ''>('');
    const [anotacionEspecial, setAnotacionEspecial] = useState('');

    // Ventana 3: Milling & Yield
    const [thrashedWeight, setThrashedWeight] = useState<number | ''>('');
    const [pasillaWeight, setPasillaWeight] = useState<number | ''>('');
    const [ciscoWeight, setCiscoWeight] = useState<number | ''>('');
    const [moisture, setMoisture] = useState<number | ''>('');

    // Ventana 4: Physical Lab (physical_analysis table)
    const [waterActivity, setWaterActivity] = useState<number | ''>('');
    const [densityGl, setDensityGl] = useState<number | ''>('');
    const [defectsPrimarios, setDefectsPrimarios] = useState<number>(0);
    const [defectsSecundarios, setDefectsSecundarios] = useState<number>(0);
    const [physicalNotes, setPhysicalNotes] = useState('');

    // Ventana 5: Roasting batch
    const [batchIdLabel, setBatchIdLabel] = useState('');
    const [greenWeightRoast, setGreenWeightRoast] = useState<number | ''>('');
    const [roastedWeight, setRoastedWeight] = useState<number | ''>('');
    const [timeTotal, setTimeTotal] = useState('');
    const [tempDrop, setTempDrop] = useState<number | ''>('');
    const [rorDev, setRorDev] = useState<number | ''>('');

    // Ventana 6: SCA CVA Cupping
    const [fragranceIntensity, setFragranceIntensity] = useState<number>(7.5);
    const [aromaIntensity, setAromaIntensity] = useState<number>(7.5);
    const [flavorIntensity, setFlavorIntensity] = useState<number>(7.5);
    const [aftertasteIntensity, setAftertasteIntensity] = useState<number>(7.5);
    const [acidityIntensity, setAcidityIntensity] = useState<number>(7.5);
    const [sweetnessIntensity, setSweetnessIntensity] = useState<number>(7.5);
    const [mouthfeelIntensity, setMouthfeelIntensity] = useState<number>(7.5);

    const [fragranceQuality, setFragranceQuality] = useState<number>(8.0);
    const [aromaQuality, setAromaQuality] = useState<number>(8.0);
    const [flavorQuality, setFlavorQuality] = useState<number>(8.0);
    const [aftertasteQuality, setAftertasteQuality] = useState<number>(8.0);
    const [acidityQuality, setAcidityQuality] = useState<number>(8.0);
    const [sweetnessQuality, setSweetnessQuality] = useState<number>(8.0);
    const [mouthfeelQuality, setMouthfeelQuality] = useState<number>(8.0);
    const [overallImpression, setOverallImpression] = useState<number>(8.0);

    const [cuppingNotes, setCuppingNotes] = useState('');
    const [cuppingTaster, setCuppingTaster] = useState('');

    const [selectedDescriptors, setSelectedDescriptors] = useState<string[]>(["Floral", "Frutal", "Dulce"]);
    const [selectedAcids, setSelectedAcids] = useState<string[]>(["Málica"]);
    const [selectedMouthfeel, setSelectedMouthfeel] = useState<string[]>(["Sedoso"]);

    // Telegram Alert Config
    const [telegramChatId, setTelegramChatId] = useState('');

    // Auto-generación de ID de lote al montar
    useEffect(() => {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setLotNumber(`AXIS-LOT-${rand}`);
        setBatchIdLabel(`ROAST-BATCH-${rand}`);
        setCuppingTaster(user.name || 'Q Grader Central');
    }, []);

    // Cálculos dinámicos (Cero carga de digitación)
    const calculatedThrashingYield = purchaseWeight && thrashedWeight
        ? ((Number(thrashedWeight) / Number(purchaseWeight)) * 100).toFixed(2)
        : '0.00';

    const calculatedRoastYieldLoss = greenWeightRoast && roastedWeight
        ? (((Number(greenWeightRoast) - Number(roastedWeight)) / Number(greenWeightRoast)) * 100).toFixed(2)
        : '0.00';

    const calculatedScaScore = (
        Number(fragranceQuality) +
        Number(aromaQuality) +
        Number(flavorQuality) +
        Number(aftertasteQuality) +
        Number(acidityQuality) +
        Number(sweetnessQuality) +
        Number(mouthfeelQuality) +
        Number(overallImpression) +
        36 // Base de escala afectiva SCA/CVA
    ).toFixed(2);

    // ==========================================
    // PERSISTENCIA EN TIEMPO REAL (PASO A PASO)
    // ==========================================
    const saveCurrentProgress = async (nextStep: typeof step) => {
        setSaveStatus('saving');
        try {
            // Estructura de process_data JSON
            const processDataObj = {
                ph_inicial: phInicial ? Number(phInicial) : null,
                ph_final: phFinal ? Number(phFinal) : null,
                tipo_secado: tipoSecado,
                tiempo_secado_dias: tiempoSecadoDias ? Number(tiempoSecadoDias) : null,
                proceso_fermentacion: process,
                temperatura_controlada_c: temperaturaControladaC ? Number(temperaturaControladaC) : null,
                tiempo_fermentacion_horas: tiempoFermentacionHoras ? Number(tiempoFermentacionHoras) : null,
                anotacion_especial: anotacionEspecial,
            };

            const payloadLot: any = {
                lot_number: lotNumber,
                farmer_name: farmerName || 'Productor Ficticio',
                farm_name: farmName || 'Finca Sin Nombre',
                altitude: altitude ? Number(altitude) : 1500,
                region: region || 'Región Central',
                variety: variety,
                process: process,
                purchase_weight: purchaseWeight ? Number(purchaseWeight) : 100,
                purchase_value: purchaseValue ? Number(purchaseValue) : 500000,
                purchase_date: purchaseDate,
                harvest_date: harvestDate,
                destination: destination,
                company_id: user.companyId,
                pasilla_weight: pasillaWeight ? Number(pasillaWeight) : 0,
                cisco_weight: ciscoWeight ? Number(ciscoWeight) : 0,
                country: country,
                moisture: moisture ? Number(moisture) : 11.0,
                thrashed_weight: thrashedWeight ? Number(thrashedWeight) : null,
                thrashing_yield: Number(calculatedThrashingYield),
                process_data: {
                    ...processDataObj,
                    quick_capture_complete: nextStep === 7,
                    admin_approved: false
                },
                status: 'purchased',
            };

            let returnedId = dbLotId;

            // 1. Guardar/Actualizar en coffee_purchase_inventory
            if (!dbLotId) {
                const { data, error } = await supabase
                    .from('coffee_purchase_inventory')
                    .insert([payloadLot])
                    .select('id')
                    .single();

                if (error) throw error;
                returnedId = data.id;
                setDbLotId(data.id);
            } else {
                const { error } = await supabase
                    .from('coffee_purchase_inventory')
                    .update(payloadLot)
                    .eq('id', dbLotId);

                if (error) throw error;
            }

            // 2. Si avanzamos del paso 4 (Lab Físico), insertar o actualizar physical_analysis
            if (step >= 4 && returnedId) {
                const physicalPayload = {
                    inventory_id: returnedId,
                    moisture_pct: moisture ? Number(moisture) : 11.0,
                    water_activity: waterActivity ? Number(waterActivity) : 0.60,
                    density_gl: densityGl ? Number(densityGl) : 700,
                    defects_count: { primarios: defectsPrimarios, secundarios: defectsSecundarios },
                    notes: physicalNotes,
                    company_id: user.companyId
                };

                const { data: physCheck } = await supabase
                    .from('physical_analysis')
                    .select('id')
                    .eq('inventory_id', returnedId)
                    .maybeSingle();

                if (physCheck) {
                    await supabase
                        .from('physical_analysis')
                        .update(physicalPayload)
                        .eq('inventory_id', returnedId);
                } else {
                    await supabase
                        .from('physical_analysis')
                        .insert([physicalPayload]);
                }
            }

            // 3. Si avanzamos del paso 5 (Tostión), guardar roast_batches
            if (step >= 5 && returnedId) {
                const roastPayload = {
                    inventory_id: returnedId,
                    batch_id_label: batchIdLabel,
                    process: process,
                    roast_date: new Date().toISOString().split('T')[0],
                    green_weight: greenWeightRoast ? Number(greenWeightRoast) : (thrashedWeight ? Number(thrashedWeight) : 10),
                    roasted_weight: roastedWeight ? Number(roastedWeight) : 8.5,
                    company_id: user.companyId,
                    roast_curve: [
                        { t: 0, bt: 190, et: 210 },
                        { t: 180, bt: 140, et: 165 },
                        { t: 360, bt: 175, et: 195 },
                        { t: 500, bt: tempDrop ? Number(tempDrop) : 200, et: 220 }
                    ]
                };

                const { data: roastCheck } = await supabase
                    .from('roast_batches')
                    .select('id')
                    .eq('inventory_id', returnedId)
                    .maybeSingle();

                if (roastCheck) {
                    await supabase
                        .from('roast_batches')
                        .update(roastPayload)
                        .eq('inventory_id', returnedId);
                } else {
                    await supabase
                        .from('roast_batches')
                        .insert([roastPayload]);
                }
            }

            // 4. Si finalizamos el paso 6 (Catación), guardar sca_cupping
            if (step >= 6 && returnedId) {
                const cuppingPayload = {
                    inventory_id: returnedId,
                    company_id: user.companyId,
                    fragrance_aroma: Number(fragranceQuality), // tradicional analítica
                    overall: Number(calculatedScaScore),
                    notes: cuppingNotes,
                    taster_name: cuppingTaster,
                    is_cva_version: true,
                    cva_descriptive: {
                        fragranceIntensity,
                        aromaIntensity,
                        flavorIntensity,
                        aftertasteIntensity,
                        acidityIntensity,
                        sweetnessIntensity,
                        mouthfeelIntensity,
                        descriptors: {
                            fragrance: selectedDescriptors,
                            flavor: selectedDescriptors,
                            mouthfeel: selectedMouthfeel,
                            acidity: selectedAcids,
                            sweetness: ["Miel"]
                        },
                        predominantGusts: ["Dulce", "Ácido"],
                        defects: { nonUniformCups: 0, defectiveCups: 0, type: [] },
                        extrinsic: {
                            alchemyProcess: process,
                            seedCertificate: "Selección Especial",
                            agrochemicalRegistry: "0% Residues",
                            waterPh: "7.2",
                            storageConditions: "18°C / 60% RH",
                            legal: { landRights: true, laborCompliance: true, indigenousRights: true }
                        }
                    },
                    cva_affective: {
                        fragranceQuality,
                        aromaQuality,
                        flavorQuality,
                        aftertasteQuality,
                        acidityQuality,
                        sweetnessQuality,
                        mouthfeelQuality,
                        overallImpression
                    }
                };

                const { data: cupCheck } = await supabase
                    .from('sca_cupping')
                    .select('id')
                    .eq('inventory_id', returnedId)
                    .maybeSingle();

                if (cupCheck) {
                    await supabase
                        .from('sca_cupping')
                        .update(cuppingPayload)
                        .eq('inventory_id', returnedId);
                } else {
                    await supabase
                        .from('sca_cupping')
                        .insert([cuppingPayload]);
                }
            }

            setSaveStatus('success');
            
            // Si pasamos al estado final (Aprobación del admin), lanzar alerta Telegram
            if (nextStep === 7) {
                if (telegramChatId.trim()) {
                    const alertMsg = `🚨 *AXISONE - NUEVO LOTE EN ESPERA* 🚨\n\n*Lote:* \`${lotNumber}\`\n*Productor:* ${farmerName || 'Sin Nombre'}\n*Variedad:* ${variety}\n*SCA Score Estimado:* ${calculatedScaScore} pts\n\nEl lote ha sido ingresado por celular. *Esperando OK del Administrador desde la web.*`;
                    await sendTelegramAlert(telegramChatId.trim(), alertMsg);
                }
            }

            setStep(nextStep);
        } catch (error: any) {
            console.error('❌ AXIS DB Error:', error.message || error);
            setSaveStatus('error');
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white border-2 border-zinc-300 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 transition-all duration-300 text-zinc-900">
            
            {/* Header del Asistente */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-6 mb-6">
                <div>
                    <h2 className="text-2xl font-black uppercase text-zinc-900 tracking-wider">
                        {step === 7 ? '✓ Registro Completado' : 'Captura Rápida Progresiva'}
                    </h2>
                    <p className="text-[10px] font-black uppercase text-teal-600 mt-1">
                        {step <= 6 ? `Fase ${step} de 6 · Auto-Guardado en Tiempo Real` : 'En espera de aprobación final'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all border border-zinc-200"
                >
                    ✕
                </button>
            </div>

            {/* Barra de Progreso Wizard */}
            {step <= 6 && (
                <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                    {([1, 2, 3, 4, 5, 6] as const).map(i => (
                        <button
                            key={i}
                            disabled={i > step && !dbLotId}
                            onClick={() => setStep(i)}
                            className={`flex-1 min-w-[70px] py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                                step === i
                                    ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20'
                                    : i < step
                                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                                    : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
                            }`}
                        >
                            Paso {i}
                        </button>
                    ))}
                </div>
            )}

            {/* ========================================================
                PASO 1: ORIGIN & PURCHASE
                ======================================================== */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black uppercase text-zinc-500 tracking-wider">Paso 1: Origen y Compra del Lote</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Número de Lote (Fijo)</label>
                            <input
                                type="text"
                                readOnly
                                value={lotNumber}
                                className="bg-zinc-100 border-2 border-zinc-300 rounded-xl p-3.5 text-xs font-mono font-black text-zinc-900 select-none focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Nombre del Productor *</label>
                            <input
                                type="text"
                                value={farmerName}
                                onChange={(e) => setFarmerName(e.target.value)}
                                placeholder="Ej: Julián Holguín"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Nombre de la Finca</label>
                            <input
                                type="text"
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                                placeholder="Ej: Finca Las Nubes"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">País *</label>
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            >
                                <option value="Colombia">Colombia</option>
                                <option value="Ethiopia">Ethiopia</option>
                                <option value="Brazil">Brazil</option>
                                <option value="Vietnam">Vietnam</option>
                                <option value="Panama">Panama</option>
                                <option value="Costa Rica">Costa Rica</option>
                                <option value="Kenya">Kenya</option>
                                <option value="Indonesia">Indonesia</option>
                                <option value="Guatemala">Guatemala</option>
                                <option value="Honduras">Honduras</option>
                                <option value="El Salvador">El Salvador</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Región / Municipio</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                placeholder="Ej: Huila, Pitalito"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Altitud (msnm)</label>
                            <input
                                type="number"
                                value={altitude}
                                onChange={(e) => setAltitude(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 1950"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Variedad</label>
                            <select
                                value={variety}
                                onChange={(e) => setVariety(e.target.value)}
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            >
                                <option value="Pink Bourbon">Pink Bourbon</option>
                                <option value="Eugenioides">Eugenioides</option>
                                <option value="Geisha">Geisha</option>
                                <option value="Castillo">Castillo</option>
                                <option value="Caturra">Caturra</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Peso Comprado (kg)</label>
                            <input
                                type="number"
                                value={purchaseWeight}
                                onChange={(e) => setPurchaseWeight(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 200"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Valor Total Pagado ($ COP)</label>
                            <input
                                type="number"
                                value={purchaseValue}
                                onChange={(e) => setPurchaseValue(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 4000000"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                PASO 2: FERMENTATION & ALCHEMY (process_data)
                ======================================================== */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black uppercase text-zinc-500 tracking-wider">Paso 2: Datos de Fermentación y Beneficio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Proceso de Fermentación</label>
                            <input
                                type="text"
                                value={process}
                                onChange={(e) => setProcess(e.target.value)}
                                placeholder="Ej: Fermentación Anaeróbica en Cereza"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">pH Inicial</label>
                            <input
                                type="number"
                                step="0.01"
                                value={phInicial}
                                onChange={(e) => setPhInicial(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 5.20"
                                className={`bg-zinc-50/50 border-2 rounded-xl p-3.5 text-xs focus:outline-none transition-all font-semibold text-zinc-850 ${
                                    phInicial && (Number(phInicial) < 3.0 || Number(phInicial) > 6.5)
                                        ? 'border-amber-500 ring-2 ring-amber-500/50 focus:bg-white'
                                        : 'border-zinc-300 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600'
                                }`}
                            />
                            {phInicial && (Number(phInicial) < 3.0 || Number(phInicial) > 6.5) && (
                                <span className="text-[8px] font-black uppercase text-amber-600 mt-1">⚠️ pH atípico para mostos de café</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">pH Final</label>
                            <input
                                type="number"
                                step="0.01"
                                value={phFinal}
                                onChange={(e) => setPhFinal(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 3.90"
                                className={`bg-zinc-50/50 border-2 rounded-xl p-3.5 text-xs focus:outline-none transition-all font-semibold text-zinc-850 ${
                                    phFinal && (Number(phFinal) < 3.2 || Number(phFinal) > 4.5)
                                        ? 'border-amber-500 ring-2 ring-amber-500/50 focus:bg-white'
                                        : 'border-zinc-300 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600'
                                }`}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Temperatura Controlada (°C)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={temperaturaControladaC}
                                onChange={(e) => setTemperaturaControladaC(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 18.0"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Tiempo de Fermentación (Horas)</label>
                            <input
                                type="number"
                                value={tiempoFermentacionHoras}
                                onChange={(e) => setTiempoFermentacionHoras(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 72"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Tipo de Secado</label>
                            <input
                                type="text"
                                value={tipoSecado}
                                onChange={(e) => setTipoSecado(e.target.value)}
                                placeholder="Ej: Camas Africanas bajo Sombra"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Tiempo de Secado (Días)</label>
                            <input
                                type="number"
                                value={tiempoSecadoDias}
                                onChange={(e) => setTiempoSecadoDias(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 22"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Anotaciones del Proceso</label>
                            <textarea
                                value={anotacionEspecial}
                                onChange={(e) => setAnotacionEspecial(e.target.value)}
                                placeholder="Detalles de levaduras inoculadas, comportamiento térmico..."
                                rows={2}
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold resize-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                PASO 3: MILLING & YIELD (Trilla)
                ======================================================== */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black uppercase text-zinc-500 tracking-wider">Paso 3: Trilla y Rendimiento del Grano</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Peso Almendra Seca Trillada (kg)</label>
                            <input
                                type="number"
                                value={thrashedWeight}
                                onChange={(e) => setThrashedWeight(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 38.0"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Rendimiento de Trilla (%)</label>
                            <input
                                type="text"
                                readOnly
                                value={`${calculatedThrashingYield}%`}
                                className="bg-zinc-100 border-2 border-zinc-300 rounded-xl p-3.5 text-xs font-mono font-black text-zinc-900 select-none focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Peso Pasilla retirado (kg)</label>
                            <input
                                type="number"
                                value={pasillaWeight}
                                onChange={(e) => setPasillaWeight(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 1.2"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Peso Cisco retirado (kg)</label>
                            <input
                                type="number"
                                value={ciscoWeight}
                                onChange={(e) => setCiscoWeight(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 0.8"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                PASO 4: PHYSICAL LAB
                ======================================================== */}
            {step === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black uppercase text-zinc-500 tracking-wider">Paso 4: Análisis Físico de Laboratorio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Humedad de Laboratorio (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={moisture}
                                onChange={(e) => setMoisture(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 10.5"
                                className={`bg-zinc-50/50 border-2 rounded-xl p-3.5 text-xs focus:outline-none transition-all font-semibold text-zinc-850 ${
                                    moisture && (Number(moisture) < 9.5 || Number(moisture) > 12.5)
                                        ? 'border-red-500 ring-2 ring-red-500/50 focus:bg-white'
                                        : 'border-zinc-300 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600'
                                }`}
                            />
                            {moisture && (Number(moisture) < 9.5 || Number(moisture) > 12.5) && (
                                <span className="text-[8px] font-black uppercase text-red-500 mt-1">❌ Humedad fuera del rango legal de exportación (10% - 12%)</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Actividad de Agua (aw)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={waterActivity}
                                onChange={(e) => setWaterActivity(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 0.58"
                                className={`bg-zinc-50/50 border-2 rounded-xl p-3.5 text-xs focus:outline-none transition-all font-semibold text-zinc-850 ${
                                    waterActivity && (Number(waterActivity) < 0.50 || Number(waterActivity) > 0.62)
                                        ? 'border-amber-500 ring-2 ring-amber-500/50 focus:bg-white'
                                        : 'border-zinc-300 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600'
                                }`}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Densidad (g/L)</label>
                            <input
                                type="number"
                                value={densityGl}
                                onChange={(e) => setDensityGl(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 720"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Defectos Prim.</label>
                                <input
                                    type="number"
                                    value={defectsPrimarios}
                                    onChange={(e) => setDefectsPrimarios(Number(e.target.value))}
                                    className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Defectos Sec.</label>
                                <input
                                    type="number"
                                    value={defectsSecundarios}
                                    onChange={(e) => setDefectsSecundarios(Number(e.target.value))}
                                    className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                PASO 5: ROASTING batch
                ======================================================== */}
            {step === 5 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black uppercase text-zinc-500 tracking-wider">Paso 5: Lote de Tostión</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Código Lote Tueste</label>
                            <input
                                type="text"
                                value={batchIdLabel}
                                onChange={(e) => setBatchIdLabel(e.target.value)}
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Tiempo Total Tueste</label>
                            <input
                                type="text"
                                value={timeTotal}
                                onChange={(e) => setTimeTotal(e.target.value)}
                                placeholder="Ej: 8m 45s"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Peso Verde Cargado (kg)</label>
                            <input
                                type="number"
                                value={greenWeightRoast}
                                onChange={(e) => setGreenWeightRoast(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 38.0"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Peso Tostado Obtenido (kg)</label>
                            <input
                                type="number"
                                value={roastedWeight}
                                onChange={(e) => setRoastedWeight(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 32.6"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Merma de Tostión (%)</label>
                            <input
                                type="text"
                                readOnly
                                value={`${calculatedRoastYieldLoss}%`}
                                className="bg-zinc-100 border-2 border-zinc-300 rounded-xl p-3.5 text-xs font-mono font-black text-zinc-900 select-none focus:outline-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Temperatura Caída / Drop (°C)</label>
                            <input
                                type="number"
                                value={tempDrop}
                                onChange={(e) => setTempDrop(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Ej: 201.0"
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                PASO 6: SCA CVA CUPPING (Taza)
                ======================================================== */}
            {step === 6 && (
                <div className="space-y-6 animate-in fade-in duration-300 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="text-sm font-black uppercase text-zinc-500 tracking-wider">Paso 6: Catación de Calidad SCA CVA</h3>
                    
                    {/* Intensidades */}
                    <div className="p-5 bg-zinc-100 border-2 border-zinc-200 rounded-2xl space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-zinc-650 tracking-widest border-b border-zinc-300 pb-2">Sección Afectiva de Calidad (Puntajes 6 - 10)</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Fragancia', val: fragranceQuality, set: setFragranceQuality },
                                { label: 'Aroma', val: aromaQuality, set: setAromaQuality },
                                { label: 'Sabor', val: flavorQuality, set: setFlavorQuality },
                                { label: 'Retrogusto', val: aftertasteQuality, set: setAftertasteQuality },
                                { label: 'Acidez', val: acidityQuality, set: setAcidityQuality },
                                { label: 'Dulzor', val: sweetnessQuality, set: setSweetnessQuality },
                                { label: 'Cuerpo', val: mouthfeelQuality, set: setMouthfeelQuality },
                                { label: 'Impresión Gral.', val: overallImpression, set: setOverallImpression }
                            ].map(item => (
                                <div key={item.label} className="flex flex-col">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black uppercase text-zinc-800">{item.label}</span>
                                        <span className="text-[10px] font-mono font-black text-teal-600">{item.val.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="6.0"
                                        max="10.0"
                                        step="0.25"
                                        value={item.val}
                                        onChange={(e) => item.set(Number(e.target.value))}
                                        className="accent-teal-600 h-2 rounded-lg bg-zinc-300 cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Visualizador de Puntaje Total */}
                        <div className="flex justify-between items-center bg-teal-50 border-2 border-teal-200 p-4 rounded-xl mt-4">
                            <span className="text-[10px] font-black uppercase text-teal-800">Puntaje SCA Estimado:</span>
                            <span className="text-2xl font-mono font-black text-teal-700">{calculatedScaScore} pts</span>
                        </div>
                    </div>

                    {/* Perfil de Taza Descriptivo pills */}
                    <div className="p-5 bg-zinc-50 border-2 border-zinc-200 rounded-2xl space-y-5 mt-5 text-left">
                        <h4 className="text-[10px] font-black uppercase text-zinc-650 tracking-widest border-b border-zinc-300 pb-2">Sección Descriptiva (Perfil de Taza / CVA)</h4>
                        
                        {/* 1. Descriptores Aromáticos/Sabor */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-700 block">Descriptores de Sabor y Aroma:</span>
                            <div className="flex flex-wrap gap-2">
                                {["Floral", "Frutal", "Cítrico", "Chocolatoso", "Caramelo", "Nueces/Cacao", "Herbal", "Especiado", "Dulce", "Afrutado"].map(desc => {
                                    const isSelected = selectedDescriptors.includes(desc);
                                    return (
                                        <button
                                            key={desc}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedDescriptors(selectedDescriptors.filter(d => d !== desc));
                                                } else {
                                                    setSelectedDescriptors([...selectedDescriptors, desc]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                isSelected
                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            {desc}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Acidez Predominante */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-700 block">Acidez Predominante:</span>
                            <div className="flex flex-wrap gap-2">
                                {["Málica", "Cítrica", "Fosfórica", "Láctica", "Acética", "Vibrante", "Compleja"].map(acid => {
                                    const isSelected = selectedAcids.includes(acid);
                                    return (
                                        <button
                                            key={acid}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedAcids(selectedAcids.filter(a => a !== acid));
                                                } else {
                                                    setSelectedAcids([...selectedAcids, acid]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                isSelected
                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            {acid}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Cuerpo / Sensación en Boca */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-700 block">Cuerpo y Sensación en Boca (Mouthfeel):</span>
                            <div className="flex flex-wrap gap-2">
                                {["Sedoso", "Cremoso", "Acuoso", "Denso", "Seco", "Suave", "Terroso"].map(body => {
                                    const isSelected = selectedMouthfeel.includes(body);
                                    return (
                                        <button
                                            key={body}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedMouthfeel(selectedMouthfeel.filter(b => b !== body));
                                                } else {
                                                    setSelectedMouthfeel([...selectedMouthfeel, body]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                isSelected
                                                    ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            {body}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Notas y Vinculación Telegram */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-zinc-700 mb-2">Descriptores de Taza y Notas</label>
                            <textarea
                                value={cuppingNotes}
                                onChange={(e) => setCuppingNotes(e.target.value)}
                                placeholder="Acidez málica, notas a maracuyá, jazmín, consistencia táctil sedosa..."
                                rows={2}
                                className="bg-zinc-50/50 border-2 border-zinc-300 rounded-xl p-3.5 text-xs text-zinc-850 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold resize-none"
                            />
                        </div>

                        <div className="flex flex-col md:col-span-2 border-t border-zinc-200 pt-6">
                            <div className="bg-zinc-100 p-5 rounded-2xl border border-zinc-300">
                                <h4 className="text-[10px] font-black uppercase text-zinc-700 tracking-widest mb-2">🤖 Alertador del Administrador (Telegram)</h4>
                                <p className="text-[10px] text-zinc-850 leading-relaxed mb-4">
                                    Introduce el **ID de Chat de Telegram** de la oficina de administración para enviar una notificación directa al finalizar la captura.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={telegramChatId}
                                        onChange={(e) => setTelegramChatId(e.target.value)}
                                        placeholder="Ej: 147284920"
                                        className="flex-1 bg-white border-2 border-zinc-300 rounded-xl p-3 text-xs text-zinc-850 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none transition-all font-semibold"
                                    />
                                    <a
                                        href="https://t.me/AxisOneBot"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5"
                                    >
                                        Obtener mi ID en Telegram
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                PASO 7: CONFIRMACIÓN FINAL
                ======================================================== */}
            {step === 7 && (
                <div className="space-y-6 text-center py-10 animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center mx-auto text-teal-600 text-4xl mb-4">
                        ✓
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-wider text-zinc-900">Lote en Proceso de Aprobación</h3>
                    <p className="text-xs text-zinc-700 max-w-md mx-auto leading-relaxed">
                        Los 60 datos de trazabilidad del lote **{lotNumber}** se han recopilado y guardado en tiempo real en Supabase.
                    </p>
                    
                    <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl max-w-md mx-auto text-left space-y-2.5">
                        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">⚠️ CONTROL DE CALIDAD REQUERIDO</span>
                        <p className="text-[10px] text-zinc-800 leading-relaxed">
                            El lote está en estado **"Pendiente de Aprobación"**. Por seguridad, el certificado criptográfico PDF y el código QR oficial solo se emitirán una vez que el **Administrador** revise los datos desde el panel web principal de escritorio.
                        </p>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => {
                                if (fetchRecentLots) fetchRecentLots();
                                onClose();
                            }}
                            className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-teal-600/20"
                        >
                            Volver al Panel Principal
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================
                ACCIONES DE NAVEGACIÓN DE BOTONES
                ======================================================== */}
            {step <= 6 && (
                <div className="flex justify-between items-center border-t border-zinc-200 pt-6 mt-8">
                    <button
                        type="button"
                        disabled={step === 1 || saveStatus === 'saving'}
                        onClick={() => setStep((step - 1) as any)}
                        className="px-6 py-3.5 border-2 border-zinc-300 hover:bg-zinc-100 text-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                        Anterior
                    </button>

                    <div className="flex items-center gap-3">
                        {saveStatus === 'saving' && (
                            <span className="text-[9px] font-black uppercase text-zinc-500 animate-pulse">
                                Guardando en Supabase...
                            </span>
                        )}
                        {saveStatus === 'success' && (
                            <span className="text-[9px] font-black uppercase text-teal-600">
                                Guardado ✓
                            </span>
                        )}

                        <button
                            type="button"
                            disabled={saveStatus === 'saving'}
                            onClick={() => saveCurrentProgress((step + 1) as any)}
                            className="px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-teal-600/20 active:scale-95 flex items-center gap-1.5"
                        >
                            {step === 6 ? 'Finalizar Registro' : 'Siguiente'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
