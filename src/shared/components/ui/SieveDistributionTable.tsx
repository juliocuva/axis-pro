import React from 'react';
import { useLanguage } from '@/shared/context/LanguageContext';

export interface SieveData {
    m18: number;
    m17: number;
    m16: number;
    m15: number;
    m14: number;
    m13: number;
    m12: number;
    menores: number;
}

interface SieveDistributionTableProps {
    data: SieveData;
    onChange: (data: SieveData) => void;
    isReadOnly?: boolean;
    isSubmitting?: boolean;
    onSync?: () => void;
    showSyncButton?: boolean;
    visibleSieves?: Array<keyof SieveData>;
}

export function SieveDistributionTable({ 
    data, 
    onChange, 
    isReadOnly = false, 
    isSubmitting = false,
    onSync,
    showSyncButton = false,
    visibleSieves
}: SieveDistributionTableProps) {
    const { t } = useLanguage();

    const meshSizes: { label: string; key: keyof SieveData }[] = [
        { label: 'Malla 18', key: 'm18' },
        { label: 'Malla 17', key: 'm17' },
        { label: 'Malla 16', key: 'm16' },
        { label: 'Malla 15', key: 'm15' },
        { label: 'Malla 14', key: 'm14' },
        { label: 'Malla 13', key: 'm13' },
        { label: 'Malla 12', key: 'm12' },
        { label: 'Fondo', key: 'menores' },
    ];

    const filteredMeshSizes = visibleSieves && visibleSieves.length > 0 
        ? meshSizes.filter(m => visibleSieves.includes(m.key))
        : meshSizes;

    // Filter data object to only sum the visible ones, so the balance calculation matches the UI
    const screenSum = filteredMeshSizes.reduce((sum, mesh) => sum + (Number(data[mesh.key]) || 0), 0);
    const isScreenValid = Math.abs(screenSum - 100) < 0.1;

    const handleInputChange = (sizeKey: keyof SieveData, value: string) => {
        onChange({
            ...data,
            [sizeKey]: parseFloat(value) || 0
        });
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-400 shadow-sm space-y-4 relative z-10">
            <div className="flex justify-between items-end border-b border-gray-400 shadow-sm pb-2">
                <h4 className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
                    {t('physicalAnalysisForm', 'sieveTitle')}
                </h4>
                <div className={`flex items-center gap-2 text-brand-navy`}>
                    <span className="text-[9px] font-bold uppercase opacity-60">
                        {t('physicalAnalysisForm', 'massBalance')}:
                    </span>
                    <span className="text-sm font-black er leading-none">{screenSum.toFixed(1)}%</span>
                    
                    {!isScreenValid && (
                        <span className="text-[9px] font-bold uppercase text-red-500 ml-2">
                            ADJUST REQUIRED (± {Math.abs(100 - screenSum).toFixed(1)}%)
                        </span>
                    )}

                    {!isReadOnly && showSyncButton && onSync && (
                        <button 
                            type="button"
                            onClick={onSync}
                            className="px-2 py-1 bg-black text-white rounded-industrial-sm hover:bg-black/80 transition-all flex items-center gap-1 text-[8px] font-bold uppercase shadow-sm ml-1"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                                <polyline points="21 3 21 8 16 8"/>
                            </svg>
                            SYNC
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {filteredMeshSizes.map((mesh, idx) => (
                    <div key={idx} className="space-y-1 flex-1 min-w-[60px]">
                        <label className="text-[9px] font-bold text-brand-navy uppercase block text-center">
                            {mesh.label}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                value={data[mesh.key] ?? 0}
                                onChange={(e) => handleInputChange(mesh.key, e.target.value)}
                                disabled={isSubmitting || isReadOnly}
                                className="w-full h-[30px] bg-transparent border-b-2 border-zinc-300 px-0 py-1 text-xs font-bold text-brand-navy text-center outline-none focus:border-brand-green transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="absolute top-1/2 -translate-y-1/2 right-2 text-[8px] font-black text-gray-500 uppercase">%</span>
                        </div>
                        <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div 
                                className="h-full bg-brand-green transition-all duration-700" 
                                style={{ width: `${data[mesh.key]}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
