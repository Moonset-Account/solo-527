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
          50: '#f0f4f9',
          100: '#dae4f0',
          200: '#b9c9e0',
          300: '#8ea8cb',
          400: '#5e82af',
          500: '#3d6294',
          600: '#2d4b76',
          700: '#1e3a5f',
          800: '#182f4c',
          900: '#14263e',
        },
        warning: '#f59e0b',
        success: '#10b981',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
