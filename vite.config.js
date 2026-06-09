import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'engine': ['/src/core/Engine.js', '/src/core/EventBus.js'],
          'config': ['/src/config/GameConfig.js'],
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true
  }
});
