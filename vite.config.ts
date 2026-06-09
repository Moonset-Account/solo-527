import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'game-core': ['./src/core/GameEngine', './src/core/EventBus'],
          'game-config': [
            './src/config/TowerConfig',
            './src/config/EnemyConfig',
            './src/config/LevelConfig',
            './src/config/WeatherConfig',
          ],
          'game-systems': [
            './src/systems/WaveSystem',
            './src/systems/ResourceSystem',
            './src/systems/WeatherSystem',
          ],
        },
      },
    },
  },
});
