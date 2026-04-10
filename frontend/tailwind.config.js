/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cabinet Grotesk'", "sans-serif"],
        body: ["'Satoshi'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#fff8ed",
          100: "#ffefd3",
          200: "#ffd9a5",
          300: "#ffbc6d",
          400: "#ff9332",
          500: "#ff710a",
          600: "#f05200",
          700: "#c73a02",
          800: "#9e2e0b",
          900: "#7f280c",
          950: "#451104",
        },
        ink: {
          50:  "#f5f5f0",
          100: "#e8e8df",
          200: "#d0d0c3",
          300: "#b0b09e",
          400: "#8e8e79",
          500: "#737360",
          600: "#5a5a4a",
          700: "#49493c",
          800: "#3d3d33",
          900: "#35352c",
          950: "#1a1a15",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
