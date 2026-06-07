/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#E8F3FF',
					100: '#B9D8FF',
					200: '#8AB9FF',
					300: '#5B9BFF',
					400: '#2D7CFF',
					500: '#165DFF',
					600: '#0E47CC',
					700: '#0A3399',
					800: '#061F66',
					900: '#030F33'
				},
				success: '#00B42A',
				warning: '#FF7D00',
				danger: '#F53F3F'
			},
			fontFamily: {
				sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
				mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace']
			},
			boxShadow: {
				card: '0 2px 8px rgba(0, 0, 0, 0.08)',
				'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)'
			}
		}
	},
	plugins: []
};
