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
					500: '#0F4C81',
					600: '#0D4373',
					700: '#0B3960',
					800: '#082E4D',
					900: '#06233A'
				},
				anomaly: {
					low: '#4CAF50',
					medium: '#FF9800',
					high: '#F44336',
					critical: '#B71C1C'
				},
				temperature: {
					cold: '#2196F3',
					normal: '#4CAF50',
					warm: '#FF9800',
					hot: '#F44336'
				},
				calibration: {
					calibrated: '#00ACC1',
					uncalibrated: '#FF9800',
					error: '#F44336'
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
