/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Raleway", "sans-serif"],
      },
      fontSize: {
        medium: "24px", // Custom font size
      },
      letterSpacing: {
        tightest: "-1.1px", // Custom letter-spacing
      },
      lineHeight: {
        relaxed: "1.5", // Custom line-height (150%)
      },
    },
  },
  plugins: [],
};
