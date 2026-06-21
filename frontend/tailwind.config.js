/** @type {import('tailwindcss').Config} */
export default {
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
        primary: '#18a058',
        success: '#18a058',
        warning: '#f0a020',
        error: '#d03050',
        info: '#2080f0',
      }
    },
  },
  plugins: [],
}
