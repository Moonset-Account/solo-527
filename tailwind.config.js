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
        'bg-primary': '#0f1923',
        'bg-secondary': '#1a2332',
        'bg-card': '#243447',
        'accent-orange': '#ff6b35',
        'accent-green': '#00c9a7',
        'accent-yellow': '#ffc107',
        'accent-red': '#ef4444',
        'text-primary': '#e8edf2',
        'text-secondary': '#8899aa',
        'border-custom': '#2d4052',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
