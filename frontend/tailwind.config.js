/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'moto-blue': '#1e40af',
        'moto-dark': '#111827',
      },
    },
  },
  plugins: [],
}
