import React from 'react';

interface NumericInputProps {
    label?: string;
    value: number | string;
    onChange: (val: number) => void;
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
    variant = 'industrial'
}) => {
    const handleIncrement = () => {
        if (disabled) return;
        const currentVal = typeof value === 'string' ? parseFloat(value) || 0 : value;
        const newVal = currentVal + step;
        if (max !== undefined && newVal > max) return;
        onChange(Number(newVal.toFixed(2)));
    };

    const handleDecrement = () => {
        if (disabled) return;
        const currentVal = typeof value === 'string' ? parseFloat(value) || 0 : value;
        const newVal = currentVal - step;
        if (min !== undefined && newVal < min) return;
        onChange(Number(newVal.toFixed(2)));
    };

    const variantStyles = {
        default: 'border-white/10 text-white focus:border-brand-green',
        industrial: 'border-white/10 text-brand-green-bright focus:border-brand-green',
        blue: 'border-blue-500/50 text-blue-400 focus:border-blue-400',
        red: 'border-brand-red/50 text-brand-red focus:border-brand-red',
        orange: 'border-orange-500/50 text-orange-400 focus:border-orange-500'
    };

    const arrowColor = {
        default: 'text-brand-green',
        industrial: 'text-brand-green',
        blue: 'text-blue-400',
        red: 'text-brand-red',
        orange: 'text-orange-400'
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    type="number"
                    required={required}
                    min={min}
                    max={max}
                    step={step}
                    value={value || ''}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className={`w-full bg-bg-main border rounded-industrial-sm px-4 py-3 outline-none font-bold transition-all pr-24 ${variantStyles[variant]} ${inputClassName} [appearance:none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="flex flex-col border-l border-white/10 pl-3">
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
