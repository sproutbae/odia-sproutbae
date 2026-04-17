/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff1f0',
          100: '#ffe0de',
          200: '#ffc6c2',
          300: '#ff9f99',
          400: '#ff6b63',
          500: '#f83c32',
          600: '#e8180a',  // ← SproutBae primary red
          700: '#c4110b',
          800: '#a21410',
          900: '#861713',
          950: '#490604',
        },
        warm: {
          50:  '#fffaf9',
          100: '#fff3f0',
          200: '#ffe8e3',
          300: '#ffd1c9',
        },
      },
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'brand': '0 4px 24px rgba(232, 24, 10, 0.15)',
        'card': '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
};
