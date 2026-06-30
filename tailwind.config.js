/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { 950: '#0F172A', 900: '#0F1E35', 800: '#1E3A5F', 700: '#1D4ED8' },
        brand: { DEFAULT: '#3B82F6', dark: '#1D4ED8', light: '#60A5FA' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        slideIn: { from: { transform: 'translateX(-8px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
      },
    },
  },
  plugins: [],
}
