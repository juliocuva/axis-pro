import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import Footer from '@/shared/components/layout/Footer';

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat"
});

export const metadata: Metadata = {
    title: "AXISONE COFFEE | Coffee Intelligence Layer",

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
        <html lang="es" className={montserrat.variable} suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('axis-theme');
                  if (!theme) theme = 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
                    }}
                />
            </head>
            <body className={`${montserrat.className} flex flex-col min-h-screen bg-bg-main text-text-main`}>
                <main className="flex-1 flex flex-col">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
