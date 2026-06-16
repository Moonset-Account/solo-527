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
        rosegold: '#B76E79',
        warmwhite: '#FFF8F6',
        grayrose: '#9E8A8F',
        mint: '#7BC8A4',
        coral: '#E85D5D',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans',
          'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
