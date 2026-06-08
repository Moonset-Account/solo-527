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
        factory: {
          bg: "#2D1B0E",
          accent: "#C45D2C",
          green: "#4A7C59",
          cream: "#E8DCC8",
          gold: "#D4A84B",
          red: "#C44B4B",
          dark: "#1a1008",
          panel: "#3a2518",
          border: "#8B7355",
          rivet: "#6B5B3A",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        terminal: ['"VT323"', "monospace"],
      },
      animation: {
        pulseBottleneck: "pulse 1s ease-in-out infinite",
        slideIn: "slideIn 0.3s ease-out",
        stampIn: "stampIn 0.3s ease-out",
        gearSpin: "gearSpin 4s linear infinite",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        stampIn: {
          "0%": { transform: "scale(2) rotate(-10deg)", opacity: "0" },
          "50%": { transform: "scale(0.9) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        gearSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};
