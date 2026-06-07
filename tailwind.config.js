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
        surface: "#1a1f36",
        "surface-hover": "#222845",
        border: "#2a3050",
        amber: { DEFAULT: "#f59e0b", 500: "#f59e0b" },
        "emerald-ok": "#10b981",
        "red-alert": "#ef4444",
        "blue-info": "#38bdf8",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
