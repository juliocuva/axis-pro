import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import AxisNexusWidget from '@/shared/components/ai/AxisNexusWidget';
import Footer from '@/shared/components/layout/Footer';

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat"
});

export const metadata: Metadata = {
    title: "AXIS COFFEE PRO | Coffee Intelligence Layer",
    description: "Sistema Avanzado de Control Operacional para Tostadoras",
    icons: {
        icon: "/logo ico.png",
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={montserrat.variable}>
            <body className={`${montserrat.className} flex flex-col min-h-screen`}>
                <main className="flex-1 flex flex-col">
                    {children}
                </main>
                <Footer />
                <AxisNexusWidget />
            </body>
        </html>
    );
}
