/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Make sure Tailwind scans your source files
  ],
  theme: {
    extend: {
      fontFamily: {
        nippo: ['Nippo', 'sans-serif'], // <- add custom Nippo font here
      },
    },
  },
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
};
