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
				},
				dotPulse: {
					'0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
					'40%': { transform: 'scale(1)', opacity: '1' }
				}
			},
			animation: {
				'toast-in': 'toastIn 0.25s ease-out',
				dot: 'dotPulse 1.2s infinite ease-in-out'
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
