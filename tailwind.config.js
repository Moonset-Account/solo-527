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
        primary: '#1E293B',
        accent: '#F97316',
        success: '#10B981',
        danger: '#F43F5E',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: {
        btn: '8px',
      },
    },
  },
  plugins: [],
};
