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
        primary: {
          50: '#E8F5EE',
          100: '#C8E6D0',
          200: '#A5D6B3',
          300: '#81C796',
          400: '#5EB879',
          500: '#3A9B5E',
          600: '#2E7D47',
          700: '#1B4332',
          800: '#143326',
          900: '#0D221A',
        },
        accent: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#E6B820',
          500: '#D4A017',
          600: '#B8860B',
          700: '#8B6914',
          800: '#6B5010',
          900: '#4A380B',
        },
        earth: {
          DEFAULT: '#8B6914',
          light: '#C4A35A',
          dark: '#5C460D',
        },
        moss: {
          DEFAULT: '#95D5B2',
          light: '#C5EAD6',
          dark: '#5BAF7E',
        },
        cream: {
          DEFAULT: '#FEFAE0',
          light: '#FFFCE8',
          dark: '#F5ECB8',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
