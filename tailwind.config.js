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
        base: {
          900: '#0D1F2D',
          800: '#122A3A',
          700: '#1A3748',
          600: '#224558',
          500: '#2D5A6F',
        },
        accent: {
          DEFAULT: '#00C9A7',
          light: '#33D4B8',
          dark: '#00A88C',
        },
        warn: {
          DEFAULT: '#FFB347',
          light: '#FFC678',
        },
        danger: {
          DEFAULT: '#FF6B6B',
          light: '#FF9494',
        },
        info: {
          DEFAULT: '#4ECDC4',
          light: '#7EDAD3',
        },
        surface: {
          DEFAULT: '#0F2432',
          light: '#162F40',
          border: '#1E3A4C',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
