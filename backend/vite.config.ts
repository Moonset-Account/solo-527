import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  build: {
    assetsDir: 'assets',
    manifest: true,
    rollupOptions: {
      input: ['resources/js/app.js', 'resources/css/app.css']
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost'
    }
  }
})
