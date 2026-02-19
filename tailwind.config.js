/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    green: "#006837",
                    "green-bright": "#00a651",
                    red: "#a31e22",
                    "red-bright": "#ed1c24",
                },
                bg: {
                    main: "#050706",
                    card: "#0f1411",
                    "card-hover": "#161d19",
                }
            },
        },
    },
    plugins: [],
}
