/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: '#0b0b0b',
          accent: '#ffcc33'
        }
      }
    }
  },
  plugins: []
}
