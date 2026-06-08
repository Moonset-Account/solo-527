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
        primary: '#6C5CE7',
        'primary-dark': '#5A4BD1',
        positive: '#00B894',
        negative: '#FF6B6B',
        warning: '#FDCB6E',
        info: '#0984E3',
        'accent-light': '#A29BFE',
        sidebar: '#1B2838',
        canvas: '#FAFBFC',
      },
      fontFamily: {
        display: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
