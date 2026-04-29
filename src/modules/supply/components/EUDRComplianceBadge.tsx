import React from 'react';

interface EUDRComplianceBadgeProps {
    lotData: any;
    className?: string;
}

export default function EUDRComplianceBadge({ lotData, className = "" }: EUDRComplianceBadgeProps) {
    if (!lotData?.is_europe_destination) return null;

    const polygon = lotData.process_data?.eudr_polygon;
    const hasPolygon = !!polygon;
    const coords = lotData.latitude && lotData.longitude ? `${lotData.latitude.toFixed(6)}, ${lotData.longitude.toFixed(6)}` : 'Sin GPS exacto';

    return (
        <div className={`bg-brand-green/5 border border-brand-green/30 rounded-industrial-sm p-4 flex items-center justify-between gap-4 ${className}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${hasPolygon ? 'bg-brand-green/20 border-brand-green/30 text-brand-green-bright' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                    </svg>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em]">Destino: Europa (EUDR)</h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                        {hasPolygon ? '✓ Polígono Georreferenciado' : '⚠ Falta Mapeo de Polígono'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Coordenadas Base</p>
                <p className="text-xs font-mono font-bold text-white tracking-tight">{coords}</p>
            </div>
        </div>
    );
}
