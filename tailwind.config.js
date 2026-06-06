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
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#b9d3ff',
          300: '#7aaaff',
          400: '#3d7aff',
          500: '#1E3A5F',
          600: '#173050',
          700: '#122640',
          800: '#0d1c30',
          900: '#081220',
        },
        accent: {
          orange: '#FF7A00',
          cyan: '#00B4D8',
        },
        dark: {
          bg: '#0a0f1a',
          card: '#111827',
          border: '#1f2937',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        flow: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 180, 216, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 180, 216, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
