/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FBF9',
          100: '#DAF3EE',
          200: '#B7E7DE',
          300: '#8CD5C8',
          400: '#5EC4B3',
          500: '#3FAE9B',
          600: '#308D7E',
          700: '#287066',
          800: '#235A53',
          900: '#1E4A44',
        },
        accent: {
          50: '#FFF5EC',
          100: '#FFE6D0',
          200: '#FFC9A1',
          300: '#F5A962',
          400: '#EC8F3E',
          500: '#D9741E',
          600: '#B55D14',
          700: '#8F4810',
          800: '#6E3910',
          900: '#572F10',
        },
        pink: {
          50: '#FFF5F7',
          100: '#FFE8EC',
          200: '#FFD1DA',
          300: '#FFB0C0',
          400: '#FF859E',
          500: '#F95D7E',
          600: '#E53B62',
          700: '#C1284E',
          800: '#A02446',
          900: '#852241',
        },
        cream: {
          50: '#FFFBF5',
          100: '#FFF9F2',
          200: '#FFF4E6',
          300: '#FFEAD0',
          400: '#F5D9B3',
          500: '#E6C294',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        display: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'hover': '0 12px 40px rgba(94, 196, 179, 0.15)',
      },
    },
  },
  plugins: [],
}
