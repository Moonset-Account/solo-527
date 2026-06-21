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
        "deep-blue": {
          50: "#F0F4FA",
          100: "#D9E3F0",
          200: "#B3C7E0",
          300: "#80A0C6",
          400: "#4D719B",
          500: "#2E4F7A",
          600: "#1E3A5F",
          700: "#172D4A",
          800: "#102034",
          900: "#0A1422",
        },
        "ink-gold": {
          50: "#FAF5E8",
          100: "#F2E6C4",
          200: "#E6CC88",
          300: "#D9AE4C",
          400: "#C69722",
          500: "#B8860B",
          600: "#9A6E09",
          700: "#7A5807",
          800: "#5A4105",
          900: "#3D2C03",
        },
        "alert-red": "#E53935",
        "success-green": "#43A047",
        "warn-orange": "#FB8C00",
        "bg-surface": "#F5F7FA",
      },
      fontFamily: {
        serif: ["'Noto Serif SC'", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(30, 58, 95, 0.08), 0 1px 2px -1px rgba(30, 58, 95, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(30, 58, 95, 0.12), 0 4px 6px -4px rgba(30, 58, 95, 0.10)",
        "gold-line": "inset 0 1px 0 0 rgba(184, 134, 11, 0.25)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(229, 57, 53, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(229, 57, 53, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "breathe-red": "breathe 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      backgroundImage: {
        "topbar-gradient": "linear-gradient(90deg, #1E3A5F 0%, #172D4A 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
