import React from 'react';

interface NumericInputProps {
    label?: string;
    value: number | string;
    onChange: (val: any) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
    required?: boolean;
    variant?: 'default' | 'industrial' | 'blue' | 'red' | 'orange';
    formatThousands?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
    label,
    value,
    onChange,
    min = 0,
    max,
    step = 0.1,
    unit,
    placeholder = '0.0',
    className = '',
    inputClassName = '',
    disabled = false,
    required = false,
    variant = 'industrial',
    formatThousands = false
}) => {


    const variantStyles = {
        default: 'border-b border-brand-navy/30 bg-transparent text-brand-navy focus:border-brand-green rounded-none',
        industrial: 'border-b border-brand-navy/30 bg-transparent text-brand-navy focus:border-brand-green rounded-none',
        blue: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black',
        red: 'border-brand-red/50 bg-white text-brand-red focus:border-brand-red',
        orange: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black'
    };



    return (
        <div className={`space-y-0.5 ${className}`}>
            {label && (
                <label className="text-[11px] font-bold text-brand-navy uppercase flex items-center gap-1.5 mb-1">
                    
                    {label}
                </label>
            )}
            <div className="relative group w-full">
                <input
                    type="text"
                    inputMode="decimal"
                    required={required}
                    value={formatThousands && value !== undefined && value !== '' ? String(value).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") : (value !== undefined ? value : '')}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (formatThousands) {
                            // Strip dots (thousands separators)
                            val = val.replace(/\./g, '');
                            // Convert comma to dot for standard decimal format
                            val = val.replace(',', '.');
                            // Ensure only numbers and one dot
                            val = val.replace(/[^0-9.]/g, '');
                            const parts = val.split('.');
                            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                        } else {
                            val = val.replace(/[^0-9.,]/g, '');
                            val = val.replace(',', '.');
                        }
                        onChange(val);
                    }}
                    className={`w-full h-[30px] px-2 py-2 outline-none font-medium transition-all text-xs ${variantStyles[variant]} ${inputClassName} placeholder:text-gray-400 placeholder:font-light`}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2"
                    style={{ right: '12px' }}
                >
                    {unit && (
                        <span className="text-brand-navy font-black text-[11px] w-4 text-center">{unit}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
