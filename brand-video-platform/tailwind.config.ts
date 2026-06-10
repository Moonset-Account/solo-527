import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2F9',
          100: '#D4DDEF',
          200: '#A9BBDF',
          300: '#7E99CF',
          400: '#5377BF',
          500: '#1B2A4A',
          600: '#162240',
          700: '#111A33',
          800: '#0C1226',
          900: '#070A19',
        },
        accent: {
          50: '#FFF3ED',
          100: '#FFE3D1',
          200: '#FFC7A3',
          300: '#FFAB75',
          400: '#FF8F47',
          500: '#FF6B35',
          600: '#E55A24',
          700: '#BF4517',
          800: '#993312',
          900: '#73220D',
        },
        surface: {
          DEFAULT: '#F7F8FA',
          50: '#FFFFFF',
          100: '#F7F8FA',
          200: '#EEF0F4',
          300: '#E2E5EB',
          400: '#C8CDD6',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
