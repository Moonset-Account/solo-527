/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#E3F2FD',
					100: '#BBDEFB',
					200: '#90CAF9',
					300: '#64B5F6',
					400: '#42A5F5',
					500: '#1E88E5',
					600: '#1976D2',
					700: '#1565C0',
					800: '#0D47A1',
					900: '#0D47A1'
				},
				warning: '#FF9800',
				danger: '#F44336',
				success: '#4CAF50'
			},
			fontFamily: {
				sans: ['Noto Sans SC', 'system-ui', 'sans-serif']
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				}
			}
		}
	},
	plugins: []
};
