/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A8A7D',
        'primary-light': '#2AA89A',
        'primary-dark': '#126B60',
        secondary: '#FF8C42',
        'secondary-light': '#FFA56B',
        'secondary-dark': '#E67A2E',
      },
    },
  },
  plugins: [],
}
