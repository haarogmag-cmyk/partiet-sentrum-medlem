/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    
    // Hvis du har filene i en src-mappe (vanlig i Next.js), trengs disse:
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ps: {
          primary: "rgb(var(--ps-primary) / <alpha-value>)",
          dark: "rgb(var(--ps-primary-dark) / <alpha-value>)",
          text: "rgb(var(--ps-text) / <alpha-value>)",
        },
        us: {
          primary: "rgb(var(--us-primary) / <alpha-value>)",
          dark: "rgb(var(--us-primary-dark) / <alpha-value>)",
        },
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};