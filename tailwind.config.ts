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
        "slate-950": "#020617",
        "slate-900": "#0F172A",
        "slate-800": "#1E293B",
        "slate-700": "#334155",
        "slate-600": "#475569",
        "slate-500": "#64748B",
        "slate-400": "#94A3B8",
        "slate-300": "#CBD5E1",
        "slate-200": "#E2E8F0",
        "slate-100": "#F1F5F9",
        "slate-50": "#F8FAFC",

        "brand-500": "#2563EB",
        "brand-600": "#1D4ED8",
        "brand-700": "#1E40AF",

        "success-500": "#10B981",
        "success-600": "#059669",

        "warning-500": "#F97316",
        "warning-600": "#EA580C",

        "danger-500": "#EF4444",
        "danger-600": "#DC2626",

        "info-500": "#3B82F6",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink": "blink 1s step-end infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
