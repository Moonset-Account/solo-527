/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': {
          50: '#E8F0F8',
          100: '#D0E1F1',
          200: '#A1C3E3',
          300: '#72A5D5',
          400: '#4387C7',
          500: '#1469B9',
          600: '#0B4F8C',
          700: '#0A467E',
          800: '#093D70',
          900: '#072E54'
        },
        'amber-gold': {
          50: '#FBF6EC',
          100: '#F7EDD9',
          200: '#EFDAB3',
          300: '#E7C88D',
          400: '#DFB567',
          500: '#D4A853',
          600: '#C59237',
          700: '#A87A2E',
          800: '#8B6225',
          900: '#6E4A1C'
        }
      },
      fontFamily: {
        'charter': ['Charter', 'Georgia', 'serif'],
        'inter-tight': ['Inter Tight', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
