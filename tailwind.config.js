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
          50: "#E8F4F8",
          100: "#D1E9F1",
          200: "#A3D3E3",
          300: "#75BDD5",
          400: "#47A7C7",
          500: "#1991B9",
          600: "#147494",
          700: "#0F576F",
          800: "#0A3A4A",
          900: "#051D25",
          950: "#020E12",
        },
        deep: {
          50: "#F0F4F8",
          100: "#E1E9F1",
          200: "#C3D3E3",
          300: "#A5BDD5",
          400: "#87A7C7",
          500: "#6991B9",
          600: "#547494",
          700: "#3F576F",
          800: "#2A3A4A",
          900: "#151D25",
          950: "#0A0E12",
        },
        accent: {
          50: "#FFF2EC",
          100: "#FFE6D9",
          200: "#FFCDB3",
          300: "#FFB48D",
          400: "#FF9B67",
          500: "#FF8241",
          600: "#CC6834",
          700: "#994E27",
          800: "#66341A",
          900: "#331A0D",
          950: "#190D07",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
