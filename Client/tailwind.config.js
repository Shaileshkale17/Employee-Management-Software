/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Raleway", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef1ff",
          100: "#d9dfff",
          200: "#b3c0ff",
          300: "#8ba3ff",
          400: "#6b85ff",
          500: "#4B6BFF",
          600: "#3354F4",
          700: "#2a45d4",
          800: "#1a3bb8",
          900: "#142e8a",
        },
        surface: {
          50: "#F8F9FF",
          100: "#F1F2F6",
          200: "#E8EAF6",
          300: "#C5C8E0",
          400: "#9EA2BE",
          500: "#7C80A0",
          600: "#5C5F7A",
          700: "#3D4057",
          800: "#1E2035",
          900: "#0B0F1C",
        },
      },
      boxShadow: {
        "soft": "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "glow": "0 0 20px rgba(51, 84, 244, 0.15)",
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "card-hover": "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
        "modal": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "fade-in-down": "fadeInDown 0.4s ease-out forwards",
        "slide-in-right": "slideInRight 0.3s ease-out forwards",
        "slide-in-left": "slideInLeft 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.2s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};
