/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    extend: {
      colors: {
        'survey-bg': '#0F172A',
        'survey-surface': '#1E293B',
        'survey-surface-hover': '#334155',
        'survey-border': '#475569',
        'survey-primary': '#06B6D4',
        'survey-secondary': '#8B5CF6',
        'survey-success': '#10B981',
        'survey-warning': '#F59E0B',
        'survey-danger': '#EF4444',
        'survey-info': '#3B82F6',
        'survey-text-primary': '#F1F5F9',
        'survey-text-secondary': '#94A3B8',
        'survey-text-muted': '#64748B',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
