/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neonPink: "#ff00cc",
        neonBlue: "#00d4ff",
        darkBackground: "#020024",
        purpleGlow: "#090979",
      },
      fontFamily: {
        retro: ['"Press Start 2P"', "cursive"]
      },
      animation: {
        gradient: "gradient 6s ease infinite",
      },
      keyframes: {
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};