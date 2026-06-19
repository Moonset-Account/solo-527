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
        primary: '#165DFF',
        accent: {
          orange: '#FF7D00',
          green: '#00B42A',
        },
      },
    },
  },
  plugins: [],
};
