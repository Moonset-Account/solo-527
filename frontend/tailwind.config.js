/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBF5F2',
          100: '#F6E8E0',
          200: '#EDD0C1',
          300: '#E1B49D',
          400: '#D49679',
          500: '#C17A58',
          600: '#A66445',
          700: '#864F37',
          800: '#693E2C',
          900: '#4D2E20',
        },
        wood: {
          50: '#F3F1EF',
          100: '#E6E1DD',
          200: '#CDC3BC',
          300: '#B2A297',
          400: '#978274',
          500: '#7D6758',
          600: '#645246',
          700: '#4B3D34',
          800: '#322923',
          900: '#191411',
        },
        olive: {
          50: '#F5F7EF',
          100: '#EAEFD9',
          200: '#D5DFB4',
          300: '#BFCF8F',
          400: '#AABF69',
          500: '#95AF44',
          600: '#778C36',
          700: '#596929',
          800: '#3C461B',
          900: '#1E230E',
        },
        cream: '#F5F1EB',
        warmGray: '#9A9590',
        inkBlack: '#2C241F',
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(44, 36, 31, 0.08)',
        'card-hover': '0 8px 30px rgba(44, 36, 31, 0.12)',
      }
    },
  },
  plugins: [],
}
