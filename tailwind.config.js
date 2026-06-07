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
        base: {
          900: '#0f1225',
          800: '#1a1f36',
          700: '#252b45',
          600: '#2f3654',
          500: '#3d4568',
          400: '#5a6285',
          300: '#8b92ad',
          200: '#b8bdd1',
          100: '#e2e5f0',
        },
        accent: {
          DEFAULT: '#00e5c7',
          light: '#33ffe6',
          dark: '#00b89e',
        },
        alert: {
          DEFAULT: '#ff6b4a',
          light: '#ff9580',
          dark: '#cc4f33',
        },
        planned: '#4a90d9',
        unplanned: '#ff8c42',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
