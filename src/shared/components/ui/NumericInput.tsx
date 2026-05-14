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
        default: 'border-carbon/20 bg-white text-carbon focus:border-brand-green',
        industrial: 'border-carbon/20 bg-white text-brand-green focus:border-brand-green',
        blue: 'border-brand-green/30 bg-white text-brand-green focus:border-brand-green',
        red: 'border-brand-red/50 bg-white text-brand-red focus:border-brand-red',
        orange: 'border-brand-green/50 bg-white text-brand-green focus:border-brand-green'
    };

    const arrowColor = {
        default: 'text-brand-green',
        industrial: 'text-brand-green',
        blue: 'text-brand-green-bright',
        red: 'text-brand-red',
        orange: 'text-brand-green-bright'
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
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
                    className={`block w-full border rounded-industrial-sm px-4 py-3 outline-none font-bold transition-all pr-14 ${variantStyles[variant]} ${inputClassName} placeholder:text-carbon/40 placeholder:font-normal`}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2"
                    style={{ right: '16px' }}
                >
                    <div className="flex flex-col border-l border-carbon/10 pl-3">
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
                        <span className="text-gray-500 font-bold opacity-60 text-[10px] tracking-tighter w-4 text-center">{unit}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
