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
    const handleIncrement = () => {
        if (disabled) return;
        const currentVal = typeof value === 'string' ? parseFloat(value) || 0 : value;
        const newVal = currentVal + step;
        if (max !== undefined && newVal > max) return;
        // Si el valor es pequeño, toFixed(2) podría agregar ceros de más a la vista, usamos Number para quitar trailing zeros, 
        // pero almacenamos como string para evitar el salto del cursor
        onChange(String(Number(newVal.toFixed(2))));
    };

    const handleDecrement = () => {
        if (disabled) return;
        const currentVal = typeof value === 'string' ? parseFloat(value) || 0 : value;
        const newVal = currentVal - step;
        if (min !== undefined && newVal < min) return;
        onChange(String(Number(newVal.toFixed(2))));
    };

    const variantStyles = {
        default: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black',
        industrial: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black',
        blue: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black',
        red: 'border-brand-red/50 bg-white text-brand-red focus:border-brand-red',
        orange: 'border-gray-400 shadow-sm bg-white text-brand-navy focus:border-black'
    };

    const arrowColor = {
        default: 'text-brand-navy',
        industrial: 'text-brand-navy',
        blue: 'text-brand-navy-bright',
        red: 'text-brand-red',
        orange: 'text-brand-navy-bright'
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="text-[11px] font-bold text-brand-green uppercase flex items-center gap-1.5 mb-1">
                    <span className="w-0.5 h-2.5 bg-brand-green rounded-full"></span>
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
                    className={`block w-full border rounded-industrial-sm px-4 py-3 outline-none font-bold transition-all pr-14 ${variantStyles[variant]} ${inputClassName} placeholder:text-brand-navy/40 placeholder:font-medium`}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2"
                    style={{ right: '16px' }}
                >
                    <div className="flex flex-col border-l border-gray-400 shadow-sm pl-3">
                        <button
                            type="button"
                            onClick={handleIncrement}
                            disabled={disabled}
                            className={`p-1 hover:brightness-125 transition-all ${arrowColor[variant]}`}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 15l-6-6-6 6" /></svg>
                        </button>
                        <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={disabled}
                            className={`p-1 hover:brightness-125 transition-all ${arrowColor[variant]}`}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M6 9l6 6 6-6" /></svg>
                        </button>
                    </div>
                    {unit && (
                        <span className="text-brand-navy font-black text-[11px] er w-4 text-center">{unit}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
