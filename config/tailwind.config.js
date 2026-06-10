const exec = require('child_process').execSync

module.exports = {
  content: [
    './app/views/**/*.html.erb',
    './app/helpers/**/*.rb',
    './app/assets/javascripts/**/*.js',
    './app/javascript/**/*.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        serif: ['Noto Serif SC', 'serif'],
      },
      colors: {
        brand: {
          purple: '#6C3CE1',
          amber: '#F59E0B',
          dark: '#1E1E2E',
          darker: '#16162a',
        }
      }
    },
  },
  plugins: [],
}
