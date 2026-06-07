/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        aqua: {
          50: '#e6f7fb',
          100: '#b3e8f2',
          200: '#80d9e9',
          300: '#4dcae0',
          400: '#26bfda',
          500: '#00B4D8',
          600: '#009bb8',
          700: '#007a91',
          800: '#005a6a',
          900: '#0A2E36',
          950: '#071E25',
        },
        pond: {
          bg: '#071E25',
          surface: '#0D3B47',
          card: '#0A2E36',
          border: '#1a4a58',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
