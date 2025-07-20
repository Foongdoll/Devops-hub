/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",             // Vite 등 HTML 진입점
    "./src/**/*.{js,ts,jsx,tsx}", // React 등 소스
  ],
  theme: {
    extend: {
      colors: {
        'background-light': "#faf8ff",
        'background-dark': "#322446",
        'panel-light': "#fff",
        'panel-dark': "#22173b",
        'accent-light': "#7c3aed",
        'accent-dark': "#bba7ee",
      }
    }
  },
  plugins: [],
  darkMode: 'class',
}
