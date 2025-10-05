import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wapify: {
          bg: "#F5F3EF",
          panel: "#FDFCFA",
          border: "#E8E3DA",
          text: "#2C1810",
          "text-secondary": "#7A6E65",
          accent: "#CC785C",
          "accent-dark": "#A6654A",
        },
      },
    },
  },
  plugins: [],
};
export default config;
