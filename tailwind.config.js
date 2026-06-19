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
        primary: {
          DEFAULT: '#1e293b',
          light: '#334155',
          dark: '#0f172a',
        },
        accent: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
