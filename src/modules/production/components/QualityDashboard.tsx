'use client';

import React from 'react';
import ExportReportButton from '@/shared/components/ui/ExportReportButton';

interface QualityMetricProps {
    label: string;
    master: string | number;
    current: string | number;
    unit?: string;
    deviation?: number;
}

const QualityMetric = ({ label, master, current, unit, deviation }: QualityMetricProps) => {
    const isOk = deviation === undefined || Math.abs(deviation) < 5;

    return (
        <div className="flex items-center justify-between p-4 bg-bg-main rounded-industrial-sm border border-gray-400 shadow-sm group hover:border-gray-400 shadow-sm transition-all">
            <div className="flex flex-col">
                <span className="text-[11px] text-gray-900 uppercase font-mono ">{label}</span>
                <span className="text-sm font-bold mt-1 text-gray-200">{current} {unit}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[11px] text-gray-900 uppercase font-mono">Maestro</p>
                    <p className="text-xs font-medium text-brand-navy">{master} {unit}</p>
                </div>
                {deviation !== undefined && (
                    <div className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono ${isOk ? 'bg-white text-brand-navy-bright' : 'bg-brand-red/10 text-brand-red-bright'}`}>
                        {deviation > 0 ? '+' : ''}{deviation}%
                    </div>
                )}
            </div>
        </div>
    );
};

export default function QualityDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <div id="quality-report-area">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
                    {/* Comparison Analysis */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-bg-card border border-gray-400 shadow-sm p-8 rounded-industrial relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-brand-green-bright"></div>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    Monitor de Consistencia
                                    <span className="bg-white border border-gray-400 shadow-sm text-brand-navy-bright text-[11px] px-2 py-1 rounded-full uppercase ">En Vivo</span>
                                </h3>
                                <p className="text-xs text-gray-900 font-mono">Lot: AX-9432 • Perfil: Supremo-DXB</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <QualityMetric label="Tiempo de Desarrollo" master="02:30" current="02:38" deviation={5.3} />
                                <QualityMetric label="Temperatura de Carga" master="210" current="212" unit="°C" deviation={0.9} />
                                <QualityMetric label="Humedad Final" master="11.2" current="11.8" unit="%" deviation={5.3} />
                                <QualityMetric label="Pérdida (Yield)" master="15.5" current="16.2" unit="%" deviation={4.5} />
                            </div>

                            <div className="mt-8 p-6 bg-brand-red/5 border border-brand-red/20 rounded-industrial-sm flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red-bright">⚠️</div>
                                <div>
                                    <p className="text-sm font-bold text-brand-red-bright">Desviación en Fase de Desarrollo</p>
                                    <p className="text-xs text-brand-navy mt-1">El tiempo de desarrollo excedió el perfil maestro por 8 segundos. Se recomienda ajustar el flujo de aire al minuto 8.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Color Analysis */}
                    <div className="space-y-6">
                        <div className="bg-bg-card border border-gray-400 shadow-sm p-8 rounded-industrial relative">
                            <h3 className="text-brand-navy-bright font-bold mb-6 uppercase text-xs ">Análisis Cromatográfico</h3>

                            <div className="space-y-6">
                                <div className="flex flex-col items-center">
                                    <div className="w-full h-24 rounded-industrial-sm bg-gradient-to-r from-[#4d3319] via-[#3d2914] to-[#2d1e0f] border border-gray-400 shadow-sm shadow-inner flex items-center justify-center">
                                        <span className="text-2xl font-bold text-brand-navy/20 er">AGTRON</span>
                                    </div>
                                    <div className="w-full flex justify-between mt-3 px-2">
                                        <div className="text-center">
                                            <p className="text-[11px] text-gray-900 uppercase">Grano</p>
                                            <p className="text-lg font-bold">58.2</p>
                                        </div>
                                        <div className="h-8 w-px bg-white"></div>
                                        <div className="text-center">
                                            <p className="text-[11px] text-gray-900 uppercase">Molido</p>
                                            <p className="text-lg font-bold">64.5</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] text-brand-navy uppercase font-bold">
                                        <span>Light Roast</span>
                                        <span>Dark Roast</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-bg-main rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-green-bright w-[65%] rounded-full shadow-[0_0_10px_rgba(0,166,81,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-bg-card border border-gray-400 shadow-sm p-6 rounded-industrial-sm">
                            <p className="text-[11px] text-gray-900 uppercase font-mono mb-2">Sello Digial de Calidad</p>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white border border-gray-400 shadow-sm rounded flex items-center justify-center text-brand-navy-bright text-[9px]">QR</div>
                                <p className="text-[9px] text-brand-navy leading-tight">Autenticado por el Motor de Inteligencia AXIS COFFEE PRO v2.0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ExportReportButton elementId="quality-report-area" fileName="AXIS-QUALITY-REPORT-9432" />
        </div>
    );
}

