/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0f5fb',
					100: '#dbe9f5',
					200: '#b8d2eb',
					300: '#8cb4dd',
					400: '#5a90cb',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1e3a5f',
					800: '#1a3151',
					900: '#172944'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			}
		}
	},
	plugins: []
};
