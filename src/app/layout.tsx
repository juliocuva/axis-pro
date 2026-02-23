import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

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
            <body className={montserrat.className}>{children}</body>
        </html>
    );
}
