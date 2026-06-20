module.exports = {
  content: [
    './app/views/**/*.html.erb',
    './app/helpers/**/*.rb',
    './app/assets/javascripts/**/*.js',
    './app/javascript/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif']
      }
    }
  }
}
