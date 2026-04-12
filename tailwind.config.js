/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"General Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          black: '#000000',
          dark: '#0A0A0F',
          accent: '#38bdf8',
          cyan: '#22d3ee',
          green: '#4ade80',
        },
      },
    },
  },
  plugins: [],
};
