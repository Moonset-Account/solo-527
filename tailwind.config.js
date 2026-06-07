/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          dark: "#0A1628",
          DEFAULT: "#0A1628",
        },
        secondary: {
          bg: "#1E293B",
          DEFAULT: "#1E293B",
        },
        accent: {
          cyan: "#00E5CC",
          DEFAULT: "#00E5CC",
        },
        anomaly: {
          orange: "#FF6B35",
          DEFAULT: "#FF6B35",
        },
        secondaryAccent: {
          blue: "#3B82F6",
          DEFAULT: "#3B82F6",
        },
        success: {
          green: "#10B981",
          DEFAULT: "#10B981",
        },
        warning: {
          yellow: "#F59E0B",
          DEFAULT: "#F59E0B",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Noto Sans SC", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
