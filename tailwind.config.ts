import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:     ['var(--font-barlow)', 'Barlow', 'sans-serif'],
        display:  ['var(--font-barlow-condensed)', 'Barlow Condensed', 'sans-serif'],
        aboreto:  ['var(--font-aboreto)', 'Aboreto', 'cursive'],
      },
      colors: {
        ink:  '#1C2B32',
        bark: '#111C22',
        mist: {
          DEFAULT: '#C8D5D2',
          d:       '#B0C0BC',
          l:       '#D8E4E1',
          xl:      '#E8F0EE',
        },
        off:   '#F4F8F7',
        terra: {
          DEFAULT: '#D4522A',
          l:       '#E06840',
          d:       '#B8401C',
        },
        muted: {
          DEFAULT: '#4A5E64',
          l:       '#7A9098',
        },
        stage: {
          1: '#2E7D60',
          2: '#2E6A8F',
          3: '#6B4FA8',
          4: '#C07830',
          5: '#D4522A',
          6: '#1A6B5A',
        },
      },
    },
  },
  plugins: [],
}

export default config
