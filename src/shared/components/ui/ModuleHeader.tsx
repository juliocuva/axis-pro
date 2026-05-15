'use client';

import React from 'react';

interface ModuleHeaderProps {
    title: string;
    subtitle: string;
    children?: React.ReactNode;
}

export default function ModuleHeader({ title, subtitle, children }: ModuleHeaderProps) {
    return (
        <header className="mb-12 flex justify-between items-center border-b border-gray-400 shadow-sm pb-10">
            <div className="flex items-center gap-5">
                <span className="w-2 h-14 bg-black rounded-full"></span>
                <div>
                    <h1 className="text-4xl font-black text-black uppercase ">{title}</h1>
                    <p className="text-[11px] text-gray-500 font-bold uppercase  mt-2 tracking-tight">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {children}
            </div>
        </header>
    );
}
