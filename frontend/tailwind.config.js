/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        chocolate: {
          950: "#1a0f0a",
          900: "#2C1A12",
          800: "#3E2723",
          700: "#4E342E",
          600: "#5D4037",
          500: "#6D4C41",
          400: "#795548",
          300: "#8D6E63",
          200: "#A1887F",
          100: "#D7CCC8",
          50:  "#EFEBE9",
        },
        gold: {
          700: "#C79A00",
          600: "#E6A800",
          500: "#FFB300",
          400: "#FFCA28",
          300: "#FFD54F",
          200: "#FFE082",
        },
        cream: {
          100: "#FFF8F0",
          200: "#FFF3E0",
          300: "#FFE0B2",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "chocolate-grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,179,0,0.3)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255,179,0,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "gold-sm": "0 0 12px rgba(255,179,0,0.15)",
        "gold-md": "0 0 24px rgba(255,179,0,0.2)",
        "gold-lg": "0 0 48px rgba(255,179,0,0.25)",
        "inset-chocolate": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};
