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
          50: '#E8F3FF',
          100: '#B9D8FF',
          200: '#8ABDFF',
          300: '#5BA2FF',
          400: '#2C87FF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A2BA0',
          800: '#061A6E',
          900: '#030D3C',
        },
        success: {
          50: '#E8FFEA',
          100: '#B3FFB9',
          200: '#80FF89',
          300: '#4DFF59',
          400: '#1AFF29',
          500: '#00B42A',
          600: '#009A24',
          700: '#00801E',
          800: '#006618',
          900: '#004D12',
        },
        warning: {
          50: '#FFF3E8',
          100: '#FFD9B3',
          200: '#FFC080',
          300: '#FFA64D',
          400: '#FF8D1A',
          500: '#FF7D00',
          600: '#D96A00',
          700: '#B35700',
          800: '#8C4400',
          900: '#663100',
        },
        danger: {
          50: '#FFEBE8',
          100: '#FFC7BF',
          200: '#FFA396',
          300: '#FF7F6D',
          400: '#FF5B44',
          500: '#F53F3F',
          600: '#CB2634',
          700: '#A11229',
          800: '#77031F',
          900: '#4D0014',
        },
        neutral: {
          50: '#F7F8FA',
          100: '#F2F3F5',
          200: '#E5E6EB',
          300: '#C9CDD4',
          400: '#86909C',
          500: '#4E5969',
          600: '#272E3B',
          700: '#1D2129',
          800: '#0F1115',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        cardHover: '0 4px 16px rgba(0, 0, 0, 0.08)',
        modal: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
