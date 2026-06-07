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
        navy: {
          DEFAULT: '#1B2A4A',
          50: '#E8EBF0',
          100: '#C5CCD9',
          200: '#8A99B3',
          300: '#4F668D',
          400: '#2D4470',
          500: '#1B2A4A',
          600: '#152240',
          700: '#0F1A33',
          800: '#0A1126',
          900: '#050913',
        },
        accent: {
          orange: '#FF6B35',
          green: '#2ECB71',
          red: '#E74C3C',
          yellow: '#F5A623',
          blue: '#3498DB',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'DM Sans', 'sans-serif'],
        display: ['DM Sans', 'Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
