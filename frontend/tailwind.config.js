/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'trace-bg': '#0d1117',
        'trace-card': '#161b22',
        'trace-border': '#30363d',
        'trace-success': '#3fb950',
        'trace-error': '#f85149',
        'trace-warning': '#d29922',
        'trace-info': '#58a6ff',
        'trace-primary': '#8b5cf6',
        'trace-secondary': '#6366f1'
      }
    },
  },
  plugins: [],
}
