/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2D6A4F',
          600: '#1B4332',
          700: '#14532d',
          800: '#166534',
          900: '#14532d',
        },
        soil: {
          50: '#faf8f7',
          100: '#f3ece8',
          200: '#e6d5cc',
          300: '#d4b8a8',
          400: '#c09380',
          500: '#774936',
          600: '#5c3929',
          700: '#4a2e21',
          800: '#3d261c',
          900: '#332017',
        },
        gold: {
          50: '#fefdf8',
          100: '#fef9e8',
          200: '#fdf0c3',
          300: '#fbe49a',
          400: '#f8d26c',
          500: '#D4A373',
          600: '#c4885a',
          700: '#a36b45',
          800: '#85563a',
          900: '#6d4731',
        }
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
