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
        amber: {
          primary: '#c8a86e',
          dark: '#8b7340',
          light: '#e8d5a8',
        },
        brown: {
          dark: '#1a1410',
          medium: '#2a2218',
          light: '#3d2b1f',
        },
        paper: '#f5e6c8',
        rust: '#8b4513',
        ink: {
          green: '#2d4a3e',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
