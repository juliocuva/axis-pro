'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import LotCertificate from '@/modules/supply/components/analysis/LotCertificate';

export default function ExportCertificatePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const id = params.id as string;
    const pagesParam = searchParams.get('pages');
    
    // Parse pages to print, default to all 4 pages if not specified
    const pagesToPrint = pagesParam 
        ? pagesParam.split(',').map(p => parseInt(p, 10)).filter(n => !isNaN(n)) 
        : [1, 2];

    // Minimal user object for the certificate
    const mockUser = {
        email: 'system_main@axis-oil.com',
        role: 'auditor',
        companyId: 'system'
    };

    return (
        <div className="w-full bg-white min-h-screen">
            <LotCertificate 
                inventoryId={id} 
                onClose={() => {}} 
                user={mockUser}
                isExportMode={true}
                pagesToPrint={pagesToPrint}
                onLoaded={() => {
                    if (searchParams.get('autoPrint') === 'true') {
                        setTimeout(() => window.print(), 500);
                    }
                }}
            />
        </div>
    );
}
