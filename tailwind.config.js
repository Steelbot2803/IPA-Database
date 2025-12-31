// tailwind.config.js
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        surface: '#1e1e1e',
        surface2: '#252525',
        primary: '#3f51b5',
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#f44336',
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
