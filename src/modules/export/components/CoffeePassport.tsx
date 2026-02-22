'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface CoffeePassportProps {
    lotData: any;
    scaData?: any;
    roastData?: any;
    degassingData?: any;
    onClose: () => void;
}

export default function CoffeePassport({ lotData, scaData, roastData, degassingData, onClose }: CoffeePassportProps) {
    // Datos simulados para demo si no vienen
    const radarData = [
        { subject: 'Fragrance', A: scaData?.fragrance_aroma || 8.5, fullMark: 10 },
        { subject: 'Flavor', A: scaData?.flavor || 8.25, fullMark: 10 },
        { subject: 'Aftertaste', A: scaData?.aftertaste || 8.0, fullMark: 10 },
        { subject: 'Acidity', A: scaData?.acidity || 8.5, fullMark: 10 },
        { subject: 'Body', A: scaData?.body || 8.0, fullMark: 10 },
        { subject: 'Balance', A: scaData?.balance || 8.25, fullMark: 10 },
    ];

    const passportId = `AX-${lotData.batch_id || '9822'}-${new Date().getFullYear()}`;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
            <div className="bg-bg-card border border-white/10 w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-3xl flex flex-col md:flex-row relative">

                {/* Botón Cerrar */}
                <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white z-20">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>

                {/* Lateral: Identidad Visual */}
                <div className="w-full md:w-1/3 bg-bg-main p-12 flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-green blur-[100px] rounded-full"></div>
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-green/20">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Coffee<br />Passport</h2>
                            <p className="text-[10px] text-brand-green font-bold uppercase tracking-[0.4em] mt-2">Certified by AXIS Trade</p>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Passport ID</p>
                            <p className="text-xl font-mono text-white font-bold">{passportId}</p>
                        </div>
                        <div className="flex justify-center">
                            {/* QR Placeholder */}
                            <div className="w-32 h-32 bg-white p-2 rounded-xl">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://axis-coffee.pro/verify/${passportId}`} alt="QR Verification" />
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest">Escaneé para Trazabilidad On-Chain</p>
                    </div>
                </div>

                {/* Contenido Principal: Data Analítica */}
                <div className="flex-1 p-12 overflow-y-auto max-h-[90vh] md:max-h-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                        {/* Sección A: Perfil Sensorial */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                                Análisis Sensorial SCA
                            </h3>
                            <div className="h-64 bg-bg-main/50 rounded-3xl border border-white/5 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#333" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
                                        <Radar name="Sensory" dataKey="A" stroke="#00ff88" fill="#00ff88" fillOpacity={0.2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <span className="text-xs text-gray-500 uppercase font-bold">Puntaje Total</span>
                                <span className="text-4xl font-black text-white tracking-tighter">84.50</span>
                            </div>
                        </div>

                        {/* Sección B: Especificaciones de Origen */}
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Especificaciones de Lote
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                                        <p className="text-[9px] text-gray-500 uppercase mb-1">Variedad</p>
                                        <p className="text-sm font-bold text-white uppercase">Caturra / Colombia</p>
                                    </div>
                                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                                        <p className="text-[9px] text-gray-500 uppercase mb-1">Proceso</p>
                                        <p className="text-sm font-bold text-white uppercase">Natural EF</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase mb-1">Humedad de Exportación</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xl font-black text-white">11.2%</p>
                                        <span className="text-[8px] bg-brand-green/20 text-brand-green px-2 py-0.5 rounded font-black uppercase">Óptimo</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase mb-1">Predictor CO2 (Global Trade)</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-white font-mono uppercase">Estable para Tránsito</p>
                                        <span className="text-[10px] text-blue-400 font-black">20 Días Seguros</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Acciones PDF */}
                    <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <span className="w-3 h-3 rounded-full bg-brand-green animate-pulse"></span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Documento Protegido por Axis Cryptofolio</span>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button className="flex-1 md:flex-none px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Compartir Digital</button>
                            <button className="flex-1 md:flex-none px-12 py-4 bg-brand-green hover:bg-brand-green-bright text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-green/20 transition-all">Exportar PDF Oficial</button>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
