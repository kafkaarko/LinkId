/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["black","night","luxury"]
  }
}