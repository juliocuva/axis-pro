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
            letterSpacing: {
                tighter: "0.0em",
                tight: "0.0em",
                wide: "0.0em",
                widest: "0.0m",
                "ultra-wide": "0.0em",
            },
            colors: {
                brand: {
                    green: "#006837",
                    "green-bright": "#00a651",
                    red: "#a31e22",
                    "red-bright": "#ed1c24",
                },
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
