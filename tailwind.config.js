/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-montserrat)", "sans-serif"],
                mono: ["var(--font-montserrat)", "monospace"],
            },
            fontWeight: {
                extrabold: '700',
                black: '700',
            },
            letterSpacing: {
                tighter: "-0.05em",
                tight: "-0.025em",
                normal: "0",
                wide: "0.025em",
                wider: "0.05em",
                widest: "0.1em",
                "ultra-wide": "0.4em",
            },
            colors: {
                brand: {
                    green: "#006056",
                    navy: "#001430",
                    gray: "#d1d3d4",
                },
                carbon: "#1A1A1A",
                "soft-white": "#F8FAF9",
                bg: {
                    main: "rgb(var(--bg-main))",
                    card: "rgb(var(--bg-card))",
                    "card-hover": "rgb(var(--bg-card-hover))",
                    offset: "var(--bg-offset)",
                },
                border: {
                    main: "var(--border-main)",
                },
            },
            borderRadius: {
                'industrial': '1.25rem',
                'industrial-sm': '0.75rem',
            }
        },
    },
    plugins: [],
}
