import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";



import Footer from '@/shared/components/layout/Footer';
import { LanguageProvider } from '@/shared/context/LanguageContext';

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800", "900"],
    variable: "--font-montserrat"
});

export const metadata: Metadata = {
    title: "AXISONE COFFEE | Coffee Intelligence Layer",

    description: "Sistema Avanzado de Control Operacional para Tostadoras",
    icons: {
        icon: "/logo ico.png",
    },
    verification: {
        google: "so77i51nRuLTdq59AMqldJAocC2g-58d1Bi0JHNU670",
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
                    <LanguageProvider>
                        {children}
                    </LanguageProvider>
                </main>
                <Footer />
                <Analytics />
            </body>

        </html>
    );
}
