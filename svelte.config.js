import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess({})],
  kit: {
    adapter: adapter(),
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
      '$lib/*': path.resolve(__dirname, './src/lib/*'),
      $drizzle: path.resolve(__dirname, './drizzle'),
      '$drizzle/*': path.resolve(__dirname, './drizzle/*')
    }
  }
};

export default config;
