/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"], 
  theme: {
    extend: {
      colors: {
        primary: "#0B3C5D",
        secondary: "#328CC1",
        light: "#D9F1FF",
        whiteSoft: "#F9FAFB",
      },
    },
  },
  plugins: [],
};
