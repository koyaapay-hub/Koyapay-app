import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0F1B2D",
        "navy-2": "#16273D",
        paper: "#FBF9F5",
        "paper-2": "#F1EDE4",
        ink: "#14213D",
        "ink-soft": "#5B6472",
        green: "#2FAF64",
        "green-deep": "#1F8A4C",
        "green-bg": "#E4F5EA",
        danger: "#B23B3B",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Sora", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
