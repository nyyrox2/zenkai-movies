/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zenkai: {
          bg: "#0B0C10",
          card: "#14151D",
          surface: "#1A1B26",
          accent: "#E50914",
          accentHover: "#F40612",
          border: "#2A2B3D",
          muted: "#9496A1",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
