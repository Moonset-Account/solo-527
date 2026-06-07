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
          50: "#E8F3FF",
          100: "#B9D8FF",
          200: "#8BBCFF",
          300: "#5DA0FF",
          400: "#2E85FF",
          500: "#165DFF",
          600: "#0E42D2",
          700: "#0A2BA0",
          800: "#061A6E",
          900: "#030D3C",
        },
        success: {
          50: "#E8FFEA",
          100: "#B3FFB9",
          200: "#80F28B",
          300: "#4DD65D",
          400: "#1AB92E",
          500: "#009A2E",
          600: "#007A24",
          700: "#005B1A",
          800: "#003D11",
          900: "#001F08",
        },
        warning: {
          50: "#FFF3E8",
          100: "#FFD8B3",
          200: "#FFBC80",
          300: "#FFA14D",
          400: "#FF851A",
          500: "#FF7D00",
          600: "#CC6400",
          700: "#994B00",
          800: "#663200",
          900: "#331900",
        },
        danger: {
          50: "#FFECE8",
          100: "#FFC7B3",
          200: "#FFA280",
          300: "#FF7D4D",
          400: "#FF581A",
          500: "#F53F3F",
          600: "#CB2634",
          700: "#A1122A",
          800: "#77071F",
          900: "#4D0314",
        },
        neutral: {
          50: "#F7F8FA",
          100: "#E5E6EB",
          200: "#C9CDD4",
          300: "#86909C",
          400: "#4E5969",
          500: "#272E3B",
          600: "#1D2129",
          700: "#0F1218",
          800: "#08090D",
          900: "#040507",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 2px 12px 0 rgba(0, 0, 0, 0.08)",
        "card-hover": "0 6px 20px 0 rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
