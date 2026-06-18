'use client';

import React from 'react';

interface ModuleHeaderProps {
    title: string;
    subtitle: string;
    children?: React.ReactNode;
}

export default function ModuleHeader({ title, subtitle, children }: ModuleHeaderProps) {
    if (!children) return null;

    return (
        <header className="mb-2 flex justify-end items-center">
            <div className="flex items-center gap-4">
                {children}
            </div>
        </header>
    );
}
