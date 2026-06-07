/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0f7ff',
					100: '#e0efff',
					200: '#b9ddff',
					300: '#7cc2ff',
					400: '#36a3ff',
					500: '#0c87f0',
					600: '#0069cc',
					700: '#0053a6',
					800: '#044688',
					900: '#0a3a6e',
					950: '#072448'
				},
				accent: {
					500: '#0ea5e9',
					600: '#0284c7'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			boxShadow: {
				card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
			}
		}
	},
	plugins: []
};
