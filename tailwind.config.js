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
        circuit: {
          bg: "#1a1a2e",
          bgLight: "#252547",
          board: "#0f0f1a",
          current: "#00d4ff",
          bulb: "#ffb347",
          resistor: "#d4a373",
          capacitor: "#c084fc",
          switchOn: "#4ade80",
          error: "#f87171",
          panel: "#16213e",
          border: "#2d3a5c",
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.15)",
        "neon-bulb": "0 0 20px rgba(255, 179, 71, 0.6), 0 0 40px rgba(255, 179, 71, 0.25)",
        "inset-panel": "inset 0 2px 8px rgba(0,0,0,0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        flicker: "flicker 2s ease-in-out infinite",
        shake: "shake 0.5s ease-in-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 212, 255, 0.4)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
