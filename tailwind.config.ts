import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ps-primary': '#c93960',
        'ps-dark':    '#a02040',
        'ps-text':    '#1a1a2e',
        'us-primary': '#8a63d2',
        'us-dark':    '#6a43b2',
        background:   '#f9f8f6',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['DM Serif Display', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
