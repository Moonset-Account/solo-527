import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
          dark: '#081C15',
        },
        cream: {
          DEFAULT: '#FEFAE0',
          dark: '#F5ECD7',
        },
        amber: {
          DEFAULT: '#D4A373',
          light: '#E9C89B',
        },
        brick: {
          DEFAULT: '#BC4749',
          light: '#D46566',
        },
        slate: {
          DEFAULT: '#6B7280',
        },
        info: {
          DEFAULT: '#3B82F6',
        },
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
