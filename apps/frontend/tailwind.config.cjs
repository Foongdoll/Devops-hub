/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",             // Vite 등 HTML 진입점
    "./src/**/*.{js,ts,jsx,tsx}", // React 등 소스
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
