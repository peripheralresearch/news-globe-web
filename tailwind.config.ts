import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          yellow: '#FAD44D',
          navy: '#13235C',
          abyss: '#091642',
          ink: '#0D0D0D',
          warm: {
            100: '#ECEBE8',
            200: '#D0CEC7',
            400: '#A19D90',
            600: '#6E6A5D',
            800: '#3C3A33',
          },
          neutral: {
            50: '#F5F5F5',
            100: '#E8E8E8',
            300: '#CCCCCC',
            600: '#6B6B6B',
            900: '#1A1A1A',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        'flow-slow': {
          '0%': { left: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
        'flow-medium': {
          '0%': { left: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
        'flow-fast': {
          '0%': { left: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { left: '100%', opacity: '0' },
        },
      },
      animation: {
        'flow-slow': 'flow-slow 3s ease-in-out infinite',
        'flow-medium': 'flow-medium 2.5s ease-in-out infinite',
        'flow-fast': 'flow-fast 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config 