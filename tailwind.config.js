/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {},
    colors: {
      "primary": {
        "800": "#262b67",
        "700": "#293ea5",
        "600": "#3a53d6",
        "500": "#586bf9",
        "400": "#8286ff",
        "300": "#a6a3ff",
        "200": "#c5c1ff",
        "100": "#e3e0ff"
      },
      "success": {
        "800": "#00390d",
        "700": "#005317",
        "600": "#006e21",
        "500": "#008a2c",
        "400": "#19a73c",
        "300": "#50c15d",
        "200": "#8dd88f",
        "100": "#beefbd"
      },
      "danger": {
        "800": "#591921",
        "700": "#8f012c",
        "600": "#ba003c",
        "500": "#e02750",
        "400": "#f7556b",
        "300": "#ff858e",
        "200": "#ffb2b3",
        "100": "#ffd9d9"
      },
      "neutral": {
        "800": "#302f3a",
        "700": "#474554",
        "600": "#5e5c71",
        "500": "#77758b",
        "400": "#918f9d",
        "300": "#ababb1",
        "200": "#c6c6c9",
        "100": "#e2e2e3"
      }
    }
  },
  plugins: [],
}

