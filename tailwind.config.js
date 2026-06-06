/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'gh-primary': '#1a5c36',
        'gh-secondary': '#2d7a4a',
        'gh-accent': '#4ade80',
        'gh-bg': '#0f172a',
        'gh-panel': '#1e293b',
        'gh-border': '#334155',
        'gh-text': '#e2e8f0',
        'gh-muted': '#94a3b8',
        'gh-warning': '#f59e0b',
        'gh-danger': '#ef4444',
        'gh-success': '#22c55e',
        'gh-info': '#3b82f6'
      }
    }
  },
  plugins: []
};
