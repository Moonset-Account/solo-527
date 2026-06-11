/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'navy': {
          50: '#f0f4f9',
          100: '#d9e2ee',
          200: '#b3c5dd',
          300: '#80a0c5',
          400: '#5179a6',
          500: '#335a89',
          600: '#26456e',
          700: '#1e3a5f',
          800: '#183050',
          900: '#142842',
          950: '#0e1c2f'
        },
        'amber-gold': {
          50: '#fbf6ef',
          100: '#f5e9d7',
          200: '#e9d0ad',
          300: '#ddb27e',
          400: '#d4a574',
          500: '#c08852',
          600: '#a86e42',
          700: '#8a5438',
          800: '#704432',
          900: '#5c382b'
        },
        'warn-orange': {
          50: '#fdf3ee',
          100: '#f9e1d4',
          200: '#f3c2a7',
          300: '#ea9b74',
          400: '#e07856',
          500: '#d65d38',
          600: '#c4462e',
          700: '#a23528',
          800: '#832d27',
          900: '#6c2924'
        },
        'success-green': {
          50: '#eef8f3',
          100: '#d5eee1',
          200: '#adddc4',
          300: '#79c5a2',
          400: '#4a9d7c',
          500: '#327f62',
          600: '#25644f',
          700: '#1f5041',
          800: '#1b4035',
          900: '#17342c'
        },
        'cream': '#faf8f5',
        'ink': '#1a1a1a'
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'card': '0 1px 3px rgba(30, 58, 95, 0.08), 0 1px 2px rgba(30, 58, 95, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(30, 58, 95, 0.1), 0 8px 10px -6px rgba(30, 58, 95, 0.08)'
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      }
    }
  },
  plugins: []
};
