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
        'ps-dark': '#a02040',
        'ps-text': '#1a1a2e',
        'us-primary': '#8a63d2',
      },
    },
  },
  plugins: [],
}

export default config
