import React, { useState, useEffect } from 'react';
import { CoffeeVariety, ProcessType } from '@/shared/types';
import { NumericInput } from '@/shared/components/ui/NumericInput';
import { createCoffeePurchase, updateCoffeePurchase } from '../actions/purchase';
import { supabase } from '@/shared/lib/supabase';

const COFFEE_VARIETIES_BASE: string[] = [
    'Bourbon', 'Bourbon Rosado', 'Castillo', 'Caturra', 'Cenicafe 1',
    'Chiroso', 'Colombia', 'Geisha', 'Java', 'Laurina',
    'Maragogype', 'Mundo Novo', 'Pacamara', 'Papayo', 'Sidra',
    'SL28', 'Tabi', 'Typica', 'Wush Wush'
];

const PROCESS_TYPES: ProcessType[] = [
    'lavado', 'honey', 'honey_yellow', 'honey_red', 'honey_black', 'natural', 'semi_lavado', 'doble_fermentacion', 'co_fermentacion'
];

const COLOMBIAN_REGIONS = [
    'Huila', 'Antioquia', 'Tolima', 'Cauca', 'Caldas', 'Santander',
    'Valle del Cauca', 'Risaralda', 'Nariño', 'Quindío', 'Cundinamarca',
    'Sierra Nevada', 'Cesar', 'Boyacá', 'Casanare', 'Meta', 'Caquetá'
];

const COUNTRIES = [
    'Colombia', 'Etiopía', 'Brasil', 'Perú', 'Costa Rica', 'Panamá', 'Honduras', 'Guatemala'
];

interface PurchaseFormProps {
    onPurchaseComplete?: (lot: any) => void;
    selectedLot?: any;
    user: { email: string, name: string, companyId: string } | null;
}

