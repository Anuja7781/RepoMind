/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#4c1d95',
          900: '#2e1065',
        },
        ink: {
          950: '#070b16',
          900: '#0d1320',
          800: '#111827',
          700: '#1f2937',
          600: '#374151'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(168, 85, 247, 0.35), 0 0 24px rgba(139, 92, 246, 0.25)',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)',
      }
    },
  },
  plugins: [],
};
