/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'workbench': {
          'bg': '#0B1E33',
          'surface': '#0F2B4A',
          'border': '#1E3A5F',
          'text': '#E2E8F0',
          'text-muted': '#94A3B8',
          'accent': '#17A2B8',
          'anomaly': '#FD7E14',
          'success': '#28A745',
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
