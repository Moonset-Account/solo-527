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
        museum: {
          DEFAULT: '#1B3A5C',
          light: '#2D5A8E',
          dark: '#0F2440',
          50: '#E8EDF4',
        },
        gold: {
          DEFAULT: '#D4A84B',
          light: '#E8C97A',
          dark: '#B8892F',
        },
        ivory: '#FAFAF5',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
