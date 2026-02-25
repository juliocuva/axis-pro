import React, { useState, useEffect } from 'react';
import { CoffeeVariety, ProcessType } from '@/shared/types';
import { createCoffeePurchase } from '../actions/purchase';

const COFFEE_VARIETIES: CoffeeVariety[] = [
    'Castillo', 'Caturra', 'Colombia', 'Tabi', 'Bourbon',
    'Geisha', 'Typica', 'Maragogype', 'Pacamara', 'Sidra',
    'Wush Wush', 'Java', 'SL28', 'Pink Bourbon', 'Laurina',
    'Mundo Novo', 'Cenicafe 1', 'Papayo', 'Chiroso'
];

const PROCESS_TYPES: ProcessType[] = ['washed', 'honey', 'natural', 'semi-washed'];

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
    const initialFormState = {
        farmerName: '',
        farmName: '',
        altitude: 1600,
        country: 'Colombia',
        region: '',
        variety: '' as CoffeeVariety,
        process: 'washed' as ProcessType,
        purchaseWeight: 0,
        purchaseValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        lotNumber: `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
        destination: 'internal' as 'internal' | 'export_green' | 'export_roasted',
        exportCertificate: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isEditingLot, setIsEditingLot] = useState(false);
    const [displayValue, setDisplayValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [expectedYield, setExpectedYield] = useState<number>(0);

    useEffect(() => {
        if (selectedLot) {
            setFormData({
                farmerName: selectedLot.farmer_name || '',
                farmName: selectedLot.farm_name || '',
                altitude: selectedLot.altitude || 1600,
                country: selectedLot.country || 'Colombia',
                region: selectedLot.region || '',
                variety: (selectedLot.variety as CoffeeVariety) || '',
                process: (selectedLot.process as ProcessType) || 'washed',
                purchaseWeight: Number(selectedLot.purchase_weight) || 0,
                purchaseValue: Number(selectedLot.purchase_value) || 0,
                purchaseDate: selectedLot.purchase_date || new Date().toISOString().split('T')[0],
                lotNumber: selectedLot.lot_number || `AX-${Math.floor(Math.random() * 9000 + 1000)}`,
                destination: (selectedLot.destination as 'internal' | 'export_green' | 'export_roasted') || 'internal',
                exportCertificate: selectedLot.export_certificate || ''
            });
            setDisplayValue(formatCOP(String(selectedLot.purchase_value || 0)));
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
            const result = await createCoffeePurchase({
                ...formData,
                companyId: user?.companyId || '99999999-9999-9999-9999-999999999999'
            });

            if (!result.success) {
                setStatus({ type: 'error', message: result.message });
            } else {
                setStatus({ type: 'success', message: result.message });
                setShowSuccessModal(true);

                // Cleanup form and reset for dynamic demo
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
        const message = patterns[formData.variety as string] || patterns.default;

        return (
            <div className="mt-4 p-6 bg-brand-green/5 border border-brand-green/20 rounded-industrial-sm transition-all duration-500 animate-in fade-in slide-in-from-right-4">
                <div className="p-6 bg-white/2 border border-white/5 rounded-industrial-sm mb-4">
                    <p className="text-[10px] text-gray-400 uppercase mb-3 font-bold tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></span>
                        Patrón de Éxito Identificado (AXIS AI)
                    </p>
                    <p className="text-sm font-medium leading-relaxed">
                        "{message}"
                    </p>
                </div>
                <div className="flex justify-between items-center px-2">
                    <p className="text-[9px] text-gray-500 uppercase font-bold opacity-70 tracking-tight">Rendimiento Estimado: {expectedYield.toFixed(2)} KG Excelso</p>
                    <span className="text-[8px] text-brand-green font-mono">Probabilidad: 94.2%</span>
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
                            className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-4 rounded-industrial-sm transition-all uppercase tracking-widest text-xs shadow-lg shadow-brand-green/20 active:scale-95"
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

                    <div className="flex flex-col items-center justify-center p-8 bg-bg-main border border-white/5 rounded-industrial-sm group">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Identificador de Lote</p>
                        <div className="flex items-center gap-4">
                            <span className="text-4xl font-bold tracking-tighter text-white group-hover:text-brand-green-bright transition-colors uppercase">
                                {formData.lotNumber}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre del Caficultor</label>
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
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre de la Finca</label>
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
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Altura (msnm)</label>
                                <input
                                    type="number"
                                    min="800"
                                    max="2500"
                                    value={formData.altitude}
                                    onChange={(e) => setFormData({ ...formData, altitude: parseInt(e.target.value) })}
                                    className={`w-full bg-bg-main border rounded-industrial-sm px-4 py-3 mt-1 outline-none transition-all ${formData.altitude < 800 || formData.altitude > 2500 ? 'border-brand-red/50 text-brand-red' : 'border-white/10 focus:border-brand-green'}`}
                                    disabled={isSubmitting}
                                />
                                <p className="text-[8px] mt-1 text-gray-500 uppercase">Rango: 800 - 2500 msnm</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fecha de Compra</label>
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
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Región / Departamento</label>
                            <select
                                required
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                disabled={isSubmitting}
                            >
                                <option value="">Seleccionar</option>
                                {COLOMBIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">País</label>
                            <select
                                required
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none"
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

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Destino Final del Lote</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, destination: 'internal' })}
                                    className={`py-3 px-4 rounded-industrial-sm text-[9px] font-bold uppercase tracking-tight transition-all border ${formData.destination === 'internal' ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20' : 'bg-bg-main text-gray-400 border-white/5 hover:border-white/20'}`}
                                >
                                    Consumo Interno
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, destination: 'export_roasted' })}
                                    className={`py-3 px-4 rounded-industrial-sm text-[9px] font-bold uppercase tracking-tight transition-all border ${formData.destination === 'export_roasted' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-bg-main text-gray-400 border-white/5 hover:border-white/20'}`}
                                >
                                    Exportar Tostado
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, destination: 'export_green' })}
                                    className={`py-3 px-4 rounded-industrial-sm text-[9px] font-bold uppercase tracking-tight transition-all border ${formData.destination === 'export_green' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-bg-main text-gray-400 border-white/5 hover:border-white/20'}`}
                                >
                                    Exportar Verde
                                </button>
                            </div>
                        </div>

                        {formData.destination.startsWith('export') && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Certificado / Lote de Exportación Internacional</label>
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
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Variedad</label>
                                <select
                                    required
                                    value={formData.variety}
                                    onChange={(e) => setFormData({ ...formData, variety: e.target.value as CoffeeVariety })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none"
                                    disabled={isSubmitting}
                                >
                                    <option value="">Seleccionar</option>
                                    {COFFEE_VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Proceso</label>
                                <select
                                    value={formData.process}
                                    onChange={(e) => setFormData({ ...formData, process: e.target.value as ProcessType })}
                                    className="w-full bg-bg-main border border-white/10 rounded-industrial-sm px-4 py-3 mt-1 focus:border-brand-green outline-none uppercase"
                                    disabled={isSubmitting}
                                >
                                    {PROCESS_TYPES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cantidad Pack de Compra (Kg Pergamino)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.purchaseWeight || ''}
                                    placeholder="0.0"
                                    onChange={(e) => setFormData({ ...formData, purchaseWeight: parseFloat(e.target.value) || 0 })}
                                    className={`w-full bg-bg-main border rounded-industrial-sm px-4 py-3 mt-1 outline-none pr-20 text-2xl font-bold transition-all ${formData.purchaseWeight <= 0 ? 'border-brand-red/50 text-brand-red' : 'border-white/10 focus:border-brand-green'}`}
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-10 top-5 text-gray-500 font-bold opacity-60">KG</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-white uppercase tracking-widest block border-l-2 border-brand-green pl-3">Valor Total de Compra</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={displayValue}
                                    onChange={handleValueChange}
                                    className={`w-full bg-bg-main border rounded-industrial-sm px-6 py-5 text-4xl font-bold tracking-tighter outline-none transition-all pr-32 ${formData.purchaseValue <= 0 ? 'border-brand-red/50 text-brand-red' : 'border-white/10 text-brand-green-bright focus:border-brand-green'}`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-12 top-6 text-[10px] text-gray-500 font-bold tracking-widest opacity-60">COP</span>
                            </div>
                        </div>
                        <p className="text-[8px] text-gray-500 mt-1 uppercase">Manejando Pesos Colombianos (COP)</p>
                    </div>

                    <AIPatternBox />
                </section>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-green hover:bg-brand-green-bright text-white font-bold py-5 rounded-industrial-sm transition-all shadow-xl shadow-brand-green/20 flex items-center justify-center gap-4 group disabled:opacity-50 text-[10px] uppercase tracking-widest relative overflow-hidden"
            >
                {isSubmitting ? (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            REGISTRANDO EN LA NUBE...
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 bg-white/20 animate-loading-bar w-full"></div>
                    </>
                ) : (
                    <>
                        REGISTRAR INGRESO Y PREPARAR PARA TRILLA
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
