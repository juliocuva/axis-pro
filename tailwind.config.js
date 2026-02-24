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
                tighter: "-0.05em",
                tight: "-0.025em",
                wide: "0.05em",
                widest: "0.1em",
                "ultra-wide": "0.3em",
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
                }
            },
        },
    },
    plugins: [],
}
