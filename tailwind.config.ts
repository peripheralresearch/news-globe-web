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
    },
  },
  plugins: [],
}
export default config 