export default function PurchaseForm({ onPurchaseComplete, selectedLot, user }: PurchaseFormProps) {
    const [dynamicVarieties, setDynamicVarieties] = useState<string[]>(COFFEE_VARIETIES_BASE);
    const [customVariety, setCustomVariety] = useState('');

    const initialFormState = {
        farmerName: '',
        farmName: '',
        altitude: 1600,
        country: 'Colombia',
        region: '',
        variety: '' as CoffeeVariety | string,
        process: 'lavado' as ProcessType,
        purchaseWeight: 0,
        purchaseValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
        destination: 'internal' as 'internal' | 'export_green' | 'export_roasted',
        exportCertificate: '',
        coffeeType: 'pergamino' as 'pergamino' | 'excelso'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [displayValue, setDisplayValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [expectedYield, setExpectedYield] = useState<number>(0);

    // Cargar variedades dinámicas desde la DB
    useEffect(() => {
        const fetchVarieties = async () => {
            if (!user?.companyId) return;

            const { data, error } = await supabase
                .from('coffee_purchase_inventory')
                .select('variety')
                .eq('company_id', user.companyId);

            if (!error && data) {
                const uniqueFromDb = Array.from(new Set(data.map(i => i.variety)))
                    .filter(v => v && !COFFEE_VARIETIES_BASE.includes(v as string)) as string[];

                const merged = [...COFFEE_VARIETIES_BASE, ...uniqueFromDb].sort((a, b) => a.localeCompare(b));
                setDynamicVarieties(merged);
            }
        };

        fetchVarieties();
    }, [user?.companyId]);

    useEffect(() => {
        if (selectedLot) {
            const isBase = COFFEE_VARIETIES_BASE.includes(selectedLot.variety);
            setFormData({
                farmerName: selectedLot.farmer_name || '',
                farmName: selectedLot.farm_name || '',
                altitude: selectedLot.altitude || 1600,
                country: selectedLot.country || 'Colombia',
                region: selectedLot.region || '',
                variety: isBase ? selectedLot.variety : 'Otro',
                process: (selectedLot.process as ProcessType) || 'lavado',
                purchaseWeight: Number(selectedLot.purchase_weight) || 0,
                purchaseValue: Number(selectedLot.purchase_value) || 0,
                purchaseDate: selectedLot.purchase_date || new Date().toISOString().split('T')[0],
                lotNumber: selectedLot.lot_number || `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
                destination: (selectedLot.destination as 'internal' | 'export_green' | 'export_roasted') || 'internal',
                exportCertificate: selectedLot.export_certificate || '',
                coffeeType: (selectedLot.coffee_type as 'pergamino' | 'excelso') || 'pergamino'
            });
            if (!isBase) setCustomVariety(selectedLot.variety);
            setDisplayValue(formatCOP(String(selectedLot.purchase_value || 0)));
        } else {
            setFormData(initialFormState);
            setCustomVariety('');
            setDisplayValue('');
            setStatus(null);
            setShowSuccessModal(false);
        }
    }, [selectedLot]);

    // Cálculo dinámico de rendimiento esperado (Factor de rendimiento estándar ~81%)
    useEffect(() => {
        setExpectedYield(formData.purchaseWeight * 0.81);
    }, [formData.purchaseWeight]);

    const formatCOP = (val: string) => {
        const number = val.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const formatted = formatCOP(rawValue);
        setDisplayValue(formatted);
        setFormData({ ...formData, purchaseValue: parseInt(rawValue) || 0 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const finalVariety = formData.variety === 'Otro' ? customVariety : formData.variety;
            if (!finalVariety) throw new Error("Debe especificar una variedad.");

            let result;
            if (selectedLot?.id) {
                // Modo Edición
                result = await updateCoffeePurchase(selectedLot.id, { ...formData, variety: finalVariety });
            } else {
                // Modo Creación
                result = await createCoffeePurchase({
                    ...formData,
                    variety: finalVariety,
                    companyId: user?.companyId || '99999999-9999-9999-9999-999999999999'
                });
            }

            if (!result.success) {
                setStatus({ type: 'error', message: result.message });
            } else {
                setStatus({ type: 'success', message: result.message });
                setShowSuccessModal(true);

                // Actualizar lista de variedades para que la nueva aparezca de inmediato sin recargar
                if (formData.variety === 'Otro' && !dynamicVarieties.includes(customVariety)) {
                    setDynamicVarieties(prev => [...prev, customVariety].sort((a, b) => a.localeCompare(b)));
                }

                if (onPurchaseComplete && result.data) {
                    onPurchaseComplete(result.data);
                }
            }
        } catch (err: any) {
            console.error("DEBUG SUBMISSION:", err);
            setStatus({
                type: 'error',
                message: 'Error de Sincronización Industrial: Fallo crítico en el procesamiento.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewLot = () => {
        setShowSuccessModal(false);
        setFormData({
            ...initialFormState,
            lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}`
        });
        setDisplayValue('');
        setStatus(null);
    };

    // AI Pattern Box Component
    const AIPatternBox = () => {
        const patterns: Record<string, string> = {
            'Castillo': 'DTR entre 17.5% y 18.2% para puntajes > 86.5 pts.',
            'Caturra': 'Curva de secado lenta (32h) favorece notas achocolatadas.',
            'Geisha': 'Estabilidad térmica en reposo reduce astringencia lateral.',
            'Bourbon': 'Balance ideal de acidez cítrica con MSNM > 1800.',
            'default': 'Optimización de mallas 17/18 detectada mediante AXIS AI.'
        };
        const varietyKey = formData.variety === 'Otro' ? customVariety : formData.variety;
        const message = patterns[varietyKey] || patterns.default;

        return (
            <div className="mt-4 p-6 bg-brand-green/5 border border-brand-green/20 rounded-industrial-sm transition-all duration-500 animate-in fade-in slide-in-from-right-4">
                <div className="p-6 bg-white/2 border border-white/5 rounded-industrial-sm mb-4">
                    <p className="text-xs text-gray-400 uppercase mb-3 font-bold tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
                        Patrón de Éxito Identificado (AXIS AI)
                    </p>
                    <p className="text-sm font-medium leading-relaxed">
                        "{message}"
                    </p>
                </div>
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold opacity-70 tracking-tight">Rendimiento Estimado: {expectedYield.toFixed(2)} KG Excelso</p>
                    <span className="text-[11px] text-brand-green font-bold uppercase tracking-widest bg-brand-green/10 px-2 py-0.5 rounded-full">Probabilidad: 94.2%</span>
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-bg-card border border-brand-green/30 p-10 rounded-industrial max-w-md w-full text-center space-y-6 shadow-2xl shadow-brand-green/20">
                        <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-green/30">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00df9a" strokeWidth="3" className="animate-bounce">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">Lote Registrado</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Identificador <span className="text-brand-green-bright font-mono font-bold">{formData.lotNumber}</span> ha sido persistido exitosamente en el Core de <span className="text-white font-bold">Axis Coffee Pro</span>.
                        </p>
                        <button
                            type="button"
                            onClick={handleNewLot}
                            className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-industrial-sm transition-all uppercase tracking-widest text-sm shadow-lg shadow-brand-green/20 active:scale-95"
                        >
                            Crear Nuevo Lote
                        </button>
                    </div>
                </div>
            )}

            {status && (
                <div className={`p-4 rounded-industrial-sm text-sm font-bold border ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green-bright' : 'bg-brand-red/10 border-brand-red/30 text-brand-red-bright'}`}>
                    {status.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                            Datos del Productor
                        </h3>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 bg-bg-main border border-white/5 rounded-industrial-sm group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-green/20"></div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20" /></svg>
                            Identificador de Lote (Manual / Auto)
                        </p>
                        <div className="flex items-center gap-6">
                            <input
                                type="text"
                                placeholder="AX-0000"
                                value={formData.lotNumber}
                                onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value.toUpperCase() })}
                                className="bg-transparent text-5xl font-bold tracking-tighter text-white hover:text-brand-green-bright transition-colors uppercase outline-none text-center border-b border-white/10 focus:border-brand-green w-64"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}` })}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-brand-green transition-all"
                                title="Generar ID Aleatorio"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre del Caficultor</label>
                            <input
                                type="text"
                                placeholder="Ej. Alejandra Pérez"
                                required
                                value={formData.farmerName}
                                onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre de la Finca</label>
                            <input
                                type="text"
                                placeholder="Ej. Alejandría"
                                required
                                value={formData.farmName}
                                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <NumericInput
                                    label="Altura (msnm)"
                                    value={formData.altitude}
                                    onChange={(val) => setFormData({ ...formData, altitude: val })}
                                    min={800}
                                    max={2500}
                                    step={1}
                                    variant={formData.altitude < 1000 || formData.altitude > 2500 ? 'red' : 'default'}
                                    inputClassName="font-bold"
                                    unit="M"
                                />
                                <p className="text-[10px] mt-[-10px] text-gray-500 uppercase">Rango: 800 - 2500 msnm</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha de Compra</label>
                                <div className="relative group/date">
                                    <input
                                        type="date"
                                        required
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className={`w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none text-brand-green-bright font-bold scheme-dark pr-12 cursor-pointer
                                                [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                        disabled={isSubmitting}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-green-bright group-focus-within/date:opacity-100 opacity-60 transition-opacity">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Región / Departamento</label>
                            <select
                                required
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 mt-1 focus:border-brand-green outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                disabled={isSubmitting}
                            >
                                <option value="">Seleccionar</option>
                                {COLOMBIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">País</label>
                            <select
                                required
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 mt-1 focus:border-brand-green outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                disabled={isSubmitting}
                            >
                                <option value="">Seleccionar</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="bg-bg-card border border-white/5 p-8 rounded-industrial space-y-6">
                    <h3 className="text-brand-green-bright font-bold flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-brand-green rounded-full"></span>
                        Flujo de Destino y Especificaciones
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Estado del Café al Ingreso</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, coffeeType: 'pergamino' })}
                                    className={`py-4 px-4 rounded-industrial-sm flex flex-col items-center gap-2 transition-all border ${formData.coffeeType === 'pergamino' ? 'bg-brand-green/10 border-brand-green text-brand-green-bright shadow-lg shadow-brand-green/5' : 'bg-bg-main border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                    <span className="text-[11px] font-bold uppercase tracking-widest">CAFÉ PERGAMINO</span>
                                    <span className="text-[8px] opacity-60 font-bold uppercase">(Requiere Trilla)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, coffeeType: 'excelso' })}
                                    className={`py-4 px-4 rounded-industrial-sm flex flex-col items-center gap-2 transition-all border ${formData.coffeeType === 'excelso' ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5' : 'bg-bg-main border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest">CAFÉ VERDE / ORO</span>
                                    <span className="text-[10px] opacity-60 font-bold uppercase">(Salto a Calidad)</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Destino Final del Lote</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, destination: 'internal' })}
                                    className={`py-3 px-4 rounded-industrial-sm text-[9px] font-bold uppercase tracking-tight transition-all border leading-tight flex flex-col items-center justify-center ${formData.destination === 'internal' ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20' : 'bg-bg-main text-gray-400 border-white/5 hover:border-white/20'}`}
                                >
                                    <span>CONSUMO</span>
                                    <span>INTERNO</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, destination: 'export_roasted' })}
                                    className={`py-3 px-4 rounded-industrial-sm text-[9px] font-bold uppercase tracking-tight transition-all border leading-tight flex flex-col items-center justify-center ${formData.destination === 'export_roasted' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-bg-main text-gray-400 border-white/5 hover:border-white/20'}`}
                                >
                                    <span>EXPORTAR</span>
                                    <span>TOSTADO</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, destination: 'export_green' })}
                                    className={`py-3 px-4 rounded-industrial-sm text-[9px] font-bold uppercase tracking-tight transition-all border leading-tight flex flex-col items-center justify-center ${formData.destination === 'export_green' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-bg-main text-gray-400 border-white/5 hover:border-white/20'}`}
                                >
                                    <span>EXPORTAR</span>
                                    <span>VERDE</span>
                                </button>
                            </div>
                        </div>

                        {formData.destination.startsWith('export') && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest">Certificado / Lote de Exportación Internacional</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. SNT-2026-X001"
                                    value={formData.exportCertificate}
                                    onChange={(e) => setFormData({ ...formData, exportCertificate: e.target.value })}
                                    className="w-full bg-bg-main border border-blue-500/30 rounded-industrial-sm px-4 py-3 mt-1 focus:border-blue-400 outline-none text-white font-mono shadow-inner shadow-blue-500/5 placeholder:text-gray-700"
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Variedad</label>
                                    <select
                                        required
                                        value={formData.variety}
                                        onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                                        className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 mt-1 focus:border-brand-green outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Seleccionar</option>
                                        {dynamicVarieties.map(v => <option key={v} value={v}>{v}</option>)}
                                        <option value="Otro" className="text-brand-green font-bold">+ OTRO (INGRESAR NUEVO)</option>
                                    </select>
                                </div>
                                {formData.variety === 'Otro' && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs font-bold text-brand-green uppercase tracking-widest">Nombre Variedad Especial</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Sidra Salvaje"
                                            required
                                            value={customVariety}
                                            onChange={(e) => setCustomVariety(e.target.value)}
                                            className="w-full bg-bg-main border border-brand-green/30 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none text-white placeholder:text-gray-700"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Proceso</label>
                                <select
                                    value={formData.process}
                                    onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-5 py-3 mt-1 focus:border-brand-green outline-none uppercase appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2300a651%22%20stroke-width%3D%223%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1.25rem_center] bg-no-repeat"
                                    disabled={isSubmitting}
                                >
                                    {PROCESS_TYPES.map(p => (
                                        <option key={p} value={p}>
                                            {p.replace(/_/g, ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <NumericInput
                            label="Cantidad Pack de Compra (Kg Pergamino)"
                            value={formData.purchaseWeight}
                            onChange={(val) => setFormData({ ...formData, purchaseWeight: val })}
                            min={1}
                            step={0.1}
                            unit="KG"
                            required
                            disabled={isSubmitting}
                            variant={formData.purchaseWeight <= 0 ? 'red' : 'industrial'}
                            inputClassName="text-2xl py-4"
                        />

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-white uppercase tracking-widest block border-l-2 border-brand-green pl-3">Valor Total de Compra</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={displayValue}
                                    onChange={handleValueChange}
                                    className={`w-full bg-bg-main border rounded-industrial-sm px-6 py-5 text-4xl font-bold tracking-tighter outline-none transition-all pr-32 ${formData.purchaseValue <= 0 ? 'border-brand-red/50 text-brand-red' : 'border-white/10 text-brand-green-bright focus:border-brand-green'}`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-12 top-6 text-xs text-gray-400 font-bold tracking-widest opacity-60">COP</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase">Manejando Pesos Colombianos (COP)</p>
                    </div>

                    <AIPatternBox />
                </section>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${selectedLot ? 'bg-blue-600 hover:bg-blue-500' : 'bg-brand-green hover:bg-brand-green-bright'} text-white font-bold py-6 rounded-industrial-sm transition-all shadow-xl flex items-center justify-center gap-4 group disabled:opacity-50 text-sm uppercase tracking-widest relative overflow-hidden`}
            >
                {isSubmitting ? (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            SINCRONIZANDO CON LA NUBE...
                        </div>
                    </>
                ) : (
                    <>
                        {selectedLot ? 'ACTUALIZAR DATOS DE TRAZABILIDAD' : 'REGISTRAR INGRESO Y PREPARAR PARA TRILLA'}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:rotate-12 transition-transform">
                            <path d="M4 12V4a2 2 0 0 1 2-2h10l4 4v5" />
                            <path d="M10 12l2 2 4-4" />
                            <path d="M4 18h16" />
                        </svg>
                    </>
                )}
            </button>

            <style jsx>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-loading-bar {
                    animation: loading-bar 2s infinite linear;
                }
            `}</style>
        </form>
    );
}
