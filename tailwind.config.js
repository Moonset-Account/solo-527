/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FDF8F3',
          100: '#F5EFE6',
          200: '#E8DCC8',
          300: '#D4BE9D',
          400: '#B89A6E',
          500: '#A17F4D',
          600: '#8B6A3F',
          700: '#6F4E37',
          800: '#5A3E2E',
          900: '#4A3328',
        },
        cream: {
          50: '#FDFBF7',
          100: '#F9F5ED',
          200: '#F5F0E6',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
