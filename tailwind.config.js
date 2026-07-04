/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecefff',
          100: '#dce4ff',
          200: '#bbcaff',
          300: '#9dbfff',
          400: '#759aff',
          500: '#4461FF',
          600: '#3350ee',
          700: '#2a42d2',
          800: '#2337b5',
          900: '#213391',
          950: '#172054',
        },
        // Rankerize corporate blue
        rk: {
          50:  '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0070f3',
          600: '#005acc',
          700: '#0044a3',
          800: '#002d6b',
          900: '#001633',
          950: '#000b1a',
        },
        surface: {
          50: '#f7f8fc',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#999999',
          400: '#6e6e6e',
          500: '#424242',
          600: '#333333',
          700: '#212121',
          800: '#111111',
          850: '#0f0f0f',
          900: '#000000',
          950: '#000000',
        }
      },
      fontFamily: {
        sans: ['var(--font-primary)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
