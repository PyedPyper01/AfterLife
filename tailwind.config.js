/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#87CEEB',
        secondary: '#4682B4',
        dark: '#1a1a1a',
      }
    },
  },
  plugins: [],
}
