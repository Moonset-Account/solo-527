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
        primary: {
          50: "#E8EEF6",
          100: "#C8D5E8",
          200: "#9BB3D1",
          300: "#6E91BA",
          400: "#476FA3",
          500: "#1E3A5F",
          600: "#1A3351",
          700: "#152A42",
          800: "#102033",
          900: "#0B1724",
        },
        accent: {
          50: "#FBF5E7",
          100: "#F5E4BC",
          200: "#EED18A",
          300: "#E7BE58",
          400: "#DDB037",
          500: "#D4A853",
          600: "#B8903E",
          700: "#977431",
          800: "#765925",
          900: "#553F19",
        },
        success: {
          50: "#E8F5EF",
          500: "#10B981",
          600: "#059669",
        },
        warning: {
          50: "#FFF7ED",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          50: "#FEF2F2",
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Noto Sans SC", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(30, 58, 95, 0.08), 0 1px 2px rgba(30, 58, 95, 0.04)",
        "card-hover": "0 10px 25px rgba(30, 58, 95, 0.10), 0 4px 10px rgba(30, 58, 95, 0.06)",
        sidebar: "2px 0 8px rgba(30, 58, 95, 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
