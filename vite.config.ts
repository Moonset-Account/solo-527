import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'$duckdb-wasm': path.resolve(__dirname, 'node_modules/@duckdb/duckdb-wasm/dist')
		}
	},
	optimizeDeps: {
		exclude: ['@duckdb/duckdb-wasm'],
	},
	server: {
		fs: {
			allow: ['..']
		}
	},
	build: {
		target: 'esnext'
	}
});
