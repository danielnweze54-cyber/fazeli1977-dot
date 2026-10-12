/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: "#0B0E14",
        cardbg: "#151A23",
        brand: "#00E599",
        accent: "#6366F1",
      }
    },
  },
  plugins: [],
}
