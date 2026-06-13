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
        primary: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#243b53",
          900: "#0F3460",
        },
        danger: {
          50: "#ffe3e8",
          100: "#ffb3c0",
          200: "#ff8096",
          300: "#ff4d6d",
          400: "#ff264a",
          500: "#E94560",
          600: "#d63850",
          700: "#c02b42",
          800: "#ab1f35",
          900: "#8a0f23",
        },
        success: {
          50: "#e6f7ee",
          100: "#b3e8cb",
          200: "#80d9a8",
          300: "#4dca85",
          400: "#26bf6d",
          500: "#21BF73",
          600: "#1aa864",
          700: "#148c54",
          800: "#0e7044",
          900: "#085434",
        },
        warning: {
          50: "#fff7e6",
          100: "#ffe8b3",
          200: "#ffd980",
          300: "#ffca4d",
          400: "#ffbf26",
          500: "#f5a623",
          600: "#d48e1c",
          700: "#b37615",
          800: "#925e0e",
          900: "#714607",
        },
      },
      fontFamily: {
        sans: ["Noto Sans SC", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
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
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
