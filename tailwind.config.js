// tailwind.config.js
export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			keyframes: {
				toastIn: {
					'0%': { opacity: '0', transform: 'translateX(16px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				}
			},
			animation: {
				'toast-in': 'toastIn 0.25s ease-out'
			},
			borderRadius: {
				md: '8px'
			},
			boxShadow: {
				card: '0 2px 6px rgba(0,0,0,0.4)'
			}
		}
	},
	plugins: []
};
